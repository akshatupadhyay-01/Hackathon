import { Destination, District, Category, Vendor, LocalGuide } from '../types/database';
import { SEED_DESTINATIONS, SEED_DISTRICTS, SEED_CATEGORIES, SEED_GUIDES, SEED_VENDORS } from '../data/jharkhand';
import { VERIFIED_JHARKHAND_VENDORS, LocalVendor } from './localVendors';
import { getStoredBookings } from './destinations';

export type GovCrowdStatus = 'HIGH' | 'MEDIUM' | 'LOW';

export interface GovCrowdConfig {
  status: GovCrowdStatus;
  label: string;
  dotColor: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  hexColor: string;
  markerColor: string;
  meaning: string;
  footfallDescription: string;
}

export const GOV_CROWD_CONFIGS: Record<GovCrowdStatus, GovCrowdConfig> = {
  HIGH: {
    status: 'HIGH',
    label: 'High Crowd',
    dotColor: 'bg-red-600',
    badgeBg: 'bg-red-50 dark:bg-red-950/60',
    badgeText: 'text-red-700 dark:text-red-300',
    badgeBorder: 'border-red-300 dark:border-red-800',
    hexColor: '#dc2626',
    markerColor: '#ef4444',
    meaning: 'High tourist footfall, high visitor pressure, potential overcrowding',
    footfallDescription: 'Exceeding 80% seasonal carrying capacity. Active queue & traffic management recommended.',
  },
  MEDIUM: {
    status: 'MEDIUM',
    label: 'Medium Crowd',
    dotColor: 'bg-emerald-600',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-300 dark:border-emerald-800',
    hexColor: '#16a34a',
    markerColor: '#10b981',
    meaning: 'Moderate tourist footfall, manageable visitor pressure',
    footfallDescription: 'Within optimal sustainable carrying capacity (40% - 75%). Healthy tourist flow.',
  },
  LOW: {
    status: 'LOW',
    label: 'Low Crowd',
    dotColor: 'bg-amber-600',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/60',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-300 dark:border-amber-700',
    hexColor: '#d97706',
    markerColor: '#f59e0b',
    meaning: 'Low tourist footfall, underutilized tourism potential',
    footfallDescription: 'Under 35% seasonal carrying capacity. High potential for targeted marketing & circuit promotion.',
  },
};

/**
 * Maps raw database crowd level to standardized Government Dashboard Crowd Status:
 * - 'high' | 'peak' => HIGH (Red)
 * - 'moderate' => MEDIUM (Green)
 * - 'low' => LOW (Dark Yellow)
 */
export function getGovCrowdStatus(rawCrowd: string | undefined): GovCrowdStatus {
  if (!rawCrowd) return 'MEDIUM';
  const lower = rawCrowd.toLowerCase();
  if (lower === 'high' || lower === 'peak') return 'HIGH';
  if (lower === 'moderate' || lower === 'medium') return 'MEDIUM';
  return 'LOW';
}

export interface UnderutilizedOpportunity {
  destination: Destination;
  opportunityScore: number; // 0 - 100
  keyEcoAdvantage: string;
  carryingCapacityHeadroom: string;
  nearbyCongestedHub: string;
  diversionPotential: string;
  suggestedAction: string;
  infrastructureStatus: 'Ready' | 'Needs Road Signage' | 'Requires Homestay Expansion' | 'Needs Telecom Tower';
}

export interface SpendingCategoryInsight {
  id: string;
  category: string;
  estimatedSpendMonthlyInr: number;
  percentage: number;
  icon: string;
  avgPerTouristInr: number;
  description: string;
  localBeneficiaries: string;
}

export interface LocalEconomicImpactSummary {
  totalEstimatedMonthlySpendInr: number;
  directLocalRetentionPercentage: number;
  verifiedVendorsBenefited: number;
  tribalArtisansSupported: number;
  homestaysActive: number;
  certifiedGuidesEngaged: number;
  ecoPassRevenueGeneratedInr: number;
  carbonOffsetKg: number;
}

