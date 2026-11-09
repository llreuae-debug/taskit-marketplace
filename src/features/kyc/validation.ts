import { z } from 'zod';
import { IdDocumentType, KycStatus } from '../../types/database';

export const PHONE_REGEX = /^\+?[0-9]{10,15}$/;
export const CNIC_REGEX = /^[0-9]{5}-?[0-9]{7}-?[0-9]{1}$/;

/**
 * Calculates age in years from an ISO date string (YYYY-MM-DD)
 */
export function calculateAgeYears(dobString: string, referenceDate: Date = new Date()): number {
  const dob = new Date(dobString);
  if (Number.isNaN(dob.getTime())) {
    return -1;
  }
  let age = referenceDate.getUTCFullYear() - dob.getUTCFullYear();
  const monthDiff = referenceDate.getUTCMonth() - dob.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && referenceDate.getUTCDate() < dob.getUTCDate())
  ) {
    age--;
  }
  return age;
}

/**
 * Masks sensitive identity numbers for UI/display safety so raw CNIC/Passport
 * numbers are never exposed to other members.
 */
export function maskIdentityNumber(rawId: string): string {
  const cleaned = (rawId || '').replace(/[^A-Za-z0-9]/g, '');
  if (cleaned.length <= 4) {
    return '****';
  }
  return `${'*'.repeat(cleaned.length - 4)}${cleaned.slice(-4)}`;
}

// Step 1: Primary Phone & OTP Verification
export const step1PhoneSchema = z.object({
  primaryPhone: z
    .string()
    .trim()
    .regex(PHONE_REGEX, 'Enter a valid mobile number (e.g. +923001234567)'),
  primaryOtpVerified: z.literal(true, {
    errorMap: () => ({ message: 'Primary mobile OTP verification is required' }),
  }),
});

// Step 2: Personal Information (Minimum Age 18, Optional Secondary Phone + OTP, Optional Email)
export const step2PersonalSchema = z
  .object({
    fullName: z.string().trim().min(3, 'Full legal name must be at least 3 characters'),
    guardianName: z.string().trim().optional(),
    dateOfBirth: z
      .string()
      .trim()
      .refine((val) => calculateAgeYears(val) >= 18, {
        message: 'You must be at least 18 years old to register on TaskIt',
      }),
    gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
    secondaryPhone: z.string().trim().optional(),
    secondaryOtpVerified: z.boolean().optional(),
    email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.secondaryPhone && data.secondaryPhone.length > 0) {
        return PHONE_REGEX.test(data.secondaryPhone) && data.secondaryOtpVerified === true;
      }
      return true;
    },
    {
      message: 'Secondary mobile number must be valid and OTP-verified when provided',
      path: ['secondaryPhone'],
    }
  );

// Step 3: Address & Map Coordinates
export const step3AddressSchema = z.object({
  country: z.string().trim().min(2, 'Country is required'),
  city: z.string().trim().min(2, 'City is required'),
  area: z.string().trim().min(2, 'Area / Sector is required'),
  fullAddress: z.string().trim().min(5, 'Complete street/house address is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Step 4: Identity Verification (CNIC, National ID, Passport, Driving Licence)
export const step4IdentitySchema = z
  .object({
    documentType: z.enum(['cnic', 'national_id', 'passport', 'driving_licence']),
    idNumber: z.string().trim().min(5, 'Valid document ID number is required'),
    frontImageUri: z.string().trim().min(1, 'Front image of ID document is required'),
    backImageUri: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      if (data.documentType === 'cnic') {
        return CNIC_REGEX.test(data.idNumber) && Boolean(data.backImageUri);
      }
      if (data.documentType === 'national_id' || data.documentType === 'driving_licence') {
        return Boolean(data.backImageUri);
      }
      return true;
    },
    {
      message:
        'CNIC requires 13 digits (e.g. 35202-1234567-1) and both front & back images',
      path: ['idNumber'],
    }
  );

// Step 5: Live Camera Selfie & Consent
export const step5SelfieSchema = z.object({
  selfieImageUri: z.string().trim().min(1, 'Live camera selfie is required'),
  selfieWithIdUri: z.string().trim().optional(),
  consentAccepted: z.literal(true, {
    errorMap: () => ({
      message: 'You must accept the Privacy Policy, Terms & Identity Consent',
    }),
  }),
});

export interface CompleteKycSubmission {
  primaryPhone: string;
  primaryOtpVerified: boolean;
  fullName: string;
  guardianName?: string;
  dateOfBirth: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  secondaryPhone?: string;
  secondaryOtpVerified?: boolean;
  email?: string;
  country: string;
  city: string;
  area: string;
  fullAddress: string;
  latitude: number;
  longitude: number;
  documentType: IdDocumentType;
  idNumber: string;
  frontImageUri: string;
  backImageUri?: string;
  selfieImageUri: string;
  selfieWithIdUri?: string;
  consentAccepted: boolean;
}

export type MarketplaceActionType =
  | 'browse_tasks'
  | 'browse_properties'
  | 'post_task'
  | 'accept_task'
  | 'publish_property'
  | 'contact_seller'
  | 'submit_property_offer';

/**
 * Enforces Section 6 Verification Rules:
 * - Unverified users CANNOT publish tasks, accept tasks, or publish property listings.
 * - Property & task browsing is allowed to guests or unverified members,
 *   but contact and transaction-related actions require approved KYC.
 */
export function evaluateKycAccessGate(
  action: MarketplaceActionType,
  kycStatus: KycStatus | null | undefined,
  isSuspended: boolean = false
): { allowed: boolean; reason?: string } {
  if (isSuspended) {
    return { allowed: false, reason: 'Account is currently suspended.' };
  }

  if (action === 'browse_tasks' || action === 'browse_properties') {
    return { allowed: true };
  }

  if (kycStatus !== 'approved') {
    return {
      allowed: false,
      reason: `Identity verification (KYC) must be Approved before you can ${action.replace(
        /_/g,
        ' '
      )}. Current status: ${(kycStatus || 'pending').toUpperCase()}.`,
    };
  }

  return { allowed: true };
}
