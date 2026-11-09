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
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import {
  PropertyListingType,
  PropertyTypeCategory,
  PropertySizeUnit,
} from '../../src/types/realEstate';
import { createPropertyListing } from '../../src/features/realEstate/realEstateService';
import {
  propertyCreationSchema,
  isResidentialStructure,
  convertToSquareFeet,
} from '../../src/features/realEstate/validation';
import { evaluateKycAccessGate } from '../../src/features/kyc/validation';
import { formatCurrency } from '../../src/utils/formatters';

const STEP_TITLES = [
  '1. Listing Type',
  '2. Property Details',
  '3. Size & Rooms',
  '4. Geolocation & Privacy',
  '5. Media & Photos (Max 20)',
  '6. Ownership Documents',
  '7. Preview & Publish',
] as const;

export default function CreatePropertyScreen() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Listing Type
  const [listingType, setListingType] = useState<PropertyListingType>('for_sale');

  // Step 2: Property Details
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyTypeCategory>('house');
  const [price, setPrice] = useState('25000000');
  const [constructionStatus, setConstructionStatus] = useState<'ready' | 'under_construction' | 'off_plan'>('ready');
  const [furnishingStatus, setFurnishingStatus] = useState<'unfurnished' | 'semi_furnished' | 'furnished'>('semi_furnished');
  const [ownershipStatus, setOwnershipStatus] = useState<'freehold' | 'leasehold' | 'power_of_attorney'>('freehold');

  // Step 3: Size & Specifications
  const [landSize, setLandSize] = useState('10');
  const [sizeUnit, setSizeUnit] = useState<PropertySizeUnit>('marla');
  const [coveredArea, setCoveredArea] = useState('3200');
  const [bedrooms, setBedrooms] = useState('4');
  const [bathrooms, setBathrooms] = useState('4');
  const [parkingSpaces, setParkingSpaces] = useState('2');

  // Step 4: Location & Address Privacy
  const [city, setCity] = useState('Lahore');
  const [area, setArea] = useState('DHA Phase 6');
  const [society, setSociety] = useState('DHA Lahore');
  const [streetAddress, setStreetAddress] = useState('House 14, Street 8, Sector C');
  const [hideExactAddress, setHideExactAddress] = useState(false);

  // Step 5: Media
  const [photos, setPhotos] = useState<string[]>([
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200',
  ]);

  // Step 6: Ownership & Contact
  const [isAgentListing, setIsAgentListing] = useState(false);
  const [documents, setDocuments] = useState<string[]>([
    'private://property-documents/allotment_letter.pdf',
  ]);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const kycGate = evaluateKycAccessGate('publish_property', profile?.kyc_status, profile?.is_suspended);

  const validateStep = (): boolean => {
    setErrorMsg(null);
    if (step === 2) {
      if (title.trim().length < 5) {
        setErrorMsg('Title must be at least 5 characters');
        return false;
      }
      if (description.trim().length < 15) {
        setErrorMsg('Description must be at least 15 characters');
        return false;
      }
      if (!price || parseFloat(price) <= 0) {
        setErrorMsg('Please enter a valid asking price');
        return false;
      }
    } else if (step === 3) {
      if (!landSize || parseFloat(landSize) <= 0) {
        setErrorMsg('Property size must be greater than zero');
        return false;
      }
      if (isResidentialStructure(propertyType) && (!bedrooms || parseInt(bedrooms, 10) < 0)) {
        setErrorMsg('Number of bedrooms is required for residential structures');
        return false;
      }
    } else if (step === 4) {
      if (city.trim().length < 2 || area.trim().length < 2) {
        setErrorMsg('City and Area / Sector are required');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step < 7) {
      setStep(step + 1);
      return;
    }

    // Step 7: Publish Property
    if (!kycGate.allowed) {
      setErrorMsg(kycGate.reason || 'Approved KYC is required before publishing properties');
      return;
    }

    setSubmitting(true);
    try {
      await createPropertyListing(profile?.id || 'usr_seller_1', {
        title,
        description,
        listingType,
        propertyType,
        price: parseFloat(price) || 0,
        currency: 'PKR',
        country: 'Pakistan',
        city,
        area,
        society: society || undefined,
        streetAddress: streetAddress || undefined,
        hideExactAddress,
        landSize: parseFloat(landSize) || 1,
        sizeUnit,
        coveredArea: coveredArea ? parseFloat(coveredArea) : undefined,
        bedrooms: isResidentialStructure(propertyType) ? parseInt(bedrooms, 10) : undefined,
        bathrooms: isResidentialStructure(propertyType) ? parseInt(bathrooms, 10) : undefined,
        parkingSpaces: parkingSpaces ? parseInt(parkingSpaces, 10) : undefined,
        furnishingStatus,
        constructionStatus,
        ownershipStatus,
        isAgentListing,
        mediaPaths: photos,
        documentPaths: documents,
      });

      router.replace('/(tabs)/real-estate');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish property');
    } finally {
      setSubmitting(false);
    }
  };

  const priceNum = parseFloat(price) || 0;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Wizard Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.stepBadge, { color: COLORS.lime.DEFAULT }]}>
              STEP {step} OF 7 • PUBLISH PROPERTY 🏡
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
          </View>
          <Text style={[styles.title, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {STEP_TITLES[step - 1]}
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(step / 7) * 100}%` }]} />
          </View>
        </View>

        {errorMsg && (
          <SurfaceCard accentBorder="coral" style={{ padding: 12 }}>
            <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>⚠️ {errorMsg}</Text>
          </SurfaceCard>
        )}

        {/* STEP 1: LISTING TYPE */}
        {step === 1 && (
          <SurfaceCard style={styles.card}>
            <Text style={[styles.label, { color: textColor }]}>Select Property Listing Purpose</Text>
            <View style={styles.chipGrid}>
              {[
                { id: 'for_sale' as const, label: 'Sell Property (For Sale)' },
                { id: 'for_rent' as const, label: 'Rent Out (For Rent)' },
                { id: 'plot_sale' as const, label: 'Plot / Land Sale' },
                { id: 'commercial_sale' as const, label: 'Commercial Sale' },
                { id: 'commercial_rental' as const, label: 'Commercial Rental' },
                { id: 'new_project' as const, label: 'New Project Unit' },
              ].map((lt) => (
                <Pressable
                  key={lt.id}
                  onPress={() => setListingType(lt.id)}
                  style={[
                    styles.selectChip,
                    {
                      borderColor: listingType === lt.id ? COLORS.lime.DEFAULT : borderColor,
                      backgroundColor: listingType === lt.id ? COLORS.lime.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>{lt.label}</Text>
                </Pressable>
              ))}
            </View>
          </SurfaceCard>
        )}

        {/* STEP 2: PROPERTY DETAILS */}
        {step === 2 && (
          <SurfaceCard style={styles.card}>
            <Text style={[styles.label, { color: textColor }]}>Property Type</Text>
            <View style={styles.chipGrid}>
              {[
                { id: 'house' as const, label: 'House / Villa' },
                { id: 'apartment' as const, label: 'Apartment' },
                { id: 'plot_residential' as const, label: 'Residential Plot' },
                { id: 'plot_commercial' as const, label: 'Commercial Plot' },
                { id: 'shop' as const, label: 'Shop' },
                { id: 'office' as const, label: 'Office' },
                { id: 'building' as const, label: 'Full Building' },
                { id: 'agricultural_land' as const, label: 'Agricultural Land' },
              ].map((pt) => (
                <Pressable
                  key={pt.id}
                  onPress={() => setPropertyType(pt.id)}
                  style={[
                    styles.selectChip,
                    {
                      borderColor: propertyType === pt.id ? COLORS.lime.DEFAULT : borderColor,
                      backgroundColor: propertyType === pt.id ? COLORS.lime.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>{pt.label}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: textColor }]}>Property Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. 1 Kanal Modern Designer House in DHA Phase 6"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Asking Price (PKR) *</Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="25000000"
              placeholderTextColor={subTextColor}
              keyboardType="numeric"
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Highlight location advantages, tiles, fittings, layout, nearby amenities..."
              placeholderTextColor={subTextColor}
              multiline
              style={[styles.input, { color: textColor, borderColor, minHeight: 90 }]}
            />
          </SurfaceCard>
        )}

        {/* STEP 3: SIZE & SPECIFICATIONS */}
        {step === 3 && (
          <SurfaceCard style={styles.card}>
            <Text style={[styles.label, { color: textColor }]}>Land Size & Measurement Unit *</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput
                value={landSize}
                onChangeText={setLandSize}
                placeholder="10"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.input, { flex: 1, color: textColor, borderColor }]}
              />
              <View style={styles.unitPicker}>
                {(['marla', 'kanal', 'sq_ft', 'sq_yd', 'acres'] as PropertySizeUnit[]).map((u) => (
                  <Pressable
                    key={u}
                    onPress={() => setSizeUnit(u)}
                    style={[
                      styles.unitBtn,
                      {
                        backgroundColor: sizeUnit === u ? COLORS.lime.DEFAULT : 'transparent',
                        borderColor,
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '800', color: sizeUnit === u ? '#0F0F14' : textColor }}>
                      {u.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <Text style={{ color: subTextColor, fontSize: 12 }}>
              📐 Approximate Area: {convertToSquareFeet(parseFloat(landSize) || 0, sizeUnit).toLocaleString()} Square Feet
            </Text>

            {isResidentialStructure(propertyType) ? (
              <>
                <Text style={[styles.label, { color: textColor }]}>Bedrooms & Bathrooms *</Text>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TextInput
                    value={bedrooms}
                    onChangeText={setBedrooms}
                    placeholder="Bedrooms (e.g. 4)"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1, color: textColor, borderColor }]}
                  />
                  <TextInput
                    value={bathrooms}
                    onChangeText={setBathrooms}
                    placeholder="Baths (e.g. 4)"
                    placeholderTextColor={subTextColor}
                    keyboardType="numeric"
                    style={[styles.input, { flex: 1, color: textColor, borderColor }]}
                  />
                </View>

                <Text style={[styles.label, { color: textColor }]}>Covered Area (Sq. Ft.)</Text>
                <TextInput
                  value={coveredArea}
                  onChangeText={setCoveredArea}
                  placeholder="e.g. 3200"
                  placeholderTextColor={subTextColor}
                  keyboardType="numeric"
                  style={[styles.input, { color: textColor, borderColor }]}
                />
              </>
            ) : (
              <View style={styles.exemptNotice}>
                <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '700' }}>
                  ✓ Conditional Exemption:
                </Text>
                <Text style={{ color: subTextColor, fontSize: 12 }}>
                  Bedrooms & bathrooms are not required for {propertyType.replace('_', ' ')}.
                </Text>
              </View>
            )}
          </SurfaceCard>
        )}

        {/* STEP 4: GEOLOCATION & ADDRESS PRIVACY */}
        {step === 4 && (
          <SurfaceCard style={styles.card}>
            <Text style={[styles.label, { color: textColor }]}>City *</Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Lahore / Islamabad / Karachi"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Area / Sector *</Text>
            <TextInput
              value={area}
              onChangeText={setArea}
              placeholder="DHA Phase 6 / F-10 / Clifton"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Housing Society / Project</Text>
            <TextInput
              value={society}
              onChangeText={setSociety}
              placeholder="e.g. DHA / Bahria Town / CDA"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Exact Street Address</Text>
            <TextInput
              value={streetAddress}
              onChangeText={setStreetAddress}
              placeholder="House #, Street #, Sector / Block"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            {/* Address Privacy Toggle */}
            <Pressable
              onPress={() => setHideExactAddress(!hideExactAddress)}
              style={[styles.privacyToggle, { borderColor }]}
            >
              <Text style={{ fontSize: 20 }}>{hideExactAddress ? '🔒' : '🔓'}</Text>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ color: textColor, fontWeight: '800', fontSize: 13 }}>
                  Address Privacy Mode ({hideExactAddress ? 'ENABLED' : 'DISABLED'})
                </Text>
                <Text style={{ color: subTextColor, fontSize: 12 }}>
                  When enabled, exact street & house numbers are masked on public discovery maps and shown only to confirmed viewing appointments.
                </Text>
              </View>
            </Pressable>
          </SurfaceCard>
        )}

        {/* STEP 5: MEDIA */}
        {step === 5 && (
          <SurfaceCard style={styles.card}>
            <Text style={[styles.label, { color: textColor }]}>
              Property Photographs ({photos.length}/20)
            </Text>
            <View style={styles.photosGrid}>
              {photos.map((p, idx) => (
                <View key={idx} style={styles.photoBox}>
                  <Text style={{ fontSize: 24 }}>🏠</Text>
                  <Text style={{ fontSize: 10, color: subTextColor }}>Photo {idx + 1}</Text>
                  <Pressable
                    onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    style={styles.removeBtn}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 9, fontWeight: '900' }}>✕</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < 20 && (
                <Pressable
                  onPress={() =>
                    setPhotos([
                      ...photos,
                      `https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&idx=${photos.length}`,
                    ])
                  }
                  style={[styles.addPhotoBtn, { borderColor }]}
                >
                  <Text style={{ fontSize: 22 }}>📷</Text>
                  <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '700' }}>+ Photo</Text>
                </Pressable>
              )}
            </View>
          </SurfaceCard>
        )}

        {/* STEP 6: OWNERSHIP & PRIVATE DOCUMENTS */}
        {step === 6 && (
          <SurfaceCard style={styles.card}>
            <Text style={[styles.label, { color: textColor }]}>Your Representation Status</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable
                onPress={() => setIsAgentListing(false)}
                style={[
                  styles.selectChip,
                  {
                    flex: 1,
                    borderColor: !isAgentListing ? COLORS.lime.DEFAULT : borderColor,
                    backgroundColor: !isAgentListing ? COLORS.lime.subtle : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>🏡 Direct Owner</Text>
              </Pressable>
              <Pressable
                onPress={() => setIsAgentListing(true)}
                style={[
                  styles.selectChip,
                  {
                    flex: 1,
                    borderColor: isAgentListing ? COLORS.lime.DEFAULT : borderColor,
                    backgroundColor: isAgentListing ? COLORS.lime.subtle : 'transparent',
                  },
                ]}
              >
                <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>🤝 Authorized Agent</Text>
              </Pressable>
            </View>

            <Text style={[styles.label, { color: textColor }]}>
              Private Ownership Document Upload (For 3-Tier Verification)
            </Text>
            <Text style={{ color: subTextColor, fontSize: 12 }}>
              Upload your Registry, Title Deed, Allotment Letter, or Authority Letter. Documents are stored in an encrypted private vault and never shown to the public.
            </Text>

            <PillButton
              label={
                documents.length > 0
                  ? `✓ ${documents.length} Ownership Documents Attached (Private Vault)`
                  : '📄 Attach Ownership Records'
              }
              variant={documents.length > 0 ? 'lime' : 'outline'}
              onPress={() =>
                setDocuments(['private://property-documents/allotment_letter.pdf'])
              }
            />
          </SurfaceCard>
        )}

        {/* STEP 7: PREVIEW & PUBLISH */}
        {step === 7 && (
          <SurfaceCard accentBorder="lime" style={styles.card}>
            <Text style={[styles.previewHeading, { color: textColor }]}>Listing Review & Verification</Text>
            <Text style={[styles.title, { color: textColor }]}>{title}</Text>
            <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '900', fontSize: 24 }}>
              {formatCurrency(priceNum, 'PKR', language)}
              {listingType.includes('rent') ? ' / month' : ''}
            </Text>

            <View style={{ gap: 4, borderTopWidth: 1, borderBottomWidth: 1, borderColor, paddingVertical: 8 }}>
              <Text style={{ color: textColor }}>📍 Location: {area}, {city}</Text>
              <Text style={{ color: textColor }}>📐 Land Size: {landSize} {sizeUnit.toUpperCase()}</Text>
              {isResidentialStructure(propertyType) && (
                <Text style={{ color: textColor }}>🛏️ Rooms: {bedrooms} Bedrooms • {bathrooms} Bathrooms</Text>
              )}
              <Text style={{ color: textColor }}>
                🔒 Privacy: {hideExactAddress ? 'Exact Address Masked' : 'Address Visible'}
              </Text>
            </View>

            <View style={styles.disclaimerBox}>
              <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800', fontSize: 12 }}>
                3-TIER VERIFICATION PROCESS
              </Text>
              <Text style={{ color: subTextColor, fontSize: 11, lineHeight: 16 }}>
                Your listing will be reviewed by TaskIt Property Administrators. Once your ownership documents are confirmed, the Verified Property Badge will be activated.
              </Text>
            </View>
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
            label={step === 7 ? 'Publish Property Listing 🏡' : 'Next Step →'}
            variant="lime"
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
  header: { gap: 8 },
  stepBadge: { fontSize: 12, fontWeight: '800', letterSpacing: 0.6 },
  title: { fontSize: 22, fontWeight: '900' },
  progressBarTrack: {
    height: 8,
    backgroundColor: 'rgba(163, 230, 53, 0.2)',
    borderRadius: 999,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.lime.DEFAULT,
    borderRadius: 999,
  },
  card: { gap: 12 },
  label: { fontSize: 13, fontWeight: '700' },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  selectChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  input: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
  },
  unitPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, flex: 1 },
  unitBtn: { paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  exemptNotice: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(163, 230, 53, 0.08)',
    gap: 4,
  },
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  photoBox: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: 'rgba(163, 230, 53, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.coral.DEFAULT,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 68,
    height: 68,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHeading: { fontSize: 18, fontWeight: '800' },
  disclaimerBox: {
    backgroundColor: 'rgba(163, 230, 53, 0.08)',
    padding: 12,
    borderRadius: 12,
    gap: 4,
  },
  navRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
});