export interface ComplaintRecord {
  id: string;
  districtId: string;
  districtName: string;
  destinationName: string;
  category: 'Safety & Signage' | 'Sanitation & Cleanliness' | 'Transport & Roads' | 'Basic Amenities' | 'Overcrowding' | 'Accommodation & Pricing' | 'Other';
  severity: 'Critical' | 'Moderate' | 'Minor';
  summary: string;
  reportedDate: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  resolutionAction: string;
}

export interface RecommendedGovAction {
  id: string;
  title: string;
  category: 'HIGH CROWD DIVERSION' | 'UNDERUTILIZED PROMOTION' | 'COMPLAINTS & SANITATION' | 'LOCAL ECONOMY & VENDORS';
  urgency: 'Immediate' | 'Medium Priority' | 'Strategic Policy';
  affectedDestinations: string[];
  district: string;
  triggerSignal: string;
  recommendedIntervention: string;
  expectedOutcome: string;
}

export interface DistrictIntelligenceRecord {
  district: District;
  destinationCount: number;
  crowdBreakdown: { high: number; medium: number; low: number };
  activeVendorsCount: number;
  activeGuidesCount: number;
  complaintCount: number;
  estimatedMonthlyFootfall: number;
  estimatedEconomicImpactInr: number;
  primaryStrategicFocus: string;
  statusBadge: { label: string; color: string };
}

export interface DestinationIntelligenceRecord {
  destination: Destination;
  crowdStatus: GovCrowdStatus;
  crowdConfig: GovCrowdConfig;
  estimatedMonthlyFootfall: number;
  estimatedTouristSpendInr: number;
  complaintCount: number;
  complaintSeverity: 'Low' | 'Moderate' | 'High';
  activeVendorsNearCount: number;
  opportunityLevel: 'High Opportunity' | 'Balanced Flow' | 'High Congestion';
  recommendedGovAction: string;
}

/**
 * Top KPIs: Tourism Pulse
 */
export function getTourismPulseMetrics(destinations: Destination[] = SEED_DESTINATIONS) {
  const highCount = destinations.filter((d) => getGovCrowdStatus(d.crowd_status) === 'HIGH').length;
  const medCount = destinations.filter((d) => getGovCrowdStatus(d.crowd_status) === 'MEDIUM').length;
  const lowCount = destinations.filter((d) => getGovCrowdStatus(d.crowd_status) === 'LOW').length;

  const totalDestinations = destinations.length;
  const activeVendorsCount = VERIFIED_JHARKHAND_VENDORS.length;
  const activeGuidesCount = SEED_GUIDES.length;

  // Estimated Footfall based on review count & crowd multiplier (Demo calculation)
  const estimatedMonthlyFootfall = destinations.reduce((sum, d) => {
    const base = d.review_count * 150;
    const mult = getGovCrowdStatus(d.crowd_status) === 'HIGH' ? 1.8 : getGovCrowdStatus(d.crowd_status) === 'MEDIUM' ? 1.2 : 0.7;
    return sum + Math.round(base * mult);
  }, 0);

  // Estimated Monthly Spend based on average spend of ₹2,200 per eco-tourist
  const estimatedMonthlySpendInr = estimatedMonthlyFootfall * 2150;

  // Complaint count (from demo complaint dataset)
  const complaints = getDemoComplaints();
  const openComplaints = complaints.filter((c) => c.status !== 'Resolved').length;

  return {
    totalDestinations,
    highCrowdDestinations: highCount,
    mediumCrowdDestinations: medCount,
    lowCrowdDestinations: lowCount,
    estimatedMonthlyFootfall,
    estimatedMonthlySpendInr,
    activeVendorsCount,
    activeGuidesCount,
    totalComplaints: complaints.length,
    openComplaints,
    resolvedComplaints: complaints.length - openComplaints,
  };
}

