import React, { useState, useEffect } from 'react';
import {
  Leaf,
  Award,
  MapPin,
  Calendar,
  QrCode,
  LogOut,
  User as UserIcon,
  Compass,
  Route,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Edit3,
  Sparkles,
  Phone,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Badge } from '../components/ui/badge';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { useAuth } from '../lib/auth-context';
import { fetchUserBookings, fetchUserSavedItineraries, deleteUserSavedItinerary, getStoredBookings } from '../services/destinations';
import { SEED_DESTINATIONS } from '../data/jharkhand';
import { DigitalEcoPass } from '../components/digital-eco-pass';
import { Booking, Destination, SavedItinerary } from '../types/database';

interface ProfilePageProps {
  navigate: (path: string) => void;
  initialTab?: 'passes' | 'trips' | 'badges' | 'settings';
}

export function ProfilePage({ navigate, initialTab }: ProfilePageProps) {
  const { user, profile, signOut, updateProfile, loading: authLoading } = useAuth();

  // Read URL query parameter for tab if present
  const getTabFromUrl = (): 'passes' | 'trips' | 'badges' | 'settings' => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam === 'trips' || tabParam === 'passes' || tabParam === 'badges' || tabParam === 'settings') {
      return tabParam;
    }
    return initialTab || 'passes';
  };

  const [activeTab, setActiveTab] = useState<'passes' | 'trips' | 'badges' | 'settings'>(getTabFromUrl());
  const [userBookings, setUserBookings] = useState<Booking[]>([]);
  const [savedTrips, setSavedTrips] = useState<SavedItinerary[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [signingOut, setSigningOut] = useState<boolean>(false);
  const [signOutNotice, setSignOutNotice] = useState<string | null>(null);

  // Edit profile form states
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editBio, setEditBio] = useState<string>('');
  const [editDistrict, setEditDistrict] = useState<string>('Ranchi');
  const [profileSaving, setProfileSaving] = useState<boolean>(false);
  const [profileSaveSuccess, setProfileSaveSuccess] = useState<boolean>(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);

  const [selectedPassForModal, setSelectedPassForModal] = useState<{
    bookingId: string;
    destination: Destination;
    visitorName: string;
    numberOfGuests: number;
    visitDate: string;
    totalAmountInr: number;
    status: string;
  } | null>(null);

  // Sync edit profile form with loaded profile
  useEffect(() => {
    if (profile) {
      setEditName(profile.full_name || '');
      setEditPhone(profile.phone || '');
      setEditBio(profile.bio || '');
      setEditDistrict(profile.district || 'Ranchi');
    } else if (user) {
      setEditName(user.user_metadata?.full_name || user.email?.split('@')[0] || '');
    }
  }, [profile, user]);

  // Load user's bookings and saved itineraries
  useEffect(() => {
    let isMounted = true;

    async function loadUserData() {
      setLoadingData(true);
      const userId = user?.id || '';
      try {
        const [bookings, itineraries] = await Promise.all([
          fetchUserBookings(userId),
          fetchUserSavedItineraries(userId),
        ]);

        if (isMounted) {
          setUserBookings(bookings);
          setSavedTrips(itineraries);
        }
      } catch (err) {
        console.warn('Error loading profile data:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    }

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, [user]);

  // Combined passes (stored user bookings + seed default pass if empty)
  const allPasses = React.useMemo(() => {
    const defaultPasses = [
      {
        id: 'seed-1',
        code: 'JH-2026-839201',
        destinationName: 'Betla National Park',
        districtName: 'Latehar',
        date: '2026-09-12',
        guests: 2,
        visitorName: profile?.full_name || user?.user_metadata?.full_name || 'Akshat Kumar',
        guide: 'Somra Oraon (Certified Wildlife Tracker)',
        status: 'CONFIRMED',
        totalAmount: 500,
        destinationSlug: 'betla-national-park',
      },
      {
        id: 'seed-2',
        code: 'JH-2026-491024',
        destinationName: 'Netarhat Sunset Point',
        districtName: 'Latehar',
        date: '2026-09-14',
        guests: 2,
        visitorName: profile?.full_name || user?.user_metadata?.full_name || 'Akshat Kumar',
        guide: null,
        status: 'CONFIRMED',
        totalAmount: 40,
        destinationSlug: 'netarhat-sunset-point',
      },
    ];

    const mappedStored = userBookings.map((b) => {
      const matchedDest = SEED_DESTINATIONS.find((d) => d.id === b.destination_id);
      return {
        id: b.id,
        code: b.eco_pass_code,
        destinationName: matchedDest?.name || 'Jharkhand Eco Sanctuary',
        districtName: matchedDest?.district?.name || 'Jharkhand',
        date: b.booking_date,
        guests: b.number_of_guests,
        visitorName: b.visitor_name || profile?.full_name || user?.user_metadata?.full_name || 'Eco-Traveler',
        guide: null,
        status: 'CONFIRMED',
        totalAmount: b.total_amount_inr,
        destinationSlug: matchedDest?.slug || 'betla-national-park',
      };
    });

    if (mappedStored.length > 0) {
      return mappedStored;
    }
    return defaultPasses;
  }, [userBookings, profile, user]);

  const handleOpenPassModal = (pass: (typeof allPasses)[0]) => {
    const matchedDest =
      SEED_DESTINATIONS.find(
        (d) => d.slug === pass.destinationSlug || d.name.toLowerCase() === pass.destinationName.toLowerCase()
      ) || SEED_DESTINATIONS[0];

    setSelectedPassForModal({
      bookingId: pass.code,
      destination: matchedDest,
      visitorName: pass.visitorName,
      numberOfGuests: pass.guests,
      visitDate: pass.date,
      totalAmountInr: pass.totalAmount,
      status: 'CONFIRMED',
    });
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      setSignOutNotice("You've been signed out.");
      setTimeout(() => {
        setSignOutNotice(null);
        navigate('/');
      }, 1200);
    } catch (err) {
      console.warn('Sign out error:', err);
    } finally {
      setSigningOut(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaveError(null);
    setProfileSaveSuccess(false);

    if (!editName.trim()) {
      setProfileSaveError('Display name cannot be empty.');
      return;
    }

    setProfileSaving(true);
    try {
      const res = await updateProfile({
        full_name: editName.trim(),
        phone: editPhone.trim() || null,
        bio: editBio.trim() || null,
        district: editDistrict,
      });

      if (res.success) {
        setProfileSaveSuccess(true);
        setTimeout(() => setProfileSaveSuccess(false), 3000);
      } else {
        setProfileSaveError(res.error || 'Failed to update profile.');
      }
    } catch (err) {
      setProfileSaveError('Something went wrong updating your profile.');
    } finally {
      setProfileSaving(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    if (!confirm('Are you sure you want to remove this saved itinerary?')) return;
    try {
      await deleteUserSavedItinerary(id, user?.id || '');
      setSavedTrips((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error('Failed to delete itinerary:', err);
    }
  };

  const handleOpenTripRoute = (trip: SavedItinerary) => {
    try {
      sessionStorage.setItem('active_itinerary', JSON.stringify(trip.itinerary_data));
      localStorage.setItem('active_itinerary', JSON.stringify(trip.itinerary_data));
      navigate('/map?itinerary=active');
    } catch (e) {
      navigate('/map');
    }
  };

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Eco-Traveler';
  const userInitial = displayName.charAt(0).toUpperCase() || 'E';
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    : 'August 2026';

  return (
    <div className="min-h-screen bg-stone-50/50 dark:bg-stone-950 py-8 md:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Sign Out Notice Toast */}
        {signOutNotice && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-emerald-800 dark:text-emerald-200 text-sm flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-semibold">{signOutNotice}</span>
          </div>
        )}

        {/* Not Logged In Banner (if guest) */}
        {!user && !authLoading && (
          <Card className="p-6 rounded-3xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/70 dark:bg-amber-950/30 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-2xl bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200 flex items-center justify-center shrink-0">
                <Info className="h-5 w-5" />
              </div>
              <div className="text-center sm:text-left">
                <h3 className="font-bold text-stone-900 dark:text-stone-100 text-sm">
                  Sign in to sync your trips & permits
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-400">
                  Create an account to securely access your reservations and saved itineraries across any device.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => navigate('/signin')}
                className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
              >
                Sign In
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate('/signup')}
                className="text-xs border-stone-300 dark:border-stone-700"
              >
                Create Account
              </Button>
            </div>
          </Card>
        )}

        {/* Profile Card Header */}
        <Card className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
            <div className="h-20 w-20 rounded-2xl bg-gradient-to-tr from-emerald-700 to-teal-500 text-white font-extrabold text-3xl flex items-center justify-center shadow-lg shrink-0">
              {userInitial}
            </div>

            <div className="space-y-2 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">
                  {displayName}
                </h2>
                <Badge variant="emerald" className="text-xs">
                  {profile?.role === 'admin' ? 'Tourism Board Admin' : 'Verified Eco-Traveler'}
                </Badge>
              </div>

              <p className="text-xs text-stone-500">
                {user?.email ? (
                  <span>{user.email} • </span>
                ) : null}
                Member since {memberSince} • {allPasses.length} Permits • {profile?.eco_points || 120} Eco-Points
              </p>

              {profile?.bio && (
                <p className="text-xs text-stone-600 dark:text-stone-300 italic max-w-lg">
                  "{profile.bio}"
                </p>
              )}

              <div className="pt-2 flex flex-wrap gap-3 text-xs font-semibold justify-center sm:justify-start">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1.5 rounded-lg">
                  <Leaf className="h-4 w-4" />
                  <span>{(allPasses.length * 22) + 20} kg Carbon Offset</span>
                </div>
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-3 py-1.5 rounded-lg">
                  <Award className="h-4 w-4" />
                  <span>3 Green Badges</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sign In / Sign Out Top Control */}
          <div className="flex sm:flex-col items-center gap-2 shrink-0">
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                disabled={signingOut}
                className="text-xs text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/40 gap-1.5 cursor-pointer"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>{signingOut ? 'Signing out...' : 'Sign Out'}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/signin')}
                className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
              >
                Sign In
              </Button>
            )}
          </div>
        </Card>

        {/* Tab Navigation */}
        <div className="space-y-6">
          <div className="flex flex-wrap border-b border-stone-200 dark:border-stone-800 gap-4 sm:gap-6 text-sm font-bold">
            <button
              onClick={() => setActiveTab('passes')}
              className={`pb-3 cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'passes'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <QrCode className="h-4 w-4" />
              <span>My Reservations & Passes ({allPasses.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('trips')}
              className={`pb-3 cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'trips'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Route className="h-4 w-4" />
              <span>My Saved Trips ({savedTrips.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('badges')}
              className={`pb-3 cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                activeTab === 'badges'
                  ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                  : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
              }`}
            >
              <Award className="h-4 w-4" />
              <span>Green Badges</span>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-3 cursor-pointer transition-colors border-b-2 flex items-center gap-1.5 ${
                  activeTab === 'settings'
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-stone-500 hover:text-stone-800 dark:hover:text-stone-200'
                }`}
              >
                <Edit3 className="h-4 w-4" />
                <span>Account Profile</span>
              </button>
            )}
          </div>

          {/* TAB 1: RESERVATIONS & DIGITAL ECO PASSES */}
          {activeTab === 'passes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-500">
                  Show this digital pass or QR code at forest checkpoints and sanctuary entry gates.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate('/explore')}
                  className="text-xs border-emerald-600 text-emerald-700 dark:text-emerald-400"
                >
                  Book Another Destination
                </Button>
              </div>

              {allPasses.map((pass) => (
                <Card
                  key={pass.code}
                  className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-emerald-500/40 transition-all bg-white dark:bg-stone-900"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Badge variant="emerald" className="font-mono text-xs font-bold">
                        {pass.code}
                      </Badge>
                      <span className="text-xs text-stone-400">•</span>
                      <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        {pass.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                      {pass.destinationName}
                    </h3>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-stone-400" />
                        {pass.districtName} District
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-stone-400" />
                        {pass.date}
                      </span>
                      <span>
                        {pass.guests} {pass.guests === 1 ? 'Guest' : 'Guests'}
                      </span>
                      <span>• Visitor: {pass.visitorName}</span>
                    </div>

                    {pass.guide && (
                      <p className="text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        Guide: {pass.guide}
                      </p>
                    )}
                  </div>

                  <div className="flex sm:flex-col items-center gap-2 w-full sm:w-auto">
                    <Button
                      size="sm"
                      onClick={() => handleOpenPassModal(pass)}
                      className="text-xs w-full sm:w-auto gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold"
                    >
                      <QrCode className="h-3.5 w-3.5" />
                      View Digital Pass & QR
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* TAB 2: MY SAVED TRIPS */}
          {activeTab === 'trips' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-stone-500">
                  Your custom AI-generated road itineraries and multi-day travel plans.
                </p>
                <Button
                  size="sm"
                  onClick={() => navigate('/trip-planner')}
                  className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1"
                >
                  <Sparkles className="h-3.5 w-3.5 text-amber-300" />
                  <span>Plan New Trip</span>
                </Button>
              </div>

              {savedTrips.length === 0 ? (
                <Card className="p-8 text-center space-y-4 border-dashed border-2 border-stone-300 dark:border-stone-800 rounded-3xl">
                  <div className="h-14 w-14 rounded-full bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                    <Route className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-stone-900 dark:text-stone-100">
                      No saved itineraries yet
                    </h4>
                    <p className="text-xs text-stone-500 max-w-sm mx-auto">
                      Use our Green Travel Planner to generate realistic road travel circuits and save them to your account.
                    </p>
                  </div>
                  <Button
                    onClick={() => navigate('/trip-planner')}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs"
                  >
                    Open Green Trip Planner
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {savedTrips.map((trip) => (
                    <Card
                      key={trip.id}
                      className="p-6 rounded-2xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-4 hover:border-emerald-500/40 transition-all"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 dark:border-stone-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge variant="emerald" className="text-xs font-bold">
                              {trip.duration_days} Days Circuit
                            </Badge>
                            <span className="text-xs text-stone-400">•</span>
                            <span className="text-xs font-semibold text-stone-600 dark:text-stone-400">
                              Estimated {trip.budget_level}
                            </span>
                          </div>
                          <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 mt-1">
                            {trip.title}
                          </h3>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleOpenTripRoute(trip)}
                            className="text-xs bg-emerald-700 hover:bg-emerald-800 text-white font-bold gap-1"
                          >
                            <Compass className="h-3.5 w-3.5" />
                            <span>Open Route on Map</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteTrip(trip.id)}
                            className="h-8 w-8 p-0 text-stone-400 hover:text-rose-600"
                            title="Remove itinerary"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* Itinerary Preview Days */}
                      {trip.itinerary_data?.days && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                          {trip.itinerary_data.days.slice(0, 3).map((d: any) => (
                            <div
                              key={d.dayNumber}
                              className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-100 dark:border-stone-700/60"
                            >
                              <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                                Day {d.dayNumber}: {d.destinationName}
                              </span>
                              <span className="text-stone-500 text-[11px] line-clamp-1">
                                {d.activities?.[0] || 'Explore eco sanctuary and nature trails'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GREEN BADGES */}
          {activeTab === 'badges' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card className="p-6 rounded-2xl text-center space-y-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="h-14 w-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 text-3xl flex items-center justify-center mx-auto shadow-sm">
                  🐯
                </div>
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Betla Tiger Guardian
                </h4>
                <p className="text-xs text-stone-500">
                  Completed wildlife safari with certified indigenous tracker and respected zero-plastic zone rules.
                </p>
                <Badge variant="emerald" className="text-[10px]">
                  Earned • +50 Points
                </Badge>
              </Card>

              <Card className="p-6 rounded-2xl text-center space-y-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="h-14 w-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-700 text-3xl flex items-center justify-center mx-auto shadow-sm">
                  🏺
                </div>
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Dokra Art Patron
                </h4>
                <p className="text-xs text-stone-500">
                  Supported hereditary brass craft guilds and purchased genuine tribal artisan artifacts.
                </p>
                <Badge variant="emerald" className="text-[10px]">
                  Earned • +40 Points
                </Badge>
              </Card>

              <Card className="p-6 rounded-2xl text-center space-y-3 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800">
                <div className="h-14 w-14 rounded-2xl bg-teal-100 dark:bg-teal-950 text-teal-700 text-3xl flex items-center justify-center mx-auto shadow-sm">
                  🍃
                </div>
                <h4 className="font-bold text-base text-stone-900 dark:text-stone-100">
                  Zero Plastic Pioneer
                </h4>
                <p className="text-xs text-stone-500">
                  Used digital QR permits instead of paper tickets and carried reusable water filters on treks.
                </p>
                <Badge variant="emerald" className="text-[10px]">
                  Earned • +30 Points
                </Badge>
              </Card>
            </div>
          )}

          {/* TAB 4: ACCOUNT PROFILE SETTINGS */}
          {activeTab === 'settings' && user && (
            <Card className="p-6 sm:p-8 rounded-3xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 shadow-sm space-y-6">
              <div>
                <h3 className="font-bold text-lg text-stone-900 dark:text-stone-100">
                  Edit Personal Information
                </h3>
                <p className="text-xs text-stone-500">
                  Update your display name and contact details for eco permits.
                </p>
              </div>

              {profileSaveError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{profileSaveError}</span>
                </div>
              )}

              {profileSaveSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Profile details updated successfully!</span>
                </div>
              )}

              <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Display Name
                  </label>
                  <Input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-10 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Email Address (Account ID)
                  </label>
                  <Input
                    type="text"
                    value={user.email || ''}
                    disabled
                    className="h-10 bg-stone-100 dark:bg-stone-800/80 border-stone-200 dark:border-stone-700 rounded-xl text-sm opacity-80 cursor-not-allowed"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Phone Number (Optional)
                  </label>
                  <Input
                    type="tel"
                    value={editPhone}
                    placeholder="+91 98765 43210"
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="h-10 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-stone-300">
                    Bio / Eco Travel Interests
                  </label>
                  <Input
                    type="text"
                    value={editBio}
                    placeholder="Nature lover, trekking, tribal art enthusiast"
                    onChange={(e) => setEditBio(e.target.value)}
                    className="h-10 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-sm"
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    disabled={profileSaving}
                    className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
                  >
                    {profileSaving ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin mr-1.5" />
                        Saving Changes...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </form>
            </Card>
          )}
        </div>
      </div>

      {/* View Digital Pass Modal */}
      <Dialog
        open={Boolean(selectedPassForModal)}
        onOpenChange={(open) => {
          if (!open) setSelectedPassForModal(null);
        }}
      >
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto" onClose={() => setSelectedPassForModal(null)}>
          {selectedPassForModal && (
            <div className="py-2">
              <DialogHeader className="sr-only">
                <DialogTitle>Digital Eco-Pass</DialogTitle>
                <DialogDescription>Your travel permit pass</DialogDescription>
              </DialogHeader>

              <DigitalEcoPass
                bookingId={selectedPassForModal.bookingId}
                destination={selectedPassForModal.destination}
                visitorName={selectedPassForModal.visitorName}
                numberOfGuests={selectedPassForModal.numberOfGuests}
                visitDate={selectedPassForModal.visitDate}
                totalAmountInr={selectedPassForModal.totalAmountInr}
                status={selectedPassForModal.status}
                onClose={() => setSelectedPassForModal(null)}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
