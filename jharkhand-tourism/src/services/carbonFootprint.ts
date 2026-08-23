import { ItineraryResponse, ItineraryDayPlan } from '../types/index';

export type TransitModeId =
  | 'diesel_suv'
  | 'petrol_sedan'
  | 'cng_cab'
  | 'electric_vehicle'
  | 'shared_bus'
  | 'electric_railway'
  | 'bicycle_walk';

export interface TransitMode {
  id: TransitModeId;
  name: string;
  shortName: string;
  category: 'fossil' | 'cng' | 'ev' | 'public' | 'zero_emission';
  emissionFactorGramsPerKm: number; // g CO2 per passenger-km
  costFactorPerKm: number; // approximate INR per km
  speedAvgKmh: number;
  iconName: string;
  isEcoFriendly: boolean;
  description: string;
}

export interface SustainableAlternative {
  modeId: TransitModeId;
  modeName: string;
  title: string;
  reason: string;
  highlightBenefit: string;
  estimatedCarbonKg: number;
  savingsCarbonKg: number;
  savingsPercent: number;
  localInfrastructureNote?: string;
}

export interface SegmentCarbonDetail {
  dayNumber: number;
  originName: string;
  destinationName: string;
  distanceKm: number;
  currentMode: TransitMode;
  carbonKg: number;
  baselineCarbonKg: number;
  savingsCarbonKg: number;
  savingsPercent: number;
  recommendedAlternative?: SustainableAlternative;
}

export interface RouteTransitRecommendation {
  dayNumber: number;
  routeLabel: string;
  originName: string;
  destinationName: string;
  distanceKm: number;
  currentModeId: TransitModeId;
  currentCarbonKg: number;
  suggestedAlternative: SustainableAlternative;
}

export interface CarbonFootprintResult {
  totalDistanceKm: number;
  totalCarbonKg: number;
  carbonPerPersonKg: number;
  baselineCarbonKg: number; // Standard private SUV baseline
  savingsCarbonKg: number;
  savingsPercentage: number;
  treesEquivalent: number; // 1 mature sal/forest tree absorbs ~22 kg CO2/year
  ecoRating: 'gold' | 'silver' | 'bronze' | 'high_carbon';
  ecoRatingLabel: string;
  ecoRatingDescription: string;
  guestCount: number;
  activeTransitMode: TransitModeId;
  segmentBreakdowns: SegmentCarbonDetail[];
  sustainableRecommendations: RouteTransitRecommendation[];
}

/**
 * Standard Transit Modes calibrated with Indian highway/emission benchmarks (g CO2/km)
 */
