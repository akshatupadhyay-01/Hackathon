import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  Destination,
  Category,
  District,
  LocalGuide,
  Vendor,
  Review,
  Booking,
  SavedItinerary,
} from '../types/database';
import { ItineraryResponse } from '../types/index';
import {
  SEED_CATEGORIES,
  SEED_DISTRICTS,
  SEED_DESTINATIONS,
  SEED_GUIDES,
  SEED_VENDORS,
  SEED_REVIEWS,
} from '../data/jharkhand';

export interface DestinationFilterOptions {
  categorySlug?: string;
  districtId?: string;
  searchQuery?: string;
  isFeatured?: boolean;
  ecoCertifiedOnly?: boolean;
}

/**
 * Fetch all categories
 */
export async function fetchCategories(): Promise<Category[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return data as Category[];
      }
      if (error) console.warn('Supabase fetchCategories error, falling back to seed:', error.message);
    } catch (err) {
      console.warn('Supabase fetchCategories network error:', err);
    }
  }
  return SEED_CATEGORIES;
}

/**
 * Fetch all districts
 */
export async function fetchDistricts(): Promise<District[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('districts')
        .select('*')
        .order('name');
      if (!error && data && data.length > 0) {
        return data as District[];
      }
      if (error) console.warn('Supabase fetchDistricts error, falling back to seed:', error.message);
    } catch (err) {
      console.warn('Supabase fetchDistricts network error:', err);
    }
  }
  return SEED_DISTRICTS;
}

/**
 * Fetch destinations with optional filters
 */
export async function fetchDestinations(
  filters?: DestinationFilterOptions
): Promise<Destination[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase
        .from('destinations')
        .select('*, district:districts(*), category:categories(*)');

      if (filters?.isFeatured !== undefined) {
        query = query.eq('is_featured', filters.isFeatured);
      }
      if (filters?.ecoCertifiedOnly) {
        query = query.eq('is_eco_certified', true);
      }
      if (filters?.districtId && filters.districtId !== 'all') {
        query = query.eq('district_id', filters.districtId);
      }

      const { data, error } = await query;
      if (!error && data) {
        let results = data as Destination[];

        // Apply in-memory search and category filter if joined relations
        if (filters?.categorySlug && filters.categorySlug !== 'all') {
          results = results.filter(
            (d) => d.category?.slug === filters.categorySlug
          );
        }
        if (filters?.searchQuery && filters.searchQuery.trim()) {
          const q = filters.searchQuery.toLowerCase().trim();
          results = results.filter(
            (d) =>
              d.name.toLowerCase().includes(q) ||
              d.description.toLowerCase().includes(q) ||
              d.district?.name.toLowerCase().includes(q) ||
              (d.tags && d.tags.some((t) => t.toLowerCase().includes(q)))
          );
        }
        return results;
      }
      if (error) console.warn('Supabase fetchDestinations error, falling back to seed:', error.message);
    } catch (err) {
      console.warn('Supabase fetchDestinations network error:', err);
    }
  }

  // Fallback to seed data
  let results = [...SEED_DESTINATIONS];

  if (filters?.isFeatured !== undefined) {
    results = results.filter((d) => d.is_featured === filters.isFeatured);
  }
  if (filters?.ecoCertifiedOnly) {
    results = results.filter((d) => d.is_eco_certified);
  }
  if (filters?.districtId && filters.districtId !== 'all') {
    results = results.filter((d) => d.district_id === filters.districtId);
  }
  if (filters?.categorySlug && filters.categorySlug !== 'all') {
    results = results.filter((d) => d.category?.slug === filters.categorySlug);
  }
  if (filters?.searchQuery && filters.searchQuery.trim()) {
    const q = filters.searchQuery.toLowerCase().trim();
    results = results.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.district?.name.toLowerCase().includes(q) ||
        (d.tags && d.tags.some((t) => t.toLowerCase().includes(q)))
    );
  }

  return results;
}

/**
 * Fetch a single destination by its URL slug
 */
