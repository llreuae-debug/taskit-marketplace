import { supabase, isSupabaseConfigured } from '../../services/supabase';
import { CompleteKycSubmission, maskIdentityNumber } from './validation';
import { KycStatus } from '../../types/database';

export interface KycSubmissionResult {
  kycId: string;
  status: KycStatus;
  maskedIdNumber: string;
  frontStoragePath: string;
  backStoragePath?: string;
  selfieStoragePath: string;
}

/**
 * Generates a private storage path isolated by user ID (`<user_id>/<timestamp>_<tag>.jpg`)
 * matching the `kyc-documents` RLS policy.
 */
export function buildPrivateKycStoragePath(
  userId: string,
  tag: 'front' | 'back' | 'selfie' | 'selfie_with_id'
): string {
  const safeUserId = userId.replace(/[^a-zA-Z0-9-]/g, '');
  return `${safeUserId}/${Date.now()}_${tag}.jpg`;
}

/**
 * Requests a short-lived signed URL (default 60 seconds) for private KYC documents.
 * Never returns public URLs for sensitive identity documents.
 */
export async function getKycDocumentSignedUrl(
  storagePath: string,
  expiresInSeconds: number = 60
): Promise<string | null> {
  const boundedExpiry = Math.min(Math.max(expiresInSeconds, 15), 300);
  if (!isSupabaseConfigured) {
    return `https://signed-kyc.taskit.local/${storagePath}?token=short-lived&exp=${boundedExpiry}`;
  }
  const { data, error } = await supabase.storage
    .from('kyc-documents')
    .createSignedUrl(storagePath, boundedExpiry);

  if (error || !data?.signedUrl) {
    throw new Error(error?.message || 'Unable to generate short-lived signed URL');
  }
  return data.signedUrl;
}

/**
 * Submits the 5-step Registration & KYC package.
 */
export async function submitMemberKycApplication(
  userId: string,
  payload: CompleteKycSubmission
): Promise<KycSubmissionResult> {
  const frontPath = buildPrivateKycStoragePath(userId, 'front');
  const backPath = payload.backImageUri
    ? buildPrivateKycStoragePath(userId, 'back')
    : undefined;
  const selfiePath = buildPrivateKycStoragePath(userId, 'selfie');
  const selfieWithIdPath = payload.selfieWithIdUri
    ? buildPrivateKycStoragePath(userId, 'selfie_with_id')
    : undefined;

  const maskedIdNumber = maskIdentityNumber(payload.idNumber);

  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('submit_kyc_verification', {
      p_full_name: payload.fullName,
      p_guardian_name: payload.guardianName || null,
      p_date_of_birth: payload.dateOfBirth,
      p_gender: payload.gender || null,
      p_secondary_phone: payload.secondaryPhone || null,
      p_email: payload.email || null,
      p_country: payload.country,
      p_city: payload.city,
      p_area: payload.area,
      p_full_address: payload.fullAddress,
      p_latitude: payload.latitude,
      p_longitude: payload.longitude,
      p_document_type: payload.documentType,
      p_raw_id_number: payload.idNumber,
      p_front_storage_path: frontPath,
      p_back_storage_path: backPath || null,
      p_selfie_storage_path: selfiePath,
      p_selfie_with_id_storage_path: selfieWithIdPath || null,
      p_avatar_url: null,
    });

    if (error) {
      throw new Error(error.message);
    }

    return {
      kycId: String(data),
      status: 'under_review',
      maskedIdNumber,
      frontStoragePath: frontPath,
      backStoragePath: backPath,
      selfieStoragePath: selfiePath,
    };
  }

  return {
    kycId: `kyc_${Date.now()}`,
    status: 'under_review',
    maskedIdNumber,
    frontStoragePath: frontPath,
    backStoragePath: backPath,
    selfieStoragePath: selfiePath,
  };
}