export const TRANSIT_MODES: Record<TransitModeId, TransitMode> = {
  diesel_suv: {
    id: 'diesel_suv',
    name: 'Private SUV / Diesel 4x4',
    shortName: 'Private SUV',
    category: 'fossil',
    emissionFactorGramsPerKm: 192,
    costFactorPerKm: 14,
    speedAvgKmh: 45,
    iconName: 'Car',
    isEcoFriendly: false,
    description: 'Standard private diesel SUV or heavy utility vehicle.',
  },
  petrol_sedan: {
    id: 'petrol_sedan',
    name: 'Petrol Sedan / Hatchback',
    shortName: 'Petrol Car',
    category: 'fossil',
    emissionFactorGramsPerKm: 142,
    costFactorPerKm: 10,
    speedAvgKmh: 48,
    iconName: 'Car',
    isEcoFriendly: false,
    description: 'Compact petrol car or private taxi.',
  },
  cng_cab: {
    id: 'cng_cab',
    name: 'Shared CNG Cab / Green Taxi',
    shortName: 'CNG Cab',
    category: 'cng',
    emissionFactorGramsPerKm: 92,
    costFactorPerKm: 6.5,
    speedAvgKmh: 45,
    iconName: 'CarFront',
    isEcoFriendly: true,
    description: 'Compressed Natural Gas powered regional taxi or shared cruiser.',
  },
  electric_vehicle: {
    id: 'electric_vehicle',
    name: 'Electric Vehicle (EV) Taxi',
    shortName: 'Electric EV',
    category: 'ev',
    emissionFactorGramsPerKm: 42,
    costFactorPerKm: 4.5,
    speedAvgKmh: 48,
    iconName: 'Zap',
    isEcoFriendly: true,
    description: 'Zero direct tailpipe emission EV running on Jharkhand green charging corridors.',
  },
  shared_bus: {
    id: 'shared_bus',
    name: 'State Eco-Bus / JUIDCO Transport',
    shortName: 'Eco-Bus',
    category: 'public',
    emissionFactorGramsPerKm: 36,
    costFactorPerKm: 2.2,
    speedAvgKmh: 40,
    iconName: 'Bus',
    isEcoFriendly: true,
    description: 'Shared public/state tourist coach with high per-passenger fuel efficiency.',
  },
  electric_railway: {
    id: 'electric_railway',
    name: 'Indian Railways / Vande Bharat Express',
    shortName: 'Train / Rail',
    category: 'public',
    emissionFactorGramsPerKm: 24,
    costFactorPerKm: 1.8,
    speedAvgKmh: 65,
    iconName: 'Train',
    isEcoFriendly: true,
    description: '100% electrified rail corridor connecting Jharkhand district junctions.',
  },
  bicycle_walk: {
    id: 'bicycle_walk',
    name: 'E-Bike / Cycle / Guided Walking Trail',
    shortName: 'E-Bike / Walk',
    category: 'zero_emission',
    emissionFactorGramsPerKm: 0,
    costFactorPerKm: 0.5,
    speedAvgKmh: 15,
    iconName: 'Bike',
    isEcoFriendly: true,
    description: 'Zero carbon non-motorized local eco exploration.',
  },
};

export const TRANSIT_MODES_LIST: TransitMode[] = Object.values(TRANSIT_MODES);

/**
 * Contextual route suggestions for Jharkhand eco corridors
 */
