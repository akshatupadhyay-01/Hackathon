import { ItineraryRequest, ItineraryResponse, ItineraryDayPlan } from '../types/index';
import { SEED_DESTINATIONS } from '../data/jharkhand';
import { enrichItineraryWithTravelTimes } from './routing';

export async function requestItineraryPlan(request: ItineraryRequest): Promise<ItineraryResponse> {
  let basePlan: ItineraryResponse | null = null;

  try {
    const response = await fetch('/api/itinerary', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.ok) {
      const data: ItineraryResponse = await response.json();
      if (data && data.days && Array.isArray(data.days) && data.days.length > 0) {
        basePlan = data;
      }
    }
  } catch (netErr) {
    console.warn('Network call to /api/itinerary failed, using client-side resilient generator:', netErr);
  }

  // Graceful client-side fallback planner if API is down
  if (!basePlan) {
    basePlan = generateClientFallbackPlan(request);
  }

  // Enrich base itinerary with real OSRM road travel calculations, distances, and timeline
  try {
    const startLoc = request.startingLocationCoords || request.startingLocation || 'Ranchi';
    const enriched = await enrichItineraryWithTravelTimes(
      basePlan,
      startLoc,
      SEED_DESTINATIONS
    );
    return enriched;
  } catch (routingErr) {
    console.warn('Failed to enrich travel times:', routingErr);
    return basePlan;
  }
}

function generateClientFallbackPlan(req: ItineraryRequest): ItineraryResponse {
  const days = Math.max(1, Math.min(14, Math.floor(Number(req.days) || 3)));
  const budget = Math.max(1000, Number(req.budget) || 12000);
  const guests = Math.max(1, Math.min(50, Math.floor(Number(req.guests) || 2)));
  const startingLocation = req.startingLocation || (req.startingLocationCoords?.isGps ? 'Your Location' : 'Ranchi');
  const interests = req.interests || ['Eco Tourism', 'Waterfalls'];
  const travelGroup = req.travelGroup || (guests === 1 ? 'solo' : guests === 2 ? 'couple' : 'family');
  const tourismType = req.tourismType || 'all';

  // Smart Circuit Clustering for Jharkhand
  let filtered: typeof SEED_DESTINATIONS = [];

  if (tourismType === 'wildlife_eco' || (interests.some(i => /wildlife|safari/i.test(i)))) {
    filtered = SEED_DESTINATIONS.filter(d => ['betla-national-park', 'netarhat-sunset-point', 'saranda-forest-kiriburu'].includes(d.slug));
  } else if (tourismType === 'waterfalls' || (interests.some(i => /waterfall/i.test(i)))) {
    filtered = SEED_DESTINATIONS.filter(d => ['hundru-falls', 'jonha-falls', 'patratu-valley'].includes(d.slug));
  } else if (tourismType === 'sacred_temples' || tourismType === 'spiritual') {
    filtered = SEED_DESTINATIONS.filter(d => ['parasnath-hills-shikharji', 'baba-baidyanath-dham'].includes(d.slug));
  } else {
    filtered = [
      SEED_DESTINATIONS.find(d => d.slug === 'betla-national-park')!,
      SEED_DESTINATIONS.find(d => d.slug === 'netarhat-sunset-point')!,
      SEED_DESTINATIONS.find(d => d.slug === 'patratu-valley')!,
      SEED_DESTINATIONS.find(d => d.slug === 'hundru-falls')!,
      SEED_DESTINATIONS.find(d => d.slug === 'parasnath-hills-shikharji')!,
    ].filter(Boolean);
  }

  if (filtered.length === 0) {
    filtered = SEED_DESTINATIONS;
  }

  const dailyBudget = Math.round(budget / days);
  const dayPlans: ItineraryDayPlan[] = [];

  for (let i = 0; i < days; i++) {
    const dest = filtered[i % filtered.length];
    dayPlans.push({
      dayNumber: i + 1,
      title: `Day ${i + 1}: ${dest.name}`,
      destinationId: dest.id,
      destinationName: dest.name,
      activities: [
        `Morning travel & check-in, followed by guided nature trail at ${dest.name}`,
        `Afternoon exploration: ${dest.tagline || 'Experience local bio-diversity and eco heritage'}`,
        `Evening cultural exchange and organic dinner with tribal community hosts`,
      ],
      suggestedListingIds: [dest.id],
      suggestedVendorNames: ['Sohrai & Kohbar Women Guild', 'Dokra Brass Art Collective'],
      estimatedBudget: dailyBudget,
      travelNotes: dest.eco_guidelines || 'Strict zero-plastic zone. Support local tribal artisans.',
    });
  }

  return {
    title: `${days}-Day Sustainable Jharkhand Green Circuit`,
    summary: `Curated sustainable travel plan starting from ${startingLocation}, designed for ${travelGroup} travelers exploring ${interests.slice(0, 2).join(' & ')}.`,
    totalEstimatedBudget: dailyBudget * days,
    days: dayPlans,
    responsibleTourismNotes:
      'Practice Leave No Trace principles, support local homestays, and hire certified native guides.',
    source: 'mock',
  };
}
