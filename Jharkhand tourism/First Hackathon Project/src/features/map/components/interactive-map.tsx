import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  Star,
  Compass,
  ArrowRight,
  Route,
  Navigation,
  Car,
  CheckCircle2,
  X,
  LocateFixed,
  AlertCircle,
  RefreshCw,
  Search,
  Users,
  Eye,
  EyeOff,
  Filter,
  ChevronUp,
  ChevronDown,
  Info,
  Plus,
  Minus,
  ShoppingBag,
  Phone,
  Store,
  Sparkles,
  ExternalLink,
  HardDrive,
  Download,
} from 'lucide-react';
import { Destination, District } from '../../../types/database';
import { ItineraryResponse } from '../../../types';
import { Badge } from '../../../components/ui/badge';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import {
  calculateRoadRoute,
  requestUserLocation,
  resolveLocationCoords,
  RouteResult,
  JHARKHAND_HUBS,
  isValidCoord,
} from '../services/routing';
import {
  LocalVendor,
  VENDOR_CATEGORIES,
  fetchNearbyVendors,
} from '../../discover-local/services/localVendors';
import { MockMap } from './mock-map';
import { createOfflineTileLayer } from '../services/leaflet-offline-layer';
import { MapBounds, getStorageStats } from '../services/offlineMapStorage';
import { OfflineMapModal } from './offline-map-modal';

export type StandardCrowdLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CrowdInfo {
  level: StandardCrowdLevel;
  label: string;
  tagColor: string;
  zoneColor: string;
  fillOpacity: number;
  strokeOpacity: number;
  radiusMeters: number;
  description: string;
}

export function getCrowdInfo(status?: string): CrowdInfo {
  const s = (status || '').toLowerCase();
  if (s === 'high' || s === 'peak') {
    return {
      level: 'HIGH',
      label: 'High Crowd',
      tagColor: 'bg-red-100 text-red-800 border-red-300 dark:bg-red-950/80 dark:text-red-300 dark:border-red-800',
      zoneColor: '#ef4444', // RED = High Crowd
      fillOpacity: 0.28,
      strokeOpacity: 0.75,
      radiusMeters: 14000,
      description: 'Popular peak destination with active visitor interest',
    };
  }
  if (s === 'low') {
    return {
      level: 'LOW',
      label: 'Low Crowd',
      tagColor: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-700',
      zoneColor: '#d97706', // DARK YELLOW = Low Crowd
      fillOpacity: 0.16,
      strokeOpacity: 0.45,
      radiusMeters: 9000,
      description: 'Serene & peaceful atmosphere with low visitor density',
    };
  }
  // Default moderate / medium
  return {
    level: 'MEDIUM',
    label: 'Medium Crowd',
    tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300 dark:border-emerald-700',
    zoneColor: '#10b981', // GREEN = Medium Crowd
    fillOpacity: 0.22,
    strokeOpacity: 0.6,
    radiusMeters: 11500,
    description: 'Steady, comfortable visitor flow throughout the day',
  };
}

export type MapViewTab = 'explore' | 'crowd' | 'vendors' | 'nearby' | 'directions';
export type CrowdFilterValue = 'ALL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type DrawerState = 'hidden' | 'collapsed' | 'expanded';

interface InteractiveMapProps {
  destinations: Destination[];
  districts: District[];
  selectedDistrict: string;
  onSelectDistrict: (id: string) => void;
  onSelectDestination: (slug: string) => void;
  focusedDestinationId?: string;
  focusedDestinationSlug?: string;
  activeItinerary?: ItineraryResponse | null;
  onClearItinerary?: () => void;
  directionsMode?: boolean;
  directionsOrigin?: { lat: number; lng: number; name: string; isGps?: boolean } | null;
  directionsDestination?: Destination | null;
  onClearDirections?: () => void;
  onStartDirections?: (dest: Destination, origin?: { lat: number; lng: number; name: string; isGps?: boolean }) => void;
}