export function findSustainableRouteAlternative(
  origin: string,
  destination: string,
  distanceKm: number,
  currentMode: TransitModeId
): SustainableAlternative | undefined {
  const normOrig = (origin || '').toLowerCase();
  const normDest = (destination || '').toLowerCase();
  const pair = `${normOrig} ${normDest}`;

  // 1. Parasnath (Shikharji) Route
  if (pair.includes('parasnath') || pair.includes('shikharji') || pair.includes('giridih')) {
    if (currentMode === 'diesel_suv' || currentMode === 'petrol_sedan') {
      const mode = TRANSIT_MODES.electric_railway;
      const altEmissions = (distanceKm * mode.emissionFactorGramsPerKm) / 1000;
      const curEmissions = (distanceKm * TRANSIT_MODES[currentMode].emissionFactorGramsPerKm) / 1000;
      const saved = Math.max(0, curEmissions - altEmissions);
      return {
        modeId: 'electric_railway',
        modeName: 'Vande Bharat / Intercity Express Train',
        title: 'Electrified Rail Corridor to Parasnath (PNME)',
        reason: 'Ranchi/Dhanbad to Parasnath Station is a 100% electrified broad-gauge trunk line with daily express trains.',
        highlightBenefit: `Cuts carbon emissions by ~${Math.round((saved / curEmissions) * 100)}% (saves ${saved.toFixed(1)} kg CO₂ per traveler).`,
        estimatedCarbonKg: Number(altEmissions.toFixed(1)),
        savingsCarbonKg: Number(saved.toFixed(1)),
        savingsPercent: Math.round((saved / curEmissions) * 100),
        localInfrastructureNote: 'Direct trains available from Ranchi Junction & Dhanbad to Parasnath (Shikharji) Railway Station with e-rickshaw connectivity to Madhuban base.',
      };
    }
  }

  // 2. Jamshedpur (Tatanagar) Corridor
  if (pair.includes('jamshedpur') || pair.includes('tatanagar')) {
    if (currentMode !== 'electric_railway' && currentMode !== 'electric_vehicle') {
      const mode = TRANSIT_MODES.electric_railway;
      const altEmissions = (distanceKm * mode.emissionFactorGramsPerKm) / 1000;
      const curEmissions = (distanceKm * TRANSIT_MODES[currentMode].emissionFactorGramsPerKm) / 1000;
      const saved = Math.max(0, curEmissions - altEmissions);
      return {
        modeId: 'electric_railway',
        modeName: 'Ranchi-Howrah / Tatanagar Express',
        title: 'Fast Electric Rail on NH-33 Corridor',
        reason: 'Frequent daily superfast rail connections take only 2h 15m and generate minimal carbon.',
        highlightBenefit: `Reduces emissions by ~${Math.round((saved / curEmissions) * 100)}% (${saved.toFixed(1)} kg CO₂ saved).`,
        estimatedCarbonKg: Number(altEmissions.toFixed(1)),
        savingsCarbonKg: Number(saved.toFixed(1)),
        savingsPercent: Math.round((saved / curEmissions) * 100),
        localInfrastructureNote: 'Vande Bharat & Janshatabdi express trains connect Ranchi and Tatanagar with zero highway congestion.',
      };
    }
  }

  // 3. Deoghar (Baidyanath Dham) Corridor
  if (pair.includes('deoghar') || pair.includes('baidyanath') || pair.includes('jasidih')) {
    if (currentMode === 'diesel_suv' || currentMode === 'petrol_sedan') {
      const mode = TRANSIT_MODES.electric_railway;
      const altEmissions = (distanceKm * mode.emissionFactorGramsPerKm) / 1000;
      const curEmissions = (distanceKm * TRANSIT_MODES[currentMode].emissionFactorGramsPerKm) / 1000;
      const saved = Math.max(0, curEmissions - altEmissions);
      return {
        modeId: 'electric_railway',
        modeName: 'Ranchi-Deoghar Vande Bharat Express',
        title: 'Direct Vande Bharat Electrified Link (Train 22350)',
        reason: 'High-speed electrified train connection covering 250+ km in under 4 hours.',
        highlightBenefit: `Avoids ~${saved.toFixed(1)} kg of highway CO₂ emissions per passenger!`,
        estimatedCarbonKg: Number(altEmissions.toFixed(1)),
        savingsCarbonKg: Number(saved.toFixed(1)),
        savingsPercent: Math.round((saved / curEmissions) * 100),
        localInfrastructureNote: 'Daily Vande Bharat Express stops directly at Deoghar Junction with clean electric propulsion.',
      };
    }
  }

  // 4. Patratu Valley / Hundru / Jonha Excursions (Short Distance < 55 km)
  if (distanceKm <= 55 && (pair.includes('patratu') || pair.includes('hundru') || pair.includes('jonha') || pair.includes('ranchi'))) {
    if (currentMode === 'diesel_suv' || currentMode === 'petrol_sedan') {
      const mode = TRANSIT_MODES.electric_vehicle;
      const altEmissions = (distanceKm * mode.emissionFactorGramsPerKm) / 1000;
      const curEmissions = (distanceKm * TRANSIT_MODES[currentMode].emissionFactorGramsPerKm) / 1000;
      const saved = Math.max(0, curEmissions - altEmissions);
      return {
        modeId: 'electric_vehicle',
        modeName: 'Electric EV Cab / Shared CNG Shuttle',
        title: 'Green Valley EV Excursion',
        reason: 'Patratu & Ranchi waterfalls are ideal for zero-emission EV cabs with fast charging hubs in Ranchi city.',
        highlightBenefit: `Cuts transit emissions by ~${Math.round((saved / curEmissions) * 100)}% (${saved.toFixed(1)} kg CO₂).`,
        estimatedCarbonKg: Number(altEmissions.toFixed(1)),
        savingsCarbonKg: Number(saved.toFixed(1)),
        savingsPercent: Math.round((saved / curEmissions) * 100),
        localInfrastructureNote: 'Rent e-bikes or electric cabs at Patratu Lake Resort Promenade for eco-friendly ghat tours.',
      };
    }
  }

  // 5. Netarhat / Betla National Park (Palamu Circuit)
  if (pair.includes('betla') || pair.includes('netarhat') || pair.includes('latehar') || pair.includes('palamu')) {
    if (currentMode === 'diesel_suv' || currentMode === 'petrol_sedan') {
      const mode = TRANSIT_MODES.electric_vehicle;
      const altEmissions = (distanceKm * mode.emissionFactorGramsPerKm) / 1000;
      const curEmissions = (distanceKm * TRANSIT_MODES[currentMode].emissionFactorGramsPerKm) / 1000;
      const saved = Math.max(0, curEmissions - altEmissions);
      return {
        modeId: 'electric_vehicle',
        modeName: 'JUIDCO NH-39 Green EV Corridor / Tourism Eco-Van',
        title: 'NH-39 Green Charging Highway',
        reason: 'Jharkhand Tourism has equipped the Ranchi-Kuru-Latehar-Betla route with DC Fast Charging for EVs.',
        highlightBenefit: `Reduces safari carbon footprint by ${Math.round((saved / curEmissions) * 100)}% (${saved.toFixed(1)} kg CO₂).`,
        estimatedCarbonKg: Number(altEmissions.toFixed(1)),
        savingsCarbonKg: Number(saved.toFixed(1)),
        savingsPercent: Math.round((saved / curEmissions) * 100),
        localInfrastructureNote: 'Fast EV charging stations available at Kuru Highway Junction and Latehar Forest Rest House.',
      };
    }
  }

  // 6. Generic Fallback Suggestion for Fossil Cars
  if (currentMode === 'diesel_suv' || currentMode === 'petrol_sedan') {
    const mode = distanceKm > 100 ? TRANSIT_MODES.electric_railway : TRANSIT_MODES.electric_vehicle;
    const altEmissions = (distanceKm * mode.emissionFactorGramsPerKm) / 1000;
    const curEmissions = (distanceKm * TRANSIT_MODES[currentMode].emissionFactorGramsPerKm) / 1000;
    const saved = Math.max(0, curEmissions - altEmissions);
    return {
      modeId: mode.id,
      modeName: mode.name,
      title: distanceKm > 100 ? 'Switch to Electrified Rail' : 'Switch to Electric Taxi / Shared EV',
      reason: 'Reduces heavy fossil fuel combustion and preserves pristine forest bio-reserves.',
      highlightBenefit: `Save ~${saved.toFixed(1)} kg CO₂ per traveler (${Math.round((saved / curEmissions) * 100)}% lower emissions).`,
      estimatedCarbonKg: Number(altEmissions.toFixed(1)),
      savingsCarbonKg: Number(saved.toFixed(1)),
      savingsPercent: Math.round((saved / curEmissions) * 100),
      localInfrastructureNote: 'Support Jharkhand Eco-Tourism green transit initiatives for clean air in tribal sanctuaries.',
    };
  }

  return undefined;
}

