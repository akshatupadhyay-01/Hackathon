# API and Services Architecture

## Gemini AI Service Contract

### Endpoint: `POST /api/itinerary`

Generates a customized, eco-conscious travel itinerary for Jharkhand using Gemini 2.5 (`gemini-2.5-flash`) constrained by real destination records from the database.

#### Request Schema (`ItineraryRequest`):
```typescript
interface ItineraryRequest {
  days: number;               // 1-14 days
  budget: number;             // Total estimated budget in INR
  startingLocation?: string;  // e.g. "Ranchi", "Jamshedpur", "Deoghar"
  interests?: string[];       // e.g. ["Waterfalls", "Wildlife", "Tribal Heritage", "Temples"]
  travelGroup?: 'solo' | 'couple' | 'family' | 'friends';
  tourismType?: 'eco' | 'cultural' | 'adventure' | 'spiritual' | 'all';
}
```

#### Response Schema (`ItineraryResponse`):
```typescript
interface ItineraryResponse {
  title: string;
  summary: string;
  totalEstimatedBudget: number;
  days: ItineraryDayPlan[];
  responsibleTourismNotes?: string;
  source: 'gemini' | 'mock';
}

interface ItineraryDayPlan {
  dayNumber: number;
  title: string;
  destinationId?: string;
  destinationName: string;
  activities: string[];
  suggestedListingIds?: string[];
  suggestedVendorNames?: string[];
  estimatedBudget: number;
  travelNotes?: string;
}
```

#### Security & Architecture Guidelines:
- `GEMINI_API_KEY` is kept strictly server-side in Node environment variables and never exposed to the client.
- The client calls `/api/itinerary`.
- Gemini responses are parsed, validated against real database destination IDs, and sanitized before returning to the UI.
