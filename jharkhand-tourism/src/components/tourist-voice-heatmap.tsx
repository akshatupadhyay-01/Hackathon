import React, { useEffect, useRef, useState, useMemo } from 'react';
import L from 'leaflet';
import {
  Star,
  ThumbsUp,
  AlertCircle,
  MessageSquare,
  Filter,
  RefreshCw,
  Eye,
  Info,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  MapPin,
  TrendingUp,
} from 'lucide-react';
import { Destination, District } from '../types/database';
import {
  SentimentStatus,
  ReviewTag,
  ALL_REVIEW_TAGS,
  getDestinationReviewSummary,
  DestinationReviewSummary,
  getStoredTouristReviews,
} from '../services/reviewIntelligence';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';

interface TouristVoiceHeatmapProps {
  destinations: Destination[];
  districts: District[];
  onSelectDestination?: (destination: Destination) => void;
  navigate?: (path: string) => void;
}

interface MapSentimentRecord {
  destination: Destination;
  summary: DestinationReviewSummary;
  sentimentStatus: SentimentStatus;
  hexColor: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dominantTheme: string;
  dominantIssue: string;
}

export function TouristVoiceHeatmap({
  destinations,
  districts,
  onSelectDestination,
  navigate,
}: TouristVoiceHeatmapProps) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);
  const halosGroupRef = useRef<L.LayerGroup | null>(null);

  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | SentimentStatus>('ALL');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('all');
  const [selectedCategoryTag, setSelectedCategoryTag] = useState<string>('all');
  const [timePeriod, setTimePeriod] = useState<'all' | '30days' | '90days'>('all');
  const [selectedRecord, setSelectedRecord] = useState<MapSentimentRecord | null>(null);
  const [showSentimentHalo, setShowSentimentHalo] = useState<boolean>(true);

  // Compute sentiment records for each destination
  const sentimentRecords: MapSentimentRecord[] = useMemo(() => {
    return destinations.map((dest) => {
      const summary = getDestinationReviewSummary(dest.id, destinations);
      let sentimentStatus: SentimentStatus = 'POSITIVE';
      let hexColor = '#16a34a'; // Green
      let dotColor = 'bg-emerald-600';
      let badgeBg = 'bg-emerald-50 dark:bg-emerald-950/60';
      let badgeText = 'text-emerald-700 dark:text-emerald-300';
      let badgeBorder = 'border-emerald-300 dark:border-emerald-800';

      if (summary.negativePercentage > 15 || summary.overallRating < 3.8) {
        sentimentStatus = 'NEGATIVE';
        hexColor = '#dc2626'; // Red
        dotColor = 'bg-red-600';
        badgeBg = 'bg-red-50 dark:bg-red-950/60';
        badgeText = 'text-red-700 dark:text-red-300';
        badgeBorder = 'border-red-300 dark:border-red-800';
      } else if (summary.neutralPercentage > 20 || summary.positivePercentage < 75 || summary.overallRating < 4.4) {
        sentimentStatus = 'NEUTRAL';
        hexColor = '#d97706'; // Dark Yellow / Amber
        dotColor = 'bg-amber-600';
        badgeBg = 'bg-amber-50 dark:bg-amber-950/60';
        badgeText = 'text-amber-800 dark:text-amber-300';
        badgeBorder = 'border-amber-300 dark:border-amber-700';
      }

      return {
        destination: dest,
        summary,
        sentimentStatus,
        hexColor,
        dotColor,
        badgeBg,
        badgeText,
        badgeBorder,
        dominantTheme: summary.topPositiveThemes[0] || 'Scenic eco beauty',
        dominantIssue: summary.topNegativeIssues[0] || 'No critical issues reported',
      };
    });
  }, [destinations]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return sentimentRecords.filter((record) => {
      const matchSentiment =
        sentimentFilter === 'ALL' || record.sentimentStatus === sentimentFilter;

      const matchDistrict =
        selectedDistrictId === 'all' || record.destination.district_id === selectedDistrictId;

      const matchTag =
        selectedCategoryTag === 'all' ||
        record.destination.tags?.some((t) => t.toLowerCase().includes(selectedCategoryTag.toLowerCase())) ||
        record.summary.categoryFeedback[selectedCategoryTag as ReviewTag]?.count > 0;

      return matchSentiment && matchDistrict && matchTag;
    });
  }, [sentimentRecords, sentimentFilter, selectedDistrictId, selectedCategoryTag]);

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

      const halos = L.layerGroup().addTo(map);
      const markers = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
      halosGroupRef.current = halos;
      markersGroupRef.current = markers;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Markers & Sentiment Radii
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    const halosGroup = halosGroupRef.current;

    if (!map || !markersGroup || !halosGroup) return;

    markersGroup.clearLayers();
    halosGroup.clearLayers();

    filteredRecords.forEach((record) => {
      const { destination, sentimentStatus, hexColor, summary } = record;
      const lat = destination.latitude;
      const lng = destination.longitude;

      if (!lat || !lng) return;

      // Visual Sentiment Radii
      if (showSentimentHalo) {
        const radiusMeters =
          sentimentStatus === 'NEGATIVE' ? 3400 : sentimentStatus === 'NEUTRAL' ? 2400 : 2000;

        const circle = L.circle([lat, lng], {
          radius: radiusMeters,
          color: hexColor,
          fillColor: hexColor,
          fillOpacity: sentimentStatus === 'NEGATIVE' ? 0.25 : 0.15,
          weight: sentimentStatus === 'NEGATIVE' ? 2 : 1.5,
          dashArray: sentimentStatus === 'NEUTRAL' ? '4, 4' : undefined,
        });

        circle.addTo(halosGroup);
      }

      // Custom Sentiment Marker
      const isPositive = sentimentStatus === 'POSITIVE';
      const isNegative = sentimentStatus === 'NEGATIVE';
      const isNeutral = sentimentStatus === 'NEUTRAL';

      const iconHtml = `
        <div class="relative flex items-center justify-center cursor-pointer group">
          ${
            isNegative
              ? `<div class="absolute -inset-2 rounded-full bg-red-500/40 animate-ping"></div>`
              : isNeutral
              ? `<div class="absolute -inset-1.5 rounded-full bg-amber-400/30 animate-pulse"></div>`
              : ''
          }
          <div class="relative flex items-center justify-center w-8 h-8 rounded-full shadow-lg border-2 border-white text-white font-extrabold text-[12px] transition-transform group-hover:scale-110" style="background-color: ${hexColor};">
            ${isPositive ? '🟢' : isNeutral ? '🟡' : '🔴'}
          </div>
          <div class="absolute -bottom-5 px-1.5 py-0.5 rounded bg-stone-900/90 text-white text-[9px] font-bold whitespace-nowrap shadow pointer-events-none">
            ⭐ ${summary.overallRating}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: 'sentiment-map-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });

      const marker = L.marker([lat, lng], { icon: customIcon });

      marker.on('click', () => {
        setSelectedRecord(record);
        if (onSelectDestination) {
          onSelectDestination(destination);
        }
      });

      marker.addTo(markersGroup);
    });

    if (filteredRecords.length > 0 && map) {
      const bounds = L.latLngBounds(
        filteredRecords.map((r) => [r.destination.latitude, r.destination.longitude])
      );
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 10 });
    }
  }, [filteredRecords, showSentimentHalo, onSelectDestination]);

  return (
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* HEADER & FILTERS                                                          */}
      {/* ========================================================================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗣️</span>
            <h2 className="text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100">
              Tourist Voice Sentiment Heatmap
            </h2>
            <Badge variant="emerald" className="text-[10px] font-bold">
              Automated Review Intelligence
            </Badge>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            Spatial distribution of tourist sentiment derived deterministically from approved reviews and rating signals across all 8 districts.
          </p>
        </div>

        {/* Sentiment Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 mr-1">
            Sentiment:
          </span>
          <button
            onClick={() => setSentimentFilter('ALL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              sentimentFilter === 'ALL'
                ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 hover:bg-stone-200 dark:hover:bg-stone-750'
            }`}
          >
            All Sentiments ({sentimentRecords.length})
          </button>

          <button
            onClick={() => setSentimentFilter('POSITIVE')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sentimentFilter === 'POSITIVE'
                ? 'bg-emerald-600 text-white shadow ring-1 ring-emerald-400'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
            }`}
          >
            <span>🟢 Strong Positive</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                sentimentFilter === 'POSITIVE'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-200'
              }`}
            >
              {sentimentRecords.filter((r) => r.sentimentStatus === 'POSITIVE').length}
            </span>
          </button>

          <button
            onClick={() => setSentimentFilter('NEUTRAL')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sentimentFilter === 'NEUTRAL'
                ? 'bg-amber-600 text-white shadow ring-1 ring-amber-400'
                : 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-900/60 hover:bg-amber-100 dark:hover:bg-amber-900/50'
            }`}
          >
            <span>🟡 Mixed / Neutral</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                sentimentFilter === 'NEUTRAL'
                  ? 'bg-amber-800 text-white'
                  : 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-200'
              }`}
            >
              {sentimentRecords.filter((r) => r.sentimentStatus === 'NEUTRAL').length}
            </span>
          </button>

          <button
            onClick={() => setSentimentFilter('NEGATIVE')}
            className={`text-xs px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              sentimentFilter === 'NEGATIVE'
                ? 'bg-red-600 text-white shadow ring-1 ring-red-400'
                : 'bg-red-50 dark:bg-red-950/40 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-900/60 hover:bg-red-100 dark:hover:bg-red-900/50'
            }`}
          >
            <span>🔴 Negative Signals</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                sentimentFilter === 'NEGATIVE'
                  ? 'bg-red-800 text-white'
                  : 'bg-red-200 dark:bg-red-900 text-red-900 dark:text-red-200'
              }`}
            >
              {sentimentRecords.filter((r) => r.sentimentStatus === 'NEGATIVE').length}
            </span>
          </button>
        </div>
      </div>

      {/* Secondary District & Category Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* District Dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <Filter className="h-3.5 w-3.5 text-stone-500" />
            <label htmlFor="voice-district-select" className="text-stone-500 font-medium">District:</label>
            <select
              id="voice-district-select"
              value={selectedDistrictId}
              onChange={(e) => setSelectedDistrictId(e.target.value)}
              className="bg-transparent border-none text-stone-900 dark:text-stone-100 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">All Districts (8)</option>
              {districts.map((d) => (
                <option key={d.id} value={d.id} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Category Tag Dropdown */}
          <div className="flex items-center gap-1.5 text-xs bg-white dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <MessageSquare className="h-3.5 w-3.5 text-stone-500" />
            <label htmlFor="voice-aspect-select" className="text-stone-500 font-medium">Aspect:</label>
            <select
              id="voice-aspect-select"
              value={selectedCategoryTag}
              onChange={(e) => setSelectedCategoryTag(e.target.value)}
              className="bg-transparent border-none text-stone-900 dark:text-stone-100 font-bold focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">All Aspects & Tags</option>
              {ALL_REVIEW_TAGS.map((tag) => (
                <option key={tag} value={tag} className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100">
                  {tag}
                </option>
              ))}
            </select>
          </div>

          {/* Time Period Filter */}
          <div className="flex items-center gap-1 text-xs bg-white dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
            <span className="text-stone-500 font-medium">Period:</span>
            <button
              onClick={() => setTimePeriod('all')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                timePeriod === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setTimePeriod('90days')}
              className={`px-2 py-0.5 rounded text-[11px] font-bold transition-colors cursor-pointer ${
                timePeriod === '90days'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200 dark:hover:bg-stone-750'
              }`}
            >
              Last 90d
            </button>
          </div>
        </div>

        {/* Toggle Halo */}
        <label className="flex items-center gap-2 text-xs font-semibold text-stone-600 dark:text-stone-400 cursor-pointer select-none bg-white dark:bg-stone-900 px-3 py-1.5 rounded-xl border border-stone-200 dark:border-stone-800 shadow-sm">
          <input
            type="checkbox"
            checked={showSentimentHalo}
            onChange={(e) => setShowSentimentHalo(e.target.checked)}
            className="rounded text-emerald-600 focus:ring-emerald-500"
          />
          <span>Show Sentiment Radii</span>
        </label>
      </div>

      {/* ========================================================================= */}
      {/* MAP CANVAS CONTAINER                                                      */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl overflow-hidden border border-stone-200 dark:border-stone-800 shadow-xl bg-stone-100 dark:bg-stone-900 h-[520px]">
        {/* Leaflet DOM Node */}
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Overlay Legend */}
        <div className="absolute top-4 left-4 z-[400] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-3.5 rounded-2xl border border-stone-200/80 dark:border-stone-700/80 shadow-xl max-w-xs space-y-2.5">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>Review Sentiment Index</span>
            </h4>
            <span className="text-[10px] text-stone-500">Live Signals</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">🟢</span>
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                  Strong Positive (&gt;75% Pos)
                </span>
                <span className="text-[10px] text-stone-500">High satisfaction, guide & scenic praise</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">🟡</span>
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                  Mixed / Neutral (50-75% Pos)
                </span>
                <span className="text-[10px] text-stone-500">Balanced reviews, minor service friction</span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="text-sm shrink-0">🔴</span>
              <div>
                <span className="font-bold text-stone-900 dark:text-stone-100 block">
                  Negative Signals (&gt;15% Neg)
                </span>
                <span className="text-[10px] text-stone-500">Parking bottlenecks, waste or queue issues</span>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Destination Inspector Modal Card */}
        {selectedRecord && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-96 z-[400] bg-white/95 dark:bg-stone-900/95 backdrop-blur-md p-4 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-2xl space-y-3 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant="outline"
                    className={`text-[10px] font-bold ${selectedRecord.badgeBg} ${selectedRecord.badgeText} ${selectedRecord.badgeBorder}`}
                  >
                    {selectedRecord.sentimentStatus === 'POSITIVE'
                      ? '🟢 Strong Positive'
                      : selectedRecord.sentimentStatus === 'NEUTRAL'
                      ? '🟡 Mixed Sentiment'
                      : '🔴 Negative Signals'}
                  </Badge>
                  <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400" />
                    {selectedRecord.summary.overallRating}
                  </span>
                </div>
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-stone-100 truncate mt-1">
                  {selectedRecord.destination.name}
                </h3>
                <p className="text-xs text-stone-500 flex items-center gap-1 truncate">
                  <MapPin className="h-3 w-3 text-stone-400" />
                  {selectedRecord.destination.district?.name || 'Jharkhand District'}
                </p>
              </div>

              <button
                onClick={() => setSelectedRecord(null)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 p-1 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            {/* Sentiment Breakdown Bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-emerald-700 dark:text-emerald-400">
                  Pos {selectedRecord.summary.positivePercentage}%
                </span>
                <span className="text-amber-700 dark:text-amber-400">
                  Neu {selectedRecord.summary.neutralPercentage}%
                </span>
                <span className="text-rose-700 dark:text-rose-400">
                  Neg {selectedRecord.summary.negativePercentage}%
                </span>
              </div>
              <div className="h-2 w-full bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden flex">
                <div
                  style={{ width: `${selectedRecord.summary.positivePercentage}%` }}
                  className="bg-emerald-500 h-full"
                />
                <div
                  style={{ width: `${selectedRecord.summary.neutralPercentage}%` }}
                  className="bg-amber-500 h-full"
                />
                <div
                  style={{ width: `${selectedRecord.summary.negativePercentage}%` }}
                  className="bg-red-500 h-full"
                />
              </div>
            </div>

            {/* Key Positive & Negative Topics */}
            <div className="p-2.5 rounded-xl bg-stone-50 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 text-xs space-y-1.5">
              <div className="flex items-start gap-1.5 text-stone-800 dark:text-stone-200">
                <span className="text-emerald-600 font-bold shrink-0">✓ Praise:</span>
                <span className="truncate">{selectedRecord.dominantTheme}</span>
              </div>
              <div className="flex items-start gap-1.5 text-stone-800 dark:text-stone-200">
                <span className="text-rose-600 font-bold shrink-0">! Issue:</span>
                <span className="truncate">{selectedRecord.dominantIssue}</span>
              </div>
              <div className="pt-1 border-t border-stone-200 dark:border-stone-700 flex items-center justify-between text-[11px]">
                <span className="text-stone-500">Tourist Experience Score:</span>
                <span className="font-extrabold text-emerald-700 dark:text-emerald-400">
                  {selectedRecord.summary.touristExperienceScore} / 100
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-1">
              <Button
                size="sm"
                onClick={() => {
                  if (navigate) navigate(`/destinations/${selectedRecord.destination.slug}`);
                }}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold h-8 rounded-xl"
              >
                View Public Reviews
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
