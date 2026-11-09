import {
  calculateAgeYears,
  maskIdentityNumber,
  step1PhoneSchema,
  step2PersonalSchema,
  step3AddressSchema,
  step4IdentitySchema,
  step5SelfieSchema,
  evaluateKycAccessGate,
} from '../../src/features/kyc/validation';
import {
  buildPrivateKycStoragePath,
  getKycDocumentSignedUrl,
  submitMemberKycApplication,
} from '../../src/features/kyc/kycService';

describe('Phase 2 — Member Registration & 5-Step KYC Verification', () => {
  test('Step 1 validates primary phone format and mandatory OTP verification', () => {
    expect(
      step1PhoneSchema.safeParse({
        primaryPhone: '+923001234567',
        primaryOtpVerified: true,
      }).success
    ).toBe(true);

    expect(
      step1PhoneSchema.safeParse({
        primaryPhone: '+923001234567',
        primaryOtpVerified: false,
      }).success
    ).toBe(false);
  });

  test('Step 2 enforces minimum age 18 and secondary phone OTP rule', () => {
    const reference = new Date('2026-11-09T00:00:00Z');
    expect(calculateAgeYears('2000-01-01', reference)).toBe(26);
    expect(calculateAgeYears('2012-01-01', reference)).toBe(14);

    // Under-18 must fail
    const underAge = step2PersonalSchema.safeParse({
      fullName: 'Young User',
      dateOfBirth: '2015-05-01',
    });
    expect(underAge.success).toBe(false);

    // Secondary phone without OTP verification must fail
    const unverifiedSecondary = step2PersonalSchema.safeParse({
      fullName: 'Ali Raza',
      dateOfBirth: '1995-05-01',
      secondaryPhone: '+923211234567',
      secondaryOtpVerified: false,
    });
    expect(unverifiedSecondary.success).toBe(false);

    // Valid adult with verified secondary phone passes
    const validAdult = step2PersonalSchema.safeParse({
      fullName: 'Ali Raza',
      dateOfBirth: '1995-05-01',
      secondaryPhone: '+923211234567',
      secondaryOtpVerified: true,
      email: 'ali@taskit.pk',
    });
    expect(validAdult.success).toBe(true);
  });

  test('Step 3 & Step 4 validate geolocation address, CNIC format, and front/back images', () => {
    expect(
      step3AddressSchema.safeParse({
        country: 'Pakistan',
        city: 'Lahore',
        area: 'DHA Phase 6',
        fullAddress: 'House 12, Street 4, Sector B',
        latitude: 31.4697,
        longitude: 74.4424,
      }).success
    ).toBe(true);

    // CNIC missing back image fails
    expect(
      step4IdentitySchema.safeParse({
        documentType: 'cnic',
        idNumber: '35202-1234567-1',
        frontImageUri: 'private://front.jpg',
      }).success
    ).toBe(false);

    // CNIC with both front and back images passes
    expect(
      step4IdentitySchema.safeParse({
        documentType: 'cnic',
        idNumber: '35202-1234567-1',
        frontImageUri: 'private://front.jpg',
        backImageUri: 'private://back.jpg',
      }).success
    ).toBe(true);
  });

  test('Step 5 requires live camera selfie and explicit privacy consent', () => {
    expect(
      step5SelfieSchema.safeParse({
        selfieImageUri: 'private://selfie.jpg',
        consentAccepted: true,
      }).success
    ).toBe(true);

    expect(
      step5SelfieSchema.safeParse({
        selfieImageUri: '',
        consentAccepted: true,
      }).success
    ).toBe(false);
  });

  test('masks government ID numbers and isolates private KYC storage paths per user', async () => {
    expect(maskIdentityNumber('35202-1234567-1')).toBe('*********5671');
    const storagePath = buildPrivateKycStoragePath('user-123', 'front');
    expect(storagePath.startsWith('user-123/')).toBe(true);

    const signedUrl = await getKycDocumentSignedUrl(storagePath, 60);
    expect(signedUrl).toContain('token=short-lived');

    const submission = await submitMemberKycApplication('user-123', {
      primaryPhone: '+923001234567',
      primaryOtpVerified: true,
      fullName: 'Muhammad Ahmed',
      dateOfBirth: '1994-03-10',
      country: 'Pakistan',
      city: 'Lahore',
      area: 'Gulberg',
      fullAddress: 'Main Boulevard',
      latitude: 31.5204,
      longitude: 74.3587,
      documentType: 'cnic',
      idNumber: '35202-1234567-1',
      frontImageUri: 'file://front.jpg',
      backImageUri: 'file://back.jpg',
      selfieImageUri: 'file://selfie.jpg',
      consentAccepted: true,
    });

    expect(submission.status).toBe('under_review');
    expect(submission.maskedIdNumber).toBe('*********5671');
  });

  test('enforces KYC access gates: unverified users can browse but cannot post/accept/publish', () => {
    expect(evaluateKycAccessGate('browse_properties', 'pending').allowed).toBe(true);
    expect(evaluateKycAccessGate('browse_tasks', 'under_review').allowed).toBe(true);

    expect(evaluateKycAccessGate('post_task', 'pending').allowed).toBe(false);
    expect(evaluateKycAccessGate('accept_task', 'under_review').allowed).toBe(false);
    expect(evaluateKycAccessGate('publish_property', 'rejected').allowed).toBe(false);

    expect(evaluateKycAccessGate('post_task', 'approved').allowed).toBe(true);
    expect(evaluateKycAccessGate('accept_task', 'approved').allowed).toBe(true);
    expect(evaluateKycAccessGate('publish_property', 'approved').allowed).toBe(true);
    expect(evaluateKycAccessGate('post_task', 'approved', true).allowed).toBe(false);
  });
});
