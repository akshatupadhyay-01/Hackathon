/**
 * Database types matching db/schema.sql for the Supabase PostgreSQL integration.
 */

export type UserRole = 'tourist' | 'vendor' | 'guide' | 'admin';
export type DestinationCategoryType =
  | 'waterfalls'
  | 'sacred_temples'
  | 'wildlife_eco'
  | 'hills_valleys'
  | 'tribal_heritage'
  | 'mining_heritage'
  | 'adventure_nature';

export type CrowdLevel = 'low' | 'moderate' | 'high' | 'peak';
export type VendorType = 'homestay' | 'artisan_craft' | 'local_cuisine' | 'eco_tour_guide' | 'transport';
export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';
export type VerificationStatus = 'pending' | 'verified' | 'rejected';

export interface District {
  id: string;
  name: string;
  division: string;
  headquarters: string;
  description: string | null;
  featured_image: string | null;
  latitude: number;
  longitude: number;
  created_at: string;
}

export interface Category {
  id: string;
  slug: string;
  name: string;
  icon: string;
  description: string | null;
  created_at: string;
}

export interface Destination {
  id: string;
  district_id: string;
  category_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string;
  cultural_significance: string | null;
  eco_guidelines: string | null;
  best_time_to_visit: string | null;
  entry_fee_inr: number;
  timings: string;
  latitude: number;
  longitude: number;
  featured_image: string;
  images: string[];
  tags: string[];
  rating: number;
  review_count: number;
  crowd_status: CrowdLevel;
  is_featured: boolean;
  is_eco_certified: boolean;
  created_at: string;
  // Joined relation fields for convenience
  district?: District;
  category?: Category;
}

export interface DestinationHighlight {
  id: string;
  destination_id: string;
  title: string;
  description: string | null;
  icon: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  bio: string | null;
  district: string | null;
  eco_points: number;
  created_at: string;
}

export interface Vendor {
  id: string;
  user_id: string | null;
  business_name: string;
  vendor_type: VendorType;
  district_id: string | null;
  village_or_area: string;
  description: string;
  contact_phone: string;
  contact_email: string | null;
  featured_image: string | null;
  price_range: string | null;
  tribal_art_form: string | null;
  verification_status: VerificationStatus;
  rating: number;
  created_at: string;
  district?: District;
}

export interface LocalGuide {
  id: string;
  user_id: string | null;
  destination_id: string | null;
  name: string;
  languages_spoken: string[];
  experience_years: number;
  badge: string;
  bio: string | null;
  daily_rate_inr: number;
  phone: string | null;
  rating: number;
  is_verified: boolean;
  created_at: string;
  destination?: Destination;
}

export interface Review {
  id: string;
  destination_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  comment: string;
  photos: string[];
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string | null;
  visitor_name?: string;
  destination_id: string | null;
  vendor_id: string | null;
  guide_id: string | null;
  booking_date: string;
  number_of_guests: number;
  total_amount_inr: number;
  status: BookingStatus;
  eco_pass_code: string;
  created_at: string;
  destination?: Destination;
  vendor?: Vendor;
  guide?: LocalGuide;
}

export interface SavedItinerary {
  id: string;
  user_id: string;
  title: string;
  duration_days: number;
  budget_level: string;
  estimated_cost_inr: number | null;
  carbon_footprint_saved_kg: number;
  itinerary_data: any;
  created_at: string;
}
