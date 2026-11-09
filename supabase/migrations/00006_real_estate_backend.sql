-- =============================================================================
-- TASKIT ⚡ — MIGRATION 00006: REAL ESTATE MARKETPLACE BACKEND
-- Categories, Properties, Media, Private Documents, Inquiries, Viewings,
-- 3-Tier Verification, Projects, Analytics, RLS & Server-Side RPCs
-- =============================================================================

-- 1. REAL ESTATE ENUMS
DO $$ BEGIN
  CREATE TYPE property_listing_type AS ENUM (
    'for_sale',
    'for_rent',
    'wanted_to_buy',
    'wanted_to_rent',
    'commercial_sale',
    'commercial_rental',
    'plot_sale',
    'new_project',
    'development_project'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_type_category AS ENUM (
    'house',
    'apartment',
    'plot_residential',
    'plot_commercial',
    'shop',
    'office',
    'building',
    'agricultural_land',
    'industrial_property',
    'penthouse',
    'villa'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_size_unit AS ENUM (
    'marla',
    'kanal',
    'sq_ft',
    'sq_yd',
    'acres',
    'sq_m'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_verification_status AS ENUM (
    'draft',
    'pending_review',
    'under_verification',
    'verified',
    'rejected',
    'suspended'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_listing_status AS ENUM (
    'active',
    'under_offer',
    'sold',
    'rented',
    'archived',
    'paused'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE property_inquiry_status AS ENUM (
    'new',
    'contacted',
    'viewing_scheduled',
    'negotiating',
    'offer_submitted',
    'accepted',
    'rejected',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE viewing_appointment_status AS ENUM (
    'pending',
    'confirmed',
    'rescheduled',
    'completed',
    'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. STORAGE BUCKETS (Private property-documents vs Public property-media)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('property-documents', 'property-documents', FALSE, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('property-media', 'property-media', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('project-media', 'project-media', TRUE, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for Private property-documents
DROP POLICY IF EXISTS "Owners and admins read property documents" ON storage.objects;
CREATE POLICY "Owners and admins read property documents" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'property-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Owners upload property documents" ON storage.objects;
CREATE POLICY "Owners upload property documents" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'property-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Storage RLS Policies for Public property-media
DROP POLICY IF EXISTS "Public reads property media" ON storage.objects;
CREATE POLICY "Public reads property media" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id IN ('property-media', 'project-media'));

DROP POLICY IF EXISTS "Authenticated upload property media" ON storage.objects;
CREATE POLICY "Authenticated upload property media" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('property-media', 'project-media'));

-- 3. PROPERTY CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.property_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_ur VARCHAR(100) NOT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT '🏡',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial 15 Real Estate Categories
INSERT INTO public.property_categories (slug, name_en, name_ur, icon, sort_order)
VALUES
  ('buy-property', 'Buy Property', 'پراپرٹی خریدیں', '🔑', 1),
  ('sell-property', 'Sell Property', 'پراپرٹی فروخت کریں', '🏷️', 2),
  ('rent-property', 'Rent Property', 'کرائے پر دیں یا لیں', '🏢', 3),
  ('find-property', 'Find a Property', 'پراپرٹی تلاش کریں', '🔍', 4),
  ('residential', 'Residential Property', 'رہائشی پراپرٹی', '🏡', 5),
  ('commercial', 'Commercial Property', 'کمرشل پراپرٹی', '🏬', 6),
  ('plots-land', 'Plots & Land', 'پلاٹس اور اراضی', '📐', 7),
  ('houses', 'Houses', 'مکانات اور ولاز', '🏠', 8),
  ('apartments', 'Apartments', 'اپارٹمنٹس اور فلیٹس', '🏢', 9),
  ('shops', 'Shops', 'دکانیں', '🏪', 10),
  ('offices', 'Offices', 'دفاتر', '💼', 11),
  ('buildings', 'Buildings', 'مکمل عمارتیں', '🏛️', 12),
  ('agricultural-land', 'Agricultural Land', 'زرعی اراضی', '🌾', 13),
  ('new-projects', 'New Projects & Developments', 'نئے ہاؤسنگ پراجیکٹس', '🌆', 14),
  ('agent-services', 'Property Agent Services', 'پراپرٹی ایجنٹ سروسز', '🤝', 15)
ON CONFLICT (slug) DO UPDATE
SET
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- 4. PROPERTIES TABLE
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.property_categories(id) ON DELETE SET NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT NOT NULL,
  listing_type property_listing_type NOT NULL,
  property_type property_type_category NOT NULL,
  price NUMERIC(16,2) NOT NULL CHECK (price >= 0),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  -- Geographic Location
  country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
  city VARCHAR(100) NOT NULL,
  area VARCHAR(150) NOT NULL,
  society VARCHAR(150),
  street_address TEXT,
  hide_exact_address BOOLEAN NOT NULL DEFAULT FALSE,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Area and Specifications (Conditional)
  land_size NUMERIC(12,2) NOT NULL CHECK (land_size > 0),
  size_unit property_size_unit NOT NULL DEFAULT 'marla',
  covered_area NUMERIC(12,2),
  bedrooms INTEGER CHECK (bedrooms >= 0),
  bathrooms INTEGER CHECK (bathrooms >= 0),
  floors INTEGER CHECK (floors >= 0),
  parking_spaces INTEGER CHECK (parking_spaces >= 0),
  furnishing_status VARCHAR(32) DEFAULT 'unfurnished', -- 'unfurnished' | 'semi_furnished' | 'furnished'
  construction_status VARCHAR(32) DEFAULT 'ready', -- 'ready' | 'under_construction' | 'off_plan'
  ownership_status VARCHAR(32) DEFAULT 'freehold', -- 'freehold' | 'leasehold' | 'power_of_attorney'
  is_agent_listing BOOLEAN NOT NULL DEFAULT FALSE,
  -- 3-Tier Verification
  verification_status property_verification_status NOT NULL DEFAULT 'pending_review',
  documents_reviewed BOOLEAN NOT NULL DEFAULT FALSE,
  verified_listing BOOLEAN NOT NULL DEFAULT FALSE,
  listing_status property_listing_status NOT NULL DEFAULT 'active',
  featured_until TIMESTAMPTZ,
  views_count INTEGER NOT NULL DEFAULT 0,
  inquiries_count INTEGER NOT NULL DEFAULT 0,
  favourites_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Geospatial and Discovery Indexes
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(listing_status, verification_status);
CREATE INDEX IF NOT EXISTS idx_properties_city_area ON public.properties(city, area);
CREATE INDEX IF NOT EXISTS idx_properties_type ON public.properties(property_type, listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_price ON public.properties(price);
CREATE INDEX IF NOT EXISTS idx_properties_coords ON public.properties(latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_properties_created ON public.properties(created_at DESC);

-- 5. PROPERTY MEDIA (Public Photos, Video, Floor Plans)
CREATE TABLE IF NOT EXISTS public.property_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  media_type VARCHAR(32) NOT NULL DEFAULT 'photo', -- 'photo' | 'video' | 'floor_plan'
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PROPERTY DOCUMENTS (Private Ownership & Authority Records)
CREATE TABLE IF NOT EXISTS public.property_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type VARCHAR(64) NOT NULL, -- 'title_deed' | 'allotment_letter' | 'tax_receipt' | 'agent_authority_letter'
  storage_path TEXT NOT NULL,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'verified' | 'rejected'
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. PROPERTY FAVOURITES
CREATE TABLE IF NOT EXISTS public.property_favourites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- 8. PROPERTY INQUIRIES & OFFERS
CREATE TABLE IF NOT EXISTS public.property_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  offer_price NUMERIC(16,2),
  status property_inquiry_status NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PROPERTY VIEWING APPOINTMENTS
CREATE TABLE IF NOT EXISTS public.property_viewings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  inquiry_id UUID REFERENCES public.property_inquiries(id) ON DELETE SET NULL,
  buyer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  status viewing_appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PROPERTY REPORTS & MODERATION
CREATE TABLE IF NOT EXISTS public.property_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'open', -- 'open' | 'investigating' | 'resolved'
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. NEW DEVELOPMENTS & PROJECTS
CREATE TABLE IF NOT EXISTS public.property_projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  developer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_name VARCHAR(180) NOT NULL,
  developer_name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  location_address TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  construction_status VARCHAR(64) NOT NULL DEFAULT 'under_construction',
  total_units INTEGER,
  price_from NUMERIC(16,2) NOT NULL,
  price_to NUMERIC(16,2),
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  is_verified_project BOOLEAN NOT NULL DEFAULT FALSE,
  featured_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.property_project_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.property_projects(id) ON DELETE CASCADE,
  media_type VARCHAR(32) NOT NULL DEFAULT 'photo',
  storage_path TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. RPC: CREATE PROPERTY LISTING
CREATE OR REPLACE FUNCTION public.create_property_listing(
  p_title VARCHAR(180),
  p_description TEXT,
  p_listing_type property_listing_type,
  p_property_type property_type_category,
  p_price NUMERIC(16,2),
  p_currency VARCHAR(10),
  p_city VARCHAR(100),
  p_area VARCHAR(150),
  p_society VARCHAR(150),
  p_street_address TEXT,
  p_hide_exact_address BOOLEAN,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_land_size NUMERIC(12,2),
  p_size_unit property_size_unit,
  p_covered_area NUMERIC(12,2),
  p_bedrooms INTEGER,
  p_bathrooms INTEGER,
  p_floors INTEGER,
  p_parking_spaces INTEGER,
  p_furnishing_status VARCHAR(32),
  p_construction_status VARCHAR(32),
  p_ownership_status VARCHAR(32),
  p_is_agent_listing BOOLEAN,
  p_media_paths TEXT[],
  p_document_paths TEXT[] DEFAULT '{}'::text[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_owner_id UUID := auth.uid();
  v_property_id UUID;
  v_idx INTEGER;
  v_path TEXT;
  v_is_kyc_ok BOOLEAN;
BEGIN
  IF v_owner_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to publish property listings';
  END IF;

  v_is_kyc_ok := public.is_kyc_approved(v_owner_id);
  IF NOT v_is_kyc_ok THEN
    RAISE EXCEPTION 'Approved KYC verification is required before publishing real estate listings';
  END IF;

  IF p_price < 0 THEN
    RAISE EXCEPTION 'Price cannot be negative';
  END IF;

  IF p_land_size <= 0 THEN
    RAISE EXCEPTION 'Property size must be greater than zero';
  END IF;

  INSERT INTO public.properties (
    owner_id,
    title,
    description,
    listing_type,
    property_type,
    price,
    currency,
    city,
    area,
    society,
    street_address,
    hide_exact_address,
    latitude,
    longitude,
    land_size,
    size_unit,
    covered_area,
    bedrooms,
    bathrooms,
    floors,
    parking_spaces,
    furnishing_status,
    construction_status,
    ownership_status,
    is_agent_listing,
    verification_status,
    listing_status
  )
  VALUES (
    v_owner_id,
    trim(p_title),
    trim(p_description),
    p_listing_type,
    p_property_type,
    p_price,
    COALESCE(p_currency, 'PKR'),
    trim(p_city),
    trim(p_area),
    NULLIF(trim(p_society), ''),
    NULLIF(trim(p_street_address), ''),
    COALESCE(p_hide_exact_address, FALSE),
    p_latitude,
    p_longitude,
    p_land_size,
    p_size_unit,
    p_covered_area,
    p_bedrooms,
    p_bathrooms,
    p_floors,
    p_parking_spaces,
    COALESCE(p_furnishing_status, 'unfurnished'),
    COALESCE(p_construction_status, 'ready'),
    COALESCE(p_ownership_status, 'freehold'),
    COALESCE(p_is_agent_listing, FALSE),
    'pending_review',
    'active'
  )
  RETURNING id INTO v_property_id;

  -- Insert Public Media
  IF p_media_paths IS NOT NULL AND array_length(p_media_paths, 1) > 0 THEN
    FOR v_idx IN 1..array_length(p_media_paths, 1) LOOP
      INSERT INTO public.property_media (property_id, storage_path, sort_order)
      VALUES (v_property_id, p_media_paths[v_idx], v_idx);
    END LOOP;
  END IF;

  -- Insert Private Documents
  IF p_document_paths IS NOT NULL AND array_length(p_document_paths, 1) > 0 THEN
    FOREACH v_path IN ARRAY p_document_paths LOOP
      INSERT INTO public.property_documents (property_id, owner_id, document_type, storage_path)
      VALUES (v_property_id, v_owner_id, 'ownership_deed', v_path);
    END LOOP;
  END IF;

  -- Increment user's listed properties count
  UPDATE public.profiles
  SET properties_listed_count = properties_listed_count + 1, updated_at = NOW()
  WHERE id = v_owner_id;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_owner_id,
    'member',
    'PROPERTY_LISTED',
    'properties',
    v_property_id,
    jsonb_build_object('title', p_title, 'price', p_price, 'city', p_city)
  );

  RETURN v_property_id;
END;
$$;

-- 13. RPC: ADMIN REVIEW PROPERTY (3-Tier Verification Approval)
CREATE OR REPLACE FUNCTION public.admin_review_property(
  p_property_id UUID,
  p_verification_status property_verification_status,
  p_documents_reviewed BOOLEAN DEFAULT FALSE,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_prop public.properties%ROWTYPE;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Administrator privileges required';
  END IF;

  SELECT * INTO v_prop FROM public.properties WHERE id = p_property_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  UPDATE public.properties
  SET
    verification_status = p_verification_status,
    documents_reviewed = p_documents_reviewed,
    verified_listing = (p_verification_status = 'verified'),
    updated_at = NOW()
  WHERE id = p_property_id;

  -- Notify Owner
  INSERT INTO public.notifications (
    user_id,
    marketplace,
    notification_type,
    title_key,
    body_key,
    translation_params,
    reference_id
  )
  VALUES (
    v_prop.owner_id,
    'real_estate',
    'property_reviewed',
    CASE WHEN p_verification_status = 'verified' THEN 'realEstate.notifyVerifiedTitle' ELSE 'realEstate.notifyStatusTitle' END,
    CASE WHEN p_verification_status = 'verified' THEN 'realEstate.notifyVerifiedBody' ELSE 'realEstate.notifyStatusBody' END,
    jsonb_build_object('property_title', v_prop.title, 'status', p_verification_status),
    p_property_id
  );

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'admin',
    'PROPERTY_REVIEW_' || upper(p_verification_status::text),
    'properties',
    p_property_id,
    jsonb_build_object('status', p_verification_status, 'documents_reviewed', p_documents_reviewed)
  );

  RETURN TRUE;
END;
$$;

-- 14. RPC: CREATE INQUIRY OR OFFER
CREATE OR REPLACE FUNCTION public.create_property_inquiry(
  p_property_id UUID,
  p_message TEXT,
  p_offer_price NUMERIC(16,2) DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id UUID := auth.uid();
  v_prop public.properties%ROWTYPE;
  v_inq_id UUID;
  v_chat_id UUID;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_prop FROM public.properties WHERE id = p_property_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF v_prop.owner_id = v_buyer_id THEN
    RAISE EXCEPTION 'Sellers cannot submit inquiries on their own property';
  END IF;

  INSERT INTO public.property_inquiries (
    property_id,
    buyer_id,
    seller_id,
    message,
    offer_price,
    status
  )
  VALUES (
    p_property_id,
    v_buyer_id,
    v_prop.owner_id,
    trim(p_message),
    p_offer_price,
    CASE WHEN p_offer_price IS NOT NULL THEN 'offer_submitted' ELSE 'new' END
  )
  RETURNING id INTO v_inq_id;

  -- Increment inquiries count on property
  UPDATE public.properties
  SET inquiries_count = inquiries_count + 1, updated_at = NOW()
  WHERE id = p_property_id;

  -- Create shared chat room for this inquiry
  INSERT INTO public.chats (
    context_type,
    property_inquiry_id,
    property_id,
    participant_one,
    participant_two
  )
  VALUES (
    'property_inquiry',
    v_inq_id,
    p_property_id,
    v_buyer_id,
    v_prop.owner_id
  )
  RETURNING id INTO v_chat_id;

  -- Add initial message
  INSERT INTO public.messages (chat_id, sender_id, body)
  VALUES (v_chat_id, v_buyer_id, trim(p_message));

  -- Notify Seller
  INSERT INTO public.notifications (
    user_id,
    marketplace,
    notification_type,
    title_key,
    body_key,
    translation_params,
    reference_id
  )
  VALUES (
    v_prop.owner_id,
    'real_estate',
    'new_inquiry',
    'realEstate.notifyInquiryTitle',
    'realEstate.notifyInquiryBody',
    jsonb_build_object('property_title', v_prop.title, 'buyer_id', v_buyer_id),
    p_property_id
  );

  RETURN v_inq_id;
END;
$$;

-- 15. RPC: SCHEDULE PROPERTY VIEWING
CREATE OR REPLACE FUNCTION public.schedule_property_viewing(
  p_property_id UUID,
  p_inquiry_id UUID,
  p_scheduled_at TIMESTAMPTZ,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_buyer_id UUID := auth.uid();
  v_prop public.properties%ROWTYPE;
  v_view_id UUID;
BEGIN
  IF v_buyer_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_prop FROM public.properties WHERE id = p_property_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Property not found';
  END IF;

  IF p_scheduled_at <= NOW() THEN
    RAISE EXCEPTION 'Viewing appointment must be in the future';
  END IF;

  INSERT INTO public.property_viewings (
    property_id,
    inquiry_id,
    buyer_id,
    seller_id,
    scheduled_at,
    notes,
    status
  )
  VALUES (
    p_property_id,
    p_inquiry_id,
    v_buyer_id,
    v_prop.owner_id,
    p_scheduled_at,
    p_notes,
    'pending'
  )
  RETURNING id INTO v_view_id;

  -- Notify Seller
  INSERT INTO public.notifications (
    user_id,
    marketplace,
    notification_type,
    title_key,
    body_key,
    translation_params,
    reference_id
  )
  VALUES (
    v_prop.owner_id,
    'real_estate',
    'viewing_requested',
    'realEstate.notifyViewingTitle',
    'realEstate.notifyViewingBody',
    jsonb_build_object('scheduled_at', p_scheduled_at),
    p_property_id
  );

  RETURN v_view_id;
END;
$$;

-- 16. RPC: TOGGLE FAVOURITE
CREATE OR REPLACE FUNCTION public.toggle_property_favourite(p_property_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_exists BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT EXISTS(
    SELECT 1 FROM public.property_favourites
    WHERE user_id = v_user_id AND property_id = p_property_id
  ) INTO v_exists;

  IF v_exists THEN
    DELETE FROM public.property_favourites
    WHERE user_id = v_user_id AND property_id = p_property_id;

    UPDATE public.properties
    SET favourites_count = GREATEST(0, favourites_count - 1), updated_at = NOW()
    WHERE id = p_property_id;
    RETURN FALSE;
  ELSE
    INSERT INTO public.property_favourites (user_id, property_id)
    VALUES (v_user_id, p_property_id);

    UPDATE public.properties
    SET favourites_count = favourites_count + 1, updated_at = NOW()
    WHERE id = p_property_id;
    RETURN TRUE;
  END IF;
END;
$$;

-- 17. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.property_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_favourites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_viewings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_project_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads property categories" ON public.property_categories
  FOR SELECT USING (true);

CREATE POLICY "Active properties read by all" ON public.properties
  FOR SELECT USING (
    listing_status = 'active'
    OR owner_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Owners insert properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners update own properties" ON public.properties
  FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Public reads property media" ON public.property_media
  FOR SELECT USING (true);

CREATE POLICY "Owners insert property media" ON public.property_media
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.properties p WHERE p.id = property_media.property_id AND p.owner_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Private property documents read by owner or admin" ON public.property_documents
  FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR public.is_admin());

CREATE POLICY "Owners insert private property documents" ON public.property_documents
  FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users manage own favourites" ON public.property_favourites
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Inquiries read by buyer, seller, or admin" ON public.property_inquiries
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

CREATE POLICY "Buyers insert inquiries" ON public.property_inquiries
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Viewings read by buyer, seller, or admin" ON public.property_viewings
  FOR SELECT TO authenticated
  USING (buyer_id = auth.uid() OR seller_id = auth.uid() OR public.is_admin());

CREATE POLICY "Buyers insert viewings" ON public.property_viewings
  FOR INSERT TO authenticated
  WITH CHECK (buyer_id = auth.uid());

CREATE POLICY "Public reads verified projects" ON public.property_projects
  FOR SELECT USING (true);

CREATE POLICY "Developers insert projects" ON public.property_projects
  FOR INSERT TO authenticated
  WITH CHECK (developer_id = auth.uid());

CREATE POLICY "Public reads project media" ON public.property_project_media
  FOR SELECT USING (true);
