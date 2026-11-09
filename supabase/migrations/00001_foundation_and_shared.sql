-- =============================================================================
-- TASKIT ⚡ — MIGRATION 00001: FOUNDATION & SHARED INFRASTRUCTURE
-- Shared Auth, Profiles, Roles (RBAC), KYC, Notifications, Chat, Ratings, Audit
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ENUMS
DO $$ BEGIN
  CREATE TYPE app_role AS ENUM ('member', 'admin', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE kyc_status_type AS ENUM ('pending', 'under_review', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE id_document_type AS ENUM ('cnic', 'national_id', 'passport', 'driving_licence');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE chat_context_type AS ENUM ('task', 'property_inquiry');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE message_content_type AS ENUM ('text', 'image', 'voice', 'location', 'system');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. PROFILES TABLE (Shared across Task & Real Estate Marketplaces)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(32) UNIQUE,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  secondary_phone VARCHAR(32),
  secondary_phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  email VARCHAR(255),
  full_name VARCHAR(150) NOT NULL DEFAULT '',
  guardian_name VARCHAR(150),
  date_of_birth DATE,
  gender VARCHAR(32),
  country VARCHAR(100) NOT NULL DEFAULT 'Pakistan',
  city VARCHAR(100),
  area VARCHAR(150),
  full_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  avatar_url TEXT,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  kyc_status kyc_status_type NOT NULL DEFAULT 'pending',
  is_verified_agent BOOLEAN NOT NULL DEFAULT FALSE,
  is_verified_developer BOOLEAN NOT NULL DEFAULT FALSE,
  is_suspended BOOLEAN NOT NULL DEFAULT FALSE,
  poster_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  tasker_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  seller_rating NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  tasks_posted_count INTEGER NOT NULL DEFAULT 0,
  tasks_completed_count INTEGER NOT NULL DEFAULT 0,
  properties_listed_count INTEGER NOT NULL DEFAULT 0,
  consent_accepted_at TIMESTAMPTZ,
  deletion_requested_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_minimum_age CHECK (
    date_of_birth IS NULL OR date_of_birth <= (CURRENT_DATE - INTERVAL '18 years')
  )
);

-- 3. USER ROLES (Server-side RBAC)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'member',
  granted_by UUID REFERENCES public.profiles(id),
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. KYC DOCUMENTS (Strictly Private)
CREATE TABLE IF NOT EXISTS public.kyc_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  document_type id_document_type NOT NULL,
  id_number_masked VARCHAR(64) NOT NULL,
  id_number_encrypted TEXT NOT NULL,
  front_storage_path TEXT NOT NULL,
  back_storage_path TEXT,
  selfie_storage_path TEXT NOT NULL,
  selfie_with_id_storage_path TEXT,
  status kyc_status_type NOT NULL DEFAULT 'under_review',
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. NOTIFICATIONS (Translation-key driven for 15 languages)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  marketplace VARCHAR(32) NOT NULL DEFAULT 'shared', -- 'task' | 'real_estate' | 'shared'
  notification_type VARCHAR(64) NOT NULL,
  title_key VARCHAR(128) NOT NULL,
  body_key VARCHAR(128) NOT NULL,
  translation_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  reference_id UUID,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. CHATS & MESSAGES (Shared across Task & Property Inquiry contexts)
CREATE TABLE IF NOT EXISTS public.chats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_type chat_context_type NOT NULL,
  task_id UUID,
  property_inquiry_id UUID,
  property_id UUID,
  participant_one UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ DEFAULT NOW(),
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_chat_context CHECK (
    (context_type = 'task' AND task_id IS NOT NULL) OR
    (context_type = 'property_inquiry' AND property_inquiry_id IS NOT NULL)
  )
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content_type message_content_type NOT NULL DEFAULT 'text',
  body TEXT,
  media_storage_path TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  translated_cache JSONB NOT NULL DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. RATINGS, REPORTS, BLOCKED USERS, APP SETTINGS, AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  context_type VARCHAR(32) NOT NULL DEFAULT 'task', -- 'task' | 'real_estate'
  reference_id UUID NOT NULL,
  reviewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(context_type, reference_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS public.user_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason VARCHAR(120) NOT NULL,
  description TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'open',
  resolved_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.blocked_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(blocker_id, blocked_id)
);

CREATE TABLE IF NOT EXISTS public.app_settings (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES public.profiles(id),
  actor_role VARCHAR(32),
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id UUID,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. HELPER SECURITY FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
      AND role IN ('admin', 'super_admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = check_user_id
      AND role = 'super_admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_kyc_approved(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = check_user_id
      AND kyc_status = 'approved'
      AND is_suspended = FALSE
  );
$$;

-- 9. AUTOMATIC PROFILE CREATION ON AUTH SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.profiles (id, phone, email, full_name)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'member')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 10. ENABLE RLS & FOUNDATION POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: Authenticated users can view basic profiles; owners can update non-privileged fields
CREATE POLICY "Public profiles readable by authenticated" ON public.profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile non-sensitive fields" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (kyc_status IS NOT DISTINCT FROM (SELECT p.kyc_status FROM public.profiles p WHERE p.id = auth.uid()) OR public.is_admin())
    AND (is_suspended IS NOT DISTINCT FROM (SELECT p.is_suspended FROM public.profiles p WHERE p.id = auth.uid()) OR public.is_admin())
  );

-- Roles: Users can read their own roles; only super_admin can mutate roles
CREATE POLICY "Users read own roles or admin reads all" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Super admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- KYC Documents: Strictly owner (insert/select own) and admins
CREATE POLICY "Users view own KYC or admin views all" ON public.kyc_documents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users submit own KYC" ON public.kyc_documents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins review KYC" ON public.kyc_documents
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Notifications: Strictly recipient
CREATE POLICY "Users read and mark own notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Chats & Messages: Strictly participants or admin
CREATE POLICY "Chat participants access" ON public.chats
  FOR SELECT TO authenticated
  USING (participant_one = auth.uid() OR participant_two = auth.uid() OR public.is_admin());

CREATE POLICY "Messages participants access" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid() OR public.is_admin())
    )
  );

CREATE POLICY "Messages participants insert" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.chats c
      WHERE c.id = messages.chat_id
        AND c.is_blocked = FALSE
        AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
    )
  );

-- Audit Logs: Only admins can read; append-only
CREATE POLICY "Admins read audit logs" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());
