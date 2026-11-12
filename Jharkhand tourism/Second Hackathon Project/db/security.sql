-- ============================================================================
-- Jharkhand Eco & Cultural Tourism Platform (SIH25032)
-- Security migration: privileges, roles and row-level security policies
-- Run AFTER db/schema.sql on the Supabase project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table privileges (PostgREST needs explicit grants; RLS alone is not enough)
-- ----------------------------------------------------------------------------
GRANT SELECT ON public.districts, public.categories, public.destinations,
  public.destination_highlights, public.vendors, public.local_guides,
  public.reviews TO anon;

GRANT SELECT ON public.districts, public.categories, public.destinations,
  public.destination_highlights, public.local_guides TO authenticated;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.vendors TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_itineraries TO authenticated;

GRANT ALL ON public.districts, public.categories, public.destinations,
  public.destination_highlights, public.profiles, public.vendors,
  public.local_guides, public.reviews, public.bookings,
  public.saved_itineraries TO service_role;

-- ----------------------------------------------------------------------------
-- 2. Roles live in their own table (never on profiles) to prevent
--    privilege escalation through a self-updatable profile row.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role user_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

DROP POLICY IF EXISTS "Users can read their own roles" ON public.user_roles;
CREATE POLICY "Users can read their own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Role grants are performed out-of-band (SQL editor / service role) only.
-- No INSERT/UPDATE/DELETE policy is defined for authenticated users on purpose.

-- ----------------------------------------------------------------------------
-- 3. Vendor geo columns used by the nearby-vendor discovery service
-- ----------------------------------------------------------------------------
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 6);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 6);
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}';
ALTER TABLE public.vendors ADD COLUMN IF NOT EXISTS opening_hours VARCHAR(100);

-- ----------------------------------------------------------------------------
-- 4. Owner-scoped write policies
--    (schema.sql already created the public SELECT policies)
-- ----------------------------------------------------------------------------

-- Profiles: readable by owner and admins, writable only by the owner.
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Bookings / Eco Passes: strictly owner scoped, admins may read for oversight.
DROP POLICY IF EXISTS "Users can read own bookings" ON public.bookings;
CREATE POLICY "Users can read own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create own bookings" ON public.bookings;
CREATE POLICY "Users can create own bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own bookings" ON public.bookings;
CREATE POLICY "Users can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own bookings" ON public.bookings;
CREATE POLICY "Users can delete own bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Saved itineraries: private to their owner.
DROP POLICY IF EXISTS "Users can read own itineraries" ON public.saved_itineraries;
CREATE POLICY "Users can read own itineraries" ON public.saved_itineraries
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own itineraries" ON public.saved_itineraries;
CREATE POLICY "Users can create own itineraries" ON public.saved_itineraries
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own itineraries" ON public.saved_itineraries;
CREATE POLICY "Users can update own itineraries" ON public.saved_itineraries
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own itineraries" ON public.saved_itineraries;
CREATE POLICY "Users can delete own itineraries" ON public.saved_itineraries
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- Reviews: anyone signed in may post; authors and admins may edit/remove.
DROP POLICY IF EXISTS "Signed in users can post reviews" ON public.reviews;
CREATE POLICY "Signed in users can post reviews" ON public.reviews
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Authors and admins can update reviews" ON public.reviews;
CREATE POLICY "Authors and admins can update reviews" ON public.reviews
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authors and admins can delete reviews" ON public.reviews;
CREATE POLICY "Authors and admins can delete reviews" ON public.reviews
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Vendors: public listing stays readable; hosts may register and edit their own
-- listing, but verification_status can only be changed by an admin.
DROP POLICY IF EXISTS "Hosts can register a vendor listing" ON public.vendors;
CREATE POLICY "Hosts can register a vendor listing" ON public.vendors
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND verification_status = 'pending');

DROP POLICY IF EXISTS "Hosts can update own vendor listing" ON public.vendors;
CREATE POLICY "Hosts can update own vendor listing" ON public.vendors
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- Admin curation of the destination catalogue.
DROP POLICY IF EXISTS "Admins can manage destinations" ON public.destinations;
CREATE POLICY "Admins can manage destinations" ON public.destinations
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ----------------------------------------------------------------------------
-- 5. Bootstrap an administrator (run manually, replace the email)
-- ----------------------------------------------------------------------------
-- INSERT INTO public.user_roles (user_id, role)
-- SELECT id, 'admin' FROM auth.users WHERE email = 'you@example.com'
-- ON CONFLICT DO NOTHING;
