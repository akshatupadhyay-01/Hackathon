import { GoogleGenAI, Type } from '@google/genai';
import { ItineraryRequest, ItineraryResponse, ItineraryDayPlan } from '../types/index';
import { SEED_DESTINATIONS, SEED_GUIDES, SEED_VENDORS } from '../data/jharkhand';
import { sanitizePromptInput, sanitizeStringList, redactSecrets, safeLogger, SECURITY_LIMITS } from '../lib/security';

export async function generateItinerary(
  reqBody: Partial<ItineraryRequest>,
  supabaseClient?: any
): Promise<ItineraryResponse> {
  // 1. Sanitize & validate inputs (SSDI, Prompt Injection & LPDOS bounds)
  const days = Math.max(1, Math.min(SECURITY_LIMITS.MAX_ITINERARY_DAYS, Math.floor(Number(reqBody.days) || 3)));
  const rawBudget = Number(reqBody.budget) || 12000;
  const budget = Math.max(SECURITY_LIMITS.MIN_BUDGET_INR, Math.min(SECURITY_LIMITS.MAX_BUDGET_INR, rawBudget));
  const guests = Math.max(1, Math.min(SECURITY_LIMITS.MAX_ITINERARY_GUESTS, Math.floor(Number(reqBody.guests) || 2)));
  
  // Sanitize strings & lists to defeat SSDI / Prompt Delimiter breakout
  const startingLocation = sanitizePromptInput(reqBody.startingLocation || 'Ranchi', 50) || 'Ranchi';
  
  const rawInterests = Array.isArray(reqBody.interests) && reqBody.interests.length > 0
    ? reqBody.interests
    : ['Eco Tourism', 'Waterfalls', 'Tribal Heritage'];
  const interests = sanitizeStringList(rawInterests, 6, 30);

  // Whitelist travel groups to prevent injection
  const allowedGroups = ['solo', 'couple', 'family', 'friends', 'business'];
  const rawGroup = typeof reqBody.travelGroup === 'string' ? reqBody.travelGroup.toLowerCase().trim() : '';
  const travelGroup = allowedGroups.includes(rawGroup)
    ? rawGroup
    : (guests === 1 ? 'solo' : guests === 2 ? 'couple' : 'family');

  // Whitelist tourism types
  const allowedTypes = ['all', 'waterfalls', 'wildlife_eco', 'spiritual', 'adventure', 'culture_heritage'];
  const rawType = typeof reqBody.tourismType === 'string' ? reqBody.tourismType.toLowerCase().trim() : '';
  const tourismType = allowedTypes.includes(rawType) ? rawType : 'all';

  // 2. Fetch real destinations from database or fallback catalog
  let destinations = SEED_DESTINATIONS;
  let guides = SEED_GUIDES;
  let vendors = SEED_VENDORS;

  if (supabaseClient) {
    try {
      const { data: dbDests, error } = await supabaseClient
        .from('destinations')
        .select('*, district:districts(*), category:categories(*)');
      if (!error && dbDests && dbDests.length > 0) {
        destinations = dbDests;
      }
    } catch {
      // Use SEED_DESTINATIONS fallback
    }
  }

  // Destination mapping dictionary for fast matching
  const destinationMap = new Map<string, typeof destinations[0]>();
  const destinationListText: string[] = [];

  destinations.forEach((d) => {
    destinationMap.set(d.id.toLowerCase(), d);
    destinationMap.set(d.name.toLowerCase().trim(), d);
    destinationMap.set(d.slug.toLowerCase().trim(), d);

    destinationListText.push(
      `- ID: "${d.id}" | Name: "${d.name}" | District: "${d.district?.name || 'Jharkhand'}" | Category: "${d.category?.name || 'Nature'}" | Entry Fee: ₹${d.entry_fee_inr} | Best Season: "${d.best_time_to_visit || 'Oct-Mar'}" | Eco Guidelines: "${d.eco_guidelines || ''}" | Highlights: ${d.tags ? d.tags.join(', ') : ''}`
    );
  });

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are the official Senior Eco-Tourism AI Planner for the Government of Jharkhand Tourism Initiative.
Your task is to create a realistic, well-paced, sustainable ${days}-day travel itinerary for a tourist across Jharkhand.

TRAVEL REQUEST:
- Trip Duration: ${days} days
- Approximate Budget: ₹${budget} INR total
- Number of Guests: ${guests}
- Starting Location / Hub: ${startingLocation}
- Primary Interests: ${interests.join(', ')}
- Travel Group: ${travelGroup}
- Tourism Preference: ${tourismType}

REAL ROAD GEOGRAPHY & TRAVEL CONSTRAINTS:
- Do NOT plan impossible schedules that ignore road travel time.
- Jharkhand highway road travel speeds range between 35-50 km/h due to hilly plateau terrain and ghat passes.
- Distances & travel estimates between major hubs:
  * Ranchi <-> Betla National Park: ~165 km (approx 4h 30m driving)
  * Betla National Park <-> Netarhat: ~115 km (approx 3h driving through scenic forests)
  * Ranchi <-> Hundru Falls: ~45 km (approx 1h 15m driving)
  * Ranchi <-> Jonha Falls: ~40 km (approx 1h 10m driving)
  * Ranchi <-> Patratu Valley: ~35 km (approx 1h driving via scenic ghat curves)
  * Ranchi <-> Parasnath (Shikharji): ~160 km (approx 4h driving)
  * Ranchi <-> Baidyanath Dham (Deoghar): ~250 km (approx 5h 30m driving)
  * Ranchi <-> Saranda Forest (Kiriburu): ~200 km (approx 5h driving)
- Arrange consecutive days along logical geographical circuits:
  * Palamu/Latehar Circuit: Betla National Park + Netarhat Sunset Point
  * Ranchi Waterfalls & Valleys Circuit: Hundru Falls, Jonha Falls, Patratu Valley
  * North Chotanagpur & Pilgrimage: Parasnath Hills, Hazaribagh
  * Santhal Pargana: Baba Baidyanath Dham, Massanjore Dam
  * Kolhan Wilderness: Saranda Forest
- When travel between destinations takes 3+ hours, allocate the morning for scenic travel, midday/afternoon for check-in and destination exploration, and evening for local tribal culture or sunset views. Do NOT pack more than 1 primary destination per day unless they are neighboring spots.

CRITICAL RULES:
1. You MUST ONLY select destinations from the following list of real Jharkhand locations. Do NOT invent fictional destinations or fake IDs.
2. For every day, assign the EXACT "destinationId" and "destinationName" from this authorized list:
${destinationListText.join('\n')}

3. Each day must include:
   - dayNumber (1 to ${days})
   - title (creative title highlighting the day's route and travel)
   - destinationId (the exact ID string from above)
   - destinationName (the exact name string from above)
   - activities (3 distinct realistic activities: morning/arrival, afternoon nature trail, evening local artisan interaction)
   - suggestedListingIds (array containing destinationId)
   - suggestedVendorNames (recommended local crafts or homestays e.g. "Malhor Dokra Brass Collective", "Sohrai Tribal Women Co-op", "Netarhat Sal Grove Homestay")
   - estimatedBudget (portion of budget in INR for that day's food, transit, entry, local guide)
   - travelNotes (eco-tourism advisory, road transit tip, zero-waste rule)

4. Ensure totalEstimatedBudget matches the sum of the daily budgets and stays close to ₹${budget}.
5. Provide actionable responsibleTourismNotes highlighting zero-plastic travel, supporting tribal artisans, and hiring certified local guides.`;

      let response: any = null;
      const modelCandidates = ['gemini-3.7-flash', 'gemini-3.6-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
      for (const candidateModel of modelCandidates) {
        try {
          response = await ai.models.generateContent({
            model: candidateModel,
            contents: prompt,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  summary: { type: Type.STRING },
                  totalEstimatedBudget: { type: Type.INTEGER },
                  responsibleTourismNotes: { type: Type.STRING },
                  days: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        dayNumber: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        destinationId: { type: Type.STRING },
                        destinationName: { type: Type.STRING },
                        activities: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        suggestedListingIds: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        suggestedVendorNames: {
                          type: Type.ARRAY,
                          items: { type: Type.STRING },
                        },
                        estimatedBudget: { type: Type.INTEGER },
                        travelNotes: { type: Type.STRING },
                      },
                      required: ['dayNumber', 'title', 'destinationName', 'activities', 'estimatedBudget'],
                    },
                  },
                },
                required: ['title', 'summary', 'totalEstimatedBudget', 'days', 'responsibleTourismNotes'],
              },
            },
          });
          if (response && response.text) {
            break;
          }
        } catch (candidateErr) {
          safeLogger.warn(`Model ${candidateModel} call failed, trying next candidate:`, candidateErr);
        }
      }

      if (response && response.text) {
        const parsed = JSON.parse(response.text) as Partial<ItineraryResponse>;

        if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
          // Validate and sanitize each day against actual database records
          const validatedDays: ItineraryDayPlan[] = parsed.days.map((dayPlan, index) => {
            const rawId = (dayPlan.destinationId || '').toLowerCase().trim();
            const rawName = (dayPlan.destinationName || '').toLowerCase().trim();

            let matchedDest = destinationMap.get(rawId) || destinationMap.get(rawName);

            // Fuzzy match by name inclusion if exact key not found
            if (!matchedDest) {
              matchedDest = destinations.find(
                (d) =>
                  rawName.includes(d.name.toLowerCase()) ||
                  d.name.toLowerCase().includes(rawName) ||
                  d.slug.toLowerCase().includes(rawName)
              );
            }

            // Fallback to indexed destination if still not found
            if (!matchedDest) {
              matchedDest = destinations[index % destinations.length];
            }

            const dailyBudget = Math.max(
              500,
              Number(dayPlan.estimatedBudget) || Math.round(budget / days)
            );

            return {
              dayNumber: index + 1,
              title: dayPlan.title || `Day ${index + 1}: ${matchedDest.name}`,
              destinationId: matchedDest.id,
              destinationName: matchedDest.name,
              activities: Array.isArray(dayPlan.activities) && dayPlan.activities.length > 0
                ? dayPlan.activities
                : [
                    `Morning nature trail and photography at ${matchedDest.name}`,
                    `Guided eco-exploration and cultural folklore session with native guide`,
                    `Evening artisan craft immersion and regional dinner at village cooperative`,
                  ],
              suggestedListingIds: [matchedDest.id],
              suggestedVendorNames: Array.isArray(dayPlan.suggestedVendorNames) && dayPlan.suggestedVendorNames.length > 0
                ? dayPlan.suggestedVendorNames
                : ['Local Dokra & Sohrai Artisan Guild', 'Tribal Eco Homestay'],
              estimatedBudget: dailyBudget,
              travelNotes:
                dayPlan.travelNotes ||
                `Carry reusable water bottles and respect local sacred grove traditions at ${matchedDest.name}.`,
            };
          });

          // Ensure exactly the requested number of days
          let finalDays = validatedDays;
          if (finalDays.length > days) {
            finalDays = finalDays.slice(0, days);
          } else if (finalDays.length < days) {
            for (let i = finalDays.length; i < days; i++) {
              const extraDest = destinations[i % destinations.length];
              finalDays.push({
                dayNumber: i + 1,
                title: `Day ${i + 1}: Discover ${extraDest.name}`,
                destinationId: extraDest.id,
                destinationName: extraDest.name,
                activities: [
                  `Morning heritage trek around ${extraDest.name}`,
                  `Afternoon wildlife and eco-observation session`,
                  `Sunset panoramic viewpoint and indigenous dinner`,
                ],
                suggestedListingIds: [extraDest.id],
                suggestedVendorNames: ['Sohrai Village Collective'],
                estimatedBudget: Math.round(budget / days),
                travelNotes: 'Practice Leave No Trace principles throughout your journey.',
              });
            }
          }

          const computedTotalBudget = finalDays.reduce((acc, curr) => acc + curr.estimatedBudget, 0);

          return {
            title: parsed.title || `${days}-Day Sustainable Jharkhand Green Circuit`,
            summary:
              parsed.summary ||
              `A customized ${days}-day eco-conscious travel itinerary covering top heritage and nature wonders starting from ${startingLocation}.`,
            totalEstimatedBudget: computedTotalBudget || budget,
            days: finalDays,
            responsibleTourismNotes:
              parsed.responsibleTourismNotes ||
              'Support local tribal economies by purchasing authentic GI-tagged Sohrai art and hiring certified native guides.',
            source: 'gemini',
          };
        }
      }
    } catch (geminiError) {
      safeLogger.warn('Gemini API execution error, falling back to database rule-based planner:', geminiError);
    }
  }

  // 3. Fallback Planner (source: "mock") using real database destination records
  return buildRuleBasedItinerary(days, budget, startingLocation, interests, travelGroup, tourismType, destinations);
}

function buildRuleBasedItinerary(
  days: number,
  budget: number,
  startingLocation: string,
  interests: string[],
  travelGroup: string,
  tourismType: string,
  destinations: typeof SEED_DESTINATIONS
): ItineraryResponse {
  // Filter destinations based on interests/tourismType if possible
  let filtered = [...destinations];

  if (tourismType === 'waterfalls') {
    filtered = destinations.filter((d) => d.category?.slug === 'waterfalls');
  } else if (tourismType === 'wildlife_eco') {
    filtered = destinations.filter((d) => d.category?.slug === 'wildlife_eco');
  } else if (tourismType === 'spiritual') {
    filtered = destinations.filter((d) => d.category?.slug === 'sacred_temples');
  } else if (tourismType === 'adventure') {
    filtered = destinations.filter((d) => d.tags.some((t) => /trek|hills|safari/i.test(t)));
  }

  if (filtered.length < days) {
    filtered = destinations;
  }

  const dailyBudget = Math.round(budget / days);
  const dayPlans: ItineraryDayPlan[] = [];

  for (let i = 0; i < days; i++) {
    const dest = filtered[i % filtered.length];
    dayPlans.push({
      dayNumber: i + 1,
      title: `Day ${i + 1}: ${dest.name} & Surrounds`,
      destinationId: dest.id,
      destinationName: dest.name,
      activities: [
        `Morning exploration and photography at ${dest.name}`,
        `Cultural discovery: ${dest.cultural_significance || 'Learn about local tribal ecology and historical heritage'}`,
        `Evening handicraft workshop visit and dinner at local cooperative`,
      ],
      suggestedListingIds: [dest.id],
      suggestedVendorNames: ['Sohrai & Kohbar Tribal Women Co-op', 'Malhor Dokra Art Collective'],
      estimatedBudget: dailyBudget,
      travelNotes: dest.eco_guidelines || 'Strict zero-plastic zone. Hire a certified native guide for the best experience.',
    });
  }

  return {
    title: `${days}-Day ${tourismType === 'all' ? 'Jharkhand Highlights' : tourismType.toUpperCase()} Eco Circuit`,
    summary: `Curated sustainable ${days}-day travel plan starting from ${startingLocation}, designed for ${travelGroup} travelers focusing on ${interests.slice(0, 2).join(' & ')}.`,
    totalEstimatedBudget: dailyBudget * days,
    days: dayPlans,
    responsibleTourismNotes:
      'Always support local livelihood by utilizing certified tribal guides and patronizing verified GI-tagged handicraft artisans.',
    source: 'mock',
  };
}
