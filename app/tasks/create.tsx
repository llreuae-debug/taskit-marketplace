import React, { useState, useEffect } from 'react';
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
  TaskCategory,
  TaskLocationType,
  TaskAcceptanceMethod,
} from '../../src/types/tasks';
import {
  getTaskCategories,
  createNewTask,
} from '../../src/features/tasks/taskService';
import {
  taskScreen1Schema,
  taskScreen2Schema,
  taskScreen3Schema,
  taskScreen4Schema,
} from '../../src/features/tasks/validation';
import { evaluateKycAccessGate } from '../../src/features/kyc/validation';
import {
  formatCurrency,
  calculateTaskFeeBreakdown,
} from '../../src/utils/formatters';

const STEP_TITLES = [
  '1. Select Category',
  '2. Task Details & Photos',
  '3. Locations (Pickup / Drop-off / Online)',
  '4. Pricing, Escrow & Deadline',
] as const;

export default function CreateTaskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const [categories, setCategories] = useState<TaskCategory[]>([]);
  const [step, setStep] = useState<number>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Screen 1: Category Selection
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, any>>({});

  // Screen 2: Title, Description, Voice, Photos
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [voiceNotePath, setVoiceNotePath] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);

  // Screen 3: Locations
  const [locationType, setLocationType] = useState<TaskLocationType>('physical_single');
  const [locationName, setLocationName] = useState('DHA Phase 5');
  const [locationAddress, setLocationAddress] = useState('Sector C, DHA Phase 5, Lahore');
  const [pickupName, setPickupName] = useState('Montgomery Road');
  const [pickupAddress, setPickupAddress] = useState('Montgomery Road Auto Market, Lahore');
  const [dropoffName, setDropoffName] = useState('Resident Home');
  const [dropoffAddress, setDropoffAddress] = useState('DHA Phase 5, Lahore');

  // Screen 4: Pricing, Budget, Deadline & Acceptance Method
  const [taskCharges, setTaskCharges] = useState('1000');
  const [expenseBudget, setExpenseBudget] = useState('0');
  const [deadlineHours, setDeadlineHours] = useState('8');
  const [acceptanceMethod, setAcceptanceMethod] = useState<TaskAcceptanceMethod>('instant');

  useEffect(() => {
    getTaskCategories().then((cats) => {
      setCategories(cats);
      if (cats.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(cats[0].id);
      }
    });
  }, []);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);

  // Check KYC Gate for posting tasks
  const kycGate = evaluateKycAccessGate(
    'post_task',
    profile?.kyc_status,
    profile?.is_suspended
  );

  const validateStep = (): boolean => {
    setErrorMsg(null);
    if (step === 1) {
      const res = taskScreen1Schema.safeParse({
        categoryId: selectedCategoryId,
        customData: customFieldValues,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Please choose a category');
        return false;
      }
    } else if (step === 2) {
      const res = taskScreen2Schema.safeParse({
        title,
        description,
        voiceNotePath,
        photos,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Please fill in required task details');
        return false;
      }
    } else if (step === 3) {
      const res = taskScreen3Schema.safeParse({
        locationType,
        locationName,
        locationAddress,
        pickupName,
        pickupAddress,
        dropoffName,
        dropoffAddress,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Location information is required');
        return false;
      }
    } else if (step === 4) {
      const deadlineIso = new Date(
        Date.now() + (parseInt(deadlineHours, 10) || 8) * 3600 * 1000
      ).toISOString();
      const res = taskScreen4Schema.safeParse({
        taskCharges: parseFloat(taskCharges) || 0,
        expenseBudget: parseFloat(expenseBudget) || 0,
        deadline: deadlineIso,
        acceptanceMethod,
      });
      if (!res.success) {
        setErrorMsg(res.error.issues[0]?.message || 'Pricing and deadline are invalid');
        return false;
      }
    }
    return true;
  };

  const handleNext = async () => {
    if (!validateStep()) return;

    if (step < 4) {
      setStep(step + 1);
      return;
    }

    // Final Step 4: Publish Task
    if (!kycGate.allowed) {
      setErrorMsg(kycGate.reason || 'Approved KYC is required before posting tasks');
      return;
    }

    setIsSubmitting(true);
    try {
      const chargesNum = parseFloat(taskCharges) || 1000;
      const budgetNum = parseFloat(expenseBudget) || 0;
      const deadlineIso = new Date(
        Date.now() + (parseInt(deadlineHours, 10) || 8) * 3600 * 1000
      ).toISOString();

      await createNewTask(profile?.id || 'usr_poster_1', {
        categoryId: selectedCategoryId,
        title,
        description,
        voiceNotePath,
        photos,
        locationType,
        locationName: locationType === 'physical_single' ? locationName : undefined,
        locationAddress: locationType === 'physical_single' ? locationAddress : undefined,
        latitude: 31.4697,
        longitude: 74.4424,
        pickupName: locationType === 'physical_pickup_dropoff' ? pickupName : undefined,
        pickupAddress: locationType === 'physical_pickup_dropoff' ? pickupAddress : undefined,
        pickupLatitude: 31.5546,
        pickupLongitude: 74.3214,
        dropoffName: locationType === 'physical_pickup_dropoff' ? dropoffName : undefined,
        dropoffAddress: locationType === 'physical_pickup_dropoff' ? dropoffAddress : undefined,
        dropoffLatitude: 31.4697,
        dropoffLongitude: 74.4424,
        currency: 'PKR',
        taskCharges: chargesNum,
        expenseBudget: budgetNum,
        deadline: deadlineIso,
        acceptanceMethod,
        customData: customFieldValues,
      });

      router.replace('/(tabs)/tasks');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to publish task');
    } finally {
      setIsSubmitting(false);
    }
  };

  const charges = parseFloat(taskCharges) || 0;
  const breakdown = calculateTaskFeeBreakdown(charges, 10);

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
            <Text style={[styles.stepBadge, { color: COLORS.primary.DEFAULT }]}>
              STEP {step} OF 4 • POST A TASK ⚡
            </Text>
            <Pressable onPress={() => router.back()}>
              <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>Cancel</Text>
            </Pressable>
          </View>
          <Text style={[styles.title, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {STEP_TITLES[step - 1]}
          </Text>
          <View style={styles.progressBarTrack}>
            <View style={[styles.progressBarFill, { width: `${(step / 4) * 100}%` }]} />
          </View>
        </View>

        {errorMsg && (
          <SurfaceCard accentBorder="coral" style={{ padding: 12 }}>
            <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>⚠️ {errorMsg}</Text>
          </SurfaceCard>
        )}

        {/* SCREEN 1: CATEGORY SELECTION */}
        {step === 1 && (
          <View style={styles.section}>
            <Text style={[styles.label, { color: textColor }]}>
              Choose Task Category (14 Options)
            </Text>
            <View style={styles.catGrid}>
              {categories.map((cat) => {
                const isSelected = cat.id === selectedCategoryId;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => setSelectedCategoryId(cat.id)}
                    style={[
                      styles.categoryCard,
                      {
                        borderColor: isSelected ? COLORS.primary.DEFAULT : borderColor,
                        backgroundColor: isSelected
                          ? COLORS.primary.subtle
                          : isDark
                          ? COLORS.background.darkElevated
                          : '#FFFFFF',
                      },
                    ]}
                  >
                    <Text style={{ fontSize: 24 }}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.catName,
                        { color: isSelected ? COLORS.primary.light : textColor },
                      ]}
                    >
                      {language === 'ur' ? cat.name_ur : cat.name_en}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Configurable Category Custom Fields */}
            {selectedCategory && selectedCategory.custom_fields.length > 0 && (
              <SurfaceCard style={{ gap: 12, marginTop: 12 }}>
                <Text style={[styles.label, { color: textColor }]}>
                  {selectedCategory.name_en} — Details
                </Text>
                {selectedCategory.custom_fields.map((field) => (
                  <View key={field.name} style={{ gap: 6 }}>
                    <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>
                      {field.label || field.name} {field.required ? '*' : ''}
                    </Text>
                    <TextInput
                      value={customFieldValues[field.name] || ''}
                      onChangeText={(val) =>
                        setCustomFieldValues({ ...customFieldValues, [field.name]: val })
                      }
                      placeholder={`Enter ${field.label || field.name}`}
                      placeholderTextColor={subTextColor}
                      style={[styles.input, { color: textColor, borderColor }]}
                    />
                  </View>
                ))}
              </SurfaceCard>
            )}
          </View>
        )}

        {/* SCREEN 2: TITLE, DESCRIPTION, VOICE, PHOTOS */}
        {step === 2 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>Task Title *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="e.g. Find Honda Civic 2018 Side Mirror in Montgomery Road"
              placeholderTextColor={subTextColor}
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Detailed Description *</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe exact requirements, part numbers, instructions..."
              placeholderTextColor={subTextColor}
              multiline
              style={[styles.input, { color: textColor, borderColor, minHeight: 90 }]}
            />

            {/* Voice-to-Text Input Simulator */}
            <PillButton
              label={
                voiceNotePath
                  ? '✓ Voice Instructions Recorded (0:45s)'
                  : '🎙️ Record Voice Note / Voice-to-Text'
              }
              variant={voiceNotePath ? 'lime' : 'outline'}
              onPress={() => setVoiceNotePath('voice-notes/sample_instructions.m4a')}
            />

            {/* Up to 5 Photos Upload */}
            <Text style={[styles.label, { color: textColor }]}>
              Task Photos ({photos.length}/5 Attached)
            </Text>
            <View style={styles.photosRow}>
              {photos.map((uri, idx) => (
                <View key={idx} style={styles.photoThumb}>
                  <Text style={{ fontSize: 20 }}>🖼️</Text>
                  <Pressable
                    onPress={() => setPhotos(photos.filter((_, i) => i !== idx))}
                    style={styles.photoRemove}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 10, fontWeight: '900' }}>✕</Text>
                  </Pressable>
                </View>
              ))}
              {photos.length < 5 && (
                <Pressable
                  onPress={() =>
                    setPhotos([
                      ...photos,
                      `https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&idx=${photos.length}`,
                    ])
                  }
                  style={[styles.photoAddBtn, { borderColor }]}
                >
                  <Text style={{ fontSize: 20 }}>📷</Text>
                  <Text style={{ fontSize: 11, color: subTextColor, fontWeight: '700' }}>
                    + Photo
                  </Text>
                </Pressable>
              )}
            </View>
          </SurfaceCard>
        )}

        {/* SCREEN 3: LOCATIONS (Single, Pickup/Drop-off, Online) */}
        {step === 3 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>Location Type</Text>
            <View style={styles.locationTypeRow}>
              {[
                { id: 'physical_single', label: 'Single Location' },
                { id: 'physical_pickup_dropoff', label: 'Pickup & Drop-off' },
                { id: 'online', label: 'Online / Digital' },
              ].map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => setLocationType(loc.id as TaskLocationType)}
                  style={[
                    styles.locChip,
                    {
                      borderColor:
                        locationType === loc.id ? COLORS.primary.DEFAULT : borderColor,
                      backgroundColor:
                        locationType === loc.id ? COLORS.primary.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 12 }}>
                    {loc.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {locationType === 'physical_single' && (
              <>
                <Text style={[styles.label, { color: textColor }]}>Location Name</Text>
                <TextInput
                  value={locationName}
                  onChangeText={setLocationName}
                  placeholder="e.g. Clifton Block 4"
                  placeholderTextColor={subTextColor}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <Text style={[styles.label, { color: textColor }]}>Full Street Address *</Text>
                <TextInput
                  value={locationAddress}
                  onChangeText={setLocationAddress}
                  placeholder="Street / House / Sector address"
                  placeholderTextColor={subTextColor}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
              </>
            )}

            {locationType === 'physical_pickup_dropoff' && (
              <>
                <Text style={[styles.label, { color: COLORS.lime.DEFAULT }]}>
                  📦 Pickup Location *
                </Text>
                <TextInput
                  value={pickupName}
                  onChangeText={setPickupName}
                  placeholder="Pickup place name (e.g. Montgomery Road)"
                  placeholderTextColor={subTextColor}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TextInput
                  value={pickupAddress}
                  onChangeText={setPickupAddress}
                  placeholder="Pickup complete address"
                  placeholderTextColor={subTextColor}
                  style={[styles.input, { color: textColor, borderColor }]}
                />

                <Text style={[styles.label, { color: COLORS.coral.DEFAULT, marginTop: 8 }]}>
                  🏁 Drop-off Location *
                </Text>
                <TextInput
                  value={dropoffName}
                  onChangeText={setDropoffName}
                  placeholder="Drop-off place name (e.g. DHA Phase 5)"
                  placeholderTextColor={subTextColor}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <TextInput
                  value={dropoffAddress}
                  onChangeText={setDropoffAddress}
                  placeholder="Drop-off complete address"
                  placeholderTextColor={subTextColor}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
              </>
            )}

            {locationType === 'online' && (
              <View style={styles.onlineInfoBox}>
                <Text style={{ fontSize: 24 }}>🌐</Text>
                <Text style={{ color: textColor, fontWeight: '700' }}>
                  Online & Remote Delivery
                </Text>
                <Text style={{ color: subTextColor, fontSize: 13, textAlign: 'center' }}>
                  Taskers anywhere in Pakistan or globally can complete this task digitally. Proof can be submitted via documents, links, or screenshots.
                </Text>
              </View>
            )}
          </SurfaceCard>
        )}

        {/* SCREEN 4: PRICING, BUDGET, DEADLINE & FEE BREAKDOWN */}
        {step === 4 && (
          <SurfaceCard style={styles.stepCard}>
            <Text style={[styles.label, { color: textColor }]}>Task Charges (PKR) *</Text>
            <TextInput
              value={taskCharges}
              onChangeText={setTaskCharges}
              placeholder="1000"
              placeholderTextColor={subTextColor}
              keyboardType="numeric"
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>
              Expense Budget (PKR) — Optional for purchases
            </Text>
            <TextInput
              value={expenseBudget}
              onChangeText={setExpenseBudget}
              placeholder="0"
              placeholderTextColor={subTextColor}
              keyboardType="numeric"
              style={[styles.input, { color: textColor, borderColor }]}
            />

            <Text style={[styles.label, { color: textColor }]}>Deadline (Hours from now)</Text>
            <View style={styles.deadlineRow}>
              {['2', '4', '8', '24', '48'].map((hr) => (
                <Pressable
                  key={hr}
                  onPress={() => setDeadlineHours(hr)}
                  style={[
                    styles.deadlineChip,
                    {
                      borderColor: deadlineHours === hr ? COLORS.primary.DEFAULT : borderColor,
                      backgroundColor:
                        deadlineHours === hr ? COLORS.primary.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
                    {hr}h
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.label, { color: textColor }]}>Tasker Acceptance Method</Text>
            <View style={styles.deadlineRow}>
              {[
                { id: 'instant', label: 'Instant Acceptance ⚡' },
                { id: 'offer_only', label: 'Offers / Counter Only' },
                { id: 'both', label: 'Both (Instant + Offers)' },
              ].map((m) => (
                <Pressable
                  key={m.id}
                  onPress={() => setAcceptanceMethod(m.id as TaskAcceptanceMethod)}
                  style={[
                    styles.deadlineChip,
                    {
                      flex: 1,
                      borderColor: acceptanceMethod === m.id ? COLORS.primary.DEFAULT : borderColor,
                      backgroundColor:
                        acceptanceMethod === m.id ? COLORS.primary.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 12 }}>
                    {m.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Transparent Escrow Breakdown Box */}
            <View style={styles.feeBreakdownBox}>
              <Text style={{ color: COLORS.primary.light, fontWeight: '800', fontSize: 12 }}>
                TRANSPARENT ESCROW & FEE PREVIEW
              </Text>
              <View style={styles.feeRow}>
                <Text style={{ color: textColor }}>Task Charges:</Text>
                <Text style={{ color: textColor, fontWeight: '700' }}>
                  {formatCurrency(breakdown.taskCharges, 'PKR', language)}
                </Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={{ color: subTextColor }}>Platform Service Fee (10%):</Text>
                <Text style={{ color: subTextColor, fontWeight: '700' }}>
                  {formatCurrency(breakdown.serviceFee, 'PKR', language)}
                </Text>
              </View>
              <View style={[styles.feeRow, { borderTopWidth: 1, borderColor, paddingTop: 6 }]}>
                <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800' }}>
                  Tasker Receives:
                </Text>
                <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '900', fontSize: 16 }}>
                  {formatCurrency(breakdown.taskerReceives, 'PKR', language)}
                </Text>
              </View>
            </View>
          </SurfaceCard>
        )}

        {/* Wizard Footer Navigation */}
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
            label={step === 4 ? 'Publish Task ⚡' : 'Next Step →'}
            variant="primary"
            loading={isSubmitting}
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
  section: { gap: 12 },
  stepCard: { gap: 14 },
  label: { fontSize: 14, fontWeight: '700' },
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  categoryCard: {
    width: '48%',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    gap: 8,
  },
  catName: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  input: {
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 15,
  },
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: 'rgba(124, 58, 237, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  photoRemove: {
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
  photoAddBtn: {
    width: 64,
    height: 64,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTypeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  locChip: {
    flex: 1,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  onlineInfoBox: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  deadlineRow: {
    flexDirection: 'row',
    gap: 8,
  },
  deadlineChip: {
    minWidth: 48,
    minHeight: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  feeBreakdownBox: {
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});