/**
 * WOW FEATURE #2: Underutilized Destination Detector
 */
export function getUnderutilizedDestinations(destinations: Destination[] = SEED_DESTINATIONS): UnderutilizedOpportunity[] {
  const lowCrowdDestinations = destinations.filter(
    (d) => getGovCrowdStatus(d.crowd_status) === 'LOW'
  );

  return lowCrowdDestinations.map((d) => {
    let keyAdvantage = 'Untouched natural biodiversity with zero commercial noise';
    let capacityHeadroom = '72% available visitor headroom before reaching conservation limits';
    let nearbyCongested = 'Hundru Falls & Ranchi Waterfalls Circuit';
    let diversionPotential = 'High diversion potential during holiday weekends';
    let suggestedAction = 'Feature as alternate tranquil circuit on AI Trip Planner with eco-pass priority discount.';
    let infra: UnderutilizedOpportunity['infrastructureStatus'] = 'Ready';
    let oppScore = 88;

    if (d.slug.includes('netarhat')) {
      keyAdvantage = 'High-altitude sunset and sunrise vistas with colonial forest bungalows';
      capacityHeadroom = '68% capacity headroom. Ideal for quiet eco-stays and stargazing';
      nearbyCongested = 'Betla Safari Peak Queues';
      diversionPotential = 'Can absorb 400+ overnight weekend visitors from Betla overflow';
      suggestedAction = 'Promote 2-Day "Sal Forest & Sunset" twin-circuit connecting Betla & Netarhat with solar shuttle vans.';
      infra = 'Ready';
      oppScore = 94;
    } else if (d.slug.includes('saranda')) {
      keyAdvantage = 'Asia\'s largest sal forest canopy (820 sq km) with indigenous Ho tribal guides';
      capacityHeadroom = '85% capacity headroom. Pristine sanctuary suited for guided ethnobotany';
      nearbyCongested = 'Deoghar Pilgrimage & Ranchi City Trails';
      diversionPotential = 'Attracts high-value eco-researchers, birders, and wilderness trekkers';
      suggestedAction = 'Establish 5 new verified community homestays in Kiriburu and promote certified tribal guide bookings.';
      infra = 'Requires Homestay Expansion';
      oppScore = 91;
    } else if (d.slug.includes('jonha')) {
      keyAdvantage = 'Historic Gautamdhara Buddhist shrine and stepped valley cascades';
      capacityHeadroom = '55% capacity headroom on weekdays; moderate on Sundays';
      nearbyCongested = 'Hundru Falls (overcrowded on peak weekends)';
      diversionPotential = 'Immediate 25-minute diversion corridor from Hundru traffic jam point';
      suggestedAction = 'Deploy electronic dynamic signage on Ranchi-Purulia Highway diverting traffic to Jonha and Sita Falls.';
      infra = 'Needs Road Signage';
      oppScore = 86;
    }

    return {
      destination: d,
      opportunityScore: oppScore,
      keyEcoAdvantage: keyAdvantage,
      carryingCapacityHeadroom: capacityHeadroom,
      nearbyCongestedHub: nearbyCongested,
      diversionPotential,
      suggestedAction,
      infrastructureStatus: infra,
    };
  });
}

/**
 * WOW FEATURE #3: Tourist Spending & Local Economic Impact
 */
