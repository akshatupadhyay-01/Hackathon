import { supabase, isSupabaseConfigured } from '../../../services/supabase/client';
import { Destination, District, Category, LocalGuide, Vendor, Review, Booking, SavedItinerary } from '../../../types/database';
import { ItineraryResponse } from '../../../types';
import {
  SEED_CATEGORIES,
  SEED_DISTRICTS,
  SEED_DESTINATIONS,
  SEED_GUIDES,
  SEED_VENDORS,
  SEED_REVIEWS,
} from '../../../data/jharkhand';
import {
  sanitizeDbSearchTerm,
  safeContains,
  isValidSlug,
  safeLogger,
  SECURITY_LIMITS,
} from '../../../utils/security';

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
      if (error) safeLogger.warn('Supabase fetchCategories error, falling back to seed:', error.message);
    } catch (err) {
      safeLogger.warn('Supabase fetchCategories network error:', err);
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
      if (error) safeLogger.warn('Supabase fetchDistricts error, falling back to seed:', error.message);
    } catch (err) {
      safeLogger.warn('Supabase fetchDistricts network error:', err);
    }
  }
  return SEED_DISTRICTS;
}

/**
 * Fetch destinations with optional filters (Hardened against SQL injection & ReDoS)
 */
export async function fetchDestinations(
  filters?: DestinationFilterOptions
): Promise<Destination[]> {
  // Sanitize filter arguments
  const sanitizedSearch = filters?.searchQuery
    ? sanitizeDbSearchTerm(filters.searchQuery, SECURITY_LIMITS.MAX_SEARCH_QUERY_LENGTH)
    : '';
  const sanitizedDistrictId = filters?.districtId
    ? sanitizeDbSearchTerm(filters.districtId, 50)
    : '';
  const sanitizedCategorySlug = filters?.categorySlug
    ? sanitizeDbSearchTerm(filters.categorySlug, 50)
    : '';

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
      if (sanitizedDistrictId && sanitizedDistrictId !== 'all') {
        query = query.eq('district_id', sanitizedDistrictId);
      }

      const { data, error } = await query;
      if (!error && data) {
        let results = data as Destination[];

        // Apply in-memory search and category filter safely (linear time)
        if (sanitizedCategorySlug && sanitizedCategorySlug !== 'all') {
          results = results.filter(
            (d) => d.category?.slug === sanitizedCategorySlug
          );
        }
        if (sanitizedSearch) {
          results = results.filter(
            (d) =>
              safeContains(d.name, sanitizedSearch) ||
              safeContains(d.description, sanitizedSearch) ||
              safeContains(d.district?.name, sanitizedSearch) ||
              (d.tags && d.tags.some((t) => safeContains(t, sanitizedSearch)))
          );
        }
        return results;
      }
      if (error) safeLogger.warn('Supabase fetchDestinations error, falling back to seed:', error.message);
    } catch (err) {
      safeLogger.warn('Supabase fetchDestinations network error:', err);
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
  if (sanitizedDistrictId && sanitizedDistrictId !== 'all') {
    results = results.filter((d) => d.district_id === sanitizedDistrictId);
  }
  if (sanitizedCategorySlug && sanitizedCategorySlug !== 'all') {
    results = results.filter((d) => d.category?.slug === sanitizedCategorySlug);
  }
  if (sanitizedSearch) {
    results = results.filter(
      (d) =>
        safeContains(d.name, sanitizedSearch) ||
        safeContains(d.description, sanitizedSearch) ||
        safeContains(d.district?.name, sanitizedSearch) ||
        (d.tags && d.tags.some((t) => safeContains(t, sanitizedSearch)))
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
  const safeSlug = sanitizeDbSearchTerm(slug, 80);
  if (!safeSlug) return null;

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('destinations')
        .select('*, district:districts(*), category:categories(*)')
        .eq('slug', safeSlug)
        .single();
      if (!error && data) {
        return data as Destination;
      }
      if (error) safeLogger.warn(`Supabase fetchDestinationBySlug('${safeSlug}') error:`, error.message);
    } catch (err) {
      safeLogger.warn('Supabase fetchDestinationBySlug network error:', err);
    }
  }

  const found = SEED_DESTINATIONS.find((d) => d.slug === safeSlug);
  return found || null;
}

