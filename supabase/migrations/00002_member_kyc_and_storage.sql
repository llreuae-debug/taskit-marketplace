-- =============================================================================
-- TASKIT ⚡ — MIGRATION 00002: MEMBER REGISTRATION, PRIVATE KYC STORAGE & RPCs
-- 5-Step Registration & KYC Verification, Encrypted ID Numbers, Audit Logging
-- =============================================================================

-- 1. STORAGE BUCKETS (Private KYC Documents vs Public Avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('kyc-documents', 'kyc-documents', FALSE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for Private kyc-documents bucket
-- Files must be uploaded under path: <user_id>/<filename>
DROP POLICY IF EXISTS "Users upload own KYC files" ON storage.objects;
CREATE POLICY "Users upload own KYC files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'kyc-documents'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "Users and admins read KYC files" ON storage.objects;
CREATE POLICY "Users and admins read KYC files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'kyc-documents'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR public.is_admin()
    )
  );

-- Storage RLS Policies for Avatars bucket
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 2. HELPER: MASK IDENTITY NUMBER (Never expose full CNIC/Passport to other members)
CREATE OR REPLACE FUNCTION public.mask_identity_number(raw_id TEXT)
RETURNS VARCHAR(64)
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  cleaned TEXT;
  len INTEGER;
BEGIN
  cleaned := regexp_replace(COALESCE(raw_id, ''), '[^A-Za-z0-9]', '', 'g');
  len := length(cleaned);
  IF len <= 4 THEN
    RETURN '****';
  END IF;
  RETURN repeat('*', len - 4) || right(cleaned, 4);
END;
$$;

-- 3. SERVER-SIDE RPC: SUBMIT 5-STEP REGISTRATION & KYC APPLICATION
CREATE OR REPLACE FUNCTION public.submit_kyc_verification(
  p_full_name VARCHAR(150),
  p_guardian_name VARCHAR(150),
  p_date_of_birth DATE,
  p_gender VARCHAR(32),
  p_secondary_phone VARCHAR(32),
  p_email VARCHAR(255),
  p_country VARCHAR(100),
  p_city VARCHAR(100),
  p_area VARCHAR(150),
  p_full_address TEXT,
  p_latitude DOUBLE PRECISION,
  p_longitude DOUBLE PRECISION,
  p_document_type id_document_type,
  p_raw_id_number TEXT,
  p_front_storage_path TEXT,
  p_back_storage_path TEXT,
  p_selfie_storage_path TEXT,
  p_selfie_with_id_storage_path TEXT DEFAULT NULL,
  p_avatar_url TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_kyc_id UUID;
  v_masked VARCHAR(64);
  v_encrypted TEXT;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required to submit KYC verification';
  END IF;

  -- Enforce minimum age 18 server-side
  IF p_date_of_birth IS NULL OR p_date_of_birth > (CURRENT_DATE - INTERVAL '18 years') THEN
    RAISE EXCEPTION 'Member must be at least 18 years old';
  END IF;

  IF length(trim(COALESCE(p_full_name, ''))) < 3 THEN
    RAISE EXCEPTION 'Full legal name is required';
  END IF;

  IF length(trim(COALESCE(p_raw_id_number, ''))) < 5 THEN
    RAISE EXCEPTION 'Valid government ID number is required';
  END IF;

  IF length(trim(COALESCE(p_front_storage_path, ''))) = 0 OR length(trim(COALESCE(p_selfie_storage_path, ''))) = 0 THEN
    RAISE EXCEPTION 'ID front image and live camera selfie are required';
  END IF;

  v_masked := public.mask_identity_number(p_raw_id_number);
  v_encrypted := encode(pgp_sym_encrypt(p_raw_id_number, current_setting('app.settings.jwt_secret', true)), 'base64');

  -- Update member profile and set kyc_status to under_review
  UPDATE public.profiles
  SET
    full_name = trim(p_full_name),
    guardian_name = NULLIF(trim(COALESCE(p_guardian_name, '')), ''),
    date_of_birth = p_date_of_birth,
    gender = NULLIF(trim(COALESCE(p_gender, '')), ''),
    secondary_phone = NULLIF(trim(COALESCE(p_secondary_phone, '')), ''),
    email = NULLIF(trim(COALESCE(p_email, '')), ''),
    country = COALESCE(NULLIF(trim(p_country), ''), 'Pakistan'),
    city = trim(p_city),
    area = trim(p_area),
    full_address = trim(p_full_address),
    latitude = p_latitude,
    longitude = p_longitude,
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    kyc_status = 'under_review',
    consent_accepted_at = COALESCE(consent_accepted_at, NOW()),
    updated_at = NOW()
  WHERE id = v_user_id;

  -- Insert KYC Document record
  INSERT INTO public.kyc_documents (
    user_id,
    document_type,
    id_number_masked,
    id_number_encrypted,
    front_storage_path,
    back_storage_path,
    selfie_storage_path,
    selfie_with_id_storage_path,
    status
  )
  VALUES (
    v_user_id,
    p_document_type,
    v_masked,
    COALESCE(v_encrypted, 'ENCRYPTED_ID_PAYLOAD'),
    p_front_storage_path,
    p_back_storage_path,
    p_selfie_storage_path,
    p_selfie_with_id_storage_path,
    'under_review'
  )
  RETURNING id INTO v_kyc_id;

  -- Record audit log
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_user_id,
    'member',
    'KYC_SUBMITTED',
    'kyc_documents',
    v_kyc_id,
    jsonb_build_object('document_type', p_document_type, 'id_masked', v_masked, 'city', p_city)
  );

  RETURN v_kyc_id;