export function getTouristSpendingBreakdown(totalSpendInr: number = 38400000): {
  spendingCategories: SpendingCategoryInsight[];
  economicImpact: LocalEconomicImpactSummary;
} {
  const categories: SpendingCategoryInsight[] = [
    {
      id: 'spend-homestay',
      category: 'Eco-Homestays & Forest Lodges',
      estimatedSpendMonthlyInr: Math.round(totalSpendInr * 0.34),
      percentage: 34,
      icon: '🏡',
      avgPerTouristInr: 780,
      description: 'Stays at community-run cottages, JTDCL tourist lodges, and forest rest houses.',
      localBeneficiaries: '18 village homestay cooperatives across Netarhat, Betla, and Saranda',
    },
    {
      id: 'spend-food',
      category: 'Local Food, Sweets & Tea Stalls',
      estimatedSpendMonthlyInr: Math.round(totalSpendInr * 0.23),
      percentage: 23,
      icon: '🍲',
      avgPerTouristInr: 520,
      description: 'Authentic Dhuska, Marua Roti thali, Deoghar Peda, and scenic hill tea stalls.',
      localBeneficiaries: '75+ registered street food vendors and small family kitchens',
    },
    {
      id: 'spend-crafts',
      category: 'Tribal Handicrafts & Art Guilds',
      estimatedSpendMonthlyInr: Math.round(totalSpendInr * 0.18),
      percentage: 18,
      icon: '🎨',
      avgPerTouristInr: 410,
      description: 'Malhor Dokra brass art, Sohrai paintings, terracotta, and bamboo baskets.',
      localBeneficiaries: '120+ indigenous artisan households across Hazaribagh and Singhbhum',
    },
    {
      id: 'spend-guides',
      category: 'Certified Tribal Guides & Treks',
      estimatedSpendMonthlyInr: Math.round(totalSpendInr * 0.13),
      percentage: 13,
      icon: '🥾',
      avgPerTouristInr: 290,
      description: 'Daily guiding fees for wildlife tracking, mountain trails, and sacred grove treks.',
      localBeneficiaries: '46 certified native guides with direct digital QR payouts',
    },
    {
      id: 'spend-transport',
      category: 'Local Transit, E-rickshaws & Safaris',
      estimatedSpendMonthlyInr: Math.round(totalSpendInr * 0.12),
      percentage: 12,
      icon: '🚐',
      avgPerTouristInr: 270,
      description: 'Safari jeep bookings, lake boating at Patratu, and rural transit shuttles.',
      localBeneficiaries: 'Local driver collectives and eco-boating operators',
    },
  ];

  const economicImpact: LocalEconomicImpactSummary = {
    totalEstimatedMonthlySpendInr: totalSpendInr,
    directLocalRetentionPercentage: 81, // 81% remains within village economies
    verifiedVendorsBenefited: VERIFIED_JHARKHAND_VENDORS.length + 32,
    tribalArtisansSupported: 148,
    homestaysActive: 22,
    certifiedGuidesEngaged: SEED_GUIDES.length + 14,
    ecoPassRevenueGeneratedInr: 1842 * 120,
    carbonOffsetKg: 12400,
  };

  return { spendingCategories: categories, economicImpact };
}

/**
 * WOW FEATURE #4: Tourist Complaint Intelligence (Demo Dataset)
 */
