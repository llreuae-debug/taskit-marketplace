import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { TaskItem } from '../../src/types/tasks';
import {
  getTaskById,
  acceptTaskAtomic,
  submitTaskOffer,
} from '../../src/features/tasks/taskService';
import { evaluateKycAccessGate } from '../../src/features/kyc/validation';
import { formatCurrency } from '../../src/utils/formatters';

export default function TaskDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Counter Offer Modal State
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [counterPrice, setCounterPrice] = useState('');
  const [offerComment, setOfferComment] = useState('');
  const [submittingOffer, setSubmittingOffer] = useState(false);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  useEffect(() => {
    if (id) {
      getTaskById(id).then((t) => {
        setTask(t);
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light }]}>
        <View style={styles.loadingBox}>
          <Text style={{ color: textColor, fontSize: 16 }}>Loading task details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light }]}>
        <View style={styles.loadingBox}>
          <Text style={{ color: COLORS.coral.DEFAULT, fontSize: 18, fontWeight: '800' }}>Task Not Found</Text>
          <PillButton label="← Back to Tasks" variant="outline" onPress={() => router.back()} />
        </View>
      </SafeAreaView>
    );
  }

  const isPoster = profile?.id === task.poster_id;
  const isAcceptedByMe = profile?.id === task.tasker_id;
  const kycGate = evaluateKycAccessGate('accept_task', profile?.kyc_status, profile?.is_suspended);

  // Atomic Acceptance Handler
  const handleInstantAccept = async () => {
    if (!kycGate.allowed) {
      setErrorMsg(kycGate.reason || 'Approved KYC is required before accepting tasks');
      return;
    }
    if (isPoster) {
      setErrorMsg('You cannot accept your own task');
      return;
    }

    setAccepting(true);
    setErrorMsg(null);
    try {
      const res = await acceptTaskAtomic(task.id, profile?.id || 'usr_tasker_demo');
      setTask({ ...task, status: 'accepted', tasker_id: profile?.id || 'usr_tasker_demo' });
      setSuccessMsg(`⚡ Task accepted successfully! Completion code: ${res.completion_code || '****'}`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to accept task');
    } finally {
      setAccepting(false);
    }
  };

  // Counter Offer Handler
  const handleSendOffer = async () => {
    const priceNum = parseFloat(counterPrice);
    if (!priceNum || priceNum < 100) {
      setErrorMsg('Offer price must be at least PKR 100');
      return;
    }

    setSubmittingOffer(true);
    try {
      await submitTaskOffer(task.id, profile?.id || 'usr_tasker_demo', priceNum, offerComment);
      setOfferModalVisible(false);
      setSuccessMsg(`✓ Offer of PKR ${priceNum} sent to poster!`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit offer');
    } finally {
      setSubmittingOffer(false);
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
        {/* Top Header Bar */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PillButton label="← Tasks" variant="outline" onPress={() => router.back()} />
          <View style={[styles.statusBadge, { backgroundColor: task.status === 'open' ? COLORS.lime.subtle : COLORS.primary.subtle }]}>
            <Text style={{ color: task.status === 'open' ? COLORS.lime.dark : COLORS.primary.light, fontWeight: '800', fontSize: 12 }}>
              STATUS: {task.status.toUpperCase()}
            </Text>
          </View>
        </View>

        {successMsg && (
          <SurfaceCard accentBorder="lime" style={{ padding: 14 }}>
            <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800' }}>{successMsg}</Text>
          </SurfaceCard>
        )}

        {errorMsg && (
          <SurfaceCard accentBorder="coral" style={{ padding: 14 }}>
            <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>⚠️ {errorMsg}</Text>
          </SurfaceCard>
        )}

        {/* Main Details Card */}
        <SurfaceCard accentBorder="violet" style={styles.card}>
          <View style={[styles.catRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={{ fontSize: 18 }}>{task.category?.icon || '⚡'}</Text>
            <Text style={{ color: COLORS.primary.light, fontWeight: '800', fontSize: 14 }}>
              {language === 'ur' ? task.category?.name_ur : task.category?.name_en}
            </Text>
          </View>

          <Text style={[styles.title, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {task.title}
          </Text>

          <Text style={[styles.desc, { color: subTextColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {task.description}
          </Text>

          {/* Pricing & Escrow Box */}
          <View style={styles.priceContainer}>
            <View>
              <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '800' }}>TASK REWARD (ESCROW)</Text>
              <Text style={[styles.priceBig, { color: COLORS.lime.DEFAULT }]}>
                {formatCurrency(task.task_charges, task.currency, language)}
              </Text>
            </View>
            {task.expense_budget > 0 && (
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '800' }}>EXPENSE BUDGET</Text>
                <Text style={[styles.expenseText, { color: textColor }]}>
                  {formatCurrency(task.expense_budget, task.currency, language)}
                </Text>
              </View>
            )}
          </View>

          {/* Location Breakdown */}
          <View style={styles.locationSection}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Locations</Text>
            {task.location_type === 'physical_pickup_dropoff' ? (
              <View style={{ gap: 8 }}>
                <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '700' }}>
                  📦 Pickup: {task.pickup_name || task.pickup_address}
                </Text>
                <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>
                  🏁 Drop-off: {task.dropoff_name || task.dropoff_address}
                </Text>
              </View>
            ) : (
              <Text style={{ color: textColor }}>
                📍 {task.location_type === 'online' ? 'Online / Remote Task' : task.location_name || task.location_address}
              </Text>
            )}
          </View>

          {/* Poster Profile */}
          <View style={[styles.posterBox, { borderColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.posterAvatar}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                {task.poster?.full_name ? task.poster.full_name[0] : 'U'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.posterName, { color: textColor }]}>{task.poster?.full_name || 'Member'}</Text>
              <Text style={{ color: COLORS.lime.dark, fontSize: 12, fontWeight: '700' }}>
                ⭐ {task.poster?.poster_rating || '5.0'} • 🛡️ Identity Verified
              </Text>
            </View>
            <PillButton
              label="💬 Chat"
              variant="outline"
              onPress={() => router.push('/(tabs)/chats')}
              style={{ minHeight: 36, paddingHorizontal: 12 }}
            />
          </View>
        </SurfaceCard>

        {/* Action Controls */}
        {task.status === 'open' && !isPoster && (
          <View style={styles.actionButtons}>
            {(task.acceptance_method === 'instant' || task.acceptance_method === 'both') && (
              <PillButton
                label="Accept Task Instantly ⚡"
                variant="primary"
                loading={accepting}
                onPress={handleInstantAccept}
              />
            )}
            {(task.acceptance_method === 'offer_only' || task.acceptance_method === 'both') && (
              <PillButton
                label="Send Counter-Offer / Propose Price 💬"
                variant="outline"
                onPress={() => setOfferModalVisible(true)}
              />
            )}
          </View>
        )}

        {task.status !== 'open' && (
          <SurfaceCard accentBorder="lime" style={{ gap: 10 }}>
            <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800', fontSize: 16 }}>
              ⚡ Task In Active Execution Lifecycle
            </Text>
            <Text style={{ color: subTextColor, fontSize: 13 }}>
              Track live countdown, submit/approve proof photos, enter the 4-digit completion code, or request time extensions.
            </Text>
            <PillButton
              label="Open Execution Mission Control 🚀"
              variant="lime"
              onPress={() => router.push({ pathname: '/tasks/active/[id]', params: { id: task.id } })}
            />
          </SurfaceCard>
        )}

        {/* Counter Offer Modal */}
        <Modal visible={offerModalVisible} animationType="slide" transparent onRequestClose={() => setOfferModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Propose Counter-Price</Text>
              <Text style={{ color: subTextColor, fontSize: 13 }}>
                Offer your price to complete this task. The poster can accept your offer.
              </Text>

              <Text style={[styles.label, { color: textColor }]}>Your Offered Amount (PKR) *</Text>
              <TextInput
                value={counterPrice}
                onChangeText={setCounterPrice}
                placeholder="e.g. 1500"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <Text style={[styles.label, { color: textColor }]}>Comment / Proposal *</Text>
              <TextInput
                value={offerComment}
                onChangeText={setOfferComment}
                placeholder="I have tools and can arrive in 30 minutes..."
                placeholderTextColor={subTextColor}
                multiline
                style={[styles.input, { color: textColor, borderColor, minHeight: 70 }]}
              />

              <View style={styles.modalActions}>
                <PillButton label="Cancel" variant="outline" onPress={() => setOfferModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Submit Offer" variant="primary" loading={submittingOffer} onPress={handleSendOffer} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  card: { padding: 18, gap: 12 },
  catRow: { alignItems: 'center', gap: 8 },
  title: { fontSize: 20, fontWeight: '900', lineHeight: 26 },
  desc: { fontSize: 14, lineHeight: 20 },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    padding: 14,
    borderRadius: 14,
  },
  priceBig: { fontSize: 24, fontWeight: '900', marginTop: 4 },
  expenseText: { fontSize: 18, fontWeight: '800', marginTop: 4 },
  locationSection: { gap: 6, borderTopWidth: 1, borderColor: 'rgba(124, 58, 237, 0.08)', paddingTop: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '800' },
  posterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    padding: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  posterAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  posterName: { fontSize: 14, fontWeight: '800' },
  actionButtons: { gap: 10 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: TYPOGRAPHY.minTouchTarget, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
});
