import React, { useState } from 'react';
import {
  Leaf,
  Zap,
  Train,
  Bus,
  Car,
  CarFront,
  Bike,
  TreePine,
  ArrowRight,
  TrendingDown,
  Sparkles,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  ShieldCheck,
  Fuel,
  RefreshCw,
  Award,
} from 'lucide-react';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Card } from './ui/card';
import {
  TransitModeId,
  TransitMode,
  TRANSIT_MODES,
  TRANSIT_MODES_LIST,
  calculateItineraryCarbonFootprint,
  CarbonFootprintResult,
  SustainableAlternative,
} from '../services/carbonFootprint';
import { ItineraryResponse } from '../types/index';

interface CarbonFootprintCardProps {
  itinerary: ItineraryResponse;
  guestCount?: number;
  onOpenMap?: () => void;
}

export function CarbonFootprintCard({
  itinerary,
  guestCount = 2,
  onOpenMap,
}: CarbonFootprintCardProps) {
  const [globalMode, setGlobalMode] = useState<TransitModeId>('diesel_suv');
  const [segmentOverrides, setSegmentOverrides] = useState<Record<number, TransitModeId>>({});
  const [showSegmentDetails, setShowSegmentDetails] = useState<boolean>(false);
  const [pledgeTaken, setPledgeTaken] = useState<boolean>(false);
  const [appliedAlternativeNotice, setAppliedAlternativeNotice] = useState<string | null>(null);

  // Compute live carbon footprint
  const footprint: CarbonFootprintResult = calculateItineraryCarbonFootprint(
    itinerary,
    globalMode,
    segmentOverrides,
    guestCount
  );

  const getModeIcon = (modeId: TransitModeId, className = 'h-4 w-4') => {
    switch (modeId) {
      case 'electric_railway':
        return <Train className={className} />;
      case 'electric_vehicle':
        return <Zap className={className} />;
      case 'shared_bus':
        return <Bus className={className} />;
      case 'cng_cab':
        return <CarFront className={className} />;
      case 'bicycle_walk':
        return <Bike className={className} />;
      case 'petrol_sedan':
      case 'diesel_suv':
      default:
        return <Car className={className} />;
    }
  };

  const handleApplyAlternative = (dayNumber: number, alt: SustainableAlternative) => {
    setSegmentOverrides((prev) => ({
      ...prev,
      [dayNumber]: alt.modeId,
    }));
    setAppliedAlternativeNotice(
      `Day ${dayNumber} route updated to ${alt.modeName}! Saved an additional ${alt.savingsCarbonKg} kg CO₂.`
    );
    setTimeout(() => {
      setAppliedAlternativeNotice(null);
    }, 4000);
  };

  const handleGlobalModeChange = (modeId: TransitModeId) => {
    setGlobalMode(modeId);
    // Clear individual segment overrides when changing global mode
    setSegmentOverrides({});
  };

  const handleSegmentModeChange = (dayNumber: number, modeId: TransitModeId) => {
    setSegmentOverrides((prev) => ({
      ...prev,
      [dayNumber]: modeId,
    }));
  };

  const handleResetAllToElectric = () => {
    setGlobalMode('electric_vehicle');
    setSegmentOverrides({});
    setAppliedAlternativeNotice('Updated all routes to Electric EV Travel!');
    setTimeout(() => setAppliedAlternativeNotice(null), 3000);
  };

  const handleResetAllToTrain = () => {
    setGlobalMode('electric_railway');
    setSegmentOverrides({});
    setAppliedAlternativeNotice('Updated routes to Indian Railways Electrified Corridor!');
    setTimeout(() => setAppliedAlternativeNotice(null), 3000);
  };

  return (
    <Card className="rounded-3xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-b from-emerald-50/70 via-white to-stone-50/50 dark:from-emerald-950/40 dark:via-stone-900 dark:to-stone-900 shadow-lg overflow-hidden space-y-5 p-5 sm:p-7 transition-all">
      {/* Header & Badges */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-100 dark:border-emerald-900/50 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="h-8 w-8 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm">
              <Leaf className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <span>Trip Carbon Footprint & Transit Optimizer</span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                Calculated across {footprint.totalDistanceKm} km total circuit travel for {guestCount} {guestCount === 1 ? 'traveler' : 'travelers'}
              </p>
            </div>
          </div>
        </div>

        {/* Eco-Rating Badge */}
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`text-xs px-3 py-1 font-bold ${
              footprint.ecoRating === 'gold'
                ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-700'
                : footprint.ecoRating === 'silver'
                ? 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-700'
                : footprint.ecoRating === 'bronze'
                ? 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/60 dark:text-teal-300'
                : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300'
            }`}
          >
            {footprint.ecoRatingLabel}
          </Badge>
        </div>
      </div>

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Metric 1: Total CO2 Emissions */}
        <div className="p-3.5 rounded-2xl bg-white dark:bg-stone-900/80 border border-stone-200/80 dark:border-stone-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block uppercase tracking-wider">
            Total Carbon Output
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-stone-900 dark:text-stone-100">
              {footprint.totalCarbonKg}
            </span>
            <span className="text-xs font-semibold text-stone-500">kg CO₂</span>
          </div>
          <span className="text-[10px] text-stone-400 block">
            ~{footprint.carbonPerPersonKg} kg CO₂ / person
          </span>
        </div>

        {/* Metric 2: Carbon Saved vs Fossil Baseline */}
        <div className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 block uppercase tracking-wider flex items-center gap-1">
            <TrendingDown className="h-3.5 w-3.5 text-emerald-600" />
            <span>Carbon Saved</span>
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {footprint.savingsCarbonKg > 0 ? `-${footprint.savingsCarbonKg}` : '0.0'}
            </span>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">kg CO₂</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block">
            {footprint.savingsPercentage > 0
              ? `${footprint.savingsPercentage}% lower than SUV`
              : 'Standard baseline'}
          </span>
        </div>

        {/* Metric 3: Forest Tree Offset */}
        <div className="p-3.5 rounded-2xl bg-teal-500/10 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-teal-800 dark:text-teal-300 block uppercase tracking-wider flex items-center gap-1">
            <TreePine className="h-3.5 w-3.5 text-teal-600" />
            <span>Sal Tree Offset</span>
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-teal-700 dark:text-teal-300">
              {footprint.treesEquivalent > 0 ? footprint.treesEquivalent : '0.0'}
            </span>
            <span className="text-xs font-semibold text-teal-700 dark:text-teal-400">Trees / Year</span>
          </div>
          <span className="text-[10px] text-teal-600 dark:text-teal-400 block">
            Annual sequestration equiv.
          </span>
        </div>

        {/* Metric 4: Baseline Comparison */}
        <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-800 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-stone-500 dark:text-stone-400 block uppercase tracking-wider">
            SUV Benchmark
          </span>
          <div className="flex items-baseline gap-1.5">
            <span className="text-xl sm:text-2xl font-black text-stone-700 dark:text-stone-300">
              {footprint.baselineCarbonKg}
            </span>
            <span className="text-xs font-semibold text-stone-500">kg CO₂</span>
          </div>
          <span className="text-[10px] text-stone-500 dark:text-stone-400 block">
            192g CO₂ / km per traveler
          </span>
        </div>
      </div>

      {/* Feedback Toast if Alternative applied */}
      {appliedAlternativeNotice && (
        <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs flex items-center gap-2 animate-in fade-in-50 duration-200">
          <Check className="h-4 w-4 text-emerald-600 shrink-0" />
          <span className="font-semibold">{appliedAlternativeNotice}</span>
        </div>
      )}

      {/* Global Primary Transit Mode Selector */}
      <div className="space-y-2.5 bg-white dark:bg-stone-900 p-4 sm:p-5 rounded-2xl border border-stone-200/80 dark:border-stone-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <label className="font-bold text-xs sm:text-sm text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <span>Primary Transit Mode for Entire Trip:</span>
            </label>
            <p className="text-[11px] text-stone-500">
              Select your expected mode of transport or pick specific green choices per day below.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetAllToElectric}
              className="text-[11px] h-7 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 font-semibold gap-1"
            >
              <Zap className="h-3 w-3 text-amber-500" />
              <span>All EV</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleResetAllToTrain}
              className="text-[11px] h-7 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/60 font-semibold gap-1"
            >
              <Train className="h-3 w-3 text-blue-500" />
              <span>All Rail</span>
            </Button>
          </div>
        </div>

        {/* Mode Selector Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1">
          {TRANSIT_MODES_LIST.map((mode) => {
            const isSelected = globalMode === mode.id && Object.keys(segmentOverrides).length === 0;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => handleGlobalModeChange(mode.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-2.5 ${
                  isSelected
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-500 ring-2 ring-emerald-500/20 text-stone-900 dark:text-stone-100 font-bold'
                    : 'bg-stone-50/70 dark:bg-stone-800/60 border-stone-200 dark:border-stone-700 text-stone-600 dark:text-stone-300 hover:bg-stone-100 hover:border-stone-300'
                }`}
              >
                <div
                  className={`h-7 w-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                    mode.isEcoFriendly
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300'
                  }`}
                >
                  {getModeIcon(mode.id, 'h-3.5 w-3.5')}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs truncate block font-bold">{mode.shortName}</span>
                    {mode.isEcoFriendly && (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">🌿 Eco</span>
                    )}
                  </div>
                  <span className="text-[10px] text-stone-500 dark:text-stone-400 block font-normal">
                    {mode.emissionFactorGramsPerKm}g CO₂/km
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sustainable Alternatives Recommendations Banner (Contextual for Jharkhand routes) */}
      {footprint.sustainableRecommendations.length > 0 && (
        <div className="space-y-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-teal-900 via-emerald-900 to-stone-900 text-white border border-teal-700 shadow-md">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-300 shrink-0" />
            <h4 className="font-extrabold text-sm sm:text-base text-white">
              Green Transit Recommendations for Your Circuit
            </h4>
          </div>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            We analyzed your specific Jharkhand route segments against real electrified train corridors, EV highway fast chargers, and state eco-transits:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {footprint.sustainableRecommendations.map((rec) => (
              <div
                key={rec.dayNumber}
                className="p-3.5 rounded-xl bg-white/10 backdrop-blur-sm border border-white/15 space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300">
                      Day {rec.dayNumber}: {rec.routeLabel} ({rec.distanceKm} km)
                    </span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-400/20 text-emerald-200 border-emerald-300/40">
                      Save -{rec.suggestedAlternative.savingsCarbonKg} kg CO₂
                    </Badge>
                  </div>
                  <h5 className="font-bold text-xs sm:text-sm text-white">
                    {rec.suggestedAlternative.title}
                  </h5>
                  <p className="text-[11px] text-emerald-100 leading-snug">
                    {rec.suggestedAlternative.reason}
                  </p>
                  {rec.suggestedAlternative.localInfrastructureNote && (
                    <p className="text-[10px] text-amber-200/90 font-medium pt-0.5">
                      📍 {rec.suggestedAlternative.localInfrastructureNote}
                    </p>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-between border-t border-white/10 mt-2">
                  <span className="text-[10px] text-emerald-200 font-semibold">
                    {rec.suggestedAlternative.highlightBenefit}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleApplyAlternative(rec.dayNumber, rec.suggestedAlternative)}
                    className="text-xs h-7 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold px-2.5 gap-1 shrink-0 cursor-pointer shadow-xs"
                  >
                    <Zap className="h-3 w-3" />
                    <span>Switch Route</span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Accordion: Per-Day Route Segment Breakdown */}
      <div className="border border-stone-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900 overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSegmentDetails(!showSegmentDetails)}
          className="w-full p-4 flex items-center justify-between text-left text-xs sm:text-sm font-bold text-stone-900 dark:text-stone-100 hover:bg-stone-50 dark:hover:bg-stone-800/50 cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Fuel className="h-4 w-4 text-emerald-600" />
            <span>Customize Transit per Day & View Segment Breakdown ({footprint.segmentBreakdowns.length} legs)</span>
          </div>
          {showSegmentDetails ? (
            <ChevronUp className="h-4 w-4 text-stone-400" />
          ) : (
            <ChevronDown className="h-4 w-4 text-stone-400" />
          )}
        </button>

        {showSegmentDetails && (
          <div className="p-4 pt-0 space-y-3 border-t border-stone-100 dark:border-stone-800 animate-in fade-in-50">
            <p className="text-xs text-stone-500 dark:text-stone-400 pt-2">
              Select specific transit modes for each travel leg to model mixed-modal trips (e.g. Train for inter-district links + EV for local waterfall circuits):
            </p>

            <div className="space-y-2.5">
              {footprint.segmentBreakdowns.map((seg) => (
                <div
                  key={seg.dayNumber}
                  className="p-3 rounded-xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200/70 dark:border-stone-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-bold bg-white dark:bg-stone-900">
                        Day {seg.dayNumber}
                      </Badge>
                      <span className="font-bold text-stone-900 dark:text-stone-100 truncate">
                        {seg.originName} → {seg.destinationName}
                      </span>
                    </div>
                    <span className="text-[11px] text-stone-500 block">
                      Distance: <strong>{seg.distanceKm} km</strong> • Current Carbon: <strong>{seg.carbonKg} kg CO₂</strong>
                      {seg.savingsCarbonKg > 0 && (
                        <span className="text-emerald-600 dark:text-emerald-400 ml-1 font-semibold">
                          (Saved {seg.savingsCarbonKg} kg vs SUV)
                        </span>
                      )}
                    </span>
                  </div>

                  {/* Segment Mode Dropdown */}
                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={segmentOverrides[seg.dayNumber] || globalMode}
                      onChange={(e) => handleSegmentModeChange(seg.dayNumber, e.target.value as TransitModeId)}
                      className="h-8 bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 rounded-lg px-2 text-xs font-semibold text-stone-800 dark:text-stone-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    >
                      {TRANSIT_MODES_LIST.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.shortName} ({m.emissionFactorGramsPerKm}g/km)
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Sustainable Eco-Pledge & Offset Card */}
      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-bold text-xs sm:text-sm text-emerald-950 dark:text-emerald-200">
              {pledgeTaken ? '🎉 Green Eco-Pledge Active!' : 'Jharkhand Responsible Tourism Pledge'}
            </h5>
            <p className="text-[11px] text-emerald-800 dark:text-emerald-400">
              I pledge to minimize single-use plastics, travel using low-carbon transport when possible, and support native tribal homestays.
            </p>
          </div>
        </div>

        <Button
          size="sm"
          onClick={() => setPledgeTaken(!pledgeTaken)}
          className={`text-xs shrink-0 font-bold ${
            pledgeTaken
              ? 'bg-emerald-700 hover:bg-emerald-800 text-white gap-1'
              : 'bg-white dark:bg-stone-900 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100'
          }`}
        >
          {pledgeTaken ? (
            <>
              <Check className="h-3.5 w-3.5 text-white" />
              <span>Pledge Taken</span>
            </>
          ) : (
            <span>Take Green Pledge</span>
          )}
        </Button>
      </div>
    </Card>
  );
}