/**
 * Calculates complete carbon footprint for an itinerary with per-segment customization and alternatives
 */
export function calculateItineraryCarbonFootprint(
  itinerary: ItineraryResponse,
  globalTransitMode: TransitModeId = 'diesel_suv',
  segmentOverrides: Record<number, TransitModeId> = {},
  guestCount: number = 2
): CarbonFootprintResult {
  const guests = Math.max(1, Math.min(50, Math.floor(Number(guestCount) || 2)));
  let totalDistanceKm = 0;
  let totalCarbonGrams = 0;
  let baselineCarbonGrams = 0;

  const segmentBreakdowns: SegmentCarbonDetail[] = [];
  const sustainableRecommendations: RouteTransitRecommendation[] = [];

  const baselineMode = TRANSIT_MODES.diesel_suv;

  itinerary.days.forEach((day, index) => {
    // Determine distance: from travelSegment or estimate default 45km per day exploration
    const distanceKm = day.travelSegment?.distanceKm || 45;
    totalDistanceKm += distanceKm;

    const chosenModeId = segmentOverrides[day.dayNumber] || globalTransitMode;
    const chosenMode = TRANSIT_MODES[chosenModeId] || TRANSIT_MODES.diesel_suv;

    const segmentCarbonGrams = distanceKm * chosenMode.emissionFactorGramsPerKm;
    const segmentBaselineGrams = distanceKm * baselineMode.emissionFactorGramsPerKm;

    totalCarbonGrams += segmentCarbonGrams;
    baselineCarbonGrams += segmentBaselineGrams;

    const origin = day.travelSegment?.originName || (index === 0 ? 'Starting Point' : `Day ${index}`);
    const dest = day.travelSegment?.destinationName || day.destinationName;

    const alternative = findSustainableRouteAlternative(origin, dest, distanceKm, chosenModeId);

    const segCarbonKg = Number((segmentCarbonGrams / 1000).toFixed(1));
    const segBaseKg = Number((segmentBaselineGrams / 1000).toFixed(1));
    const segSaveKg = Number(Math.max(0, segBaseKg - segCarbonKg).toFixed(1));
    const segSavePct = segBaseKg > 0 ? Math.round((segSaveKg / segBaseKg) * 100) : 0;

    segmentBreakdowns.push({
      dayNumber: day.dayNumber,
      originName: origin,
      destinationName: dest,
      distanceKm,
      currentMode: chosenMode,
      carbonKg: segCarbonKg,
      baselineCarbonKg: segBaseKg,
      savingsCarbonKg: segSaveKg,
      savingsPercent: segSavePct,
      recommendedAlternative: alternative,
    });

    if (alternative && alternative.savingsCarbonKg > 0) {
      sustainableRecommendations.push({
        dayNumber: day.dayNumber,
        routeLabel: `${origin} → ${dest}`,
        originName: origin,
        destinationName: dest,
        distanceKm,
        currentModeId: chosenModeId,
        currentCarbonKg: segCarbonKg,
        suggestedAlternative: alternative,
      });
    }
  });

  const totalCarbonKg = Number(((totalCarbonGrams * guests) / 1000).toFixed(1));
  const baselineCarbonKg = Number(((baselineCarbonGrams * guests) / 1000).toFixed(1));
  const carbonPerPersonKg = Number((totalCarbonGrams / 1000).toFixed(1));
  const savingsCarbonKg = Number(Math.max(0, baselineCarbonKg - totalCarbonKg).toFixed(1));
  const savingsPercentage = baselineCarbonKg > 0 ? Math.round((savingsCarbonKg / baselineCarbonKg) * 100) : 0;

  // 1 mature Sal / Teak tree in Jharkhand forests absorbs ~22 kg CO2 per year
  const treesEquivalent = Number((savingsCarbonKg / 22).toFixed(1));

  // Determine Eco-Rating
  let ecoRating: 'gold' | 'silver' | 'bronze' | 'high_carbon' = 'high_carbon';
  let ecoRatingLabel = 'High Carbon Footprint';
  let ecoRatingDescription = 'Travel relies heavily on fossil fuel private vehicles. Consider switching routes to train or EV.';

  if (savingsPercentage >= 65 || carbonPerPersonKg <= 12) {
    ecoRating = 'gold';
    ecoRatingLabel = '🌿 Gold Eco-Traveler (Green Hero)';
    ecoRatingDescription = 'Outstanding low-carbon itinerary! You are utilizing high-efficiency electric or public transit.';
  } else if (savingsPercentage >= 40 || carbonPerPersonKg <= 25) {
    ecoRating = 'silver';
    ecoRatingLabel = '🍃 Silver Sustainable Route';
    ecoRatingDescription = 'Great eco-conscious choices with significant carbon savings across key circuits.';
  } else if (savingsPercentage >= 15 || carbonPerPersonKg <= 40) {
    ecoRating = 'bronze';
    ecoRatingLabel = '🌱 Bronze Eco-Pledge';
    ecoRatingDescription = 'Moderate carbon footprint. Check suggested alternatives below to reduce emissions further.';
  }

  return {
    totalDistanceKm,
    totalCarbonKg,
    carbonPerPersonKg,
    baselineCarbonKg,
    savingsCarbonKg,
    savingsPercentage,
    treesEquivalent,
    ecoRating,
    ecoRatingLabel,
    ecoRatingDescription,
    guestCount: guests,
    activeTransitMode: globalTransitMode,
    segmentBreakdowns,
    sustainableRecommendations,
  };
}
