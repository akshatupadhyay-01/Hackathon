export * from './database';

export interface TravelSegment {
  originName: string;
  destinationName: string;
  originCoords?: [number, number];
  destinationCoords?: [number, number];
  distanceKm: number;
  durationMinutes: number;
  durationFormatted: string;
  departureTime?: string; // e.g. "08:00 AM"
  arrivalTime?: string; // e.g. "~12:30 PM"
  isLongTravel?: boolean;
  isLiveRouting?: boolean;
}

export interface DayTimelineItem {
  time: string; // e.g. "08:00 AM"
  title: string;
  description: string;
  type: 'travel' | 'activity' | 'meal' | 'stay' | 'highlight';
}

export interface ItineraryRequest {
  days: number;
  budget: number;
  guests?: number;
  startingLocation?: string;
  startingLocationCoords?: { lat: number; lng: number; name?: string; isGps?: boolean };
  interests?: string[];
  travelGroup?: 'solo' | 'couple' | 'family' | 'friends';
  tourismType?:
    | 'eco'
    | 'cultural'
    | 'adventure'
    | 'spiritual'
    | 'all'
    | 'waterfalls'
    | 'wildlife_eco'
    | 'hills_valleys'
    | 'sacred_temples';
}

export interface ItineraryDayPlan {
  dayNumber: number;
  title: string;
  destinationId?: string;
  destinationName: string;
  activities: string[];
  suggestedListingIds?: string[];
  suggestedVendorNames?: string[];
  estimatedBudget: number;
  travelNotes?: string;
  startLocationName?: string;
  overnightStayLocation?: string;
  travelSegment?: TravelSegment;
  timeline?: DayTimelineItem[];
}

export interface ItineraryResponse {
  title: string;
  summary: string;
  totalEstimatedBudget: number;
  days: ItineraryDayPlan[];
  responsibleTourismNotes?: string;
  source: 'gemini' | 'mock';
}