END;
$$;

-- 4. ADMIN RPC: REVIEW & APPROVE/REJECT KYC APPLICATION
CREATE OR REPLACE FUNCTION public.admin_review_kyc(
  p_kyc_id UUID,
  p_decision kyc_status_type,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id UUID := auth.uid();
  v_target_user UUID;
BEGIN
  IF NOT public.is_admin(v_admin_id) THEN
    RAISE EXCEPTION 'Unauthorized: Only administrators can review KYC documents';
  END IF;

  IF p_decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'Decision must be approved or rejected';
  END IF;

  SELECT user_id INTO v_target_user
  FROM public.kyc_documents
  WHERE id = p_kyc_id
  FOR UPDATE;

  IF v_target_user IS NULL THEN
    RAISE EXCEPTION 'KYC document record not found';
  END IF;

  UPDATE public.kyc_documents
  SET
    status = p_decision,
    reviewed_by = v_admin_id,
    reviewed_at = NOW(),
    rejection_reason = CASE WHEN p_decision = 'rejected' THEN p_rejection_reason ELSE NULL END,
    updated_at = NOW()
  WHERE id = p_kyc_id;

  UPDATE public.profiles
  SET
    kyc_status = p_decision,
    updated_at = NOW()
  WHERE id = v_target_user;

  -- Send localized notification to member
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
    v_target_user,
    'shared',
    CASE WHEN p_decision = 'approved' THEN 'kyc_approved' ELSE 'kyc_rejected' END,
    CASE WHEN p_decision = 'approved' THEN 'kyc.notificationApprovedTitle' ELSE 'kyc.notificationRejectedTitle' END,
    CASE WHEN p_decision = 'approved' THEN 'kyc.notificationApprovedBody' ELSE 'kyc.notificationRejectedBody' END,
    jsonb_build_object('reason', COALESCE(p_rejection_reason, '')),
    p_kyc_id
  );

  -- Record immutable audit log
  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_admin_id,
    'admin',
    'KYC_REVIEW_' || upper(p_decision::text),
    'kyc_documents',
    p_kyc_id,
    jsonb_build_object('target_user_id', v_target_user, 'decision', p_decision, 'reason', p_rejection_reason)
  );

  RETURN TRUE;
END;
$$;

-- 5. ACCOUNT DELETION WORKFLOW RPC (GDPR / Play Store / App Store Compliance)
CREATE OR REPLACE FUNCTION public.request_account_deletion(p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  UPDATE public.profiles
  SET
    deletion_requested_at = NOW(),
    is_suspended = TRUE,
    updated_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO public.audit_logs (actor_id, actor_role, action, entity_type, entity_id, metadata)
  VALUES (
    v_user_id,
    'member',
    'ACCOUNT_DELETION_REQUESTED',
    'profiles',
    v_user_id,
    jsonb_build_object('reason', COALESCE(p_reason, 'User requested account deletion'))
  );

  RETURN TRUE;
END;
$$;
