-- ============================================================================
-- Jharkhand Eco & Cultural Tourism Platform (SIH25032)
-- Supabase PostgreSQL Database Schema
-- ============================================================================

-- Create Enums
CREATE TYPE user_role AS ENUM ('tourist', 'vendor', 'guide', 'admin');
CREATE TYPE destination_category_type AS ENUM ('waterfalls', 'sacred_temples', 'wildlife_eco', 'hills_valleys', 'tribal_heritage', 'mining_heritage', 'adventure_nature');
CREATE TYPE crowd_level AS ENUM ('low', 'moderate', 'high', 'peak');
CREATE TYPE vendor_type AS ENUM ('homestay', 'artisan_craft', 'local_cuisine', 'eco_tour_guide', 'transport');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE verification_status AS ENUM ('pending', 'verified', 'rejected');

-- 1. Districts of Jharkhand
CREATE TABLE IF NOT EXISTS districts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  division VARCHAR(100) NOT NULL,
  headquarters VARCHAR(100) NOT NULL,
  description TEXT,
  featured_image TEXT,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Destinations
CREATE TABLE IF NOT EXISTS destinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  district_id UUID NOT NULL REFERENCES districts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  tagline VARCHAR(300),
  description TEXT NOT NULL,
  cultural_significance TEXT,
  eco_guidelines TEXT,
  best_time_to_visit VARCHAR(150),
  entry_fee_inr DECIMAL(10, 2) DEFAULT 0,
  timings VARCHAR(150) DEFAULT '6:00 AM - 6:00 PM',
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  featured_image TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  rating DECIMAL(3, 2) DEFAULT 4.5,
  review_count INT DEFAULT 0,
  crowd_status crowd_level DEFAULT 'moderate',
  is_featured BOOLEAN DEFAULT false,
  is_eco_certified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Destination Highlights & Tips
CREATE TABLE IF NOT EXISTS destination_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'Sparkles',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Profiles (Tourists, Vendors, Guides, Admins)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role DEFAULT 'tourist',
  full_name VARCHAR(150),
  avatar_url TEXT,
  phone VARCHAR(20),
  bio TEXT,
  district VARCHAR(100),
  eco_points INT DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Vendors / Local Businesses & Artisans
CREATE TABLE IF NOT EXISTS vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  business_name VARCHAR(200) NOT NULL,
  vendor_type vendor_type NOT NULL,
  district_id UUID REFERENCES districts(id) ON DELETE SET NULL,
  village_or_area VARCHAR(200) NOT NULL,
  description TEXT NOT NULL,
  contact_phone VARCHAR(20) NOT NULL,
  contact_email VARCHAR(150),
  featured_image TEXT,
  price_range VARCHAR(50),
  tribal_art_form VARCHAR(100), -- e.g., 'Dokra Craft', 'Sohrai Painting', 'Paitkar'
  verification_status verification_status DEFAULT 'pending',
  rating DECIMAL(3, 2) DEFAULT 4.8,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Local Guides
CREATE TABLE IF NOT EXISTS local_guides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  name VARCHAR(150) NOT NULL,
  languages_spoken TEXT[] DEFAULT '{"Hindi", "Tribal Dialects (Santhali/Ho/Mundari)", "English"}',
  experience_years INT DEFAULT 3,
  badge VARCHAR(100) DEFAULT 'Certified Jharkhand Eco-Guide',
  bio TEXT,
  daily_rate_inr DECIMAL(10, 2) DEFAULT 800,
  phone VARCHAR(20),
  rating DECIMAL(3, 2) DEFAULT 4.9,
  is_verified BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Reviews
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destination_id UUID NOT NULL REFERENCES destinations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  author_name VARCHAR(150) NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Bookings & Eco Passes
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  destination_id UUID REFERENCES destinations(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendors(id) ON DELETE SET NULL,
  guide_id UUID REFERENCES local_guides(id) ON DELETE SET NULL,
  booking_date DATE NOT NULL,
  number_of_guests INT DEFAULT 1,
  total_amount_inr DECIMAL(10, 2) NOT NULL,
  status booking_status DEFAULT 'confirmed',
  eco_pass_code VARCHAR(50) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Saved Trips / Itineraries
CREATE TABLE IF NOT EXISTS saved_itineraries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  duration_days INT NOT NULL DEFAULT 3,
  budget_level VARCHAR(50) DEFAULT 'Eco Budget',
  estimated_cost_inr DECIMAL(10, 2),
  carbon_footprint_saved_kg DECIMAL(10, 2) DEFAULT 45.0,
  itinerary_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE districts ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE destination_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE local_guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_itineraries ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Districts are publicly readable" ON districts FOR SELECT USING (true);
CREATE POLICY "Categories are publicly readable" ON categories FOR SELECT USING (true);
CREATE POLICY "Destinations are publicly readable" ON destinations FOR SELECT USING (true);
CREATE POLICY "Destination highlights are publicly readable" ON destination_highlights FOR SELECT USING (true);
CREATE POLICY "Verified vendors are publicly readable" ON vendors FOR SELECT USING (true);
CREATE POLICY "Guides are publicly readable" ON local_guides FOR SELECT USING (true);
CREATE POLICY "Reviews are publicly readable" ON reviews FOR SELECT USING (true);