export async function fetchDestinationBySlug(
  slug: string
): Promise<Destination | null> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*, district:districts(*), category:categories(*)')
        .eq('slug', slug)
        .single();
      if (!error && data) {
        return data as Destination;
      }
      if (error) console.warn(`Supabase fetchDestinationBySlug('${slug}') error:`, error.message);
    } catch (err) {
      console.warn('Supabase fetchDestinationBySlug network error:', err);
    }
  }

  const found = SEED_DESTINATIONS.find((d) => d.slug === slug);
  return found || null;
}

/**
 * Fetch verified local guides (optionally filtered by destination)
 */
export async function fetchLocalGuides(
  destinationId?: string
): Promise<LocalGuide[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('local_guides').select('*');
      if (destinationId) {
        query = query.eq('destination_id', destinationId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as LocalGuide[];
      }
    } catch (err) {
      console.warn('Supabase fetchLocalGuides error:', err);
    }
  }
  if (destinationId) {
    const matched = SEED_GUIDES.filter((g) => g.destination_id === destinationId);
    return matched.length > 0 ? matched : SEED_GUIDES;
  }
  return SEED_GUIDES;
}

/**
 * Fetch local craft vendors & homestays
 */
export async function fetchVendors(type?: string): Promise<Vendor[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('vendors').select('*, district:districts(*)');
      if (type && type !== 'all') {
        query = query.eq('vendor_type', type);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Vendor[];
      }
    } catch (err) {
      console.warn('Supabase fetchVendors error:', err);
    }
  }
  if (type && type !== 'all') {
    return SEED_VENDORS.filter((v) => v.vendor_type === type);
  }
  return SEED_VENDORS;
}

/**
 * Fetch reviews for a specific destination
 */
export async function fetchReviews(
  destinationId: string
): Promise<Review[]> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('destination_id', destinationId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Review[];
      }
    } catch (err) {
      console.warn('Supabase fetchReviews error:', err);
    }
  }
  return SEED_REVIEWS.filter((r) => r.destination_id === destinationId);
}

/**
 * Generate unique stable Booking ID in format JH-2026-XXXXXX
 */
export function generateBookingId(): string {
  const chars = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < 6; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `JH-2026-${randomPart}`;
}

const STORAGE_BOOKINGS_KEY = 'jharkhand_confirmed_bookings';

/**
 * Retrieve all locally confirmed bookings
 */
export function getStoredBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(STORAGE_BOOKINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.warn('Error reading stored bookings:', err);
  }
  return [];
}

/**
 * Store a confirmed booking locally
 */
export function storeBooking(booking: Booking): void {
  try {
    const existing = getStoredBookings();
    const updated = [booking, ...existing.filter((b) => b.id !== booking.id && b.eco_pass_code !== booking.eco_pass_code)];
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Error storing booking locally:', err);
  }
}

/**
 * Create a new booking / eco-pass
 */
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'created_at' | 'eco_pass_code' | 'status'> & { eco_pass_code?: string; visitor_name?: string }
): Promise<{ success: boolean; booking: Booking | null; error?: string }> {
  const ecoPassCode = bookingData.eco_pass_code || generateBookingId();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            ...bookingData,
            status: 'confirmed',
            eco_pass_code: ecoPassCode,
          },
        ])
        .select()
        .single();

      if (!error && data) {
        const savedBooking = data as Booking;
        storeBooking(savedBooking);
        return { success: true, booking: savedBooking };
      }
      if (error) {
        console.warn('Supabase booking insert error:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase booking exception:', err.message);
    }
  }

  // Fallback demo mock booking with stable ID
  const localBooking: Booking = {
    id: `b-${Date.now()}`,
    ...bookingData,
    status: 'confirmed',
    eco_pass_code: ecoPassCode,
    created_at: new Date().toISOString(),
  };

  storeBooking(localBooking);
  return { success: true, booking: localBooking };
}

/**
 * Fetch bookings associated with a specific user
 */