/**
 * Fetch verified local guides (optionally filtered by destination)
 */
export async function fetchLocalGuides(
  destinationId?: string
): Promise<LocalGuide[]> {
  const safeDestId = destinationId ? sanitizeDbSearchTerm(destinationId, 50) : undefined;

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('local_guides').select('*');
      if (safeDestId) {
        query = query.eq('destination_id', safeDestId);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as LocalGuide[];
      }
    } catch (err) {
      safeLogger.warn('Supabase fetchLocalGuides error:', err);
    }
  }
  if (safeDestId) {
    const matched = SEED_GUIDES.filter((g) => g.destination_id === safeDestId);
    return matched.length > 0 ? matched : SEED_GUIDES;
  }
  return SEED_GUIDES;
}

/**
 * Fetch local craft vendors & homestays
 */
export async function fetchVendors(type?: string): Promise<Vendor[]> {
  const safeType = type && type !== 'all' ? sanitizeDbSearchTerm(type, 50) : undefined;

  if (isSupabaseConfigured() && supabase) {
    try {
      let query = supabase.from('vendors').select('*, district:districts(*)');
      if (safeType) {
        query = query.eq('vendor_type', safeType);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return data as Vendor[];
      }
    } catch (err) {
      safeLogger.warn('Supabase fetchVendors error:', err);
    }
  }
  if (safeType) {
    return SEED_VENDORS.filter((v) => v.vendor_type === safeType);
  }
  return SEED_VENDORS;
}

/**
 * Fetch reviews for a specific destination
 */
export async function fetchReviews(
  destinationId: string
): Promise<Review[]> {
  const safeDestId = sanitizeDbSearchTerm(destinationId, 50);
  if (!safeDestId) return [];

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('destination_id', safeDestId)
        .order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        return data as Review[];
      }
    } catch (err) {
      safeLogger.warn('Supabase fetchReviews error:', err);
    }
  }
  return SEED_REVIEWS.filter((r) => r.destination_id === safeDestId);
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
      if (Array.isArray(parsed)) return parsed.slice(0, 100);
    }
  } catch (err) {
    safeLogger.warn('Error reading stored bookings:', err);
  }
  return [];
}

/**
 * Store a confirmed booking locally
 */
export function storeBooking(booking: Booking): void {
  try {
    const existing = getStoredBookings();
    const updated = [booking, ...existing.filter((b) => b.id !== booking.id && b.eco_pass_code !== booking.eco_pass_code)].slice(0, 100);
    localStorage.setItem(STORAGE_BOOKINGS_KEY, JSON.stringify(updated));
  } catch (err) {
    safeLogger.warn('Error storing booking locally:', err);
  }
}

/**
 * Create a new booking / eco-pass
 */
export async function createBooking(
  bookingData: Omit<Booking, 'id' | 'created_at' | 'eco_pass_code' | 'status'> & { eco_pass_code?: string; visitor_name?: string }
): Promise<{ success: boolean; booking: Booking | null; error?: string }> {
  const ecoPassCode = bookingData.eco_pass_code
    ? sanitizeDbSearchTerm(bookingData.eco_pass_code, 30)
    : generateBookingId();

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
        safeLogger.warn('Supabase booking insert error:', error.message);
      }
    } catch (err: any) {
      safeLogger.warn('Supabase booking exception:', err.message);
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
  const safeUserId = sanitizeDbSearchTerm(userId, 80);

  if (isSupabaseConfigured() && supabase && safeUserId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select('*, destination:destinations(*), vendor:vendors(*), guide:local_guides(*)')
        .eq('user_id', safeUserId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as Booking[];
      }
      if (error) {
        safeLogger.warn('Supabase fetchUserBookings error:', error.message);
      }
    } catch (err) {
      safeLogger.warn('Supabase fetchUserBookings exception:', err);
    }
  }

  // Local storage fallback for bookings
  const local = getStoredBookings();
  if (safeUserId) {
    const userMatched = local.filter((b) => b.user_id === safeUserId || !b.user_id);
    return userMatched;
  }
  return local;
}

