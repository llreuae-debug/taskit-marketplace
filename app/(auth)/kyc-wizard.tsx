import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import {
  step1PhoneSchema,
  step2PersonalSchema,
  step3AddressSchema,
  step4IdentitySchema,
  step5SelfieSchema,
  maskIdentityNumber,
} from '../../src/features/kyc/validation';
import { submitMemberKycApplication } from '../../src/features/kyc/kycService';
import { IdDocumentType } from '../../src/types/database';

const STEP_TITLES = [
  '1. Primary Phone & OTP',
  '2. Personal Information',
  '3. Address & Location',
  '4. Identity Document (KYC)',
  '5. Live Camera Selfie',
] as const;

export default function KycRegistrationWizardScreen() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const setProfile = useAppStore((s) => s.setProfile);
  const isDark = theme === 'dark';

  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1 state
  const [primaryPhone, setPrimaryPhone] = useState('+923001234567');
  const [primaryOtpSent, setPrimaryOtpSent] = useState(false);
  const [primaryOtpCode, setPrimaryOtpCode] = useState('');
  const [primaryOtpVerified, setPrimaryOtpVerified] = useState(false);

  // Step 2 state
  const [fullName, setFullName] = useState('');
  const [guardianName, setGuardianName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1996-05-15');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | 'prefer_not_to_say'>('male');
  const [secondaryPhone, setSecondaryPhone] = useState('');
  const [secondaryOtpVerified, setSecondaryOtpVerified] = useState(false);
  const [email, setEmail] = useState('');

  // Step 3 state
  const [country, setCountry] = useState('Pakistan');
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('DHA Phase 6');
  const [fullAddress, setFullAddress] = useState('');
  const [latitude, setLatitude] = useState<number>(31.4697);
  const [longitude, setLongitude] = useState<number>(74.4424);

  // Step 4 state
  const [documentType, setDocumentType] = useState<IdDocumentType>('cnic');
  const [idNumber, setIdNumber] = useState('');
  const [frontImageUri, setFrontImageUri] = useState('');
  const [backImageUri, setBackImageUri] = useState('');

  // Step 5 state
  const [selfieImageUri, setSelfieImageUri] = useState('');
  const [selfieWithIdUri, setSelfieWithIdUri] = useState('');
  const [consentAccepted, setConsentAccepted] = useState(false);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const validateCurrentStep = (): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      const res = step1PhoneSchema.safeParse({
        primaryPhone,
        primaryOtpVerified,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Invalid Step 1 input');
        return false;
      }
    } else if (step === 2) {
      const res = step2PersonalSchema.safeParse({
        fullName,
        guardianName,
        dateOfBirth,
        gender,
        secondaryPhone: secondaryPhone || undefined,
        secondaryOtpVerified,
        email: email || undefined,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Invalid Step 2 input');
        return false;
      }
    } else if (step === 3) {
      const res = step3AddressSchema.safeParse({
        country,
        city,
        area,
        fullAddress,
        latitude,
        longitude,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Invalid Step 3 input');
        return false;
      }
    } else if (step === 4) {
      const res = step4IdentitySchema.safeParse({
        documentType,
        idNumber,
        frontImageUri,
        backImageUri: backImageUri || undefined,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Invalid Step 4 input');
        return false;
      }
    } else if (step === 5) {
      const res = step5SelfieSchema.safeParse({
        selfieImageUri,
        selfieWithIdUri: selfieWithIdUri || undefined,
        consentAccepted,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Invalid Step 5 input');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateCurrentStep()) return;

    if (step < 5) {
      setStep(step + 1);
      return;
    }

    // Step 5 Final Submission
    setSubmitting(true);
    try {
      const userId = 'usr_member_demo_01';
      await submitMemberKycApplication(userId, {
        primaryPhone,
        primaryOtpVerified: true,
        fullName,
        guardianName: guardianName || undefined,
        dateOfBirth,
        gender,
        secondaryPhone: secondaryPhone || undefined,
        secondaryOtpVerified,
        email: email || undefined,
        country,
        city,
        area,
        fullAddress,
        latitude,
        longitude,
        documentType,
        idNumber,
        frontImageUri,
        backImageUri: backImageUri || undefined,
        selfieImageUri,
        selfieWithIdUri: selfieWithIdUri || undefined,
        consentAccepted: true,
      });

      setProfile({
        id: userId,
        phone: primaryPhone,
        phone_verified: true,
        secondary_phone: secondaryPhone || null,
        secondary_phone_verified: secondaryOtpVerified,
        email: email || null,
        full_name: fullName,
        guardian_name: guardianName || null,
        date_of_birth: dateOfBirth,
        gender,
        country,
        city,
        area,
        full_address: fullAddress,
        latitude,
        longitude,
        avatar_url: selfieImageUri,
        preferred_language: useAppStore.getState().language,
        kyc_status: 'under_review',
        is_verified_agent: false,
        is_verified_developer: false,
        is_suspended: false,
        poster_rating: 5.0,
        tasker_rating: 5.0,
        seller_rating: 5.0,
        tasks_posted_count: 0,
        tasks_completed_count: 0,
        properties_listed_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      router.replace('/(tabs)/profile');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit KYC');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wizard Progress Header */}
        <View style={styles.progressHeader}>
          <Text style={[styles.stepBadge, { color: COLORS.primary.DEFAULT }]}>
            STEP {step} OF 5 • VERIFIED MEMBER WIZARD
          </Text>
          <Text
            style={[
              styles.title,
              { color: textColor, textAlign: isRTL ? 'right' : 'left' },
            ]}
          >
            {STEP_TITLES[step - 1]}
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(step / 5) * 100}%` }]} />
          </View>
        </View>

        {errorMsg && (
          <SurfaceCard accentBorder="coral" style={styles.errorBox}>
            <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>
              ⚠️ {errorMsg}
            </Text>
          </SurfaceCard>
        )}

        {/* STEP 1: PRIMARY PHONE & OTP */}
        {step === 1 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>
              Primary Mobile Number
            </Text>
            <TextInput
              value={primaryPhone}
              onChangeText={setPrimaryPhone}
              placeholder="+923001234567"
              placeholderTextColor={subTextColor}
              keyboardType="phone-pad"
              style={[styles.input, { color: textColor, borderColor }]}
            />

            {!primaryOtpSent ? (
              <PillButton
                label="Send OTP Code"
                variant="outline"
                onPress={() => setPrimaryOtpSent(true)}
              />
            ) : (
              <>
                <Text style={[styles.label, { color: textColor }]}>
                  Enter 6-Digit OTP (Demo: 123456)
                </Text>
                <TextInput
                  value={primaryOtpCode}
                  onChangeText={setPrimaryOtpCode}
                  placeholder="123456"
                  placeholderTextColor={subTextColor}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <PillButton
                  label={
                    primaryOtpVerified
                      ? '✓ Phone Number Verified'
                      : 'Verify OTP Code'
                  }
                  variant={primaryOtpVerified ? 'lime' : 'primary'}
                  onPress={() => {
                    if (primaryOtpCode.length >= 4) {
                      setPrimaryOtpVerified(true);
                      setErrorMsg(null);
                    } else {
                      setErrorMsg('Enter valid OTP code');
                    }
                  }}
                />
              </>
            )}
          </SurfaceCard>
        )}

        {/* STEP 2: PERSONAL INFORMATION */}
        {step === 2 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>
              Full Legal Name (As on CNIC / Passport) *
            </Text>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="e.g. Muhammad Ahmed Khan"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>
              Father / Guardian Name (Optional)
            </Text>
            <TextInput
              value={guardianName}
              onChangeText={setGuardianName}
              placeholder="Guardian Name"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>
              Date of Birth (YYYY-MM-DD, Minimum Age 18) *
            </Text>
            <TextInput
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              placeholder="1996-05-15"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>
              Secondary Mobile Number (Optional)
            </Text>
            <TextInput
              value={secondaryPhone}
              onChangeText={setSecondaryPhone}
              placeholder="+923211234567"
              placeholderTextColor={subTextColor}
              keyboardType="phone-pad"
              style={[styles.input, { color: textColor, borderColor }]}
            />
            {secondaryPhone.length > 0 && (
              <PillButton
                label={
                  secondaryOtpVerified
                    ? '✓ Secondary Phone OTP Verified'
                    : 'Verify Secondary Phone OTP'
                }
                variant={secondaryOtpVerified ? 'lime' : 'outline'}
                onPress={() => setSecondaryOtpVerified(true)}
              />
            )}

            <Text style={[styles.label, { color: textColor }]}>
              Email Address (Optional)
            </Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="member@taskit.pk"
              placeholderTextColor={subTextColor}
              keyboardType="email-address"
              autoCapitalize="none"
              style={[styles.input, { color: textColor, borderColor }]}
            />
          </SurfaceCard>
        )}

        {/* STEP 3: ADDRESS & GEOLOCATION */}
        {step === 3 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>Country *</Text>
            <TextInput
              value={country}
              onChangeText={setCountry}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>City *</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Lahore / Karachi / Islamabad"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Area / Sector *</Text>
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="DHA Phase 6 / Gulberg / Bahria Town"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>
              Full Residential Address *
            </Text>
            <TextInput
              value={fullAddress}
              onChangeText={setFullAddress}
              placeholder="House #, Street #, Block / Sector"
              placeholderTextColor={subTextColor}
              multiline
              style={[styles.input, { color: textColor, borderColor, minHeight: 72 }]}
            />

            <PillButton
              label={`📍 Use My Current Location (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`}
              variant="outline"
              onPress={() => {
                setLatitude(31.5204);
                setLongitude(74.3587);
              }}
            />
          </SurfaceCard>
        )}

        {/* STEP 4: IDENTITY VERIFICATION DOCUMENT */}
        {step === 4 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>
              Select Government Document Type *
            </Text>
            <View style={styles.docTypeGrid}>
              {(
                [
                  { id: 'cnic', label: 'CNIC (Pakistan)' },
                  { id: 'national_id', label: 'National ID' },
                  { id: 'passport', label: 'Passport' },
                  { id: 'driving_licence', label: 'Driving Licence' },
                ] as const
              ).map((doc) => (
                <Pressable
                  key={doc.id}
                  onPress={() => setDocumentType(doc.id)}
                  accessibilityRole="button"
                  style={[
                    styles.docChip,
                    {
                      borderColor:
                        documentType === doc.id ? COLORS.primary.DEFAULT : borderColor,
                      backgroundColor:
                        documentType === doc.id ? COLORS.primary.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
                    {doc.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: textColor }]}>
              {documentType === 'cnic'
                ? 'CNIC Number (13 digits, e.g. 35202-1234567-1) *'
                : 'Document ID Number *'}
            </Text>
            <TextInput
              value={idNumber}
              onChangeText={setIdNumber}
              placeholder={
                documentType === 'cnic' ? '35202-1234567-1' : 'Enter ID Number'
              }
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />
            {idNumber.length > 4 && (
              <Text style={{ color: subTextColor, fontSize: 12 }}>
                🔒 Public Masked Preview: {maskIdentityNumber(idNumber)} (Encrypted in Private Vault)
              </Text>
            )}

            <PillButton
              label={
                frontImageUri
                  ? '✓ Front Document Image Attached (Private Bucket)'
                  : '📷 Upload ID Front Image *'
              }
              variant={frontImageUri ? 'lime' : 'outline'}
              onPress={() => setFrontImageUri('private://kyc-documents/id_front.jpg')}
            />

            {documentType !== 'passport' && (
              <PillButton
                label={
                  backImageUri
                    ? '✓ Back Document Image Attached (Private Bucket)'
                    : '📷 Upload ID Back Image *'
                }
                variant={backImageUri ? 'lime' : 'outline'}
                onPress={() => setBackImageUri('private://kyc-documents/id_back.jpg')}
              />
            )}
          </SurfaceCard>
        )}

        {/* STEP 5: LIVE CAMERA SELFIE & CONSENT */}
        {step === 5 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>
              Live Camera Selfie Verification *
            </Text>
            <Text style={{ color: subTextColor, fontSize: 13, lineHeight: 19 }}>
              Your live selfie is matched against your government ID by authorized TaskIt KYC administrators and stored in an encrypted private bucket.
            </Text>

            <PillButton
              label={
                selfieImageUri
                  ? '✓ Live Camera Selfie Captured'
                  : '🤳 Capture Live Camera Selfie *'
              }
              variant={selfieImageUri ? 'lime' : 'primary'}
              onPress={() => setSelfieImageUri('private://kyc-documents/live_selfie.jpg')}
            />

            <PillButton
              label={
                selfieWithIdUri
                  ? '✓ Selfie Holding ID Captured'
                  : '🪪 Capture Selfie Holding ID (Optional)'
              }
              variant={selfieWithIdUri ? 'lime' : 'outline'}
              onPress={() =>
                setSelfieWithIdUri('private://kyc-documents/selfie_holding_id.jpg')
              }
            />

            <Pressable
              onPress={() => setConsentAccepted(!consentAccepted)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consentAccepted }}
              style={[
                styles.consentRow,
                { borderColor: consentAccepted ? COLORS.primary.DEFAULT : borderColor },
              ]}
            >
              <Text style={{ fontSize: 18 }}>{consentAccepted ? '☑️' : '⬜'}</Text>
              <Text style={{ color: textColor, flex: 1, fontSize: 13, lineHeight: 18 }}>
                I consent to identity verification and agree to the TaskIt Privacy Policy & Terms of Service.
              </Text>
            </Pressable>
          </SurfaceCard>
        )}

        {/* Wizard Navigation Footer */}
        <View style={styles.navRow}>
          {step > 1 && (
            <PillButton
              label="← Back"
              variant="outline"
              onPress={() => setStep(step - 1)}
              style={{ flex: 1 }}
            />
          )}
          <PillButton
            label={step === 5 ? 'Submit KYC for Verification ⚡' : 'Next Step →'}
            variant="primary"
            loading={submitting}
            onPress={handleNext}
            style={{ flex: 2 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  progressHeader: { gap: 8 },
  stepBadge: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 24, fontWeight: '900' },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(124, 58, 237, 0.16)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary.DEFAULT,
    borderRadius: 999,
  },
  errorBox: { padding: 14 },
  stepCard: { gap: 14 },
  label: { fontSize: 14, fontWeight: '700' },
  input: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  docTypeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docChip: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    justifyContent: 'center',
  },
  consentRow: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
