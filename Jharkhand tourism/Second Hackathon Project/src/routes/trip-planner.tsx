import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Compass,
  Leaf,
  Sparkles,
  MapPin,
  Clock,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  IndianRupee,
  Users,
  Building2,
  CheckCircle2,
  TreePine,
  Layers,
  HeartHandshake,
  Route,
  Car,
  Navigation,
  LocateFixed,
  Hotel,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
} from 'lucide-react';
import { Destination } from '../types/database';
import { ItineraryRequest, ItineraryResponse, ItineraryDayPlan } from '../types/index';
import { fetchDestinations, saveUserItinerary } from '../services/destinations';
import { requestItineraryPlan } from '../services/itinerary';
import { requestUserLocation, resolveLocationCoords, JHARKHAND_HUBS } from '../services/routing';
import { useAuth } from '../lib/auth-context';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';

interface TripPlannerPageProps {
  navigate: (path: string) => void;
}

const LOADING_MESSAGES = [
  'Crafting your perfect Jharkhand journey…',
  'Finding experiences that match your interests…',
  'Putting together the perfect places for your trip…',
  'Building your personalized travel itinerary…',
  'Adding the best local experiences to your journey…',
  'Almost there — your Jharkhand adventure is taking shape…',
];

export function TripPlannerPage({ navigate }: TripPlannerPageProps) {
  const { user, profile } = useAuth();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [duration, setDuration] = useState<number>(3);
  const [durationInput, setDurationInput] = useState<string>('3');
  const [budget, setBudget] = useState<number>(12000);
  const [budgetInput, setBudgetInput] = useState<string>('12000');
  const [guestCountInput, setGuestCountInput] = useState<string>('2');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [startingLocation, setStartingLocation] = useState<string>('Ranchi');
  const [travelGroup, setTravelGroup] = useState<'solo' | 'couple' | 'family' | 'friends'>('couple');
  const [travelTheme, setTravelTheme] = useState<string>('all');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([
    'Waterfalls & Cascades',
    'Tribal Art & Dokra Crafts',
    'Eco Homestays',
  ]);

  // Geolocation & GPS states
  const [userGpsCoords, setUserGpsCoords] = useState<{ lat: number; lng: number; name: string; isGps: boolean } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'locating' | 'granted' | 'denied' | 'timeout'>('idle');
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [gpsLocationNotice, setGpsLocationNotice] = useState<string | null>(null);

  // Execution states
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [expandedDayTimelines, setExpandedDayTimelines] = useState<Record<number, boolean>>({ 1: true });

  // Rotating loading messages timer
  useEffect(() => {
    let interval: any = null;
    if (loading) {
      setLoadingMessageIndex(0);
      interval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2400);
    } else {
      setLoadingMessageIndex(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [loading]);

  const interestOptions = [
    'Waterfalls & Cascades',
    'Wildlife & Tiger Safari',
    'Sacred Temples & Jyotirlinga',
    'Hills, Valleys & Sunsets',
    'Tribal Art & Dokra Crafts',
    'High Altitude Trekking',
    'Eco Homestays & Farm Food',
  ];

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDestinations();
        setDestinations(data);

        // Check if there is an existing active itinerary in session
        const stored = sessionStorage.getItem('active_itinerary');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && parsed.days) {
              setItinerary(parsed);
            }
          } catch (e) {
            // Ignore
          }
        }
      } catch (err) {
        console.error('Failed to load destination catalog:', err);
      }
    }
    load();
  }, []);

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 1) {
        setSelectedInterests(selectedInterests.filter((i) => i !== interest));
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  };

  const handleUseGpsLocation = async () => {
    setGpsStatus('locating');
    setGpsErrorMessage(null);
    setGpsLocationNotice(null);

    try {
      const pos = await requestUserLocation();
      setGpsStatus('granted');
      const gpsObj = {
        lat: pos.lat,
        lng: pos.lng,
        name: 'Your Location',
        isGps: true,
      };
      setUserGpsCoords(gpsObj);
      setStartingLocation('Your Location');
      setGpsLocationNotice(`Your location found (${pos.lat.toFixed(4)}° N, ${pos.lng.toFixed(4)}° E)`);
    } catch (err: any) {
      console.warn('GPS location request denied or failed:', err);
      setUserGpsCoords(null);
      const errType = err?.type;
      if (errType === 'PERMISSION_DENIED') {
        setGpsStatus('denied');
        setGpsErrorMessage(
          "We couldn't access your location. Please allow location access in your browser settings or choose a starting location."
        );
      } else if (errType === 'TIMEOUT') {
        setGpsStatus('timeout');
        setGpsErrorMessage("We couldn't get your current location. Please try again.");
      } else {
        setGpsStatus('denied');
        setGpsErrorMessage(
          err?.message || "We couldn't access your location. Please allow location access in your browser settings or choose a starting location."
        );
      }
    }
  };

  const toggleTimeline = (dayNumber: number) => {
    setExpandedDayTimelines((prev) => ({
      ...prev,
      [dayNumber]: !prev[dayNumber],
    }));
  };

  const handleDurationChange = (val: string) => {
    setDurationInput(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed >= 1 && parsed <= 14) {
      setDuration(parsed);
    }
  };

  const handleDurationBlur = () => {
    const parsed = parseInt(durationInput.trim(), 10);
    if (!durationInput.trim() || isNaN(parsed) || parsed < 1) {
      setDuration(1);
      setDurationInput('1');
    } else if (parsed > 14) {
      setDuration(14);
      setDurationInput('14');
    } else {
      setDuration(parsed);
      setDurationInput(parsed.toString());
    }
  };

  const handleBudgetChange = (val: string) => {
    setBudgetInput(val);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setBudget(parsed);
    }
  };

  const handleBudgetBlur = () => {
    const parsed = parseInt(budgetInput.trim(), 10);
    if (!budgetInput.trim() || isNaN(parsed) || parsed < 1000) {
      setBudget(1000);
      setBudgetInput('1000');
    } else {
      setBudget(parsed);
      setBudgetInput(parsed.toString());
    }
  };

  const handleGuestChange = (val: string) => {
    setGuestCountInput(val);
    setGuestError(null);
    const parsed = parseInt(val.trim(), 10);
    if (!isNaN(parsed) && parsed > 0) {
      if (parsed === 1 && travelGroup === 'couple') {
        setTravelGroup('solo');
      } else if (parsed === 2 && travelGroup === 'solo') {
        setTravelGroup('couple');
      } else if (parsed >= 3 && (travelGroup === 'solo' || travelGroup === 'couple')) {
        setTravelGroup('family');
      }
    }
  };

  const handleGuestBlur = () => {
    const parsed = parseInt(guestCountInput.trim(), 10);
    if (!guestCountInput.trim() || isNaN(parsed) || parsed < 1) {
      setGuestCountInput('1');
      setGuestError(null);
      if (travelGroup === 'couple' || travelGroup === 'family') {
        setTravelGroup('solo');
      }
    } else if (parsed > 50) {
      setGuestCountInput('50');
      setGuestError(null);
      setTravelGroup('family');
    } else {
      setGuestCountInput(parsed.toString());
      setGuestError(null);
    }
  };

  const incrementGuests = () => {
    const current = parseInt(guestCountInput.trim(), 10) || 1;
    const next = Math.min(50, Math.max(1, current + 1));
    handleGuestChange(next.toString());
  };

  const decrementGuests = () => {
    const current = parseInt(guestCountInput.trim(), 10) || 2;
    const next = Math.max(1, current - 1);
    handleGuestChange(next.toString());
  };

  const handleGenerateItinerary = async () => {
    setError(null);
    setSaveSuccess(false);

    let finalDuration = parseInt(durationInput.trim(), 10);
    if (!durationInput.trim() || isNaN(finalDuration)) {
      finalDuration = duration;
    }
    if (finalDuration < 1 || finalDuration > 14) {
      setError('Please select a trip duration between 1 and 14 days.');
      return;
    }

    let finalBudget = parseInt(budgetInput.trim(), 10);
    if (!budgetInput.trim() || isNaN(finalBudget)) {
      finalBudget = budget;
    }
    if (finalBudget < 1000) {
      finalBudget = 1000;
      setBudget(1000);
      setBudgetInput('1000');
    }

    const parsedGuests = parseInt(guestCountInput.trim(), 10);
    if (!guestCountInput.trim() || isNaN(parsedGuests) || parsedGuests < 1 || parsedGuests > 50) {
      setError('Please enter a valid number of guests between 1 and 50.');
      setGuestError('Enter 1 to 50 guests');
      return;
    }

    setLoading(true);

    try {
      const request: ItineraryRequest = {
        days: finalDuration,
        budget: finalBudget,
        guests: parsedGuests,
        startingLocation: startingLocation || 'Ranchi',
        startingLocationCoords: userGpsCoords || undefined,
        interests: selectedInterests,
        travelGroup: travelGroup,
        tourismType: travelTheme as any,
      };

      const result = await requestItineraryPlan(request);
      setItinerary(result);

      // Store in session storage for Map integration
      try {
        sessionStorage.setItem('active_itinerary', JSON.stringify(result));
        localStorage.setItem('active_itinerary', JSON.stringify(result));
      } catch (storageErr) {
        console.warn('Unable to persist active itinerary:', storageErr);
      }
    } catch (err: any) {
      console.error('Error generating itinerary:', err);
      setError('Something went wrong while creating your itinerary. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveItinerary = async () => {
    if (!itinerary) return;
    try {
      const userId = user?.id || 'guest_user';
      await saveUserItinerary(userId, itinerary);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error('Failed to save itinerary:', err);
    }
  };

  const handleOpenMapWithItinerary = (destinationId?: string) => {
    if (itinerary) {
      sessionStorage.setItem('active_itinerary', JSON.stringify(itinerary));
      localStorage.setItem('active_itinerary', JSON.stringify(itinerary));
      if (destinationId) {
        navigate(`/map?itinerary=active&destinationId=${destinationId}`);
      } else {
        navigate('/map?itinerary=active');
      }
    } else {
      navigate('/map');
    }
  };

  const getDestination = (destinationId?: string, name?: string) => {
    if (destinationId) {
      const byId = destinations.find((d) => d.id === destinationId);
      if (byId) return byId;
    }
    if (name) {
      return destinations.find((d) => d.name.toLowerCase() === name.toLowerCase());
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 md:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title Banner */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Badge variant="emerald" className="gap-1 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Smart Sustainable Trip Planner
            </Badge>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-stone-900 dark:text-stone-100 tracking-tight">
            Jharkhand Green Circuit Trip Planner
          </h1>
          <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 max-w-3xl">
            Custom journey planner calculating real road travel times, certified homestay stops, and native guide bookings for responsible exploration.
          </p>
        </div>

        {/* Configuration Card */}
        <Card className="p-6 md:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-md space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            {/* Trip Duration */}
            <div className="space-y-2">
              <label className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                <span>Trip Duration</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {(() => {
                    const parsed = parseInt(durationInput.trim(), 10);
                    const count = !isNaN(parsed) && parsed >= 1 ? parsed : duration;
                    return `${count} ${count === 1 ? 'Day' : 'Days'}`;
                  })()}
                </span>
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={14}
                  value={durationInput}
                  onChange={(e) => handleDurationChange(e.target.value)}
                  onBlur={handleDurationBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleDurationBlur();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  placeholder="1-14"
                  className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 rounded-xl"
                />
                <span className="text-stone-500 font-medium shrink-0">Days</span>
              </div>
              <div className="pt-1">
                <input
                  type="range"
                  min={1}
                  max={14}
                  value={duration}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setDuration(val);
                    setDurationInput(val.toString());
                  }}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>
            </div>

            {/* Approximate Budget (INR) */}
            <div className="space-y-2">
              <label className="font-bold text-stone-900 dark:text-stone-100 flex items-center justify-between">
                <span>Approximate Budget</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">
                  {(() => {
                    const parsed = parseInt(budgetInput.trim(), 10);
                    const amount = !isNaN(parsed) && parsed >= 0 ? parsed : budget;
                    return `₹${amount.toLocaleString('en-IN')} INR`;
                  })()}
                </span>
              </label>
              <div className="relative">
                <IndianRupee className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <Input
                  type="number"
                  min={1000}
                  step={500}
                  value={budgetInput}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  onBlur={handleBudgetBlur}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleBudgetBlur();
                      (e.target as HTMLInputElement).blur();
                    }
                  }}
                  className="pl-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 rounded-xl"
                  placeholder="Total budget in INR"
                />
              </div>
              <div className="pt-1">
                <input
                  type="range"
                  min={1000}
                  max={100000}
                  step={500}
                  value={Math.min(100000, Math.max(1000, parseInt(budgetInput.trim(), 10) || budget || 1000))}
                  onChange={(e) => {
                    const val = Math.max(1000, Number(e.target.value));
                    setBudget(val);
                    setBudgetInput(val.toString());
                  }}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>
              <div className="flex gap-2">
                {[1000, 3000, 6000, 12000, 20000].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => {
                      setBudget(b);
                      setBudgetInput(b.toString());
                    }}
                    className="text-[10px] px-2 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-200"
                  >
                    ₹{(b / 1000)}k
                  </button>
                ))}
              </div>
            </div>

            {/* Starting Location & GPS Origin */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-stone-900 dark:text-stone-100 block">
                  Starting Location / Hub
                </label>
                <button
                  type="button"
                  onClick={handleUseGpsLocation}
                  disabled={gpsStatus === 'locating'}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
                >
                  <LocateFixed className={`h-3 w-3 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                  <span>{gpsStatus === 'locating' ? 'Finding your location…' : 'Use My Location'}</span>
                </button>
              </div>

              <div className="flex gap-2">
                <Input
                  type="text"
                  value={startingLocation}
                  onChange={(e) => {
                    setStartingLocation(e.target.value);
                    setUserGpsCoords(null);
                    setGpsStatus('idle');
                    setGpsErrorMessage(null);
                    setGpsLocationNotice(null);
                  }}
                  placeholder="Enter start city (e.g. Ranchi, Jamshedpur)"
                  className="bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-xs font-semibold text-stone-900 dark:text-stone-100 rounded-xl"
                />
              </div>

              {/* Status & Feedback Messages */}
              {gpsStatus === 'locating' && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-800 dark:text-blue-200 flex items-center gap-2 text-[11px]">
                  <RefreshCw className="h-3 w-3 animate-spin text-blue-600 shrink-0" />
                  <span>Finding your location…</span>
                </div>
              )}

              {gpsStatus === 'granted' && gpsLocationNotice && (
                <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg text-emerald-800 dark:text-emerald-200 flex items-center gap-2 text-[11px]">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 shrink-0" />
                  <span>{gpsLocationNotice}</span>
                </div>
              )}

              {(gpsStatus === 'denied' || gpsStatus === 'timeout') && gpsErrorMessage && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg text-rose-800 dark:text-rose-200 space-y-2 text-[11px]">
                  <div className="flex items-start gap-1.5">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                    <span>{gpsErrorMessage}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleUseGpsLocation}
                      className="h-6 text-[10px] px-2 border-rose-300 dark:border-rose-700 text-rose-800 dark:text-rose-200 hover:bg-rose-100"
                    >
                      Try Again
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setStartingLocation('Ranchi');
                        setUserGpsCoords(null);
                        setGpsStatus('idle');
                        setGpsErrorMessage(null);
                        setGpsLocationNotice(null);
                      }}
                      className="text-[10px] text-stone-600 dark:text-stone-300 underline font-medium hover:text-stone-900"
                    >
                      Choose Starting Location (e.g. Ranchi)
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Hub Selector Pills */}
              <div className="flex flex-wrap gap-1 pt-1">
                {['Ranchi', 'Jamshedpur', 'Deoghar', 'Dhanbad', 'Bokaro', 'Hazaribagh'].map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    onClick={() => {
                      setStartingLocation(hub);
                      setUserGpsCoords(null);
                      setGpsStatus('idle');
                      setGpsErrorMessage(null);
                      setGpsLocationNotice(null);
                    }}
                    className={`px-2 py-0.5 rounded text-[10px] font-medium border transition-colors ${
                      startingLocation.toLowerCase() === hub.toLowerCase()
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border-emerald-400'
                        : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
                    }`}
                  >
                    {hub}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Guests, Travel Group & Theme */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-stone-100 dark:border-stone-800 pt-4 text-xs">
            {/* Number of Guests Field */}
            <div>
              <label className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                Number of Guests
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={decrementGuests}
                  aria-label="Decrease guests"
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 transition-colors"
                >
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <div className="relative flex-1">
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={guestCountInput}
                    onChange={(e) => handleGuestChange(e.target.value)}
                    onBlur={handleGuestBlur}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleGuestBlur();
                        (e.target as HTMLInputElement).blur();
                      }
                    }}
                    placeholder="e.g. 1, 2, 4"
                    className={`h-9 bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-xs font-semibold text-center text-stone-900 dark:text-stone-100 rounded-xl ${
                      guestError ? 'border-rose-500 ring-1 ring-rose-500' : ''
                    }`}
                  />
                </div>
                <button
                  type="button"
                  onClick={incrementGuests}
                  aria-label="Increase guests"
                  className="h-9 w-9 flex items-center justify-center rounded-xl bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 cursor-pointer shrink-0 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
              {guestError ? (
                <p className="text-[10px] text-rose-500 font-medium mt-1">{guestError}</p>
              ) : (
                <p className="text-[10px] text-stone-500 mt-1">1–50 travelers</p>
              )}
            </div>

            {/* Travel Group */}
            <div>
              <label className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                Travel Group
              </label>
              <select
                value={travelGroup}
                onChange={(e: any) => setTravelGroup(e.target.value)}
                className="w-full h-9 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="solo">Solo Traveler</option>
                <option value="couple">Couple</option>
                <option value="family">Family</option>
                <option value="friends">Group of Friends</option>
              </select>
              <p className="text-[10px] text-stone-500 mt-1">Pacing tailored for your party</p>
            </div>

            {/* Preferred Circuit */}
            <div>
              <label className="font-bold text-stone-900 dark:text-stone-100 block mb-1">
                Preferred Tourism Circuit
              </label>
              <select
                value={travelTheme}
                onChange={(e) => setTravelTheme(e.target.value)}
                className="w-full h-9 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl px-2.5 text-xs text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="all">All-Round Jharkhand Highlights</option>
                <option value="waterfalls">Waterfalls & River Valleys</option>
                <option value="wildlife_eco">Wildlife & Safaris (Betla)</option>
                <option value="hills_valleys">Hills, Valleys & Sunsets</option>
                <option value="sacred_temples">Spiritual Shrines & Temples</option>
              </select>
              <p className="text-[10px] text-stone-500 mt-1">Geographic focus</p>
            </div>
          </div>

          {/* Interests Pills */}
          <div className="space-y-2 border-t border-stone-100 dark:border-stone-800 pt-4 text-xs">
            <label className="font-bold text-stone-900 dark:text-stone-100 block">
              Specific Interests & Activities
            </label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((opt) => {
                const isSelected = selectedInterests.includes(opt);
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => toggleInterest(opt)}
                    className={`px-3 py-1.5 rounded-xl font-medium transition-colors cursor-pointer border ${
                      isSelected
                        ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 border-emerald-400'
                        : 'bg-stone-50 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {isSelected && '✓ '}
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Generate Button */}
          <div className="pt-2">
            <Button
              onClick={handleGenerateItinerary}
              disabled={loading}
              className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  <span>{LOADING_MESSAGES[loadingMessageIndex]}</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>Generate Green Travel Plan</span>
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </Card>

        {/* Results Section */}
        {itinerary && (
          <div className="space-y-6 animate-in fade-in-50 duration-300">
            {/* Itinerary Banner Card */}
            <div className="p-6 md:p-8 rounded-3xl bg-gradient-to-r from-emerald-950 via-teal-950 to-stone-900 text-white space-y-4 border border-emerald-800 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="emerald"
                    className="bg-emerald-400/20 text-emerald-200 border-emerald-400/40 text-xs gap-1"
                  >
                    <Sparkles className="h-3 w-3 text-amber-300" />
                    Your Jharkhand journey is ready.
                  </Badge>
                  <Badge variant="outline" className="text-white border-white/30 text-xs">
                    {itinerary.days.length} Days Trip
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    size="sm"
                    onClick={() => handleOpenMapWithItinerary()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 shadow-md"
                  >
                    <Route className="h-3.5 w-3.5 text-amber-300" />
                    <span>View Route</span>
                  </Button>
                  <div className="text-right">
                    <span className="text-xs text-emerald-200 block">Total Estimated Budget</span>
                    <span className="font-extrabold text-lg sm:text-xl text-amber-300">
                      ₹{itinerary.totalEstimatedBudget.toLocaleString('en-IN')} INR
                    </span>
                  </div>
                </div>
              </div>

              <h2 className="text-xl md:text-2xl font-black text-white">{itinerary.title}</h2>
              <p className="text-xs sm:text-sm text-emerald-100/90 leading-relaxed max-w-3xl">
                {itinerary.summary}
              </p>

              {itinerary.responsibleTourismNotes && (
                <div className="pt-2 border-t border-white/15 flex items-start gap-2 text-xs text-emerald-200">
                  <HeartHandshake className="h-4 w-4 shrink-0 text-amber-300 mt-0.5" />
                  <span>
                    <strong>Eco-Pledge:</strong> {itinerary.responsibleTourismNotes}
                  </span>
                </div>
              )}
            </div>

            {/* Impact Metric Banner */}
            <div className="p-4 rounded-2xl bg-emerald-950 text-emerald-100 border border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-800 flex items-center justify-center shrink-0 text-emerald-200 font-bold">
                  🌿
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">
                    Estimated Eco-Carbon Offset: ~{itinerary.days.length * 22} kg CO₂
                  </h4>
                  <p className="text-xs text-emerald-300">
                    Calculated for road-circuit travel, certified tribal homestays, and local guides.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="emerald" className="bg-emerald-800 text-emerald-100 text-xs shrink-0">
                  Zero Plastic Corridor
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenMapWithItinerary()}
                  className="text-xs text-emerald-200 border-emerald-700 hover:bg-emerald-900 gap-1 h-7"
                >
                  <Compass className="h-3 w-3" />
                  <span>View on Map</span>
                </Button>
              </div>
            </div>

            {/* Day by Day Cards with Real Travel Times & Realistic Day Schedules */}
            <div className="space-y-4">
              {itinerary.days.map((day) => {
                const destObj = getDestination(day.destinationId, day.destinationName);
                const destLink = destObj ? `/destinations/${destObj.slug}` : null;
                const isTimelineOpen = expandedDayTimelines[day.dayNumber] ?? false;

                return (
                  <Card
                    key={day.dayNumber}
                    className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm space-y-4"
                  >
                    {/* Day Top Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 dark:border-stone-800 pb-3">
                      <div className="flex items-center gap-2">
                        <Badge variant="emerald" className="text-xs font-bold px-2.5 py-1">
                          Day {day.dayNumber}
                        </Badge>
                        <h3 className="font-bold text-base md:text-lg text-stone-900 dark:text-stone-100">
                          {day.title || day.destinationName}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3">
                        <span className="text-xs font-semibold text-stone-500 dark:text-stone-400">
                          Day Est: ₹{day.estimatedBudget.toLocaleString('en-IN')}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenMapWithItinerary(day.destinationId || destObj?.id)}
                          className="text-xs text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 gap-1 h-7 font-bold"
                        >
                          <MapPin className="h-3 w-3" />
                          <span>View on Map</span>
                        </Button>
                        {destLink && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(destLink)}
                            className="text-xs text-stone-700 hover:text-stone-900 dark:text-stone-300 gap-1 h-7 font-bold"
                          >
                            <span>Explore Spot</span>
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Road Travel Time Segment Card */}
                    {day.travelSegment && (
                      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-200/60 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="h-9 w-9 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                            <Car className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5 font-bold text-blue-950 dark:text-blue-200">
                              <span>{day.travelSegment.originName}</span>
                              <span className="text-stone-400">→</span>
                              <span>{day.travelSegment.destinationName}</span>
                            </div>
                            <div className="text-[11px] text-blue-800 dark:text-blue-300 font-medium">
                              Road Travel: <strong>{day.travelSegment.durationFormatted}</strong> ({day.travelSegment.distanceKm} km)
                            </div>
                          </div>
                        </div>

                        {/* Departure and Arrival Chips */}
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                          <span className="bg-white dark:bg-stone-900 px-2.5 py-1 rounded-lg border border-blue-200 dark:border-blue-800 text-stone-700 dark:text-stone-300 font-semibold">
                            Depart: {day.travelSegment.departureTime || '08:00 AM'}
                          </span>
                          <span className="bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-200 font-bold">
                            Arrive: {day.travelSegment.arrivalTime || '~12:30 PM'}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Destination Banner */}
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-medium text-emerald-800 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/40 px-3 py-2 rounded-xl border border-emerald-200/50 dark:border-emerald-800/40">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>
                          Featured Destination: <strong>{day.destinationName}</strong>
                        </span>
                        {destObj && (() => {
                          const s = (destObj.crowd_status || '').toLowerCase();
                          const isHigh = s === 'high' || s === 'peak';
                          const isLow = s === 'low';
                          const level = isHigh ? 'HIGH' : isLow ? 'LOW' : 'MEDIUM';
                          const cls = isHigh
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700'
                            : isLow
                            ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
                            : 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-700';
                          return (
                            <Badge variant="outline" className={`text-[10px] py-0 px-1.5 font-bold ${cls}`}>
                              {isHigh ? '🟢' : '🟡'} {level} CROWD
                            </Badge>
                          );
                        })()}
                      </div>
                      {destObj && (
                        <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-mono">
                          {destObj.latitude.toFixed(3)}° N, {destObj.longitude.toFixed(3)}° E
                        </span>
                      )}
                    </div>

                    {/* Activities List */}
                    <div className="space-y-2">
                      <span className="font-bold text-stone-900 dark:text-stone-100 text-xs block uppercase tracking-wider">
                        Curated Day Experiences
                      </span>
                      <ul className="space-y-1.5">
                        {day.activities.map((act, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-xs text-stone-700 dark:text-stone-300"
                          >
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 dark:bg-emerald-400 mt-1.5 shrink-0" />
                            <span>{act}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Overnight Stay Recommendation */}
                    {day.overnightStayLocation && (
                      <div className="p-3 bg-stone-50 dark:bg-stone-800/70 rounded-2xl border border-stone-200/80 dark:border-stone-800 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Hotel className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <div>
                            <span className="text-[10px] text-stone-500 block uppercase font-bold">
                              Recommended Overnight Stay
                            </span>
                            <span className="font-bold text-stone-800 dark:text-stone-200">
                              {day.overnightStayLocation}
                            </span>
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-400 border-emerald-600/40">
                          Certified Eco-Homestay
                        </Badge>
                      </div>
                    )}

                    {/* Detailed Timeline Accordion Toggle */}
                    {day.timeline && day.timeline.length > 0 && (
                      <div className="border-t border-stone-100 dark:border-stone-800 pt-3">
                        <button
                          type="button"
                          onClick={() => toggleTimeline(day.dayNumber)}
                          className="flex items-center justify-between w-full text-xs font-bold text-stone-700 dark:text-stone-300 hover:text-emerald-700 dark:hover:text-emerald-400 cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-blue-500" />
                            <span>Realistic Day Timeline & Schedule ({day.timeline.length} Events)</span>
                          </span>
                          {isTimelineOpen ? (
                            <ChevronUp className="h-4 w-4 text-stone-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-stone-400" />
                          )}
                        </button>

                        {isTimelineOpen && (
                          <div className="mt-3 space-y-2 pl-2 border-l-2 border-emerald-500/40 ml-1.5 animate-in fade-in-50">
                            {day.timeline.map((item, idx) => (
                              <div key={idx} className="flex items-start gap-2.5 text-xs">
                                <span className="font-mono font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded text-[11px] shrink-0">
                                  {item.time}
                                </span>
                                <div>
                                  <span className="font-bold text-stone-900 dark:text-stone-100 block">
                                    {item.title}
                                  </span>
                                  <span className="text-stone-600 dark:text-stone-400 text-[11px]">
                                    {item.description}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Tribal Cooperative Footnote */}
                    {day.travelNotes && (
                      <div className="p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl text-stone-600 dark:text-stone-400 text-[11px] flex items-start gap-2">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{day.travelNotes}</span>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleOpenMapWithItinerary()}
                className="w-full sm:w-auto text-xs bg-stone-900 text-white border-stone-700 hover:bg-stone-800 gap-1.5"
              >
                <Route className="h-3.5 w-3.5 text-emerald-400" />
                <span>Open Full Route on Interactive Map</span>
              </Button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  onClick={handleSaveItinerary}
                  variant="outline"
                  className="text-xs border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                >
                  {saveSuccess ? 'Saved to Your Trips!' : 'Save Itinerary'}
                </Button>
                <Button
                  onClick={() => navigate('/destinations')}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                >
                  Explore All Destinations
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