export function getDemoComplaints(): ComplaintRecord[] {
  return [
    {
      id: 'cmp-01',
      districtId: 'd1000000-0000-0000-0000-000000000001',
      districtName: 'Ranchi',
      destinationName: 'Hundru Falls',
      category: 'Sanitation & Cleanliness',
      severity: 'Critical',
      summary: 'Litter accumulation along stone stairway and overflow near viewpoint trash bins on Sunday evening.',
      reportedDate: '2026-08-18',
      status: 'In Progress',
      resolutionAction: 'Sanitation squad deployed; 4 new solar-compacting bins installed at mid-tier landing.',
    },
    {
      id: 'cmp-02',
      districtId: 'd1000000-0000-0000-0000-000000000004',
      districtName: 'Deoghar',
      destinationName: 'Baba Baidyanath Dham',
      category: 'Overcrowding',
      severity: 'Critical',
      summary: 'Long queue waiting times exceeding 3.5 hours during morning ritual hours near VIP gates.',
      reportedDate: '2026-08-17',
      status: 'In Progress',
      resolutionAction: 'Time-slotted digital eco-pass entry lanes reinforced with extra volunteer marshals.',
    },
    {
      id: 'cmp-03',
      districtId: 'd1000000-0000-0000-0000-000000000005',
      districtName: 'Ramgarh',
      destinationName: 'Patratu Valley & Dam',
      category: 'Transport & Roads',
      severity: 'Moderate',
      summary: 'Heavy roadside parking bottleneck near viewpoint hairpin bend #4 causing single-lane choke.',
      reportedDate: '2026-08-16',
      status: 'Resolved',
      resolutionAction: 'Traffic police barricaded shoulder parking and directed vehicles to the main lake complex.',
    },
    {
      id: 'cmp-04',
      districtId: 'd1000000-0000-0000-0000-000000000002',
      districtName: 'Latehar',
      destinationName: 'Betla National Park',
      category: 'Safety & Signage',
      severity: 'Moderate',
      summary: 'Faded warning boards regarding wild elephant crossing zones on the secondary approach road.',
      reportedDate: '2026-08-14',
      status: 'Resolved',
      resolutionAction: 'High-visibility retroreflective wildlife corridor signposts installed by Forest Dept.',
    },
    {
      id: 'cmp-05',
      districtId: 'd1000000-0000-0000-0000-000000000003',
      districtName: 'Giridih',
      destinationName: 'Parasnath Hills (Shikharji)',
      category: 'Basic Amenities',
      severity: 'Moderate',
      summary: 'Low water pressure at mid-hill eco-drinking water station #6 on the pilgrimage ascent.',
      reportedDate: '2026-08-12',
      status: 'Resolved',
      resolutionAction: 'Solar pump pressure valve repaired and RO filter cartridge replaced.',
    },
    {
      id: 'cmp-06',
      districtId: 'd1000000-0000-0000-0000-000000000006',
      districtName: 'West Singhbhum',
      destinationName: 'Saranda Forest & Kiriburu',
      category: 'Transport & Roads',
      severity: 'Minor',
      summary: 'Lack of cellular signal causing map navigation failure between Gua and Kiriburu viewpoint.',
      reportedDate: '2026-08-10',
      status: 'Open',
      resolutionAction: 'Recommended offline map downloads in applet & proposed BSNL 4G solar mast installation.',
    },
    {
      id: 'cmp-07',
      districtId: 'd1000000-0000-0000-0000-000000000007',
      districtName: 'Hazaribagh',
      destinationName: 'Hazaribagh Craft Village',
      category: 'Accommodation & Pricing',
      severity: 'Minor',
      summary: 'Unregistered third-party middlemen claiming exorbitant commissions on Dokra brass art pieces.',
      reportedDate: '2026-08-08',
      status: 'Resolved',
      resolutionAction: 'Govt QR price verification tags affixed to all authentic artisan stalls.',
    },
    {
      id: 'cmp-08',
      districtId: 'd1000000-0000-0000-0000-000000000001',
      districtName: 'Ranchi',
      destinationName: 'Jonha Falls',
      category: 'Basic Amenities',
      severity: 'Minor',
      summary: 'Restroom lock mechanism defective at upper ticket plaza.',
      reportedDate: '2026-08-05',
      status: 'Resolved',
      resolutionAction: 'Facility maintenance team repaired lock and sanitized washroom units.',
    },
  ];
}

/**
 * WOW FEATURE #5: AI / Smart Action Recommendations
 */
