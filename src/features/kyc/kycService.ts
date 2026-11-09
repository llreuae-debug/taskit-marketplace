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

export interface KycReviewQueueItem {
  id: string;
  user_id: string;
  full_name: string;
  document_type: string;
  id_number_masked: string;
  status: KycStatus;
  front_path: string;
  selfie_path: string;
  submitted_at: string;
}

let mockPendingKycList: KycReviewQueueItem[] = [
  {
    id: 'kyc-demo-1',
    user_id: 'usr-unverified-1',
    full_name: 'Muhammad Haris',
    document_type: 'cnic',
    id_number_masked: '35201-*******-1',
    status: 'under_review',
    front_path: 'kyc/usr-unverified-1/front.jpg',
    selfie_path: 'kyc/usr-unverified-1/selfie.jpg',
    submitted_at: new Date(Date.now() - 3600 * 1000).toISOString(),
  },
  {
    id: 'kyc-demo-2',
    user_id: 'usr-unverified-2',
    full_name: 'Ayesha Siddiqua',
    document_type: 'passport',
    id_number_masked: 'PK-******42',
    status: 'under_review',
    front_path: 'kyc/usr-unverified-2/front.jpg',
    selfie_path: 'kyc/usr-unverified-2/selfie.jpg',
    submitted_at: new Date(Date.now() - 7200 * 1000).toISOString(),
  },
];

export async function getPendingKycSubmissions(): Promise<KycReviewQueueItem[]> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('kyc_documents')
      .select('id, user_id, document_type, id_number_masked, status, front_storage_path, selfie_storage_path, created_at, profile:profiles!user_id(full_name)')
      .eq('status', 'under_review')
      .order('created_at', { ascending: true });

    if (!error && data) {
      return data.map((d: any) => ({
        id: d.id,
        user_id: d.user_id,
        full_name: d.profile?.full_name || 'Member',
        document_type: d.document_type,
        id_number_masked: d.id_number_masked,
        status: d.status,
        front_path: d.front_storage_path,
        selfie_path: d.selfie_storage_path,
        submitted_at: d.created_at,
      }));
    }
  }
  return mockPendingKycList;
}

export async function adminReviewKyc(
  kycId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected',
  rejectionReason?: string
): Promise<{ success: boolean; status: KycStatus }> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.rpc('admin_review_kyc', {
      p_kyc_id: kycId,
      p_decision: decision,
      p_rejection_reason: rejectionReason || null,
    });
    if (error) throw new Error(error.message);
  }

  const item = mockPendingKycList.find((k) => k.id === kycId);
  if (item) {
    item.status = decision;
    mockPendingKycList = mockPendingKycList.filter((k) => k.id !== kycId);
  }
  return { success: true, status: decision };
}

export function __resetKycQueue() {
  mockPendingKycList = [
    {
      id: 'kyc-demo-1',
      user_id: 'usr-unverified-1',
      full_name: 'Muhammad Haris',
      document_type: 'cnic',
      id_number_masked: '35201-*******-1',
      status: 'under_review',
      front_path: 'kyc/usr-unverified-1/front.jpg',
      selfie_path: 'kyc/usr-unverified-1/selfie.jpg',
      submitted_at: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
  ];
}
