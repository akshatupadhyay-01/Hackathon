import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  MapPin,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Filter,
  RefreshCw,
  Eye,
  Info,
  Store,
  Compass,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { Destination, District } from '../types/database';
import {
  GovCrowdStatus,
  GOV_CROWD_CONFIGS,
  getGovCrowdStatus,
  getDestinationIntelligenceRecords,
  DestinationIntelligenceRecord,
} from '../services/tourismIntelligence';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface CrowdIntelligenceMapProps {
  destinations: Destination[];
  districts: District[];
  onSelectDestination?: (destination: Destination) => void;
  navigate?: (path: string) => void;
}

export function CrowdIntelligenceMap({
  destinations,
  districts,
  onSelectDestination,
  navigate,
}: CrowdIntelligenceMapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const zonesGroupRef = useRef<L.LayerGroup | null>(null);

  const [crowdFilter, setCrowdFilter] = useState<'ALL' | GovCrowdStatus>('ALL');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [selectedRecord, setSelectedRecord] = useState<DestinationIntelligenceRecord | null>(null);
  const [showCarryingCapacityZone, setShowCarryingCapacityZone] = useState<boolean>(true);

  // Compute records
  const intelligenceRecords = useMemo(() => {
    return getDestinationIntelligenceRecords(destinations);
  }, [destinations]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return intelligenceRecords.filter((record) => {
      const matchCrowd = crowdFilter === 'ALL' || record.crowdStatus === crowdFilter;
      const matchDistrict =
        selectedDistrictId === 'all' || record.destination.district_id === selectedDistrictId;
      return matchCrowd && matchDistrict;
    });
  }, [intelligenceRecords, crowdFilter, selectedDistrictId]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [23.6102, 85.2799], // Central Jharkhand coords
        zoom: 8,
        zoomControl: false,
        attributionControl: false,
      });

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      L.control.zoom({ position: 'bottomright' }).addTo(map);

      const zones = L.layerGroup().addTo(map);
      const markers = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      zonesGroupRef.current = zones;
      markersGroupRef.current = markers;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Carrying Capacity Overlays
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const zonesGroup = zonesGroupRef.current;

    if (!map || !markersGroup || !zonesGroup) return;

    markersGroup.clearLayers();
    zonesGroup.clearLayers();

    filteredRecords.forEach((record) => {
      const { destination, crowdStatus, crowdConfig } = record;
      const lat = destination.latitude;
      const lng = destination.longitude;

      if (!lat || !lng) return;

      // Color rules:
      // 🔴 RED = HIGH (#dc2626)
      // 🟢 GREEN = MEDIUM (#16a34a)
      // 🟡 DARK YELLOW = LOW (#d97706)
      const colorHex = crowdConfig.hexColor;

      // Carrying capacity zone radius
      if (showCarryingCapacityZone) {
        const radiusMeters =
          crowdStatus === 'HIGH' ? 3800 : crowdStatus === 'MEDIUM' ? 2600 : 1800;

        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: colorHex,
          fillColor: colorHex,
          fillOpacity: crowdStatus === 'HIGH' ? 0.22 : 0.15,
          weight: crowdStatus === 'HIGH' ? 2 : 1.5,
          dashArray: crowdStatus === 'LOW' ? '4, 4' : undefined,
        });

        circle.addTo(zonesGroup);
      }

      // Custom DivIcon with Pulse Effect
      const isHigh = crowdStatus === 'HIGH';
      const isLow = crowdStatus === 'LOW';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isHigh
              ? `<div class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></div>`
              : isLow
              ? `<div class="absolute -inset-1.5 rounded-full bg-amber-400/30 animate-pulse"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white text-white font-extrabold text-[11px] transition-transform group-hover:scale-110" style="background-color: ${colorHex};">
            ${isHigh ? '🔴' : isLow ? '🟡' : '🟢'}
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-stone-900/90 text-white text-[9px] font-bold whitespace-nowrap shadow pointer-events-none">
            ${destination.name.split(' ')[0]}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'gov-crowd-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedRecord(record);
        if (onSelectDestination) {
          onSelectDestination(destination);
        }
        map.setView([lat, lng], 11, { animate: true });
      });

      marker.addTo(markersGroup);
    });

    // Auto-fit bounds if records exist
    if (filteredRecords.length > 0) {
      const bounds = L.latLngBounds(
        filteredRecords.map((r) => [r.destination.latitude, r.destination.longitude])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [filteredRecords, showCarryingCapacityZone, onSelectDestination]);

  const highCount = intelligenceRecords.filter((r) => r.crowdStatus === 'HIGH').length;
  const medCount = intelligenceRecords.filter((r) => r.crowdStatus === 'MEDIUM').length;
  const lowCount = intelligenceRecords.filter((r) => r.crowdStatus === 'LOW').length;

  return (
    <div className="space-y-4">
      {/* Map Filter Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-stone-700 dark:text-stone-300 mr-1 flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-stone-500" />
            Crowd Pressure:
          </span>

          <button
            onClick={() => setCrowdFilter('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              crowdFilter === 'ALL'
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 shadow-xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            All Sites ({intelligenceRecords.length})
          </button>

          <button
            onClick={() => setCrowdFilter('HIGH')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              crowdFilter === 'HIGH'
                ? 'bg-red-600 text-white shadow-xs'
                : 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-900 hover:bg-red-100'
            }`}
          >
            <span>🔴 High Crowd</span>
            <span className="px-1.5 py-0.2 rounded-full bg-red-700/80 text-[10px] text-white">
              {highCount}
            </span>
          </button>

          <button
            onClick={() => setCrowdFilter('MEDIUM')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              crowdFilter === 'MEDIUM'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <span>🟢 Medium Crowd</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-700/80 text-[10px] text-white">
              {medCount}
            </span>
          </button>

          <button
            onClick={() => setCrowdFilter('LOW')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              crowdFilter === 'LOW'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 hover:bg-amber-100'
            }`}
          >
            <span>🟡 Low Crowd</span>
            <span className="px-1.5 py-0.2 rounded-full bg-amber-700/80 text-[10px] text-white">
              {lowCount}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedDistrictId}
            onChange={(e) => setSelectedDistrictId(e.target.value)}
            className="text-xs bg-stone-100 dark:bg-stone-800 text-stone-800 dark:text-stone-200 font-semibold px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-700 focus:outline-none"
          >
            <option value="all">All Districts (8)</option>
            {districts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} District
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowCarryingCapacityZone(!showCarryingCapacityZone)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border cursor-pointer ${
              showCarryingCapacityZone
                ? 'bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 border-stone-900'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-700'
            }`}
            title="Toggle carrying capacity radius zones on the map"
          >
            Zones {showCarryingCapacityZone ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Main Map Canvas & Interactive Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-8 relative">
          <div
            ref={mapContainerRef}
            className="w-full h-[460px] sm:h-[540px] rounded-3xl border border-stone-200 dark:border-stone-800 shadow-md overflow-hidden z-0"
          />

          {/* OFFICIAL MANDATORY CROWD CLASSIFICATION LEGEND */}
          <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-xl max-w-xs space-y-2">
            <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800 pb-1.5">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-stone-800 dark:text-stone-200">
                Official Crowd Classification
              </span>
              <Badge variant="outline" className="text-[9px] py-0 px-1 font-bold">
                JTDCL Live
              </Badge>
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex items-start gap-2 p-1 rounded-lg bg-red-50/70 dark:bg-red-950/40">
                <span className="text-sm shrink-0">🔴</span>
                <div>
                  <span className="font-extrabold text-red-800 dark:text-red-300">High Crowd</span>
                  <p className="text-[10px] text-red-700 dark:text-red-400 leading-tight">
                    High tourist footfall • High visitor pressure • Overcrowding risk
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-1 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/40">
                <span className="text-sm shrink-0">🟢</span>
                <div>
                  <span className="font-extrabold text-emerald-800 dark:text-emerald-300">Medium Crowd</span>
                  <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-tight">
                    Moderate tourist footfall • Manageable visitor pressure
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 p-1 rounded-lg bg-amber-50/70 dark:bg-amber-950/40">
                <span className="text-sm shrink-0">🟡</span>
                <div>
                  <span className="font-extrabold text-amber-800 dark:text-amber-300">Low Crowd</span>
                  <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-tight">
                    Low tourist footfall • Underutilized tourism potential
                  </p>
                </div>
              </div>
            </div>

            <p className="text-[9px] text-stone-500 dark:text-stone-400 italic pt-1 border-t border-stone-100 dark:border-stone-800">
              * Click any marker to view real-time carrying capacity & authority action.
            </p>
          </div>
        </div>

        {/* Selected Destination Intelligence Inspector */}
        <div className="lg:col-span-4 space-y-3">
          {selectedRecord ? (
            <Card className="p-5 rounded-3xl border border-stone-200 dark:border-stone-800 space-y-4 bg-white dark:bg-stone-900 shadow-md">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge
                    variant="outline"
                    className={`text-[10.5px] font-extrabold px-2.5 py-0.5 border ${selectedRecord.crowdConfig.badgeBg} ${selectedRecord.crowdConfig.badgeText} ${selectedRecord.crowdConfig.badgeBorder}`}
                  >
                    {selectedRecord.crowdStatus === 'HIGH' ? '🔴' : selectedRecord.crowdStatus === 'MEDIUM' ? '🟢' : '🟡'} {selectedRecord.crowdConfig.label}
                  </Badge>
                  <h3 className="font-extrabold text-lg text-stone-900 dark:text-stone-100 mt-1.5">
                    {selectedRecord.destination.name}
                  </h3>
                  <p className="text-xs text-stone-500">
                    📍 {selectedRecord.destination.district?.name} District • {selectedRecord.destination.category?.name}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedRecord(null)}
                  className="text-stone-400 hover:text-stone-600 p-1 text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Status Meaning Banner */}
              <div className={`p-3 rounded-2xl text-xs leading-relaxed border ${selectedRecord.crowdConfig.badgeBg} ${selectedRecord.crowdConfig.badgeBorder}`}>
                <p className={`font-bold ${selectedRecord.crowdConfig.badgeText}`}>
                  {selectedRecord.crowdConfig.meaning}
                </p>
                <p className="text-[11px] text-stone-600 dark:text-stone-300 mt-1">
                  {selectedRecord.crowdConfig.footfallDescription}
                </p>
              </div>

              {/* Key Indicators Grid */}
              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700">
                  <span className="text-[10px] text-stone-500 font-medium">Est. Monthly Visitors</span>
                  <div className="text-base font-extrabold text-stone-900 dark:text-stone-100 mt-0.5">
                    ~{selectedRecord.estimatedMonthlyFootfall.toLocaleString()}
                  </div>
                  <span className="text-[9.5px] text-stone-400">Demo estimate</span>
                </div>

                <div className="p-3 rounded-2xl bg-stone-50 dark:bg-stone-800/70 border border-stone-200/80 dark:border-stone-700">
                  <span className="text-[10px] text-stone-500 font-medium">Local Vendors Nearby</span>
                  <div className="text-base font-extrabold text-amber-700 dark:text-amber-400 mt-0.5 flex items-center gap-1">
                    <Store className="h-4 w-4" />
                    <span>{selectedRecord.activeVendorsNearCount} Stalls</span>
                  </div>
                  <span className="text-[9.5px] text-stone-400">Verified network</span>
                </div>
              </div>

              {/* Recommended Authority Action */}
              <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 space-y-1.5">
                <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
                  <Zap className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Recommended Government Action</span>
                </div>
                <p className="text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                  {selectedRecord.recommendedGovAction}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 pt-1">
                {navigate && (
                  <Button
                    size="sm"
                    onClick={() => navigate(`/destinations/${selectedRecord.destination.slug}`)}
                    className="flex-1 bg-stone-900 hover:bg-stone-800 text-white text-xs h-9 rounded-xl font-bold"
                  >
                    View Destination Details
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </Card>
          ) : (
            <Card className="p-6 rounded-3xl border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-900/50 flex flex-col items-center justify-center text-center h-full min-h-[300px] space-y-3">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl">
                🗺️
              </div>
              <h4 className="font-bold text-sm text-stone-800 dark:text-stone-200">
                Crowd Intelligence Inspector
              </h4>
              <p className="text-xs text-stone-500 max-w-xs leading-relaxed">
                Click any destination marker on the map to inspect real-time crowd pressure, carrying capacity, vendor benefits, and AI recommended government interventions.
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
