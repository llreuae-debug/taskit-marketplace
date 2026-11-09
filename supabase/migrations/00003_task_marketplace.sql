-- =============================================================================
-- TASKIT ⚡ — MIGRATION 00003: TASK MARKETPLACE CORE & ATOMIC ACCEPTANCE
-- Categories, Tasks, Task Offers, Status Log, Atomic Row-Locking RPC
-- =============================================================================

-- 1. TASK ENUMS
DO $$ BEGIN
  CREATE TYPE task_status_type AS ENUM (
    'draft',
    'open',
    'accepted',
    'in_progress',
    'submitted',
    'completed',
    'rated',
    'cancelled',
    'expired',
    'disputed',
    'resolved'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_acceptance_method AS ENUM (
    'instant',
    'offer_only',
    'both'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_location_type AS ENUM (
    'physical_single',
    'physical_pickup_dropoff',
    'online'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug VARCHAR(64) UNIQUE NOT NULL,
  name_en VARCHAR(100) NOT NULL,
  name_ur VARCHAR(100) NOT NULL,
  icon VARCHAR(16) NOT NULL DEFAULT '⚡',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  custom_fields JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Initial 14 Categories
INSERT INTO public.categories (slug, name_en, name_ur, icon, sort_order, custom_fields)
VALUES
  ('car-parts-finder', 'Car Parts Finder', 'کار پارٹس فائنڈر', '🔧', 1, '[{"name": "vehicle_model", "type": "text", "label": "Vehicle Make & Model", "required": true}]'::jsonb),
  ('delivery-courier', 'Delivery / Courier', 'ڈلیوری / کوریئر', '📦', 2, '[{"name": "package_size", "type": "select", "options": ["Small", "Medium", "Large"], "required": true}]'::jsonb),
  ('grocery-shopping', 'Grocery & Shopping', 'گروسری اور خریداری', '🛒', 3, '[]'::jsonb),
  ('pharmacy-pickup', 'Pharmacy Pickup', 'فارمیسی سے ادویات', '💊', 4, '[{"name": "prescription_required", "type": "boolean", "label": "Prescription Needed", "required": true}]'::jsonb),
  ('documents-banking', 'Documents & Banking', 'دستاویزات اور بینکنگ', '🏦', 5, '[]'::jsonb),
  ('queue-line-standing', 'Queue / Line Standing', 'قطار میں کھڑے ہونا', '⏳', 6, '[]'::jsonb),
  ('repairs-handyman', 'Repairs & Handyman', 'مرمت اور ہینڈی مین', '🛠️', 7, '[]'::jsonb),
  ('cleaning', 'Cleaning', 'صفائی کی سروس', '🧹', 8, '[]'::jsonb),
  ('moving-lifting', 'Moving & Lifting', 'سامان کی منتقلی', '🚚', 9, '[]'::jsonb),
  ('pet-care', 'Pet Care', 'پالتو جانوروں کی دیکھ بھال', '🐾', 10, '[]'::jsonb),
  ('online-digital', 'Online / Digital Tasks', 'آن لائن اور ڈیجیٹل سروسز', '💻', 11, '[]'::jsonb),
  ('photography-video', 'Photography & Video', 'فوٹوگرافی اور ویڈیو', '📸', 12, '[]'::jsonb),
  ('gifts-surprises', 'Gifts & Surprises', 'تحائف اور سرپرائز', '🎁', 13, '[]'::jsonb),
  ('anything-else', 'Anything Else', 'کوئی اور کام', '⚡', 14, '[]'::jsonb)
ON CONFLICT (slug) DO UPDATE
SET
  name_en = EXCLUDED.name_en,
  name_ur = EXCLUDED.name_ur,
  icon = EXCLUDED.icon,
  sort_order = EXCLUDED.sort_order;

-- 3. TASKS TABLE
CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poster_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tasker_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  title VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  voice_note_path TEXT,
  photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  location_type task_location_type NOT NULL DEFAULT 'physical_single',
  -- Task Location (Single or Primary)
  location_name VARCHAR(200),
  location_address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  -- Pickup Location (for courier / deliveries)
  pickup_name VARCHAR(200),
  pickup_address TEXT,
  pickup_latitude DOUBLE PRECISION,
  pickup_longitude DOUBLE PRECISION,
  -- Dropoff Location (for courier / deliveries)
  dropoff_name VARCHAR(200),
  dropoff_address TEXT,
  dropoff_latitude DOUBLE PRECISION,
  dropoff_longitude DOUBLE PRECISION,
  -- Pricing & Escrow
  currency VARCHAR(10) NOT NULL DEFAULT 'PKR',
  task_charges NUMERIC(12,2) NOT NULL CHECK (task_charges >= 100),
  expense_budget NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (expense_budget >= 0),
  service_fee NUMERIC(12,2) NOT NULL DEFAULT 0.00 CHECK (service_fee >= 0),
  tasker_amount NUMERIC(12,2) NOT NULL CHECK (tasker_amount >= 0),
  -- Execution Parameters
  deadline TIMESTAMPTZ NOT NULL,
  acceptance_method task_acceptance_method NOT NULL DEFAULT 'instant',
  status task_status_type NOT NULL DEFAULT 'open',
  completion_code VARCHAR(4),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  auto_approval_deadline TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  disputed_at TIMESTAMPTZ,
  custom_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_deadline_future CHECK (deadline > created_at)
);

-- Indexing for high-performance geospatial and filtered feed discovery
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON public.tasks(category_id);
CREATE INDEX IF NOT EXISTS idx_tasks_poster ON public.tasks(poster_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tasker ON public.tasks(tasker_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON public.tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON public.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_coords ON public.tasks(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 4. TASK OFFERS TABLE (for Offer / Counter-Price negotiation)
CREATE TABLE IF NOT EXISTS public.task_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  offered_price NUMERIC(12,2) NOT NULL CHECK (offered_price >= 100),
  comment TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(task_id, tasker_id)
);

-- 5. TASK STATUS LOG
CREATE TABLE IF NOT EXISTS public.task_status_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  from_status task_status_type,
  to_status task_status_type NOT NULL,
  changed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. ATOMIC TASK ACCEPTANCE RPC WITH ROW LOCKING
-- Guarantees that only ONE verified tasker can accept an open task.
CREATE OR REPLACE FUNCTION public.accept_task(
  p_task_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tasker_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
  v_completion_code VARCHAR(4);
  v_is_kyc_ok BOOLEAN;
BEGIN
  IF v_tasker_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to accept tasks';
  END IF;

  -- 1. Check verified KYC status of accepting member
  v_is_kyc_ok := public.is_kyc_approved(v_tasker_id);
  IF NOT v_is_kyc_ok THEN
    RAISE EXCEPTION 'Identity verification (KYC) must be approved to accept tasks';
  END IF;

  -- 2. ATOMIC ROW LOCK: acquire exclusive lock immediately or fail fast
  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE NOWAIT;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found with ID %', p_task_id;
  END IF;

  -- 3. Verify task is in 'open' status
  IF v_task.status <> 'open' THEN
    RAISE EXCEPTION 'Task is no longer open for acceptance (Current status: %)', v_task.status;
  END IF;

  -- 4. Poster cannot accept their own task
  IF v_task.poster_id = v_tasker_id THEN
    RAISE EXCEPTION 'Posters cannot accept their own tasks';
  END IF;

  -- 5. Verify deadline has not passed
  IF v_task.deadline <= NOW() THEN
    UPDATE public.tasks SET status = 'expired', updated_at = NOW() WHERE id = p_task_id;
    RAISE EXCEPTION 'Task deadline has already expired';
  END IF;

  -- 6. Generate 4-digit completion code
  v_completion_code := lpad(floor(random() * 10000)::text, 4, '0');

  -- 7. Update task to accepted
  UPDATE public.tasks
  SET
    tasker_id = v_tasker_id,
    status = 'accepted',
    accepted_at = NOW(),
    completion_code = v_completion_code,
    updated_at = NOW()
  WHERE id = p_task_id;

  -- 8. Record in status log
  INSERT INTO public.task_status_log (task_id, from_status, to_status, changed_by, notes)
  VALUES (p_task_id, 'open', 'accepted', v_tasker_id, 'Task accepted instantly via atomic lock');

  -- 9. Notify Poster
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
    v_task.poster_id,
    'task',
    'task_accepted',
    'tasks.notifyAcceptedTitle',
    'tasks.notifyAcceptedBody',
    jsonb_build_object('task_title', v_task.title, 'task_id', p_task_id),
    p_task_id
  );

  -- 10. Audit log
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_tasker_id,
    'member',
    'TASK_ACCEPTED_ATOMIC',
    'tasks',
    p_task_id,
    jsonb_build_object('poster_id', v_task.poster_id, 'tasker_id', v_tasker_id, 'amount', v_task.tasker_amount)
  );

  RETURN jsonb_build_object(
    'success', true,
    'task_id', p_task_id,
    'status', 'accepted',
    'tasker_id', v_tasker_id,
    'accepted_at', NOW()
  );
END;
$$;

-- 7. CREATE TASK RPC
CREATE OR REPLACE FUNCTION public.create_task(
  p_category_id UUID,
  p_title VARCHAR(150),
  p_description TEXT,
  p_voice_note_path TEXT,
  p_photos TEXT[],
  p_location_type task_location_type,
  p_location_name VARCHAR(200),
  p_location_address TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_pickup_name VARCHAR(200),
  p_pickup_address TEXT,
  p_pickup_latitude DOUBLE PRECISION,
  p_pickup_longitude DOUBLE PRECISION,
  p_dropoff_name VARCHAR(200),
  p_dropoff_address TEXT,
  p_dropoff_latitude DOUBLE PRECISION,
  p_dropoff_longitude DOUBLE PRECISION,
  p_currency VARCHAR(10),
  p_task_charges NUMERIC(12,2),
  p_expense_budget NUMERIC(12,2),
  p_deadline TIMESTAMPTZ,
  p_acceptance_method task_acceptance_method,
  p_custom_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_poster_id UUID := auth.uid();
  v_task_id UUID;
  v_service_fee NUMERIC(12,2);
  v_tasker_amount NUMERIC(12,2);
  v_fee_percent NUMERIC(5,2) := 10.0;
  v_is_kyc_ok BOOLEAN;
BEGIN
  IF v_poster_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to post tasks';
  END IF;

  v_is_kyc_ok := public.is_kyc_approved(v_poster_id);
  IF NOT v_is_kyc_ok THEN
    RAISE EXCEPTION 'Identity verification (KYC) must be approved to post tasks';
  END IF;

  IF p_task_charges < 100 THEN
    RAISE EXCEPTION 'Minimum task charge is 100 %', COALESCE(p_currency, 'PKR');
  END IF;

  IF p_deadline <= NOW() THEN
    RAISE EXCEPTION 'Deadline must be a future date and time';
  END IF;

  -- Calculate server-side fee breakdown (10% default platform fee)
  v_service_fee := round((p_task_charges * (v_fee_percent / 100.0)), 2);
  v_tasker_amount := p_task_charges - v_service_fee;

  INSERT INTO public.tasks (
    poster_id,
    category_id,
    title,
    description,
    voice_note_path,
    photos,
    location_type,
    location_name,
    location_address,
    latitude,
    longitude,
    pickup_name,
    pickup_address,
    pickup_latitude,
    pickup_longitude,
    dropoff_name,
    dropoff_address,
    dropoff_latitude,
    dropoff_longitude,
    currency,
    task_charges,
    expense_budget,
    service_fee,
    tasker_amount,
    deadline,
    acceptance_method,
    status,
    custom_data
  )
  VALUES (
    v_poster_id,
    p_category_id,
    trim(p_title),
    trim(p_description),
    p_voice_note_path,
    COALESCE(p_photos, '{}'::text[]),
    p_location_type,
    p_location_name,
    p_location_address,
    p_latitude,
    p_longitude,
    p_pickup_name,
    p_pickup_address,
    p_pickup_latitude,
    p_pickup_longitude,
    p_dropoff_name,
    p_dropoff_address,
    p_dropoff_latitude,
    p_dropoff_longitude,
    COALESCE(p_currency, 'PKR'),
    p_task_charges,
    COALESCE(p_expense_budget, 0.00),
    v_service_fee,
    v_tasker_amount,
    p_deadline,
    COALESCE(p_acceptance_method, 'instant'),
    'open',
    COALESCE(p_custom_data, '{}'::jsonb)
  )
  RETURNING id INTO v_task_id;

  -- Increment user's tasks_posted_count
  UPDATE public.profiles
  SET tasks_posted_count = tasks_posted_count + 1, updated_at = NOW()
  WHERE id = v_poster_id;

  -- Log initial status
  INSERT INTO public.task_status_log (task_id, from_status, to_status, changed_by, notes)
  VALUES (v_task_id, NULL, 'open', v_poster_id, 'Task published to open marketplace');

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_poster_id,
    'member',
    'TASK_CREATED',
    'tasks',
    v_task_id,
    jsonb_build_object('title', p_title, 'charges', p_task_charges, 'category_id', p_category_id)
  );

  RETURN v_task_id;
END;
$$;

-- 8. ROW LEVEL SECURITY (RLS) FOR TASKS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_status_log ENABLE ROW LEVEL SECURITY;

-- Categories: Read by all, mutate only by admin
CREATE POLICY "Categories read by all" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Categories managed by admin" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Tasks: Open tasks readable by all authenticated members
CREATE POLICY "Tasks read open or participant" ON public.tasks
  FOR SELECT TO authenticated
  USING (
    status = 'open'
    OR poster_id = auth.uid()
    OR tasker_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Posters create tasks" ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (poster_id = auth.uid());

CREATE POLICY "Posters update own open tasks" ON public.tasks
  FOR UPDATE TO authenticated
  USING (poster_id = auth.uid() OR tasker_id = auth.uid() OR public.is_admin())
  WITH CHECK (poster_id = auth.uid() OR tasker_id = auth.uid() OR public.is_admin());

-- Task Offers: Participants & Admin
CREATE POLICY "Offers read by poster or tasker" ON public.task_offers
  FOR SELECT TO authenticated
  USING (
    tasker_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_offers.task_id AND t.poster_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Verified taskers submit offers" ON public.task_offers
  FOR INSERT TO authenticated
  WITH CHECK (
    tasker_id = auth.uid()
    AND public.is_kyc_approved(auth.uid())
  );
