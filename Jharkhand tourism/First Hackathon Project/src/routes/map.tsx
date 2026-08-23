import React, { useEffect, useState } from 'react';
import { MapPin, Compass, Leaf, Layers, Filter, Sparkles, Route, RefreshCw, ArrowLeft, Car } from 'lucide-react';
import { Destination, District } from '../types/database';
import { ItineraryResponse } from '../types/index';
import { fetchDestinations, fetchDistricts } from '../services/destinations';
import { InteractiveMap } from '../components/interactive-map';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { resolveLocationCoords } from '../services/routing';
import { SEO } from '../components/seo';

interface MapPageProps {
  navigate: (path: string) => void;
  selectedDestinationId?: string;
  selectedDestinationSlug?: string;
  itineraryMode?: boolean;
}

export function MapPage({
  navigate,
  selectedDestinationId,
  selectedDestinationSlug,
  itineraryMode,
}: MapPageProps) {
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [activeItinerary, setActiveItinerary] = useState<ItineraryResponse | null>(null);

  // Read URL query params dynamically
  const urlParams = new URLSearchParams(window.location.search);
  const paramSlug = selectedDestinationSlug || urlParams.get('destination') || urlParams.get('slug') || urlParams.get('dest') || undefined;
  const paramId = selectedDestinationId || urlParams.get('destinationId') || undefined;
  const isItinMode = itineraryMode || urlParams.get('itinerary') === 'active' || urlParams.get('mode') === 'itinerary';
  
  // Directions query params
  const isDirectionsParam = urlParams.get('directions') === 'true' || urlParams.get('mode') === 'directions';
  const originLatParam = urlParams.get('originLat');
  const originLngParam = urlParams.get('originLng');
  const originNameParam = urlParams.get('originName') || urlParams.get('origin') || 'Your Location';
  const isGpsParam = urlParams.get('isGps') === 'true' || originNameParam === 'Your Location';

  const [directionsMode, setDirectionsMode] = useState<boolean>(isDirectionsParam);
  const [directionsOrigin, setDirectionsOrigin] = useState<{ lat: number; lng: number; name: string; isGps?: boolean } | null>(null);
  const [directionsDestination, setDirectionsDestination] = useState<Destination | null>(null);

  useEffect(() => {
    async function loadMapData() {
      setLoading(true);
      try {
        const [destData, distData] = await Promise.all([
          fetchDestinations(),
          fetchDistricts(),
        ]);
        setDestinations(destData);
        setDistricts(distData);

        // Check if directions mode is requested via URL
        if (isDirectionsParam && paramSlug) {
          const target = destData.find(
            (d) => d.slug.toLowerCase() === paramSlug.toLowerCase() || d.id === paramId
          );
          if (target) {
            setDirectionsDestination(target);
            setDirectionsMode(true);

            if (originLatParam && originLngParam) {
              setDirectionsOrigin({
                lat: parseFloat(originLatParam),
                lng: parseFloat(originLngParam),
                name: originNameParam,
                isGps: isGpsParam,
              });
            } else if (originNameParam && originNameParam !== 'Your Location') {
              const resolved = resolveLocationCoords(originNameParam, destData);
              setDirectionsOrigin({
                ...resolved,
                isGps: false,
              });
            } else {
              // Leave null so InteractiveMap prompts for real GPS access
              setDirectionsOrigin(null);
            }
          }
        }

        // If itinerary query or mode is set, check stored active itinerary
        if (isItinMode) {
          try {
            const raw = sessionStorage.getItem('active_itinerary') || localStorage.getItem('active_itinerary');
            if (raw) {
              const parsed: ItineraryResponse = JSON.parse(raw);
              if (parsed && parsed.days && parsed.days.length > 0) {
                setActiveItinerary(parsed);
              }
            }
          } catch (e) {
            console.error('Failed to parse active itinerary from storage:', e);
          }
        }
      } catch (err) {
        console.error('Error loading map data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadMapData();
  }, [isItinMode, isDirectionsParam, paramSlug, paramId, originLatParam, originLngParam, originNameParam, isGpsParam]);

  const handleStartDirections = (
    dest: Destination,
    origin?: { lat: number; lng: number; name: string; isGps?: boolean }
  ) => {
    setDirectionsDestination(dest);
    setDirectionsMode(true);
    const resolvedOrigin = origin || directionsOrigin || null;
    setDirectionsOrigin(resolvedOrigin);

    const url = new URL(window.location.href);
    url.searchParams.set('directions', 'true');
    url.searchParams.set('dest', dest.slug);
    if (resolvedOrigin) {
      url.searchParams.set('originLat', resolvedOrigin.lat.toString());
      url.searchParams.set('originLng', resolvedOrigin.lng.toString());
      url.searchParams.set('originName', resolvedOrigin.name);
      if (resolvedOrigin.isGps) {
        url.searchParams.set('isGps', 'true');
      } else {
        url.searchParams.delete('isGps');
      }
    } else {
      url.searchParams.delete('originLat');
      url.searchParams.delete('originLng');
      url.searchParams.delete('originName');
      url.searchParams.delete('isGps');
    }
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  };

  const handleClearItinerary = () => {
    setActiveItinerary(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('itinerary');
    url.searchParams.delete('mode');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  };

  const handleClearDirections = () => {
    setDirectionsMode(false);
    setDirectionsOrigin(null);
    setDirectionsDestination(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('directions');
    url.searchParams.delete('originLat');
    url.searchParams.delete('originLng');
    url.searchParams.delete('originName');
    url.searchParams.delete('isGps');
    url.searchParams.delete('origin');
    url.searchParams.delete('dest');
    window.history.replaceState({}, '', url.pathname + (url.search ? url.search : ''));
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-8 md:py-12 text-stone-900 dark:text-white transition-colors duration-200">
      <SEO
        title="Interactive GIS Eco-Tourism Map — Live Crowd & Offline GPS Navigation"
        description="Interactive GIS satellite and terrain map of Jharkhand. Real-time tourist crowd density zones, turn-by-turn road routing, offline GPS tile downloads, and local artisan vendor markers."
        keywords="Jharkhand GIS map, offline tourism map Jharkhand, Betla national park map, Hundru falls GPS coordinates, Patratu valley route, Jharkhand crowd density map"
        canonicalPath="/map"
        ogType="website"
      />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="emerald" className="gap-1 bg-emerald-100 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 text-xs">
                <Compass className="h-3.5 w-3.5" />
                Eco-Tourism Map
              </Badge>
              {directionsMode && (
                <Badge variant="outline" className="text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-500/50 bg-blue-50 dark:bg-blue-950/40 text-xs gap-1">
                  <Car className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  Road Directions
                </Badge>
              )}
              {activeItinerary && !directionsMode && (
                <Badge variant="outline" className="text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-500/50 bg-amber-50 dark:bg-amber-950/40 text-xs gap-1">
                  <Sparkles className="h-3 w-3 text-amber-600 dark:text-amber-300" />
                  Custom Circuit Active ({activeItinerary.days.length} Days)
                </Badge>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              Explore Map
            </h1>
            <p className="text-sm md:text-base text-stone-600 dark:text-stone-400 max-w-3xl">
              Interactive crowd density and eco-tourism discovery map displaying protected sanctuaries, sacred hills, waterfalls, and road routes across Jharkhand.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            {directionsDestination ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/destinations/${directionsDestination.slug}`)}
                className="text-xs bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to {directionsDestination.name}
              </Button>
            ) : activeItinerary ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/trip-planner')}
                className="text-xs bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white"
              >
                <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                Back to Planner
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/trip-planner')}
                className="text-xs bg-emerald-50 dark:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800 font-semibold gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-500 dark:text-amber-300" />
                Plan Custom Trip
              </Button>
            )}
          </div>
        </div>

        {/* Itinerary Banner Notification if active */}
        {activeItinerary && !directionsMode && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 dark:from-emerald-950 via-teal-50 dark:via-teal-950 to-stone-50 dark:to-stone-900 border border-emerald-200 dark:border-emerald-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Route className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="font-bold text-sm text-stone-900 dark:text-white">{activeItinerary.title}</span>
              </div>
              <p className="text-xs text-stone-600 dark:text-emerald-200/90 line-clamp-1 max-w-2xl">
                {activeItinerary.summary}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                variant="ghost"
                onClick={handleClearItinerary}
                className="text-xs text-stone-700 hover:text-stone-900 dark:text-stone-300 dark:hover:text-white h-8"
              >
                Show All Destinations
              </Button>
            </div>
          </div>
        )}

        {/* Interactive Map Canvas Container */}
        {loading ? (
          <div className="h-[550px] rounded-3xl bg-white dark:bg-stone-900 animate-pulse border border-stone-200 dark:border-stone-800 flex items-center justify-center text-stone-500 dark:text-stone-600">
            <div className="flex items-center gap-2 text-sm">
              <RefreshCw className="h-4 w-4 animate-spin text-emerald-500" />
              <span>Loading Map Coordinates & Destinations...</span>
            </div>
          </div>
        ) : (
          <InteractiveMap
            destinations={destinations}
            districts={districts}
            selectedDistrict={selectedDistrict}
            onSelectDistrict={setSelectedDistrict}
            onSelectDestination={(slug) => navigate(`/destinations/${slug}`)}
            focusedDestinationSlug={paramSlug}
            focusedDestinationId={paramId}
            activeItinerary={activeItinerary}
            onClearItinerary={handleClearItinerary}
            directionsMode={directionsMode}
            directionsOrigin={directionsOrigin}
            directionsDestination={directionsDestination}
            onClearDirections={handleClearDirections}
            onStartDirections={handleStartDirections}
          />
        )}
      </div>
    </div>
  );
}
