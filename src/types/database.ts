import { SupportedLanguageCode } from '../i18n/languages';

export type AppRole = 'member' | 'admin' | 'super_admin';
export type KycStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type IdDocumentType = 'cnic' | 'national_id' | 'passport' | 'driving_licence';

export interface MemberProfile {
  id: string;
  phone: string | null;
  phone_verified: boolean;
  secondary_phone: string | null;
  secondary_phone_verified: boolean;
  email: string | null;
  full_name: string;
  guardian_name: string | null;
  date_of_birth: string | null;
  gender: string | null;
  country: string;
  city: string | null;
  area: string | null;
  full_address: string | null;
  latitude: number | null;
  longitude: number | null;
  avatar_url: string | null;
  preferred_language: SupportedLanguageCode;
  kyc_status: KycStatus;
  is_verified_agent: boolean;
  is_verified_developer: boolean;
  is_suspended: boolean;
  poster_rating: number;
  tasker_rating: number;
  seller_rating: number;
  tasks_posted_count: number;
  tasks_completed_count: number;
  properties_listed_count: number;
  created_at: string;
  updated_at: string;
}

export interface UserRoleRow {
  id: string;
  user_id: string;
  role: AppRole;
  permissions: Record<string, boolean>;
}