export function getRecommendedGovernmentActions(destinations: Destination[] = SEED_DESTINATIONS): RecommendedGovAction[] {
  return [
    {
      id: 'act-01',
      title: 'Active Tourist Diversion: Weekend Load-Balancing',
      category: 'HIGH CROWD DIVERSION',
      urgency: 'Immediate',
      affectedDestinations: ['Betla National Park', 'Hundru Falls', 'Netarhat Sunset Point'],
      district: 'Latehar & Ranchi',
      triggerSignal: '🔴 High Crowd Detected: Betla and Hundru operating at >90% visitor density while Netarhat has 68% surplus capacity.',
      recommendedIntervention: 'Dynamically prioritize Netarhat, Jonha, and Sita Falls in the AI Trip Planner algorithm. Offer a 20% eco-pass permit incentive for off-peak and alternate circuit bookings.',
      expectedOutcome: 'Redistribute ~2,500 weekend tourists across 3 districts, eliminating 45-minute parking bottlenecks at Hundru.',
    },
    {
      id: 'act-02',
      title: 'Targeted Promotion for Underutilized Biodiversity Sanctuary',
      category: 'UNDERUTILIZED PROMOTION',
      urgency: 'Medium Priority',
      affectedDestinations: ['Saranda Forest & Kiriburu Hills'],
      district: 'West Singhbhum',
      triggerSignal: '🟡 Low Crowd Detected: Saranda has pristine 820 sq km sal canopy but captures only 4% of total state ecotourism footfall.',
      recommendedIntervention: 'Launch targeted "Land of 700 Hills" nature & birdwatching digital guide campaign. Feature Ho indigenous guide profiles prominently on homepage discovery.',
      expectedOutcome: 'Boost sustainable eco-trekking by 35% without exceeding pristine forest carrying limits.',
    },
    {
      id: 'act-03',
      title: 'Sanitation & Waste Interceptor Deployment',
      category: 'COMPLAINTS & SANITATION',
      urgency: 'Immediate',
      affectedDestinations: ['Hundru Falls', 'Patratu Valley'],
      district: 'Ranchi & Ramgarh',
      triggerSignal: '⚠️ 42% of tourist complaints in Ranchi circuit cite plastic waste near plunge pool stairs and viewpoint food stalls.',
      recommendedIntervention: 'Deploy 6 solar-compacting waste stations and partner with local stall owners for a "Litter-Free Deposit Return" system with ₹10 refundable cup tokens.',
      expectedOutcome: 'Projected 80% reduction in plastic litter along the Subarnarekha riverfront and improved visitor satisfaction rating.',
    },
    {
      id: 'act-04',
      title: 'Direct Economic Integration: Artisan QR & Vendor Onboarding',
      category: 'LOCAL ECONOMY & VENDORS',
      urgency: 'Medium Priority',
      affectedDestinations: ['Hazaribagh Craft Village', 'Deoghar Pilgrim Corridor'],
      district: 'Hazaribagh & Deoghar',
      triggerSignal: '📈 Strong tourist demand for Dokra brass casting & Sohrai paintings, but 40% of micro-artisans lack direct digital payment visibility.',
      recommendedIntervention: 'Organize on-ground digital onboarding camps to issue official Tourism Board QR verification boards and include certified artisan stalls on interactive maps.',
      expectedOutcome: 'Direct revenue increase of ~₹14,000/month per artisan household by eliminating unauthorized middlemen.',
    },
  ];
}

/**
 * District-level Intelligence aggregation
 */
