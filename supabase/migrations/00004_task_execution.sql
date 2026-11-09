-- =============================================================================
-- TASKIT ⚡ — MIGRATION 00004: TASK EXECUTION, PROOFS, COMPLETION CODE,
-- EXTENSIONS, DISPUTES, SOS & RATINGS
-- =============================================================================

-- 1. TASK PROOFS TABLE
CREATE TABLE IF NOT EXISTS public.task_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  receipt_photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  auto_approved BOOLEAN NOT NULL DEFAULT FALSE
);

-- 2. TIME EXTENSION REQUESTS
CREATE TABLE IF NOT EXISTS public.time_extension_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  tasker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  additional_minutes INTEGER NOT NULL CHECK (additional_minutes > 0 AND additional_minutes <= 1440), -- max 24h
  reason TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

-- 3. TASK DISPUTES
CREATE TABLE IF NOT EXISTS public.task_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  raised_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason VARCHAR(150) NOT NULL,
  description TEXT NOT NULL,
  evidence_photos TEXT[] NOT NULL DEFAULT '{}'::text[],
  status VARCHAR(32) NOT NULL DEFAULT 'open', -- 'open' | 'investigating' | 'resolved'
  resolution_type VARCHAR(64), -- 'full_refund' | 'full_release' | 'split_settlement' | 'cancelled'
  refund_amount NUMERIC(12,2) DEFAULT 0.00,
  payout_amount NUMERIC(12,2) DEFAULT 0.00,
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SOS ALERTS (Emergency Safety Infrastructure)
CREATE TABLE IF NOT EXISTS public.sos_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  notes TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'active', -- 'active' | 'resolved'
  resolved_by UUID REFERENCES public.profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. STORAGE BUCKET FOR TASK PROOFS (Private bucket)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('task-proofs', 'task-proofs', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Task participants read proofs" ON storage.objects;
CREATE POLICY "Task participants read proofs" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'task-proofs'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

DROP POLICY IF EXISTS "Taskers upload proof" ON storage.objects;
CREATE POLICY "Taskers upload proof" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'task-proofs'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 6. RPC: UPDATE TASK EXECUTION STATUS (On My Way / Started / In Progress)
CREATE OR REPLACE FUNCTION public.update_task_execution_status(
  p_task_id UUID,
  p_new_status task_status_type,
  p_note TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.tasker_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the assigned tasker can update execution status';
  END IF;

  IF p_new_status = 'in_progress' AND v_task.status = 'accepted' THEN
    UPDATE public.tasks
    SET
      status = 'in_progress',
      started_at = NOW(),
      updated_at = NOW()
    WHERE id = p_task_id;
  ELSE
    RAISE EXCEPTION 'Invalid status transition from % to %', v_task.status, p_new_status;
  END IF;

  INSERT INTO public.task_status_log (task_id, from_status, to_status, changed_by, notes)
  VALUES (p_task_id, v_task.status, p_new_status, v_user_id, COALESCE(p_note, 'Task marked in progress'));

  -- Notify Poster
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
    'task_started',
    'tasks.notifyStartedTitle',
    'tasks.notifyStartedBody',
    jsonb_build_object('task_title', v_task.title),
    p_task_id
  );

  RETURN jsonb_build_object('success', true, 'status', p_new_status);
END;
$$;

-- 7. RPC: SUBMIT PROOF (Tasker uploads proof photos & receipts)
CREATE OR REPLACE FUNCTION public.submit_task_proof(
  p_task_id UUID,
  p_proof_photos TEXT[],
  p_receipt_photos TEXT[] DEFAULT '{}'::text[],
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
  v_proof_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.tasker_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the assigned tasker can submit completion proof';
  END IF;

  IF v_task.status NOT IN ('accepted', 'in_progress') THEN
    RAISE EXCEPTION 'Proof can only be submitted for accepted or in-progress tasks (Current: %)', v_task.status;
  END IF;

  IF array_length(p_proof_photos, 1) IS NULL OR array_length(p_proof_photos, 1) = 0 THEN
    RAISE EXCEPTION 'At least one proof photo is required';
  END IF;

  -- Insert Proof record
  INSERT INTO public.task_proofs (
    task_id,
    tasker_id,
    proof_photos,
    receipt_photos,
    notes
  )
  VALUES (
    p_task_id,
    v_user_id,
    p_proof_photos,
    COALESCE(p_receipt_photos, '{}'::text[]),
    p_notes
  )
  RETURNING id INTO v_proof_id;

  -- Transition task to submitted, set 24h auto-approval deadline
  UPDATE public.tasks
  SET
    status = 'submitted',
    submitted_at = NOW(),
    auto_approval_deadline = NOW() + INTERVAL '24 hours',
    updated_at = NOW()
  WHERE id = p_task_id;

  INSERT INTO public.task_status_log (task_id, from_status, to_status, changed_by, notes)
  VALUES (p_task_id, v_task.status, 'submitted', v_user_id, 'Completion proof submitted');

  -- Notify Poster
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
    'proof_submitted',
    'tasks.notifyProofSubmittedTitle',
    'tasks.notifyProofSubmittedBody',
    jsonb_build_object('task_title', v_task.title),
    p_task_id
  );

  RETURN v_proof_id;
END;
$$;

-- 8. RPC: COMPLETE TASK (Via 4-Digit Code OR Poster Approval)
CREATE OR REPLACE FUNCTION public.complete_task(
  p_task_id UUID,
  p_entered_code VARCHAR(4) DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.status NOT IN ('accepted', 'in_progress', 'submitted') THEN
    RAISE EXCEPTION 'Task cannot be completed from status %', v_task.status;
  END IF;

  -- Validation: If caller is Poster, they can approve directly.
  -- If caller is Tasker, they MUST provide the correct 4-digit code given to them by Poster.
  IF v_user_id = v_task.poster_id THEN
    -- Poster approving proof directly
    NULL;
  ELSIF v_user_id = v_task.tasker_id THEN
    IF p_entered_code IS NULL OR p_entered_code <> v_task.completion_code THEN
      RAISE EXCEPTION 'Invalid 4-digit completion code';
    END IF;
  ELSIF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized to complete this task';
  END IF;

  -- Mark task completed
  UPDATE public.tasks
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id;

  -- Update tasker completed count
  UPDATE public.profiles
  SET tasks_completed_count = tasks_completed_count + 1, updated_at = NOW()
  WHERE id = v_task.tasker_id;

  -- Update task proof record if exists
  UPDATE public.task_proofs
  SET approved_at = NOW()
  WHERE task_id = p_task_id AND approved_at IS NULL;

  INSERT INTO public.task_status_log (task_id, from_status, to_status, changed_by, notes)
  VALUES (p_task_id, v_task.status, 'completed', v_user_id, 'Task marked completed');

  -- Notify Both Members
  INSERT INTO public.notifications (user_id, marketplace, notification_type, title_key, body_key, reference_id)
  VALUES
    (v_task.tasker_id, 'task', 'task_completed', 'tasks.notifyCompletedTitle', 'tasks.notifyCompletedBody', p_task_id),
    (v_task.poster_id, 'task', 'task_completed', 'tasks.notifyCompletedTitle', 'tasks.notifyCompletedBody', p_task_id);

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_user_id,
    'member',
    'TASK_COMPLETED',
    'tasks',
    p_task_id,
    jsonb_build_object('poster_id', v_task.poster_id, 'tasker_id', v_tasker_id, 'amount', v_task.tasker_amount)
  );

  RETURN jsonb_build_object('success', true, 'status', 'completed', 'completed_at', NOW());
END;
$$;

-- 9. RPC: TIME EXTENSION REQUEST & RESPONSE
CREATE OR REPLACE FUNCTION public.request_time_extension(
  p_task_id UUID,
  p_additional_minutes INTEGER,
  p_reason TEXT
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
  v_req_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = p_task_id;

  IF NOT FOUND OR v_task.tasker_id <> v_user_id THEN
    RAISE EXCEPTION 'Only the assigned tasker can request a deadline extension';
  END IF;

  IF p_additional_minutes <= 0 OR p_additional_minutes > 1440 THEN
    RAISE EXCEPTION 'Extension minutes must be between 1 and 1440 (24 hours)';
  END IF;

  INSERT INTO public.time_extension_requests (
    task_id,
    tasker_id,
    additional_minutes,
    reason
  )
  VALUES (
    p_task_id,
    v_user_id,
    p_additional_minutes,
    p_reason
  )
  RETURNING id INTO v_req_id;

  -- Notify Poster
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
    'extension_requested',
    'tasks.notifyExtensionTitle',
    'tasks.notifyExtensionBody',
    jsonb_build_object('minutes', p_additional_minutes),
    p_task_id
  );

  RETURN v_req_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_time_extension(
  p_request_id UUID,
  p_approved BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_req public.time_extension_requests%ROWTYPE;
  v_task public.tasks%ROWTYPE;
BEGIN
  SELECT * INTO v_req
  FROM public.time_extension_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Extension request not found';
  END IF;

  SELECT * INTO v_task
  FROM public.tasks
  WHERE id = v_req.task_id;

  IF v_task.poster_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only the poster can approve or reject deadline extensions';
  END IF;

  UPDATE public.time_extension_requests
  SET
    status = CASE WHEN p_approved THEN 'approved' ELSE 'rejected' END,
    responded_at = NOW()
  WHERE id = p_request_id;

  IF p_approved THEN
    UPDATE public.tasks
    SET
      deadline = deadline + (v_req.additional_minutes || ' minutes')::interval,
      updated_at = NOW()
    WHERE id = v_req.task_id;
  END IF;

  RETURN TRUE;
END;
$$;

-- 10. RPC: DISPUTES & SOS ALERTS
CREATE OR REPLACE FUNCTION public.submit_task_dispute(
  p_task_id UUID,
  p_reason VARCHAR(150),
  p_description TEXT,
  p_evidence_photos TEXT[] DEFAULT '{}'::text[]
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
  v_dispute_id UUID;
BEGIN
  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.poster_id <> v_user_id AND v_task.tasker_id <> v_user_id AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only task participants can raise a dispute';
  END IF;

  INSERT INTO public.task_disputes (
    task_id,
    raised_by,
    reason,
    description,
    evidence_photos
  )
  VALUES (
    p_task_id,
    v_user_id,
    p_reason,
    p_description,
    COALESCE(p_evidence_photos, '{}'::text[])
  )
  RETURNING id INTO v_dispute_id;

  UPDATE public.tasks
  SET
    status = 'disputed',
    disputed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_task_id;

  INSERT INTO public.task_status_log (task_id, from_status, to_status, changed_by, notes)
  VALUES (p_task_id, v_task.status, 'disputed', v_user_id, 'Dispute opened: ' || p_reason);

  RETURN v_dispute_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_sos_alert(
  p_task_id UUID,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_sos_id UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.sos_alerts (
    task_id,
    user_id,
    latitude,
    longitude,
    notes
  )
  VALUES (
    p_task_id,
    v_user_id,
    p_latitude,
    p_longitude,
    p_notes
  )
  RETURNING id INTO v_sos_id;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_user_id,
    'member',
    'SOS_ALERT_TRIGGERED',
    'sos_alerts',
    v_sos_id,
    jsonb_build_object('task_id', p_task_id, 'lat', p_latitude, 'lng', p_longitude)
  );

  RETURN v_sos_id;
END;
$$;

-- 11. RPC: MUTUAL RATINGS & SCORE UPDATES
CREATE OR REPLACE FUNCTION public.submit_task_rating(
  p_task_id UUID,
  p_score INTEGER,
  p_comment TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_task public.tasks%ROWTYPE;
  v_target_user UUID;
  v_is_poster BOOLEAN;
  v_avg NUMERIC(3,2);
BEGIN
  IF p_score < 1 OR p_score > 5 THEN
    RAISE EXCEPTION 'Rating score must be between 1 and 5';
  END IF;

  SELECT * INTO v_task FROM public.tasks WHERE id = p_task_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Task not found';
  END IF;

  IF v_task.status <> 'completed' AND v_task.status <> 'rated' THEN
    RAISE EXCEPTION 'Ratings can only be given for completed tasks';
  END IF;

  IF v_user_id = v_task.poster_id THEN
    v_target_user := v_task.tasker_id;
    v_is_poster := true;
  ELSIF v_user_id = v_task.tasker_id THEN
    v_target_user := v_task.poster_id;
    v_is_poster := false;
  ELSE
    RAISE EXCEPTION 'Only task participants can rate this task';
  END IF;

  INSERT INTO public.ratings (
    context_type,
    reference_id,
    reviewer_id,
    reviewee_id,
    score,
    comment
  )
  VALUES (
    'task',
    p_task_id,
    v_user_id,
    v_target_user,
    p_score,
    p_comment
  )
  ON CONFLICT (context_type, reference_id, reviewer_id) DO UPDATE
  SET
    score = EXCLUDED.score,
    comment = EXCLUDED.comment,
    created_at = NOW();

  -- Recalculate average rating for reviewee
  SELECT round(avg(score)::numeric, 2) INTO v_avg
  FROM public.ratings
  WHERE reviewee_id = v_target_user AND context_type = 'task';

  IF v_is_poster THEN
    -- Poster rated Tasker -> update tasker_rating
    UPDATE public.profiles SET tasker_rating = COALESCE(v_avg, 5.0), updated_at = NOW() WHERE id = v_target_user;
  ELSE
    -- Tasker rated Poster -> update poster_rating
    UPDATE public.profiles SET poster_rating = COALESCE(v_avg, 5.0), updated_at = NOW() WHERE id = v_target_user;
  END IF;

  UPDATE public.tasks SET status = 'rated', updated_at = NOW() WHERE id = p_task_id;

  RETURN TRUE;
END;
$$;

-- 12. RLS POLICIES FOR NEW TABLES
ALTER TABLE public.task_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_extension_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Task proofs read by participants" ON public.task_proofs
  FOR SELECT TO authenticated
  USING (
    tasker_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_proofs.task_id AND t.poster_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Taskers submit proofs" ON public.task_proofs
  FOR INSERT TO authenticated
  WITH CHECK (tasker_id = auth.uid());

CREATE POLICY "Extensions read by participants" ON public.time_extension_requests
  FOR SELECT TO authenticated
  USING (
    tasker_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = time_extension_requests.task_id AND t.poster_id = auth.uid())
    OR public.is_admin()
  );

CREATE POLICY "Disputes read by participants" ON public.task_disputes
  FOR SELECT TO authenticated
  USING (
    raised_by = auth.uid()
    OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_disputes.task_id AND (t.poster_id = auth.uid() OR t.tasker_id = auth.uid()))
    OR public.is_admin()
  );

CREATE POLICY "SOS read by user or admin" ON public.sos_alerts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());
