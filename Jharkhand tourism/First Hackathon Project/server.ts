import express from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);
const HOST = '0.0.0.0';

// ============================================================================
// Security & Rate Limiting Helpers
// ============================================================================

function redactSecrets(message: string): string {
  if (typeof message !== 'string') return '';
  let sanitized = message;
  sanitized = sanitized.replace(/AIzaSy[A-Za-z0-9_-]{33}/g, 'AIzaSy[REDACTED_API_KEY]');
  sanitized = sanitized.replace(/Bearer\s+eyJ[A-Za-z0-9._-]+/gi, 'Bearer eyJ[REDACTED_TOKEN]');
  sanitized = sanitized.replace(/(api[_-]?key|secret|password|token)\s*[:=]\s*["']?([^"'\s&]+)["']?/gi, '$1=[REDACTED]');
  return sanitized;
}

function sanitizePromptInput(input: unknown, maxLength = 80): string {
  if (typeof input !== 'string') return '';
  let sanitized = input.trim().slice(0, maxLength);
  sanitized = sanitized.replace(/[\x00-\x1F\x7F`$\{\}]/g, ' ');
  const injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior|above)\s+instructions/i,
    /system\s*:\s*/i,
    /human\s*:\s*/i,
    /assistant\s*:\s*/i,
    /reveal\s+(api\s+)?(key|secret|password|token)/i,
  ];
  for (const pattern of injectionPatterns) {
    sanitized = sanitized.replace(pattern, '[filtered]');
  }
  return sanitized.replace(/\s+/g, ' ').trim();
}

function sanitizeStringList(items: unknown, maxItems = 10, maxItemLength = 40): string[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((item): item is string => typeof item === 'string')
    .map((item) => sanitizePromptInput(item, maxItemLength))
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

class SimpleRateLimiter {
  private requests: Map<string, number[]> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 30) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  isAllowed(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.requests.get(clientId) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      this.requests.set(clientId, validTimestamps);
      return false;
    }

    validTimestamps.push(now);
    this.requests.set(clientId, validTimestamps);

    if (this.requests.size > 5000) {
      for (const [key, tList] of this.requests.entries()) {
        const valid = tList.filter((t) => now - t < this.windowMs);
        if (valid.length === 0) {
          this.requests.delete(key);
        } else {
          this.requests.set(key, valid);
        }
      }
    }
    return true;
  }
}

const rateLimiter = new SimpleRateLimiter(60000, 30);

// ============================================================================
// Jharkhand Seed Data for Rule-Based Fallback & Prompt Grounding
// ============================================================================

const SEED_DESTINATIONS = [
  {
    id: 'dest-betla-01',
    name: 'Betla National Park',
    slug: 'betla-national-park',
    district: 'Latehar',
    category: 'Wildlife & Eco',
    entry_fee: 100,
    best_time: 'Nov - Apr',
    highlights: 'Tiger Reserve, Elephant Herds, 16th Century Chero Forts',
    guidelines: 'No plastic bottles inside reserve. Silence during safari.',
  },
  {
    id: 'dest-netarhat-02',
    name: 'Netarhat Queen of Chotanagpur',
    slug: 'netarhat-hills',
    district: 'Latehar',
    category: 'Hill Station',
    entry_fee: 50,
    best_time: 'Sep - Mar',
    highlights: 'Magnolia Sunset Point, Pine Forests, Koel Viewpoint',
    guidelines: 'Preserve pristine pine groves and silence at sunrise.',
  },
  {
    id: 'dest-hundru-03',
    name: 'Hundru Waterfalls',
    slug: 'hundru-falls',
    district: 'Ranchi',
    category: 'Waterfalls',
    entry_fee: 30,
    best_time: 'Jul - Feb',
    highlights: '98m Subarnarekha drop, rock pools, tribal tea stalls',
    guidelines: 'Do not cross safety railings near gorge lip.',
  },
  {
    id: 'dest-jonha-04',
    name: 'Jonha (Gautamdhara) Falls',
    slug: 'jonha-falls',
    district: 'Ranchi',
    category: 'Waterfalls',
    entry_fee: 30,
    best_time: 'Aug - Mar',
    highlights: '43m cascade, Buddhist Ashram, hanging bridge view',
    guidelines: 'Dispose organic trash in designated cane bins.',
  },
  {
    id: 'dest-patratu-05',
    name: 'Patratu Valley & Dam Lake',
    slug: 'patratu-valley',
    district: 'Ramgarh',
    category: 'Scenic Valley',
    entry_fee: 40,
    best_time: 'Oct - Mar',
    highlights: 'Winding hairpin ghat roads, boating island, sunset vista',
    guidelines: 'Maintain speed limits along curvy ghat sections.',
  },
  {
    id: 'dest-parasnath-06',
    name: 'Parasnath Hills (Shikharji)',
    slug: 'parasnath-shikharji',
    district: 'Giridih',
    category: 'Sacred Heritage',
    entry_fee: 0,
    best_time: 'Oct - Mar',
    highlights: 'Highest peak in Jharkhand (1365m), 20 Jain Tirthankara Shrines',
    guidelines: 'Strict vegetarian & non-leather pilgrimage trail.',
  },
  {
    id: 'dest-baidyanath-07',
    name: 'Baba Baidyanath Jyotirlinga Dham',
    slug: 'baba-baidyanath-dham',
    district: 'Deoghar',
    category: 'Spiritual',
    entry_fee: 0,
    best_time: 'All year',
    highlights: 'One of 12 sacred Jyotirlingas, ancient architectural complex',
    guidelines: 'Respect sanctum queues and cultural protocols.',
  },
  {
    id: 'dest-saranda-08',
    name: 'Saranda Forest (Land of 700 Hills)',
    slug: 'saranda-forest',
    district: 'West Singhbhum',
    category: 'Forest & Eco',
    entry_fee: 150,
    best_time: 'Nov - Apr',
    highlights: 'Asia’s largest Sal forest, flying squirrel habitat, Kiriburu sunset',
    guidelines: 'Enter only with certified indigenous Ho tribal guide.',
  },
];

// ============================================================================
// Itinerary Planner Engine
// ============================================================================

async function planItinerary(reqBody: any) {
  const days = Math.max(1, Math.min(14, Math.floor(Number(reqBody.days) || 3)));
  const budget = Math.max(500, Math.min(5000000, Number(reqBody.budget) || 12000));
  const guests = Math.max(1, Math.min(50, Math.floor(Number(reqBody.guests) || 2)));
  const startingLocation = sanitizePromptInput(reqBody.startingLocation || 'Ranchi', 50) || 'Ranchi';
  const interests = sanitizeStringList(reqBody.interests || ['Eco Tourism', 'Waterfalls'], 6, 30);
  const travelGroup = String(reqBody.travelGroup || 'family');
  const tourismType = String(reqBody.tourismType || 'all');

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY || process.env.VITE_GEMINI_API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const destinationListText = SEED_DESTINATIONS.map(
        (d) => `- ID: "${d.id}" | Name: "${d.name}" | District: "${d.district}" | Best Season: "${d.best_time}" | Highlights: ${d.highlights}`
      ).join('\n');

      const prompt = `You are the official Senior Eco-Tourism AI Planner for Jharkhand Tourism.
Create a realistic, sustainable ${days}-day itinerary across Jharkhand.
- Duration: ${days} days
- Budget: ₹${budget} INR total
- Guests: ${guests}
- Starting Location: ${startingLocation}
- Interests: ${interests.join(', ')}
- Travel Group: ${travelGroup}

Destinations available:
${destinationListText}

Return JSON with exact structure:
{
  "title": string,
  "summary": string,
  "totalEstimatedBudget": number,
  "responsibleTourismNotes": string,
  "days": [
    {
      "dayNumber": number,
      "title": string,
      "destinationId": string,
      "destinationName": string,
      "activities": string[],
      "suggestedListingIds": string[],
      "suggestedVendorNames": string[],
      "estimatedBudget": number,
      "travelNotes": string
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
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
                    activities: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedListingIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                    suggestedVendorNames: { type: Type.ARRAY, items: { type: Type.STRING } },
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

      if (response?.text) {
        const parsed = JSON.parse(response.text);
        if (parsed.days && Array.isArray(parsed.days) && parsed.days.length > 0) {
          return {
            ...parsed,
            source: 'gemini',
          };
        }
      }
    } catch (err) {
      console.warn('Gemini API call fallback to rule-based planner:', redactSecrets(String(err)));
    }
  }

  // Fallback Rule-Based Planner
  const dailyBudget = Math.round(budget / days);
  const dayPlans = [];
  for (let i = 0; i < days; i++) {
    const dest = SEED_DESTINATIONS[i % SEED_DESTINATIONS.length];
    dayPlans.push({
      dayNumber: i + 1,
      title: `Day ${i + 1}: ${dest.name} & Surroundings`,
      destinationId: dest.id,
      destinationName: dest.name,
      activities: [
        `Morning nature exploration and viewpoint photography at ${dest.name}`,
        `Guided cultural tour with certified local indigenous guide`,
        `Evening visit to regional Dokra & Sohrai handicraft workshop`,
      ],
      suggestedListingIds: [dest.id],
      suggestedVendorNames: ['Sohrai & Kohbar Tribal Women Co-op', 'Malhor Dokra Art Collective'],
      estimatedBudget: dailyBudget,
      travelNotes: dest.guidelines,
    });
  }

  return {
    title: `${days}-Day Sustainable Jharkhand Circuit`,
    summary: `Curated ${days}-day eco-friendly travel route starting from ${startingLocation} for ${travelGroup} travelers.`,
    totalEstimatedBudget: dailyBudget * days,
    days: dayPlans,
    responsibleTourismNotes: 'Practice zero-plastic travel and support local native guides and artisans.',
    source: 'mock',
  };
}

// ============================================================================
// Server Configuration & Endpoints
// ============================================================================

app.use(express.json({ limit: '64kb' }));

app.post('/api/itinerary', async (req, res) => {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'local-client';
  if (!rateLimiter.isAllowed(String(clientIp))) {
    res.status(429).json({ error: 'Too Many Requests. Please slow down and try again in 1 minute.' });
    return;
  }

  try {
    const result = await planItinerary(req.body || {});
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.json(result);
  } catch (err: any) {
    const safeErrorMsg = redactSecrets(err?.message || 'Internal Server Error');
    res.status(500).json({ error: safeErrorMsg });
  }
});

app.get('/healthz', (_req, res) => {
  res.status(200).send('OK');
});

const distPath = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, { maxAge: '1h' }));
}

app.get('*', (_req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Jharkhand Tourism</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px;">
          <h2>Jharkhand Tourism Platform</h2>
          <p>Please refresh in a moment while assets finish loading.</p>
        </body>
      </html>
    `);
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`Jharkhand Eco-Tourism production server running on http://${HOST}:${PORT}`);
});

server.on('error', (err: any) => {
  console.error('Server error:', redactSecrets(err?.message || String(err)));
});

const handleShutdown = (signal: string) => {
  console.log(`Received ${signal}, shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed successfully.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