export function InteractiveMap({
  destinations,
  districts,
  selectedDistrict,
  onSelectDistrict,
  onSelectDestination,
  focusedDestinationId,
  focusedDestinationSlug,
  activeItinerary,
  onClearItinerary,
  directionsMode,
  directionsOrigin,
  directionsDestination,
  onClearDirections,
  onStartDirections,
}: InteractiveMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const zonesLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const vendorsLayerRef = useRef<L.LayerGroup | null>(null);
  const userGpsLayerRef = useRef<L.LayerGroup | null>(null);
  const polylineLayerRef = useRef<L.Polyline | null>(null);
  const routePolylinesGroupRef = useRef<L.LayerGroup | null>(null);

  const [activeDestination, setActiveDestination] = useState<Destination | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [activeRouteResult, setActiveRouteResult] = useState<RouteResult | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Map Toolbar & Controls state
  const [activeTab, setActiveTab] = useState<MapViewTab>('explore');
  const [crowdFilter, setCrowdFilter] = useState<CrowdFilterValue>('ALL');
  const [showCrowdZones, setShowCrowdZones] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchOpen, setSearchOpen] = useState<boolean>(false);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [showFilterSheet, setShowFilterSheet] = useState<boolean>(false);
  const [showDistrictSheet, setShowDistrictSheet] = useState<boolean>(false);

  // Mobile Bottom Sheet Drawer State
  const [drawerState, setDrawerState] = useState<DrawerState>('collapsed');
  const touchStartYRef = useRef<number | null>(null);
  const touchCurrentYRef = useRef<number | null>(null);

  // GPS / My Location states
  const [userGpsCoords, setUserGpsCoords] = useState<{
    lat: number;
    lng: number;
    name: string;
    accuracy?: number;
    isGps: boolean;
  } | null>(null);
  const [gpsStatus, setGpsStatus] = useState<
    'idle' | 'locating' | 'granted' | 'denied' | 'unavailable' | 'timeout' | 'unsupported'
  >('idle');
  const [gpsErrorMessage, setGpsErrorMessage] = useState<string | null>(null);
  const [showChooseHub, setShowChooseHub] = useState<boolean>(false);

  // Local Street Vendors state
  const [vendors, setVendors] = useState<LocalVendor[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<LocalVendor | null>(null);
  const [selectedVendorCategory, setSelectedVendorCategory] = useState<string>('all');
  const [loadingVendors, setLoadingVendors] = useState<boolean>(false);
  const [showVendorsLayer, setShowVendorsLayer] = useState<boolean>(true);
  const [vendorSearchCenter, setVendorSearchCenter] = useState<{
    lat: number;
    lng: number;
    label: string;
  } | null>(null);

  // List of transit hub names from JHARKHAND_HUBS object
  const hubNames = useMemo(() => {
    return Object.values(JHARKHAND_HUBS).map((h) => h.name);
  }, []);

  // Offline GIS Map Download & Storage State
  const [showOfflineModal, setShowOfflineModal] = useState<boolean>(false);
  const [currentMapBounds, setCurrentMapBounds] = useState<MapBounds | null>(null);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [offlineRegionCount, setOfflineRegionCount] = useState<number>(0);

  // Refresh saved offline region count
  useEffect(() => {
    getStorageStats()
      .then((stats) => {
        setOfflineRegionCount(stats.regionCount);
      })
      .catch(() => {});
  }, [showOfflineModal]);

  // Navigate to downloaded offline region
  const handleNavigateToOfflineRegion = (bounds: MapBounds, name: string) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    try {
      const corner1 = L.latLng(bounds.south, bounds.west);
      const corner2 = L.latLng(bounds.north, bounds.east);
      const latLngBounds = L.latLngBounds(corner1, corner2);
      map.fitBounds(latLngBounds, { padding: [35, 35], maxZoom: 13, animate: true });
    } catch (e) {
      console.error('Failed to fit bounds:', e);
    }
  };

  // Validate coordinates helper
  const isValidCoord = (lat?: number, lng?: number): boolean => {
    return (
      typeof lat === 'number' &&
      typeof lng === 'number' &&
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180 &&
      (lat !== 0 || lng !== 0)
    );
  };

  // Resolve itinerary days
  const itineraryDaysWithDest = useMemo(() => {
    if (!activeItinerary || !activeItinerary.days) return [];
    return activeItinerary.days
      .map((day) => {
        const dest = destinations.find(
          (d) =>
            (day.destinationId && d.id.toLowerCase() === day.destinationId.toLowerCase()) ||
            (day.destinationName && d.name.toLowerCase() === day.destinationName.toLowerCase()) ||
            (day.destinationName && d.slug.toLowerCase() === day.destinationName.toLowerCase())
        );
        return {
          day,
          destination: dest || null,
        };
      })
      .filter((item) => item.destination && isValidCoord(item.destination.latitude, item.destination.longitude));
  }, [activeItinerary, destinations]);

  // Determine which destinations to show on map with crowd filtering
  const filteredDestinations = useMemo(() => {
    if (directionsMode && directionsDestination) {
      return [directionsDestination];
    }

    if (activeItinerary && itineraryDaysWithDest.length > 0) {
      const destIds = new Set(itineraryDaysWithDest.map((item) => item.destination!.id));
      let base = destinations.filter((d) => destIds.has(d.id));
      if (crowdFilter !== 'ALL') {
        base = base.filter((d) => getCrowdInfo(d.crowd_status).level === crowdFilter);
      }
      return base;
    }

    let list = destinations.filter((d) => isValidCoord(d.latitude, d.longitude));

    // District filter
    if (selectedDistrict !== 'all') {
      list = list.filter((d) => d.district_id === selectedDistrict);
    }

    // Crowd status filter
    if (crowdFilter !== 'ALL') {
      list = list.filter((d) => getCrowdInfo(d.crowd_status).level === crowdFilter);
    }

    return list;
  }, [
    destinations,
    selectedDistrict,
    activeItinerary,
    itineraryDaysWithDest,
    directionsMode,
    directionsDestination,
    crowdFilter,
  ]);

  // Search Results suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return destinations
      .filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.slug.toLowerCase().includes(q) ||
          d.tags.some((t) => t.toLowerCase().includes(q)) ||
          (d.district?.name && d.district.name.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [destinations, searchQuery]);

  // Determine current center for vendor discovery (active destination OR user GPS coordinates)
  useEffect(() => {
    async function loadVendors() {
      let centerCoords: { lat: number; lng: number; label: string } | null = null;

      if (activeTab === 'nearby' && userGpsCoords) {
        centerCoords = {
          lat: userGpsCoords.lat,
          lng: userGpsCoords.lng,
          label: 'Your Current GPS Location',
        };
      } else if (directionsDestination) {
        centerCoords = {
          lat: directionsDestination.latitude,
          lng: directionsDestination.longitude,
          label: directionsDestination.name,
        };
      } else if (activeDestination) {
        centerCoords = {
          lat: activeDestination.latitude,
          lng: activeDestination.longitude,
          label: activeDestination.name,
        };
      } else if (userGpsCoords) {
        centerCoords = {
          lat: userGpsCoords.lat,
          lng: userGpsCoords.lng,
          label: 'Your Current GPS Location',
        };
      } else if (destinations.length > 0) {
        const first = destinations[0];
        centerCoords = {
          lat: first.latitude,
          lng: first.longitude,
          label: first.name,
        };
      }

      if (centerCoords) {
        setVendorSearchCenter(centerCoords);
        setLoadingVendors(true);
        try {
          const results = await fetchNearbyVendors(
            { lat: centerCoords.lat, lng: centerCoords.lng },
            40,
            selectedVendorCategory
          );
          setVendors(results);
        } catch (e) {
          console.error('Failed to load nearby vendors:', e);
        } finally {
          setLoadingVendors(false);
        }
      }
    }

    loadVendors();
  }, [activeDestination, directionsDestination, userGpsCoords, activeTab, selectedVendorCategory, destinations]);

  // Fetch Road Route calculation when in Directions Mode
  useEffect(() => {
    let isMounted = true;

    async function calculateRoute() {
      if (directionsMode && directionsOrigin && directionsDestination) {
        if (!isValidCoord(directionsOrigin.lat, directionsOrigin.lng) || !isValidCoord(directionsDestination.latitude, directionsDestination.longitude)) {
          return;
        }

        setLoadingRoute(true);
        try {
          const res = await calculateRoadRoute(
            { lat: directionsOrigin.lat, lng: directionsOrigin.lng },
            { lat: directionsDestination.latitude, lng: directionsDestination.longitude }
          );
          if (isMounted) {
            setActiveRouteResult(res);
          }
        } catch (err) {
          console.error('Error calculating road route:', err);
          if (isMounted) {
            setActiveRouteResult(null);
          }
        } finally {
          if (isMounted) {
            setLoadingRoute(false);
          }
        }
      } else {
        if (isMounted) {
          setActiveRouteResult(null);
        }
      }
    }

    calculateRoute();

    return () => {
      isMounted = false;
    };
  }, [directionsMode, directionsOrigin, directionsDestination]);

  // Helper to safely verify if Leaflet map instance and container are active in DOM
  const isMapAlive = (map: L.Map | null): map is L.Map => {
    if (!map) return false;
    try {
      const container = map.getContainer();
      return !!(container && document.body.contains(container) && (map as any)._leaflet_id);
    } catch {
      return false;
    }
  };

  const safeFlyTo = (
    map: L.Map | null,
    latLng: L.LatLngExpression,
    zoom: number,
    options?: L.ZoomPanOptions
  ) => {
    if (!isMapAlive(map)) return;
    try {
      map.flyTo(latLng, zoom, options);
    } catch {
      try {
        map.setView(latLng, zoom);
      } catch {
        // ignore
      }
    }
  };

  const safeFitBounds = (
    map: L.Map | null,
    bounds: L.LatLngBoundsExpression,
    options?: L.FitBoundsOptions
  ) => {
    if (!isMapAlive(map)) return;
    try {
      map.fitBounds(bounds, options);
    } catch {
      // ignore
    }
  };

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      // Reset _leaflet_id on container if previous instance left it (e.g. StrictMode remounts)
      if ((mapContainerRef.current as any)._leaflet_id) {
        delete (mapContainerRef.current as any)._leaflet_id;
      }

      const map = L.map(mapContainerRef.current, {
        center: [23.6102, 85.2799], // Center of Jharkhand
        zoom: 8,
        minZoom: 4,
        maxZoom: 18,
        zoomControl: false,
      });

      // IndexedDB-backed Offline Tile Layer
      const offlineTileLayer = createOfflineTileLayer(
        'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        {
          layerName: 'carto',
          attribution:
            '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          subdomains: 'abcd',
          maxZoom: 19,
        }
      );
      offlineTileLayer.addTo(map);

      // Track bounds & center for offline region downloads
      const updateMapBoundsAndCenter = () => {
        try {
          if (!isMapAlive(map)) return;
          const b = map.getBounds();
          const c = map.getCenter();
          setCurrentMapBounds({
            south: b.getSouth(),
            west: b.getWest(),
            north: b.getNorth(),
            east: b.getEast(),
          });
          setCurrentMapCenter({ lat: c.lat, lng: c.lng });
        } catch {
          // ignore
        }
      };

      map.on('moveend', updateMapBoundsAndCenter);
      map.on('zoomend', updateMapBoundsAndCenter);
      updateMapBoundsAndCenter();

      // Layer groups ordered for proper visual stacking
      zonesLayerRef.current = L.layerGroup().addTo(map);
      routePolylinesGroupRef.current = L.layerGroup().addTo(map);
      markersLayerRef.current = L.layerGroup().addTo(map);
      vendorsLayerRef.current = L.layerGroup().addTo(map);
      userGpsLayerRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
    }

    return () => {
      if (mapInstanceRef.current) {
        try {
          if (zonesLayerRef.current) zonesLayerRef.current.clearLayers();
          if (routePolylinesGroupRef.current) routePolylinesGroupRef.current.clearLayers();
          if (markersLayerRef.current) markersLayerRef.current.clearLayers();
          if (vendorsLayerRef.current) vendorsLayerRef.current.clearLayers();
          if (userGpsLayerRef.current) userGpsLayerRef.current.clearLayers();
          if (polylineLayerRef.current) {
            polylineLayerRef.current.remove();
            polylineLayerRef.current = null;
          }
          mapInstanceRef.current.remove();
        } catch {
          // ignore cleanup errors
        }
        mapInstanceRef.current = null;
        setMapReady(false);
      }
    };
  }, []);

  // Update User GPS Marker on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const userGpsGroup = userGpsLayerRef.current;
    if (!isMapAlive(map) || !userGpsGroup || !mapReady) return;

    try {
      userGpsGroup.clearLayers();

      if (userGpsCoords && isValidCoord(userGpsCoords.lat, userGpsCoords.lng)) {
        const userPos: [number, number] = [userGpsCoords.lat, userGpsCoords.lng];

        // Outer accuracy ring
        const accuracyMeters = userGpsCoords.accuracy || 120;
        const accuracyCircle = L.circle(userPos, {
          radius: Math.min(accuracyMeters, 500),
          color: '#2563eb',
          fillColor: '#3b82f6',
          fillOpacity: 0.14,
          weight: 1.5,
          interactive: false,
        });
        userGpsGroup.addLayer(accuracyCircle);

        // Pulsing GPS Pin with coordinates
        const gpsMarkerHtml = `
          <div class="user-gps-pin" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative; cursor: pointer;">
            <div style="
              background: #1d4ed8;
              color: #ffffff;
              border: 2.5px solid #ffffff;
              box-shadow: 0 4px 16px rgba(29,78,216,0.6);
              border-radius: 9999px;
              padding: 4px 9px;
              font-size: 11px;
              font-weight: 800;
              display: flex;
              align-items: center;
              gap: 4px;
              white-space: nowrap;
              z-index: 20;
            ">
              <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#60a5fa;box-shadow:0 0 6px #60a5fa;"></span>
              <span>📍 You are here</span>
            </div>
            <div style="
              position: absolute;
              width: 32px;
              height: 32px;
              border-radius: 50%;
              background: rgba(37, 99, 235, 0.4);
              border: 2px solid rgba(147, 197, 253, 0.9);
              animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
              z-index: 10;
              pointer-events: none;
            "></div>
          </div>
        `;

        const gpsIcon = L.divIcon({
          className: 'custom-gps-icon',
          html: gpsMarkerHtml,
          iconSize: [110, 32],
          iconAnchor: [55, 16],
        });

        const marker = L.marker(userPos, { icon: gpsIcon, zIndexOffset: 1000 });
        marker.on('click', () => {
          if (isMapAlive(mapInstanceRef.current)) {
            safeFlyTo(mapInstanceRef.current, userPos, 14, { duration: 0.8 });
          }
        });
        userGpsGroup.addLayer(marker);
      }
    } catch (e) {
      console.error('Failed to update GPS marker on map:', e);
    }
  }, [userGpsCoords, mapReady]);

  // Update Local Vendors Markers on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const vendorsGroup = vendorsLayerRef.current;
    if (!isMapAlive(map) || !vendorsGroup || !mapReady) return;

    try {
      vendorsGroup.clearLayers();

      if (!showVendorsLayer || vendors.length === 0) return;

      vendors.forEach((vendor) => {
        if (!isValidCoord(vendor.latitude, vendor.longitude)) return;
        const isSelected = selectedVendor?.id === vendor.id;
        const vendorPos: [number, number] = [vendor.latitude, vendor.longitude];

        const vendorHtml = `
          <div class="leaflet-marker-custom ${isSelected ? 'vendor-selected' : ''}" style="
            display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer;
          ">
            <div style="
              background: ${isSelected ? '#ea580c' : '#c2410c'};
              color: #ffffff;
              border: 2px solid ${isSelected ? '#fdba74' : '#fb923c'};
              box-shadow: 0 4px 12px rgba(194,65,12,0.4);
              border-radius: 9999px;
              padding: 3px 8px;
              font-size: 10.5px;
              font-weight: 700;
              display: flex;
              align-items: center;
              gap: 4px;
              transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
              transition: all 0.2s ease;
              white-space: nowrap;
              z-index: ${isSelected ? 25 : 15};
            ">
              <span>${vendor.categoryIcon}</span>
              <span style="max-width: 100px; overflow: hidden; text-overflow: ellipsis;">${vendor.name.split(' ')[0]}</span>
              ${vendor.distanceKm !== undefined ? `<span style="font-size: 9px; opacity: 0.9; background: rgba(0,0,0,0.25); padding: 0 4px; border-radius: 3px;">${vendor.distanceKm}km</span>` : ''}
            </div>
            ${
              isSelected
                ? `<div style="
                    position: absolute;
                    bottom: -5px;
                    left: 50%;
                    transform: translateX(-50%);
                    width: 0;
                    height: 0;
                    border-left: 4px solid transparent;
                    border-right: 4px solid transparent;
                    border-top: 5px solid #ea580c;
                  "></div>`
                : ''
            }
          </div>
        `;

        const customIcon = L.divIcon({
          className: 'custom-vendor-icon',
          html: vendorHtml,
          iconSize: [120, 28],
          iconAnchor: [60, 14],
        });

        const marker = L.marker(vendorPos, { icon: customIcon });
        marker.on('click', () => {
          setSelectedVendor(vendor);
          setDrawerState('expanded');
          if (isMapAlive(mapInstanceRef.current)) {
            safeFlyTo(mapInstanceRef.current, vendorPos, Math.max(mapInstanceRef.current.getZoom(), 13), { duration: 0.8 });
          }
        });
        vendorsGroup.addLayer(marker);
      });
    } catch (e) {
      console.error('Failed to update vendor markers:', e);
    }
  }, [vendors, selectedVendor, showVendorsLayer, mapReady]);

  // Update Crowd Zones, Destination Markers, and Routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const zonesGroup = zonesLayerRef.current;
    const markersGroup = markersLayerRef.current;
    const routeGroup = routePolylinesGroupRef.current;
    if (!isMapAlive(map) || !zonesGroup || !markersGroup || !routeGroup || !mapReady) return;

    try {
      zonesGroup.clearLayers();
      markersGroup.clearLayers();
      routeGroup.clearLayers();

      if (polylineLayerRef.current) {
        try {
          polylineLayerRef.current.remove();
        } catch {
          // ignore
        }
        polylineLayerRef.current = null;
      }

      const bounds: L.LatLngExpression[] = [];

      // 1. RENDER CROWD DENSITY ZONES
      if (showCrowdZones && !directionsMode) {
        filteredDestinations.forEach((dest) => {
          if (!isValidCoord(dest.latitude, dest.longitude)) return;
          const crowd = getCrowdInfo(dest.crowd_status);
          const center: [number, number] = [dest.latitude, dest.longitude];

          const outerCircle = L.circle(center, {
            radius: crowd.radiusMeters,
            color: crowd.zoneColor,
            weight: crowd.level === 'HIGH' ? 2 : crowd.level === 'MEDIUM' ? 1.5 : 1,
            opacity: crowd.strokeOpacity,
            fillColor: crowd.zoneColor,
            fillOpacity: crowd.fillOpacity,
            interactive: true,
            className: `crowd-zone crowd-zone-${crowd.level.toLowerCase()}`,
          });

          outerCircle.on('click', () => {
            setActiveDestination(dest);
            setSelectedVendor(null);
            setDrawerState('collapsed');
            if (isMapAlive(mapInstanceRef.current)) {
              safeFlyTo(mapInstanceRef.current, center, Math.max(mapInstanceRef.current.getZoom(), 11), { duration: 0.8 });
            }
          });

          zonesGroup.addLayer(outerCircle);

          if (crowd.level === 'HIGH') {
            const innerCircle = L.circle(center, {
              radius: crowd.radiusMeters * 0.45,
              color: '#059669',
              weight: 1.5,
              opacity: 0.8,
              fillColor: '#10b981',
              fillOpacity: 0.4,
              interactive: false,
            });
            zonesGroup.addLayer(innerCircle);
          }
        });
      }

      // 2. RENDER MARKERS & ROUTES BASED ON MODE

      // --- MODE A: DIRECTIONS MODE ---
      if (directionsMode && directionsDestination) {
        const isDestValid = isValidCoord(directionsDestination.latitude, directionsDestination.longitude);

        if (isDestValid) {
          const destLatLng: [number, number] = [directionsDestination.latitude, directionsDestination.longitude];
          bounds.push(destLatLng);

          // Destination Marker
          const crowd = getCrowdInfo(directionsDestination.crowd_status);
          const destHtml = `
            <div class="leaflet-marker-custom" style="display: flex; align-items: center; justify-content: center; position: relative;">
              <div style="
                background: #059669;
                color: #ffffff;
                border: 2px solid #34d399;
                box-shadow: 0 4px 14px rgba(5,150,105,0.5);
                border-radius: 9999px;
                padding: 4px 10px;
                font-size: 11px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 5px;
                white-space: nowrap;
                z-index: 10;
              ">
                <span>🎯 ${directionsDestination.name}</span>
                <span style="font-size: 10px; background: rgba(0,0,0,0.25); padding: 1px 5px; border-radius: 4px;">
                  ${crowd.level === 'HIGH' ? '🟢' : '🟡'} ${crowd.level}
                </span>
              </div>
            </div>
          `;
          const destIcon = L.divIcon({
            className: 'custom-dest-icon',
            html: destHtml,
            iconSize: [160, 32],
            iconAnchor: [80, 16],
          });
          L.marker(destLatLng, { icon: destIcon }).addTo(markersGroup);

          // If Origin coordinates are set
          if (directionsOrigin && isValidCoord(directionsOrigin.lat, directionsOrigin.lng)) {
            const originLatLng: [number, number] = [directionsOrigin.lat, directionsOrigin.lng];
            bounds.push(originLatLng);

            const isGpsOrigin = directionsOrigin.isGps || directionsOrigin.name === 'Your Location';
            const originHtml = `
              <div class="leaflet-marker-custom" style="display: flex; flex-direction: column; align-items: center; justify-content: center; position: relative;">
                <div style="
                  background: #2563eb;
                  color: #ffffff;
                  border: 2px solid #93c5fd;
                  box-shadow: 0 4px 14px rgba(37,99,235,0.6);
                  border-radius: 9999px;
                  padding: 4px 10px;
                  font-size: 11px;
                  font-weight: 700;
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  white-space: nowrap;
                  position: relative;
                  z-index: 10;
                ">
                  <span style="display:inline-block;width:7px;height:7px;border-radius:50%;background:#ffffff;box-shadow:0 0 8px #ffffff;"></span>
                  <span>${isGpsOrigin ? '📍 You are here' : `📍 ${directionsOrigin.name}`}</span>
                </div>
                ${
                  isGpsOrigin
                    ? `<div style="
                        position: absolute;
                        width: 34px;
                        height: 34px;
                        border-radius: 50%;
                        background: rgba(37, 99, 235, 0.4);
                        border: 1.5px solid rgba(147, 197, 253, 0.8);
                        animation: ping 1.6s cubic-bezier(0, 0, 0.2, 1) infinite;
                        z-index: 5;
                        pointer-events: none;
                      "></div>`
                    : ''
                }
              </div>
            `;
            const originIcon = L.divIcon({
              className: 'custom-origin-icon',
              html: originHtml,
              iconSize: [140, 32],
              iconAnchor: [70, 16],
            });
            L.marker(originLatLng, { icon: originIcon }).addTo(markersGroup);

            // Draw real road route polyline only when calculated
            if (activeRouteResult && activeRouteResult.geometry.length > 0) {
              activeRouteResult.geometry.forEach(([lat, lng]) => bounds.push([lat, lng]));

              const roadLine = L.polyline(activeRouteResult.geometry, {
                color: '#2563eb',
                weight: 5,
                opacity: 0.9,
                lineCap: 'round',
                lineJoin: 'round',
              }).addTo(routeGroup);

              polylineLayerRef.current = roadLine;
            }
          }
        }
      }

      // --- MODE B: MULTI-DAY ITINERARY MODE ---
      else if (activeItinerary && itineraryDaysWithDest.length > 1) {
        const routePoints: [number, number][] = itineraryDaysWithDest.map((item) => [
          item.destination!.latitude,
          item.destination!.longitude,
        ]);

        const polyline = L.polyline(routePoints, {
          color: '#059669',
          weight: 4.5,
          dashArray: '8, 8',
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        }).addTo(routeGroup);

        polylineLayerRef.current = polyline;

        filteredDestinations.forEach((dest) => {
          if (!isValidCoord(dest.latitude, dest.longitude)) return;
          const isSelected = activeDestination?.id === dest.id;
          const itinDay = itineraryDaysWithDest.find(
            (item) => item.destination && item.destination.id === dest.id
          );
          const crowd = getCrowdInfo(dest.crowd_status);

          const latLng: [number, number] = [dest.latitude, dest.longitude];
          bounds.push(latLng);

          const badgeContent = itinDay ? `D${itinDay.day.dayNumber}` : '';
          const crowdDot = crowd.level === 'HIGH' ? '🟢' : '🟡';

          const iconHtml = `
            <div class="leaflet-marker-custom ${isSelected ? 'marker-selected' : ''}" style="
              display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer;
            ">
              <div style="
                background: ${isSelected ? '#047857' : '#065f46'};
                color: #ffffff;
                border: 2px solid ${isSelected ? '#34d399' : '#10b981'};
                box-shadow: 0 4px 12px rgba(0,0,0,0.35);
                border-radius: 9999px;
                padding: 4px 9px;
                font-size: 11px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 4px;
                transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
                transition: all 0.2s ease;
                white-space: nowrap;
              ">
                <span style="background:#10b981;color:#064e3b;font-size:9px;padding:1px 4px;border-radius:4px;font-weight:800;">${badgeContent}</span>
                <span>${dest.name}</span>
                <span style="font-size: 8px;">${crowdDot}</span>
              </div>
              ${
                isSelected
                  ? `<div style="
                      position: absolute;
                      bottom: -6px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 0;
                      height: 0;
                      border-left: 5px solid transparent;
                      border-right: 5px solid transparent;
                      border-top: 6px solid #047857;
                    "></div>`
                  : ''
              }
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: iconHtml,
            iconSize: [140, 32],
            iconAnchor: [70, 16],
          });

          const marker = L.marker(latLng, { icon: customIcon });
          marker.on('click', () => {
            setActiveDestination(dest);
            setSelectedVendor(null);
            setDrawerState('collapsed');
            if (isMapAlive(mapInstanceRef.current)) {
              safeFlyTo(mapInstanceRef.current, latLng, Math.max(mapInstanceRef.current.getZoom(), 11), { duration: 0.8 });
            }
          });
          markersGroup.addLayer(marker);
        });
      }

      // --- MODE C: STANDARD & CROWD EXPLORATION MODE ---
      else {
        filteredDestinations.forEach((dest) => {
          if (!isValidCoord(dest.latitude, dest.longitude)) return;

          const isSelected = activeDestination?.id === dest.id;
          const crowd = getCrowdInfo(dest.crowd_status);
          const latLng: [number, number] = [dest.latitude, dest.longitude];
          bounds.push(latLng);

          const crowdIndicator = crowd.level === 'HIGH' ? '🟢' : '🟡';

          const iconHtml = `
            <div class="leaflet-marker-custom ${isSelected ? 'marker-selected' : ''}" style="
              display: flex; align-items: center; justify-content: center; position: relative; cursor: pointer;
            ">
              <div style="
                background: ${isSelected ? '#059669' : '#1c1917'};
                color: #ffffff;
                border: 2px solid ${isSelected ? '#34d399' : '#44403c'};
                box-shadow: 0 4px 14px rgba(0,0,0,0.35);
                border-radius: 9999px;
                padding: 4px 9px;
                font-size: 11px;
                font-weight: 700;
                display: flex;
                align-items: center;
                gap: 4px;
                transform: ${isSelected ? 'scale(1.12)' : 'scale(1)'};
                transition: all 0.2s ease;
                white-space: nowrap;
              ">
                <span style="font-size: 9px;">${crowdIndicator}</span>
                <span>${dest.name}</span>
              </div>
              ${
                isSelected
                  ? `<div style="
                      position: absolute;
                      bottom: -6px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 0;
                      height: 0;
                      border-left: 5px solid transparent;
                      border-right: 5px solid transparent;
                      border-top: 6px solid #059669;
                    "></div>`
                  : ''
              }
            </div>
          `;

          const customIcon = L.divIcon({
            className: 'custom-div-icon',
            html: iconHtml,
            iconSize: [130, 32],
            iconAnchor: [65, 16],
          });

          const marker = L.marker(latLng, { icon: customIcon });
          marker.on('click', () => {
            setActiveDestination(dest);
            setSelectedVendor(null);
            setDrawerState('collapsed');
            if (isMapAlive(mapInstanceRef.current)) {
              safeFlyTo(mapInstanceRef.current, latLng, Math.max(mapInstanceRef.current.getZoom(), 11), { duration: 0.8 });
            }
          });
          markersGroup.addLayer(marker);
        });
      }

      // Fit bounds safely without conflicting with active manual flyTo
      if (bounds.length > 0) {
        if (bounds.length === 1) {
          safeFlyTo(map, bounds[0], 11);
        } else {
          safeFitBounds(map, L.latLngBounds(bounds), {
            padding: [50, 50],
            maxZoom: 12,
            animate: false,
          });
        }
      }
    } catch (e) {
      console.error('Failed to update map layers:', e);
    }
  }, [
    filteredDestinations,
    activeItinerary,
    itineraryDaysWithDest,
    directionsMode,
    directionsOrigin,
    directionsDestination,
    activeRouteResult,
    mapReady,
    showCrowdZones,
    crowdFilter,
  ]);

  // Handle Initial Focused Destination from Props
  useEffect(() => {
    if (!destinations.length || !mapReady || directionsMode) return;

    let target: Destination | undefined;
    if (focusedDestinationSlug) {
      target = destinations.find(
        (d) => d.slug.toLowerCase() === focusedDestinationSlug.toLowerCase()
      );
    }
    if (!target && focusedDestinationId) {
      target = destinations.find(
        (d) => d.id.toLowerCase() === focusedDestinationId.toLowerCase()
      );
    }

    if (target && isValidCoord(target.latitude, target.longitude)) {
      setActiveDestination(target);
      setDrawerState('collapsed');
      safeFlyTo(mapInstanceRef.current, [target.latitude, target.longitude], 12, { duration: 1.2 });
    } else if (!activeDestination && destinations.length > 0) {
      const firstValid = destinations.find((d) => isValidCoord(d.latitude, d.longitude));
      if (firstValid) {
        setActiveDestination(firstValid);
      }
    }
  }, [focusedDestinationSlug, focusedDestinationId, destinations, mapReady, directionsMode]);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    (e.target as HTMLImageElement).src =
      'https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=800&auto=format&fit=crop&q=80';
  };

  const handleZoomIn = () => {
    if (isMapAlive(mapInstanceRef.current)) {
      try {
        mapInstanceRef.current.zoomIn();
      } catch {}
    }
  };

  const handleZoomOut = () => {
    if (isMapAlive(mapInstanceRef.current)) {
      try {
        mapInstanceRef.current.zoomOut();
      } catch {}
    }
  };

  const handleRecenter = () => {
    if (isMapAlive(mapInstanceRef.current)) {
      safeFlyTo(mapInstanceRef.current, [23.6102, 85.2799], 8, { duration: 1 });
    }
  };

  const handleSelectFromSearch = (dest: Destination) => {
    setActiveDestination(dest);
    setSelectedVendor(null);
    setDrawerState('collapsed');
    setSearchQuery('');
    setSearchOpen(false);
    if (isValidCoord(dest.latitude, dest.longitude)) {
      safeFlyTo(mapInstanceRef.current, [dest.latitude, dest.longitude], 13, { duration: 1.2 });
    }
  };

  // Explicit Browser Geolocation Request (Only called on explicit user button tap)
  const handleRequestUserGpsLocation = async (): Promise<{
    lat: number;
    lng: number;
    name: string;
    accuracy?: number;
    isGps: boolean;
  } | null> => {
    console.log('[GPS Flow] User tapped GPS button. Initiating geolocation request...');
    setGpsStatus('locating');
    setGpsErrorMessage(null);

    try {
      const pos = await requestUserLocation();
      setGpsStatus('granted');
      const userLoc = {
        lat: pos.lat,
        lng: pos.lng,
        name: 'Your Location',
        accuracy: pos.accuracy,
        isGps: true,
      };
      console.log('[GPS Flow] Storing verified GPS coordinates:', userLoc);
      setUserGpsCoords(userLoc);
      setActiveTab('nearby');

      if (mapInstanceRef.current) {
        mapInstanceRef.current.flyTo([pos.lat, pos.lng], 13, { duration: 1.2 });
      }

      if (directionsMode && directionsDestination) {
        if (!isValidCoord(directionsDestination.latitude, directionsDestination.longitude)) {
          console.error('[GPS Flow] Route unavailable: destination coordinates are missing or invalid for', directionsDestination.name);
          setGpsErrorMessage('Route unavailable: destination location is missing.');
          return userLoc;
        }

        console.log('[GPS Flow] Calling onStartDirections with real GPS origin and target destination:', {
          origin: userLoc,
          destination: {
            name: directionsDestination.name,
            latitude: directionsDestination.latitude,
            longitude: directionsDestination.longitude,
          },
        });

        if (onStartDirections) {
          onStartDirections(directionsDestination, userLoc);
        }
      }

      return userLoc;
    } catch (err: any) {
      console.error('[GPS Flow] Geolocation request caught error:', err);
      const errType = err?.type;
      const errCode = err?.code;

      if (errType === 'PERMISSION_DENIED' || errCode === 1) {
        setGpsStatus('denied');
        setGpsErrorMessage(
          'Location permission is blocked. Please allow location access for this site in your browser settings, then tap Try Again.'
        );
      } else if (errType === 'TIMEOUT' || errCode === 3) {
        setGpsStatus('timeout');
        setGpsErrorMessage('Location request timed out. Please verify GPS is enabled and try again.');
      } else if (errType === 'NOT_SUPPORTED') {
        setGpsStatus('unsupported');
        setGpsErrorMessage(err?.message || 'Location services are not supported on this browser.');
      } else {
        setGpsStatus('unavailable');
        setGpsErrorMessage(
          err?.message || 'Unable to determine your GPS location. Please check device location settings and try again.'
        );
      }
      return null;
    }
  };

  // Handle "Start Directions" from GPS / Hub to a destination or vendor
  const handleStartDirectionsWithGps = async (targetDest: Destination) => {
    if (!isValidCoord(targetDest.latitude, targetDest.longitude)) {
      setGpsErrorMessage('Route unavailable for this destination.');
      return;
    }
    setDrawerState('expanded');
    let originToUse = userGpsCoords;
    if (!originToUse) {
      originToUse = await handleRequestUserGpsLocation();
    }
    if (originToUse && onStartDirections) {
      onStartDirections(targetDest, originToUse);
    }
  };

  // Handle recalculate route with fresh GPS reading
  const handleRecalculateRoute = async () => {
    const freshGps = await handleRequestUserGpsLocation();
    if (freshGps && directionsDestination && onStartDirections) {
      onStartDirections(directionsDestination, freshGps);
    }
  };

  // Handle Start Directions to a specific vendor
  const handleStartDirectionsToVendor = (vendor: LocalVendor) => {
    const origin = userGpsCoords || resolveLocationCoords('Ranchi', destinations);
    const mockDest: Destination = {
      id: vendor.id,
      name: vendor.name,
      slug: `vendor-${vendor.id}`,
      latitude: vendor.latitude,
      longitude: vendor.longitude,
      featured_image: vendor.featuredImage || 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
      description: vendor.description,
      tagline: `${vendor.categoryLabel} • ${vendor.villageOrArea}`,
      category_id: 'c1',
      district_id: 'd1',
      entry_fee_inr: 0,
      timings: vendor.openingHours,
      images: [],
      tags: vendor.specialties,
      rating: vendor.rating,
      review_count: vendor.reviewCount,
      crowd_status: 'moderate',
      is_featured: false,
      is_eco_certified: true,
      cultural_significance: 'Local tribal entrepreneurship and authentic cultural gastronomy',
      eco_guidelines: 'Support local vendors, avoid plastic litter, and respect local customs.',
      best_time_to_visit: vendor.openingHours || 'All year round',
      created_at: new Date().toISOString(),
      district: {
        id: 'd1',
        name: vendor.district,
        division: 'Jharkhand',
        headquarters: vendor.district,
        description: null,
        featured_image: null,
        latitude: vendor.latitude,
        longitude: vendor.longitude,
        created_at: new Date().toISOString(),
      },
    };

    if (onStartDirections) {
      onStartDirections(mockDest, origin);
    }
  };

  // Handle choosing a starting transit hub
  const handleSelectStartingHub = (hubName: string) => {
    const target = displayedDest || destinations[0];
    if (!target || !onStartDirections) return;
    const resolved = resolveLocationCoords(hubName, destinations);
    setShowChooseHub(false);
    setGpsStatus('idle');
    setGpsErrorMessage(null);
    onStartDirections(target, resolved);
  };

  // Touch handlers for mobile bottom sheet drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartYRef.current = e.touches[0].clientY;
    touchCurrentYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchCurrentYRef.current = e.touches[0].clientY;
  };

  const handleTouchEnd = () => {
    if (touchStartYRef.current !== null && touchCurrentYRef.current !== null) {
      const deltaY = touchCurrentYRef.current - touchStartYRef.current;
      if (deltaY < -40) {
        if (drawerState === 'collapsed') {
          setDrawerState('expanded');
        }
      } else if (deltaY > 40) {
        if (drawerState === 'expanded') {
          setDrawerState('collapsed');
        } else if (drawerState === 'collapsed') {
          setDrawerState('hidden');
        }
      }
    }
    touchStartYRef.current = null;
    touchCurrentYRef.current = null;
  };

  const displayedDest = directionsMode && directionsDestination ? directionsDestination : activeDestination;
  const activeCrowdInfo = displayedDest ? getCrowdInfo(displayedDest.crowd_status) : null;

  return (
    <div className="space-y-3">
      {/* ========================================================================= */}
      {/* 1. TOP TOOLBAR CONTROLS & SEARCH BAR                                    */}
      {/* ========================================================================= */}
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl p-2.5 sm:p-3.5 shadow-sm space-y-2.5">
        {/* Top Row: Search Input with Autocomplete */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
            <Input
              type="text"
              placeholder="Search destinations or local vendors..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              className="pl-9 pr-8 py-1.5 h-9 text-xs bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800 rounded-xl text-stone-900 dark:text-white placeholder:text-stone-400 focus-visible:ring-1 focus-visible:ring-emerald-500"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchOpen(false);
                }}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1 cursor-pointer"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

            {searchOpen && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl shadow-xl z-50 overflow-hidden divide-y divide-stone-100 dark:divide-stone-800 max-h-60 overflow-y-auto animate-in fade-in-50">
                {searchResults.map((dest) => {
                  const crowd = getCrowdInfo(dest.crowd_status);
                  return (
                    <button
                      key={dest.id}
                      onClick={() => handleSelectFromSearch(dest)}
                      className="w-full px-3 py-2.5 flex items-center justify-between text-left hover:bg-stone-50 dark:hover:bg-stone-800/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <div className="h-7 w-7 rounded-lg overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800">
                          <img
                            src={dest.featured_image}
                            alt={dest.name}
                            onError={handleImageError}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="truncate">
                          <div className="font-semibold text-xs text-stone-900 dark:text-white truncate">
                            {dest.name}
                          </div>
                          <div className="text-[10px] text-stone-500 dark:text-stone-400 truncate">
                            {dest.district?.name || 'Jharkhand'}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${crowd.tagColor}`}>
                          {crowd.level === 'HIGH' ? '🟢' : '🟡'} {crowd.level}
                        </Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Filter by Crowd Density Button */}
          <button
            onClick={() => setShowFilterSheet(true)}
            className={`h-9 px-3 rounded-xl border text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              crowdFilter !== 'ALL'
                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Crowd:</span>
            <span>{crowdFilter === 'ALL' ? 'Filter' : crowdFilter}</span>
          </button>

          {/* Crowd Zones Toggle */}
          <button
            onClick={() => setShowCrowdZones(!showCrowdZones)}
            aria-label="Toggle crowd zones"
            title="Toggle crowd density zones"
            className={`h-9 px-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1 shrink-0 transition-all cursor-pointer ${
              showCrowdZones
                ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
                : 'bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-400'
            }`}
          >
            {showCrowdZones ? (
              <Eye className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <EyeOff className="h-3.5 w-3.5" />
            )}
            <span className="hidden md:inline">{showCrowdZones ? 'Zones ON' : 'Zones OFF'}</span>
          </button>

          {/* Offline Maps GIS Download Button */}
          <button
            onClick={() => setShowOfflineModal(true)}
            aria-label="Download for offline"
            title="Download map regions & tile cache for offline use"
            className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer shadow-xs ${
              offlineRegionCount > 0
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <HardDrive className="h-3.5 w-3.5 shrink-0" />
            <span className="hidden sm:inline">Offline Maps</span>
            <span className="sm:hidden">Offline</span>
            {offlineRegionCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-white text-emerald-800 text-[10px] font-extrabold shadow-xs">
                {offlineRegionCount}
              </span>
            )}
          </button>
        </div>

        {/* Second Row: Mode Tabs & GPS Action Button */}
        <div className="flex items-center justify-between gap-2 overflow-x-auto no-scrollbar pt-0.5">
          <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-800/80 p-1 rounded-xl shrink-0">
            <button
              onClick={() => {
                setActiveTab('explore');
                setShowCrowdZones(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'explore'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Explore</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('crowd');
                setShowCrowdZones(true);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'crowd'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                  : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
              }`}
            >
              <Users className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Crowd</span>
            </button>

            {/* Local Street Vendors Tab */}
            <button
              onClick={() => {
                setActiveTab('vendors');
                setShowVendorsLayer(true);
                setDrawerState('expanded');
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'vendors'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-amber-800 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60'
              }`}
            >
              <ShoppingBag className="h-3.5 w-3.5 text-amber-500" />
              <span>Local Vendors ({vendors.length})</span>
            </button>

            {/* My Location / GPS discovery button */}
            <button
              onClick={handleRequestUserGpsLocation}
              disabled={gpsStatus === 'locating'}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'nearby' || userGpsCoords
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/60'
              }`}
            >
              <LocateFixed className={`h-3.5 w-3.5 ${gpsStatus === 'locating' ? 'animate-spin text-white' : ''}`} />
              <span>{gpsStatus === 'locating' ? 'Locating…' : userGpsCoords ? 'GPS Active' : 'My Location'}</span>
            </button>

            {directionsDestination && (
              <button
                onClick={() => setActiveTab('directions')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'directions'
                    ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-xs'
                    : 'text-stone-600 dark:text-stone-400 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>Directions</span>
              </button>
            )}
          </div>

          {/* District Selector Trigger */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <button
              onClick={() => setShowDistrictSheet(true)}
              className="px-2.5 py-1 rounded-lg bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-700 text-xs font-medium border border-stone-200/60 dark:border-stone-700/60 flex items-center gap-1 cursor-pointer"
            >
              <MapPin className="h-3 w-3 text-emerald-600" />
              <span className="truncate max-w-[90px]">
                {selectedDistrict === 'all'
                  ? 'All Districts'
                  : districts.find((d) => d.id === selectedDistrict)?.name || 'District'}
              </span>
            </button>
          </div>
        </div>

        {/* GPS Status / Error Notification Alert Banner */}
        {gpsErrorMessage && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between gap-2 animate-in fade-in-50">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
              <span>{gpsErrorMessage}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={handleRequestUserGpsLocation}
                className="h-6 px-2 text-[11px] border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900"
              >
                Try Again
              </Button>
              <button
                onClick={() => setGpsErrorMessage(null)}
                className="p-0.5 text-amber-600 hover:text-amber-800 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN MAP CANVAS CONTAINER                                             */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-3 sm:p-5 text-stone-900 dark:text-white shadow-xl overflow-hidden relative">
        {/* Map Canvas Section */}
        <div className="lg:col-span-2 relative h-[480px] sm:h-[580px] lg:h-[680px] xl:h-[720px] rounded-2xl bg-stone-100 dark:bg-stone-950 border border-stone-200 dark:border-stone-800 overflow-hidden">
          {/* Leaflet Map Root */}
          <div
            ref={mapContainerRef}
            className="absolute inset-0 w-full h-full z-0 rounded-2xl"
            style={{ background: '#e2e8f0' }}
          />

          {/* TOP-LEFT STATUS BADGES */}
          <div className="absolute top-3 left-3 z-10 flex flex-wrap items-center gap-1.5 max-w-[80%] pointer-events-none">
            {directionsMode ? (
              <Badge variant="outline" className="pointer-events-auto bg-blue-600/90 text-white border-blue-400 text-[11px] gap-1 shadow-md py-0.5">
                <Car className="h-3 w-3 animate-pulse" />
                <span>Road Route Active</span>
                {onClearDirections && (
                  <button
                    onClick={onClearDirections}
                    className="ml-1 hover:text-rose-200 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ) : activeItinerary ? (
              <Badge variant="emerald" className="pointer-events-auto bg-emerald-700/90 text-white border-emerald-400 text-[11px] gap-1 shadow-md py-0.5">
                <Route className="h-3 w-3 text-amber-300" />
                <span>Itinerary ({itineraryDaysWithDest.length} Stops)</span>
                {onClearItinerary && (
                  <button
                    onClick={onClearItinerary}
                    className="ml-1 hover:text-rose-200 cursor-pointer"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-white/90 dark:bg-stone-900/90 backdrop-blur-md text-stone-800 dark:text-stone-200 border-stone-300 dark:border-stone-700 text-[11px] shadow-sm">
                <span>{filteredDestinations.length} Sites</span>
              </Badge>
            )}

            {userGpsCoords && (
              <Badge variant="outline" className="pointer-events-auto bg-blue-600 text-white border-blue-400 text-[10px] gap-1 shadow-xs">
                <span>📍 GPS Active</span>
              </Badge>
            )}

            {activeTab === 'vendors' && (
              <Badge variant="outline" className="pointer-events-auto bg-amber-600 text-white border-amber-400 text-[10px] gap-1 shadow-xs">
                <span>🛍️ {vendors.length} Vendors</span>
              </Badge>
            )}
          </div>

          {/* TOP-RIGHT MAP CONTROLS */}
          <div className="absolute top-3 right-3 z-10 flex flex-col items-end gap-2">
            <div className="flex flex-col bg-white/95 dark:bg-stone-900/95 backdrop-blur-md rounded-xl border border-stone-200 dark:border-stone-800 shadow-md overflow-hidden">
              <button
                onClick={handleZoomIn}
                title="Zoom In"
                aria-label="Zoom In"
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={handleZoomOut}
                title="Zoom Out"
                aria-label="Zoom Out"
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800 cursor-pointer"
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                onClick={handleRecenter}
                title="Recenter Map"
                aria-label="Recenter Map"
                className="p-2 text-emerald-600 dark:text-emerald-400 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors border-b border-stone-100 dark:border-stone-800 cursor-pointer"
              >
                <Compass className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowOfflineModal(true)}
                title="Download for Offline Use"
                aria-label="Download for Offline Use"
                className="p-2 text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer relative"
              >
                <HardDrive className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                {offlineRegionCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full ring-1 ring-white" />
                )}
              </button>
            </div>

            {/* Collapsible Crowd Legend */}
            {!showLegend ? (
              <button
                onClick={() => setShowLegend(true)}
                className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-md text-xs font-semibold text-stone-800 dark:text-stone-200 flex items-center gap-1.5 hover:bg-stone-50 cursor-pointer"
              >
                <Users className="h-3.5 w-3.5 text-emerald-600" />
                <span>Legend</span>
              </button>
            ) : (
              <div className="bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl text-xs space-y-2 max-w-[200px] animate-in fade-in-50">
                <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
                  <span className="font-bold text-stone-900 dark:text-white flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Map Markers</span>
                  </span>
                  <button
                    onClick={() => setShowLegend(false)}
                    className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-0.5 cursor-pointer"
                    aria-label="Collapse Legend"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span className="text-emerald-500 text-xs">🟢</span>
                      <span>High Crowd</span>
                    </div>
                    <span className="text-[10px] text-stone-500">Green</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span className="text-amber-500 text-xs">🟡</span>
                      <span>Medium</span>
                    </div>
                    <span className="text-[10px] text-stone-500">Yellow</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span>🛍️</span>
                      <span>Local Vendor</span>
                    </div>
                    <span className="text-[10px] text-amber-600">Orange</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
                      <span>📍</span>
                      <span>My Location</span>
                    </div>
                    <span className="text-[10px] text-blue-600">Blue</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* MOBILE SWIPEABLE BOTTOM SHEET DRAWER                                    */}
          {/* ========================================================================= */}
          <div
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`lg:hidden absolute left-2 right-2 bottom-2 z-30 transition-all duration-300 ease-out shadow-2xl rounded-2xl border border-stone-200 dark:border-stone-800 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md flex flex-col overflow-hidden ${
              drawerState === 'hidden'
                ? 'translate-y-[120%] pointer-events-none opacity-0'
                : drawerState === 'collapsed'
                ? 'max-h-[140px] translate-y-0'
                : 'max-h-[85%] translate-y-0'
            }`}
          >
            {/* Drag Handle */}
            <div
              onClick={() =>
                setDrawerState(drawerState === 'collapsed' ? 'expanded' : 'collapsed')
              }
              className="py-2.5 px-4 shrink-0 flex flex-col items-center justify-center cursor-pointer border-b border-stone-100 dark:border-stone-800/80 select-none bg-stone-50/50 dark:bg-stone-800/30"
            >
              <div className="w-10 h-1 rounded-full bg-stone-300 dark:bg-stone-600 mb-1" />
              <div className="flex items-center gap-1 text-[10px] font-bold text-stone-500 uppercase tracking-wider">
                <span>{drawerState === 'collapsed' ? 'Swipe Up for Details' : 'Swipe Down to Collapse'}</span>
                {drawerState === 'collapsed' ? (
                  <ChevronUp className="h-3 w-3 text-stone-400" />
                ) : (
                  <ChevronDown className="h-3 w-3 text-stone-400" />
                )}
              </div>
            </div>

            {/* Mobile Sheet Content */}
            <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 min-h-0 overscroll-contain space-y-3 pb-4">
              {/* If in Directions Mode */}
              {directionsMode && directionsDestination ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-2">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-extrabold text-sm text-stone-900 dark:text-white">Route Navigation</h4>
                    </div>
                    {onClearDirections && (
                      <button
                        onClick={onClearDirections}
                        className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer font-bold"
                      >
                        <X className="h-3.5 w-3.5" />
                        <span>Exit</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-bold gap-1 py-0.5 px-2">
                      <Car className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                      <span>Mode: Driving</span>
                    </Badge>
                    {activeRouteResult?.isLiveRouting && (
                      <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold">
                        🟢 Live Road Route
                      </span>
                    )}
                  </div>

                  {/* Destination Validity Check */}
                  {!isValidCoord(directionsDestination.latitude, directionsDestination.longitude) ? (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-2">
                      <div className="flex items-center gap-2 font-bold">
                        <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                        <span>Route unavailable: destination location is missing.</span>
                      </div>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        Exact road network coordinates are missing for this location.
                      </p>
                    </div>
                  ) : !directionsOrigin ? (
                    /* GPS Access Needed State */
                    <div className="space-y-3">
                      <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 space-y-2">
                        <div className="flex items-start gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                          <div className="text-xs min-w-0">
                            <span className="text-[10px] text-stone-500 block uppercase font-bold">Destination</span>
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate block">
                              🎯 {directionsDestination.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* GPS Error & Retry Message */}
                      {(gpsStatus === 'denied' || gpsStatus === 'timeout' || gpsStatus === 'unavailable' || gpsStatus === 'unsupported') && gpsErrorMessage && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-2.5">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                            <span className="leading-snug">{gpsErrorMessage}</span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 pt-0.5">
                            <Button
                              size="sm"
                              onClick={() => handleRequestUserGpsLocation()}
                              className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg gap-1.5 cursor-pointer"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Try Again</span>
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setShowChooseHub(true)}
                              className="h-8 text-xs bg-white dark:bg-stone-900 border-rose-300 dark:border-rose-800 text-stone-800 dark:text-stone-200 font-semibold rounded-lg cursor-pointer"
                            >
                              <span>Pick City</span>
                            </Button>
                          </div>
                          <div className="pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                            <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1 font-semibold">Quick Starting Hub:</span>
                            <div className="flex flex-wrap gap-1">
                              {['Ranchi', 'Jamshedpur', 'Dhanbad', 'Deoghar', 'Bokaro'].map((hub) => (
                                <button
                                  key={hub}
                                  type="button"
                                  onClick={() => handleSelectStartingHub(hub)}
                                  className="text-[10px] bg-white dark:bg-stone-800 hover:bg-emerald-600 hover:text-white border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-md text-stone-700 dark:text-stone-300 font-medium cursor-pointer transition-colors"
                                >
                                  📍 {hub}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Primary GPS Trigger Button */}
                      <Button
                        onClick={() => handleRequestUserGpsLocation()}
                        disabled={gpsStatus === 'locating'}
                        className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md gap-2 cursor-pointer"
                      >
                        <LocateFixed className={`h-4 w-4 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                        <span>{gpsStatus === 'locating' ? 'Getting your current location...' : 'USE MY GPS'}</span>
                      </Button>

                      <div className="text-center">
                        <button
                          type="button"
                          onClick={() => setShowChooseHub(true)}
                          className="text-[11px] text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline font-medium cursor-pointer"
                        >
                          Or calculate from a starting city / hub
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Route Information Card with Real GPS Data */
                    <div className="space-y-3">
                      <div className="p-3 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 space-y-2.5">
                        <div className="flex items-start gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-blue-600 mt-1 shrink-0" />
                          <div className="text-xs min-w-0">
                            <span className="text-[10px] text-stone-500 block uppercase font-bold">From (Origin)</span>
                            <span className="font-bold text-stone-900 dark:text-white truncate block">
                              {directionsOrigin?.isGps ? '📍 Your Location (You are here)' : `📍 ${directionsOrigin?.name || 'Your Location'}`}
                            </span>
                          </div>
                        </div>

                        <div className="ml-1 pl-3 border-l-2 border-dashed border-blue-500/50 py-1.5">
                          {loadingRoute ? (
                            <div className="flex items-center gap-1.5 text-xs text-blue-600 py-1 font-semibold">
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Calculating drivable road route...</span>
                            </div>
                          ) : activeRouteResult ? (
                            <div className="flex items-center justify-between text-xs bg-white/90 dark:bg-stone-900/90 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
                              <div>
                                <span className="text-[10px] text-stone-500 block font-bold uppercase">Distance</span>
                                <span className="font-extrabold text-sm text-stone-900 dark:text-white">
                                  {activeRouteResult.distanceKm} km
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-stone-500 block font-bold uppercase">Est. Travel Time</span>
                                <span className="font-extrabold text-sm text-emerald-700 dark:text-emerald-400">
                                  {activeRouteResult.durationFormatted}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-stone-500 italic">Calculating road estimates...</span>
                          )}
                        </div>

                        <div className="flex items-start gap-2">
                          <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                          <div className="text-xs min-w-0">
                            <span className="text-[10px] text-stone-500 block uppercase font-bold">To Destination</span>
                            <span className="font-bold text-emerald-800 dark:text-emerald-300 truncate block">
                              🎯 {directionsDestination.name}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Guidance Steps */}
                      {activeRouteResult && activeRouteResult.steps && activeRouteResult.steps.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block">
                            Route Guidance:
                          </span>
                          <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                            {activeRouteResult.steps.map((step, idx) => (
                              <div
                                key={idx}
                                className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60 text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-1.5"
                              >
                                <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                                <span>{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleRecalculateRoute}
                          disabled={gpsStatus === 'locating' || loadingRoute}
                          className="text-xs border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 gap-1 rounded-xl h-10 font-bold"
                        >
                          <RefreshCw className={`h-3.5 w-3.5 ${gpsStatus === 'locating' || loadingRoute ? 'animate-spin' : ''}`} />
                          <span>{gpsStatus === 'locating' ? 'Updating…' : 'Recalculate GPS'}</span>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onSelectDestination(directionsDestination.slug)}
                          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-10"
                        >
                          <span>Destination Guide</span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ) : selectedVendor ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                        {selectedVendor.categoryIcon} {selectedVendor.categoryLabel}
                      </Badge>
                      <h4 className="font-extrabold text-sm text-stone-900 dark:text-white mt-1">
                        {selectedVendor.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">{selectedVendor.villageOrArea}, {selectedVendor.district}</p>
                    </div>
                    <button
                      onClick={() => setSelectedVendor(null)}
                      className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                    {selectedVendor.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Specialties:</span>
                      <span className="font-bold text-amber-900 dark:text-amber-200">
                        {selectedVendor.specialties.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Price Range:</span>
                      <span className="font-bold text-stone-900 dark:text-white">{selectedVendor.priceRange}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-stone-500 font-medium">Hours:</span>
                      <span>{selectedVendor.openingHours}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {selectedVendor.contactPhone && (
                      <a
                        href={`tel:${selectedVendor.contactPhone}`}
                        className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-xs cursor-pointer"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>Call Vendor</span>
                      </a>
                    )}
                    <Button
                      size="sm"
                      onClick={() => handleStartDirectionsToVendor(selectedVendor)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1.5 rounded-xl"
                    >
                      <Navigation className="h-3.5 w-3.5" />
                      <span>Get Directions</span>
                    </Button>
                  </div>
                </div>
              ) : displayedDest ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700">
                        <img
                          src={displayedDest.featured_image}
                          alt={displayedDest.name}
                          onError={handleImageError}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm text-stone-900 dark:text-white truncate">
                          {displayedDest.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-stone-500 mt-0.5">
                          <span>{displayedDest.district?.name || 'Jharkhand'}</span>
                          {activeCrowdInfo && (
                            <Badge
                              variant="outline"
                              className={`text-[9.5px] py-0 px-1.5 font-bold ${activeCrowdInfo.tagColor}`}
                            >
                              {activeCrowdInfo.level === 'HIGH' ? '🟢' : '🟡'} {activeCrowdInfo.level}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {drawerState === 'collapsed' ? (
                        <Button
                          size="sm"
                          onClick={() => setDrawerState('expanded')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-8 px-3 rounded-xl shadow-xs"
                        >
                          Details
                        </Button>
                      ) : (
                        <button
                          onClick={() => setDrawerState('collapsed')}
                          className="p-1 text-stone-400 hover:text-stone-600 cursor-pointer"
                        >
                          <ChevronDown className="h-5 w-5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {drawerState === 'expanded' && (
                    <div className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800 animate-in fade-in-50">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-amber-500 font-bold">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          {displayedDest.rating} ({displayedDest.review_count} reviews)
                        </span>
                        <Badge variant="emerald" className="text-[10px]">
                          {displayedDest.category?.name || 'Eco Destination'}
                        </Badge>
                      </div>

                      <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                        {displayedDest.description}
                      </p>

                      {/* Nearby Vendors Section inside mobile drawer */}
                      <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                            <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                            <span>Local Street Vendors & Stalls ({vendors.length})</span>
                          </span>
                        </div>

                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                          {vendors.slice(0, 4).map((v) => (
                            <button
                              key={v.id}
                              onClick={() => {
                                setSelectedVendor(v);
                                if (mapInstanceRef.current) {
                                  mapInstanceRef.current.flyTo([v.latitude, v.longitude], 14, { duration: 0.8 });
                                }
                              }}
                              className="w-full p-2 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-left flex items-center justify-between text-xs hover:border-amber-400 transition-colors"
                            >
                              <div className="truncate pr-2">
                                <div className="font-bold text-stone-900 dark:text-white flex items-center gap-1 truncate">
                                  <span>{v.categoryIcon}</span>
                                  <span className="truncate">{v.name}</span>
                                </div>
                                <div className="text-[10px] text-stone-500 truncate">{v.villageOrArea}</div>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 dark:text-amber-400 shrink-0">
                                {v.distanceKm !== undefined ? `${v.distanceKm} km` : 'Near'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Road Directions Action */}
                      <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/60 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                            <Navigation className="h-3.5 w-3.5 text-blue-600" />
                            <span>Road Directions</span>
                          </span>
                          {activeRouteResult && (
                            <span className="font-mono text-[11px] text-blue-700 dark:text-blue-300 font-bold">
                              {activeRouteResult.distanceKm} km · {activeRouteResult.durationFormatted}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <Button
                            size="sm"
                            onClick={() => handleStartDirectionsWithGps(displayedDest)}
                            disabled={gpsStatus === 'locating'}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs h-8 gap-1 rounded-xl shadow-xs"
                          >
                            <LocateFixed className="h-3.5 w-3.5" />
                            <span>{gpsStatus === 'locating' ? 'Locating...' : 'Use My GPS'}</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowChooseHub(true)}
                            className="text-xs h-8 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 rounded-xl"
                          >
                            Choose Hub
                          </Button>
                        </div>
                      </div>

                      <Button
                        onClick={() => onSelectDestination(displayedDest.slug)}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5"
                      >
                        <span>View Full Destination Guide</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2 text-xs text-stone-500">
                  Tap any destination or vendor marker on the map to view details.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. DESKTOP SIDE PANEL (Full Details, Vendors & Directions)               */}
        {/* ========================================================================= */}
        <div className="hidden lg:flex flex-col justify-between h-[480px] sm:h-[580px] lg:h-[680px] xl:h-[720px] bg-stone-50/90 dark:bg-stone-950/90 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 overflow-y-auto">
          {/* Selected Vendor Detail View */}
          {selectedVendor ? (
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">Local Street Vendor</h3>
                  </div>
                  <button
                    onClick={() => setSelectedVendor(null)}
                    className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Close</span>
                  </button>
                </div>

                <div className="space-y-1">
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                    {selectedVendor.categoryIcon} {selectedVendor.categoryLabel}
                  </Badge>
                  <h4 className="font-extrabold text-base text-stone-900 dark:text-white">
                    {selectedVendor.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-stone-500">
                    <span>{selectedVendor.villageOrArea}, {selectedVendor.district}</span>
                    {selectedVendor.distanceKm !== undefined && (
                      <Badge variant="outline" className="text-[10px] bg-amber-100 text-amber-900 border-amber-300 font-bold">
                        📍 {selectedVendor.distanceKm} km away
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  {selectedVendor.description}
                </p>

                <div className="p-3 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                      Authentic Specialties
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedVendor.specialties.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200 text-[11px] font-medium"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-100 dark:border-stone-800">
                    <div>
                      <span className="text-[10px] text-stone-400 block">Price Range</span>
                      <span className="font-bold text-stone-900 dark:text-white">{selectedVendor.priceRange}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-stone-400 block">Timings</span>
                      <span className="text-stone-700 dark:text-stone-300 text-[11px] font-medium">{selectedVendor.openingHours}</span>
                    </div>
                  </div>
                </div>

                {selectedVendor.contactPhone && (
                  <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-semibold text-emerald-950 dark:text-emerald-200">{selectedVendor.contactPhone}</span>
                    </div>
                    <a
                      href={`tel:${selectedVendor.contactPhone}`}
                      className="px-2.5 py-1 rounded-lg bg-emerald-700 text-white font-bold text-[11px] hover:bg-emerald-800 cursor-pointer"
                    >
                      Call
                    </a>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <Button
                  onClick={() => handleStartDirectionsToVendor(selectedVendor)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  <span>Get Driving Directions to Vendor</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVendor(null)}
                  className="w-full text-xs text-stone-700 dark:text-stone-300 border-stone-300 dark:border-stone-700"
                >
                  Back to All Vendors
                </Button>
              </div>
            </div>
          ) : directionsMode && directionsDestination ? (
            /* Directions Mode View */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-2">
                    <Car className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">Route Navigation</h3>
                  </div>
                  {onClearDirections && (
                    <button
                      onClick={onClearDirections}
                      className="text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-white text-xs flex items-center gap-1 cursor-pointer font-bold"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Exit</span>
                    </button>
                  )}
                </div>

                {/* Travel Mode Badge */}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-300 text-xs font-bold gap-1.5 py-1 px-2.5">
                    <Car className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Travel Mode: Driving</span>
                  </Badge>
                  {activeRouteResult?.isLiveRouting && (
                    <Badge variant="emerald" className="text-[10px] py-0.5 px-2">
                      Live OSRM Route
                    </Badge>
                  )}
                </div>

                {/* Destination Coordinates Check */}
                {!isValidCoord(directionsDestination.latitude, directionsDestination.longitude) ? (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-2">
                    <div className="flex items-center gap-2 font-bold">
                      <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                      <span>Route unavailable: destination location is missing.</span>
                    </div>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300">
                      Geographic road coordinates are missing for this location.
                    </p>
                  </div>
                ) : !directionsOrigin ? (
                  /* GPS Required State */
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="h-2.5 w-2.5 rounded-full bg-emerald-600 mt-1 shrink-0" />
                        <div className="text-xs min-w-0">
                          <span className="text-[10px] text-stone-500 block uppercase font-bold tracking-wider">Target Destination</span>
                          <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm truncate block">
                            🎯 {directionsDestination.name}
                          </span>
                          <span className="text-[11px] text-stone-500 block">
                            {directionsDestination.district?.name || 'Jharkhand'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* GPS Error & Retry Message */}
                    {(gpsStatus === 'denied' || gpsStatus === 'timeout' || gpsStatus === 'unavailable' || gpsStatus === 'unsupported') && gpsErrorMessage && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-800 dark:text-rose-200 text-xs space-y-2.5">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <span className="leading-snug">{gpsErrorMessage}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-0.5">
                          <Button
                            size="sm"
                            onClick={() => handleRequestUserGpsLocation()}
                            className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg gap-1.5 cursor-pointer"
                          >
                            <RefreshCw className="h-3 w-3" />
                            <span>Try Again</span>
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowChooseHub(true)}
                            className="h-8 text-xs bg-white dark:bg-stone-900 border-rose-300 dark:border-rose-800 text-stone-800 dark:text-stone-200 font-semibold rounded-lg cursor-pointer"
                          >
                            <span>Pick City</span>
                          </Button>
                        </div>
                        <div className="pt-1 border-t border-rose-200/60 dark:border-rose-900/60">
                          <span className="text-[10px] text-stone-500 dark:text-stone-400 block mb-1 font-semibold">Quick Starting Hub:</span>
                          <div className="flex flex-wrap gap-1">
                            {['Ranchi', 'Jamshedpur', 'Dhanbad', 'Deoghar', 'Bokaro'].map((hub) => (
                              <button
                                key={hub}
                                type="button"
                                onClick={() => handleSelectStartingHub(hub)}
                                className="text-[10px] bg-white dark:bg-stone-800 hover:bg-emerald-600 hover:text-white border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded-md text-stone-700 dark:text-stone-300 font-medium cursor-pointer transition-colors"
                              >
                                📍 {hub}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Primary Action Button */}
                    <Button
                      onClick={() => handleRequestUserGpsLocation()}
                      disabled={gpsStatus === 'locating'}
                      className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md gap-2 cursor-pointer"
                    >
                      <LocateFixed className={`h-4 w-4 ${gpsStatus === 'locating' ? 'animate-spin' : ''}`} />
                      <span>{gpsStatus === 'locating' ? 'Getting your current location...' : 'USE MY GPS'}</span>
                    </Button>

                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowChooseHub(true)}
                        className="text-xs text-stone-500 hover:text-stone-800 dark:hover:text-stone-200 underline font-medium cursor-pointer"
                      >
                        Or calculate from a starting city / hub
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Route Information Card */
                  <div className="p-3.5 rounded-2xl bg-blue-50/90 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/70 space-y-3 shadow-xs">
                    {/* Origin */}
                    <div className="flex items-start gap-2.5">
                      <div className="h-3 w-3 rounded-full bg-blue-600 ring-4 ring-blue-500/20 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-stone-500 dark:text-stone-400 text-[10px] block uppercase font-bold tracking-wider">
                          Origin (Current Location)
                        </span>
                        <span className="font-bold text-stone-900 dark:text-white text-sm block truncate">
                          {directionsOrigin?.isGps ? '📍 Your Location (You are here)' : `📍 ${directionsOrigin?.name || 'Your Location'}`}
                        </span>
                      </div>
                    </div>

                    {/* Route Corridor & Key Stats */}
                    <div className="ml-1.5 pl-4 border-l-2 border-dashed border-blue-500/50 py-2.5 space-y-2">
                      {loadingRoute ? (
                        <div className="flex items-center gap-2 text-xs text-blue-700 dark:text-blue-300 font-medium py-1">
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Calculating drivable road route...</span>
                        </div>
                      ) : activeRouteResult ? (
                        <div className="grid grid-cols-2 gap-2 bg-white/80 dark:bg-stone-900/80 p-2.5 rounded-xl border border-blue-200/60 dark:border-blue-900/60">
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">
                              Total Distance
                            </span>
                            <span className="text-base font-extrabold text-stone-900 dark:text-white">
                              {activeRouteResult.distanceKm} km
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-stone-500 dark:text-stone-400 block">
                              Estimated Time
                            </span>
                            <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                              {activeRouteResult.durationFormatted}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-stone-500 italic">Calculating road estimates...</span>
                      )}
                    </div>

                    {/* Destination */}
                    <div className="flex items-start gap-2.5">
                      <div className="h-3 w-3 rounded-full bg-emerald-600 ring-4 ring-emerald-500/20 mt-1 shrink-0" />
                      <div className="min-w-0">
                        <span className="text-stone-500 dark:text-stone-400 text-[10px] block uppercase font-bold tracking-wider">
                          Destination
                        </span>
                        <span className="font-bold text-emerald-800 dark:text-emerald-300 text-sm block truncate">
                          🎯 {directionsDestination.name}
                        </span>
                        <span className="text-[11px] text-stone-500 block truncate">
                          {directionsDestination.district?.name || 'Jharkhand'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Turn-by-Turn Navigation Steps (if available) */}
                {directionsOrigin && activeRouteResult && activeRouteResult.steps && activeRouteResult.steps.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-stone-600 dark:text-stone-400 block">
                      Route Guidance:
                    </span>
                    <div className="space-y-1 max-h-28 overflow-y-auto pr-1">
                      {activeRouteResult.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-800/80 border border-stone-200/80 dark:border-stone-700/60 text-[11px] text-stone-700 dark:text-stone-300 flex items-start gap-1.5"
                        >
                          <span className="font-bold text-blue-600 shrink-0">{idx + 1}.</span>
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recalculate / Refresh GPS Route Button */}
                {directionsOrigin && (
                  <div className="pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRecalculateRoute}
                      disabled={gpsStatus === 'locating' || loadingRoute}
                      className="w-full text-xs border-blue-300 dark:border-blue-700 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-bold gap-1.5 py-2 rounded-xl"
                    >
                      <RefreshCw className={`h-3.5 w-3.5 text-blue-600 ${gpsStatus === 'locating' || loadingRoute ? 'animate-spin' : ''}`} />
                      <span>{gpsStatus === 'locating' ? 'Updating GPS...' : 'Recalculate Route with Latest GPS'}</span>
                    </Button>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-stone-200 dark:border-stone-800 space-y-2">
                <Button
                  onClick={() => onSelectDestination(directionsDestination.slug)}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5 rounded-xl"
                >
                  <span>View Full {directionsDestination.name} Guide</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : activeTab === 'vendors' ? (
            /* Vendors Tab Dedicated View */
            <div className="space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-stone-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <ShoppingBag className="h-4 w-4 text-amber-600" />
                    <h3 className="font-bold text-sm text-stone-900 dark:text-white">
                      Nearby Street Vendors ({vendors.length})
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-800 border-amber-300">
                    Verified Stalls
                  </Badge>
                </div>

                <p className="text-[11px] text-stone-500">
                  Authentic tribal snacks, handicrafts, and delicacies near {vendorSearchCenter?.label || 'destination'}
                </p>

                {/* Category filter pills */}
                <div className="flex flex-wrap gap-1 pb-1">
                  {VENDOR_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedVendorCategory(cat.id)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-semibold transition-all cursor-pointer ${
                        selectedVendorCategory === cat.id
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-100'
                      }`}
                    >
                      <span>{cat.icon} {cat.label}</span>
                    </button>
                  ))}
                </div>

                {/* Vendor List */}
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {loadingVendors ? (
                    <div className="py-8 text-center text-xs text-stone-500">
                      <RefreshCw className="h-4 w-4 animate-spin text-amber-600 mx-auto mb-1" />
                      Discovering authentic local street vendors…
                    </div>
                  ) : vendors.length === 0 ? (
                    <div className="py-6 text-center text-xs text-stone-500">
                      No vendors found for this category.
                    </div>
                  ) : (
                    vendors.map((v) => (
                      <button
                        key={v.id}
                        onClick={() => {
                          setSelectedVendor(v);
                          if (mapInstanceRef.current) {
                            mapInstanceRef.current.flyTo([v.latitude, v.longitude], 14, { duration: 0.8 });
                          }
                        }}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 hover:border-amber-500/60 transition-all text-left shadow-xs flex items-start justify-between gap-2 cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1 text-xs font-bold text-stone-900 dark:text-white">
                            <span>{v.categoryIcon}</span>
                            <span className="truncate">{v.name}</span>
                          </div>
                          <p className="text-[10.5px] text-stone-500 line-clamp-1 mt-0.5">{v.villageOrArea}</p>
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 font-semibold mt-1">
                            {v.specialties.slice(0, 2).join(' • ')}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="text-[10.5px] font-bold text-amber-700 dark:text-amber-400 block">
                            {v.distanceKm !== undefined ? `${v.distanceKm} km` : ''}
                          </span>
                          <span className="text-[9.5px] text-stone-400">{v.priceRange}</span>
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  onClick={() => setActiveTab('explore')}
                  variant="outline"
                  className="w-full text-xs"
                >
                  Back to Destination Map
                </Button>
              </div>
            </div>
          ) : displayedDest ? (
            /* Standard Destination Detail View */
            <div className="space-y-4 flex-1 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="relative h-36 rounded-xl overflow-hidden bg-stone-100 dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-md">
                  <img
                    src={displayedDest.featured_image}
                    alt={displayedDest.name}
                    onError={handleImageError}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  <div className="absolute top-2 left-2 flex flex-wrap gap-1">
                    <Badge variant="emerald" className="text-[10px] py-0.5 px-2 bg-emerald-900/90 border-emerald-600 text-emerald-200">
                      {displayedDest.category?.name || 'Eco Destination'}
                    </Badge>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs">
                    <span className="font-semibold">{displayedDest.district?.name || 'Jharkhand'}</span>
                    <span className="flex items-center gap-1 text-amber-300 font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {displayedDest.rating} ({displayedDest.review_count})
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-stone-900 dark:text-white line-clamp-1">
                    {displayedDest.name}
                  </h3>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium line-clamp-1 mt-0.5">
                    {displayedDest.tagline || displayedDest.best_time_to_visit}
                  </p>
                </div>

                {/* Local Street Vendors Quick Access Card */}
                <div className="p-3 bg-amber-50/80 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                      <ShoppingBag className="h-3.5 w-3.5 text-amber-600" />
                      <span>Nearby Street Vendors ({vendors.length})</span>
                    </span>
                    <p className="text-[10px] text-stone-500 mt-0.5">
                      Authentic tribal crafts, sweets & snacks
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setActiveTab('vendors');
                      setShowVendorsLayer(true);
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white text-[11px] h-7 px-2.5 rounded-lg font-bold shadow-xs"
                  >
                    View Vendors
                  </Button>
                </div>

                {activeCrowdInfo && (
                  <div className="p-3 bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                        <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        <span>Crowd Level:</span>
                      </div>
                      <Badge variant="outline" className={`font-extrabold text-xs px-2.5 py-0.5 ${activeCrowdInfo.tagColor}`}>
                        {activeCrowdInfo.level === 'HIGH' ? '🟢' : '🟡'} {activeCrowdInfo.level}
                      </Badge>
                    </div>
                  </div>
                )}

                {/* Desktop Get Directions Actions */}
                <div className="p-3 bg-white dark:bg-stone-900/90 rounded-xl border border-stone-200 dark:border-stone-800 space-y-2 text-xs">
                  <span className="font-bold text-stone-800 dark:text-stone-300 flex items-center gap-1.5">
                    <Navigation className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    <span>Get Directions & Travel Time</span>
                  </span>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => handleStartDirectionsWithGps(displayedDest)}
                      disabled={gpsStatus === 'locating'}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] gap-1.5 h-8 shadow-sm cursor-pointer"
                    >
                      <LocateFixed className="h-3.5 w-3.5" />
                      <span>Use My Location</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowChooseHub(true)}
                      className="border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-300 hover:bg-stone-100 font-medium text-[11px] h-8 cursor-pointer"
                    >
                      Choose Hub
                    </Button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-200 dark:border-stone-800">
                <Button
                  onClick={() => onSelectDestination(displayedDest.slug)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>View Full Details & Passes</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center text-stone-500 space-y-3">
              <div className="h-12 w-12 rounded-full bg-stone-100 dark:bg-stone-900 flex items-center justify-center text-stone-600">
                <MapPin className="h-6 w-6 text-emerald-500" />
              </div>
              <p className="text-xs text-stone-600 dark:text-stone-400 max-w-[200px]">
                Click on any destination or vendor marker on the map to explore its coordinates and get directions.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. MODAL: CROWD FILTER SHEET                                             */}
      {/* ========================================================================= */}
      {showFilterSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Filter by Crowd Density</h3>
              </div>
              <button
                onClick={() => setShowFilterSheet(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 min-h-0 pr-1">
              {(
                [
                  { id: 'ALL', label: 'All Crowd Levels', desc: 'Display all mapped eco destinations' },
                  { id: 'HIGH', label: '🟢 High Crowd', desc: 'Peak destinations with high visitor volume' },
                  { id: 'MEDIUM', label: '🟡 Medium Crowd', desc: 'Comfortable & steady visitor flow' },
                  { id: 'LOW', label: '🟡 Low Crowd', desc: 'Quiet, secluded, and peaceful nature sites' },
                ] as const
              ).map((opt) => {
                const count =
                  opt.id === 'ALL'
                    ? destinations.length
                    : destinations.filter((d) => getCrowdInfo(d.crowd_status).level === opt.id).length;
                const isSelected = crowdFilter === opt.id;

                return (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setCrowdFilter(opt.id);
                      setShowFilterSheet(false);
                    }}
                    className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 text-emerald-900 dark:text-emerald-200 font-bold'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-semibold">{opt.label}</div>
                      <div className="text-[11px] text-stone-500 dark:text-stone-400 font-normal">
                        {opt.desc}
                      </div>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. MODAL: DISTRICT SELECTOR                                              */}
      {/* ========================================================================= */}
      {showDistrictSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Filter by District</h3>
              </div>
              <button
                onClick={() => setShowDistrictSheet(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5 overflow-y-auto flex-1 min-h-0 pr-1">
              <button
                onClick={() => {
                  onSelectDistrict('all');
                  setShowDistrictSheet(false);
                }}
                className={`w-full p-2.5 rounded-xl text-left text-xs font-semibold border transition-all cursor-pointer ${
                  selectedDistrict === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200'
                }`}
              >
                All Districts ({destinations.length} sites)
              </button>
              {districts.map((dist) => {
                const count = destinations.filter((d) => d.district_id === dist.id).length;
                return (
                  <button
                    key={dist.id}
                    onClick={() => {
                      onSelectDistrict(dist.id);
                      setShowDistrictSheet(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left text-xs font-medium border flex items-center justify-between transition-all cursor-pointer ${
                      selectedDistrict === dist.id
                        ? 'bg-emerald-600 text-white border-emerald-600 font-bold'
                        : 'bg-stone-50 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-800 dark:text-stone-200 hover:bg-stone-100'
                    }`}
                  >
                    <span>{dist.name}</span>
                    <span className="text-[10px] opacity-75">{count} sites</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL: CHOOSE STARTING TRANSIT HUB                                   */}
      {/* ========================================================================= */}
      {showChooseHub && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-3 pb-[max(1rem,env(safe-area-inset-bottom,0px))] animate-in fade-in-50">
          <div className="w-full max-w-sm bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-3xl p-5 shadow-2xl space-y-4 max-h-[85dvh] flex flex-col">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Car className="h-4 w-4 text-blue-600" />
                <h3 className="font-bold text-sm text-stone-900 dark:text-white">Choose Starting Location</h3>
              </div>
              <button
                onClick={() => setShowChooseHub(false)}
                className="text-stone-400 hover:text-stone-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto flex-1 min-h-0 pr-1">
              {hubNames.map((hub) => (
                <button
                  key={hub}
                  onClick={() => handleSelectStartingHub(hub)}
                  className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 hover:bg-emerald-600 hover:text-white text-stone-800 dark:text-stone-200 text-xs font-semibold border border-stone-200 dark:border-stone-700 transition-all text-left cursor-pointer"
                >
                  📍 {hub}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL: OFFLINE GIS MAP DOWNLOAD & STORAGE (INDEXEDDB)                 */}
      {/* ========================================================================= */}
      <OfflineMapModal
        isOpen={showOfflineModal}
        onClose={() => setShowOfflineModal(false)}
        onNavigateToRegion={handleNavigateToOfflineRegion}
        currentMapBounds={currentMapBounds}
        currentMapCenter={currentMapCenter}
      />
    </div>
  );
}