export function getDistrictIntelligenceData(
  districts: District[] = SEED_DISTRICTS,
  destinations: Destination[] = SEED_DESTINATIONS
): DistrictIntelligenceRecord[] {
  const complaints = getDemoComplaints();

  return districts.map((district) => {
    const dList = destinations.filter((d) => d.district_id === district.id);
    const vendors = VERIFIED_JHARKHAND_VENDORS.filter((v) =>
      v.district.toLowerCase().includes(district.name.toLowerCase())
    );
    const dComplaints = complaints.filter(
      (c) => c.districtId === district.id || c.districtName.toLowerCase() === district.name.toLowerCase()
    );

    const high = dList.filter((d) => getGovCrowdStatus(d.crowd_status) === 'HIGH').length;
    const medium = dList.filter((d) => getGovCrowdStatus(d.crowd_status) === 'MEDIUM').length;
    const low = dList.filter((d) => getGovCrowdStatus(d.crowd_status) === 'LOW').length;

    const footfall = dList.reduce((sum, d) => {
      const base = d.review_count * 160;
      const mult = getGovCrowdStatus(d.crowd_status) === 'HIGH' ? 1.7 : getGovCrowdStatus(d.crowd_status) === 'MEDIUM' ? 1.1 : 0.6;
      return sum + Math.round(base * mult);
    }, 0) || 12000;

    let focus = 'Sustain balanced eco-tourism and support local street food stalls.';
    let badge = { label: 'Optimal Flow', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' };

    if (high > 0 && high >= low) {
      focus = 'Heavy weekend congestion. Active traffic & crowd dispersal required.';
      badge = { label: '🔴 High Crowd Alert', color: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300' };
    } else if (low > 0 && high === 0) {
      focus = 'Underutilized high-potential eco-tourism zone. Priority for promotional campaigns.';
      badge = { label: '🟡 Opportunity Hub', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' };
    }

    return {
      district,
      destinationCount: dList.length,
      crowdBreakdown: { high, medium, low },
      activeVendorsCount: vendors.length || 3,
      activeGuidesCount: SEED_GUIDES.filter((g) => g.bio?.includes(district.name)).length || 2,
      complaintCount: dComplaints.length,
      estimatedMonthlyFootfall: footfall,
      estimatedEconomicImpactInr: Math.round(footfall * 2150),
      primaryStrategicFocus: focus,
      statusBadge: badge,
    };
  });
}

/**
 * Destination Intelligence Records for the Master Table
 */
export function getDestinationIntelligenceRecords(
  destinations: Destination[] = SEED_DESTINATIONS
): DestinationIntelligenceRecord[] {
  const complaints = getDemoComplaints();

  return destinations.map((d) => {
    const crowdStatus = getGovCrowdStatus(d.crowd_status);
    const crowdConfig = GOV_CROWD_CONFIGS[crowdStatus];

    const estFootfall = Math.round(
      d.review_count * (crowdStatus === 'HIGH' ? 240 : crowdStatus === 'MEDIUM' ? 160 : 90)
    );
    const estSpend = Math.round(estFootfall * 1950);

    const matchComplaints = complaints.filter(
      (c) => c.destinationName.toLowerCase().includes(d.name.toLowerCase()) || d.name.toLowerCase().includes(c.destinationName.toLowerCase())
    );

    const compCount = matchComplaints.length;
    const compSeverity: 'Low' | 'Moderate' | 'High' =
      compCount > 1 ? 'High' : compCount === 1 ? 'Moderate' : 'Low';

    const vendorsNear = VERIFIED_JHARKHAND_VENDORS.filter(
      (v) =>
        v.destinationName?.toLowerCase().includes(d.name.toLowerCase()) ||
        v.district.toLowerCase() === d.district?.name.toLowerCase()
    ).length;

    let opportunityLevel: 'High Opportunity' | 'Balanced Flow' | 'High Congestion' = 'Balanced Flow';
    let action = 'Monitor eco-carrying threshold and ensure digital permit verification.';

    if (crowdStatus === 'HIGH') {
      opportunityLevel = 'High Congestion';
      action = 'Implement time-slot queuing & route excess traffic to nearby sister falls/valleys.';
    } else if (crowdStatus === 'LOW') {
      opportunityLevel = 'High Opportunity';
      action = 'Enhance visibility in AI Trip Planner and expand verified homestay clusters.';
    }

    return {
      destination: d,
      crowdStatus,
      crowdConfig,
      estimatedMonthlyFootfall: estFootfall,
      estimatedTouristSpendInr: estSpend,
      complaintCount: compCount,
      complaintSeverity: compSeverity,
      activeVendorsNearCount: vendorsNear,
      opportunityLevel,
      recommendedGovAction: action,
    };
  });
}