export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, destination:destinations(*), vendor:vendors(*), guide:local_guides(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Booking[];
      }
      if (error) {
        console.warn('Supabase fetchUserBookings error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetchUserBookings exception:', err);
    }
  }

  // Local storage fallback for bookings
  const local = getStoredBookings();
  if (userId) {
    const userMatched = local.filter((b) => b.user_id === userId || !b.user_id);
    return userMatched;
  }
  return local;
}

const STORAGE_SAVED_ITINERARIES_KEY = 'jharkhand_saved_itineraries';

/**
 * Fetch saved itineraries for an authenticated user
 */
export async function fetchUserSavedItineraries(userId: string): Promise<SavedItinerary[]> {
  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('saved_itineraries')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as SavedItinerary[];
      }
      if (error) {
        console.warn('Supabase fetchUserSavedItineraries error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase fetchUserSavedItineraries exception:', err);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITINERARIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (userId) {
          return parsed.filter((item: SavedItinerary) => item.user_id === userId || !item.user_id);
        }
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading saved itineraries from local storage:', err);
  }
  return [];
}

/**
 * Save an itinerary for a user
 */
export async function saveUserItinerary(
  userId: string,
  itinerary: ItineraryResponse
): Promise<{ success: boolean; data?: SavedItinerary; error?: string }> {
  const newRecord: Omit<SavedItinerary, 'id' | 'created_at'> = {
    user_id: userId,
    title: itinerary.title || 'Jharkhand Eco Circuit',
    duration_days: itinerary.days?.length || 3,
    budget_level: itinerary.totalEstimatedBudget ? `₹${itinerary.totalEstimatedBudget}` : 'Eco Budget',
    estimated_cost_inr: itinerary.totalEstimatedBudget || 12000,
    carbon_footprint_saved_kg: (itinerary.days?.length || 3) * 22,
    itinerary_data: itinerary,
  };

  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('saved_itineraries')
        .insert([newRecord])
        .select()
        .single();

      if (!error && data) {
        const saved = data as SavedItinerary;
        // Also cache locally
        try {
          const local = await fetchUserSavedItineraries(userId);
          localStorage.setItem(STORAGE_SAVED_ITINERARIES_KEY, JSON.stringify([saved, ...local.filter(l => l.id !== saved.id)]));
        } catch (e) {
          // ignore
        }
        return { success: true, data: saved };
      }
      if (error) {
        console.warn('Supabase saveUserItinerary error:', error.message);
      }
    } catch (err: any) {
      console.warn('Supabase saveUserItinerary exception:', err.message);
    }
  }

  // Fallback local save
  const localSaved: SavedItinerary = {
    id: `itin-${Date.now()}`,
    user_id: userId || 'demo-user',
    title: itinerary.title || 'Jharkhand Eco Circuit',
    duration_days: itinerary.days?.length || 3,
    budget_level: itinerary.totalEstimatedBudget ? `₹${itinerary.totalEstimatedBudget}` : 'Eco Budget',
    estimated_cost_inr: itinerary.totalEstimatedBudget || 12000,
    carbon_footprint_saved_kg: (itinerary.days?.length || 3) * 22,
    itinerary_data: itinerary,
    created_at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITINERARIES_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_SAVED_ITINERARIES_KEY, JSON.stringify([localSaved, ...existing]));
  } catch (err) {
    console.warn('Error saving to local storage:', err);
  }

  return { success: true, data: localSaved };
}

/**
 * Delete a saved itinerary
 */
export async function deleteUserSavedItinerary(
  id: string,
  userId: string
): Promise<{ success: boolean }> {
  if (isSupabaseConfigured() && supabase && userId) {
    try {
      const { error } = await supabase
        .from('saved_itineraries')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.warn('Supabase deleteUserSavedItinerary error:', error.message);
      }
    } catch (err) {
      console.warn('Supabase deleteUserSavedItinerary exception:', err);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITINERARIES_KEY);
    if (raw) {
      const existing: SavedItinerary[] = JSON.parse(raw);
      const filtered = existing.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_SAVED_ITINERARIES_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    console.warn('Error deleting from local storage:', err);
  }

  return { success: true };
}