const STORAGE_SAVED_ITINERARIES_KEY = 'jharkhand_saved_itineraries';

/**
 * Fetch saved itineraries for an authenticated user
 */
export async function fetchUserSavedItineraries(userId: string): Promise<SavedItinerary[]> {
  const safeUserId = sanitizeDbSearchTerm(userId, 80);

  if (isSupabaseConfigured() && supabase && safeUserId) {
    try {
      const { data, error } = await supabase
        .from('saved_itineraries')
        .select('*')
        .eq('user_id', safeUserId)
        .order('created_at', { ascending: false });

      if (!error && data) {
        return data as SavedItinerary[];
      }
      if (error) {
        safeLogger.warn('Supabase fetchUserSavedItineraries error:', error.message);
      }
    } catch (err) {
      safeLogger.warn('Supabase fetchUserSavedItineraries exception:', err);
    }
  }

  // Local storage fallback
  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITINERARIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        if (safeUserId) {
          return parsed.filter((item: SavedItinerary) => item.user_id === safeUserId || !item.user_id).slice(0, 50);
        }
        return parsed.slice(0, 50);
      }
    }
  } catch (err) {
    safeLogger.warn('Error reading saved itineraries from local storage:', err);
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
  const safeUserId = sanitizeDbSearchTerm(userId || 'demo-user', 80);

  const newRecord: Omit<SavedItinerary, 'id' | 'created_at'> = {
    user_id: safeUserId,
    title: sanitizeDbSearchTerm(itinerary.title || 'Jharkhand Eco Circuit', 120),
    duration_days: Math.min(14, Math.max(1, itinerary.days?.length || 3)),
    budget_level: itinerary.totalEstimatedBudget ? `₹${itinerary.totalEstimatedBudget}` : 'Eco Budget',
    estimated_cost_inr: Math.min(5000000, Math.max(500, itinerary.totalEstimatedBudget || 12000)),
    carbon_footprint_saved_kg: (itinerary.days?.length || 3) * 22,
    itinerary_data: itinerary,
  };

  if (isSupabaseConfigured() && supabase && safeUserId && safeUserId !== 'demo-user') {
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
          const local = await fetchUserSavedItineraries(safeUserId);
          localStorage.setItem(STORAGE_SAVED_ITINERARIES_KEY, JSON.stringify([saved, ...local.filter(l => l.id !== saved.id)].slice(0, 50)));
        } catch (e) {
          // ignore
        }
        return { success: true, data: saved };
      }
      if (error) {
        safeLogger.warn('Supabase saveUserItinerary error:', error.message);
      }
    } catch (err: any) {
      safeLogger.warn('Supabase saveUserItinerary exception:', err.message);
    }
  }

  // Fallback local save
  const localSaved: SavedItinerary = {
    id: `itin-${Date.now()}`,
    ...newRecord,
    created_at: new Date().toISOString(),
  };

  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITINERARIES_KEY);
    const existing = raw ? JSON.parse(raw) : [];
    localStorage.setItem(STORAGE_SAVED_ITINERARIES_KEY, JSON.stringify([localSaved, ...existing].slice(0, 50)));
  } catch (err) {
    safeLogger.warn('Error saving to local storage:', err);
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
  const safeId = sanitizeDbSearchTerm(id, 80);
  const safeUserId = sanitizeDbSearchTerm(userId, 80);

  if (isSupabaseConfigured() && supabase && safeUserId && safeId) {
    try {
      const { error } = await supabase
        .from('saved_itineraries')
        .delete()
        .eq('id', safeId)
        .eq('user_id', safeUserId);

      if (error) {
        safeLogger.warn('Supabase deleteUserSavedItinerary error:', error.message);
      }
    } catch (err) {
      safeLogger.warn('Supabase deleteUserSavedItinerary exception:', err);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_SAVED_ITINERARIES_KEY);
    if (raw) {
      const existing: SavedItinerary[] = JSON.parse(raw);
      const filtered = existing.filter((item) => item.id !== safeId);
      localStorage.setItem(STORAGE_SAVED_ITINERARIES_KEY, JSON.stringify(filtered));
    }
  } catch (err) {
    safeLogger.warn('Error deleting from local storage:', err);
  }

  return { success: true };
}

