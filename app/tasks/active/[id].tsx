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
import { useAppStore } from '../../../src/stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../../src/theme/tokens';
import { SurfaceCard } from '../../../src/components/ui/SurfaceCard';
import { PillButton } from '../../../src/components/ui/PillButton';
import { TaskItem } from '../../../src/types/tasks';
import { TaskChatMessage } from '../../../src/types/execution';
import { getTaskById } from '../../../src/features/tasks/taskService';
import {
  updateTaskExecutionStatus,
  submitTaskProof,
  completeTask,
  requestTimeExtension,
  submitTaskDispute,
  triggerSosAlert,
  submitTaskRating,
  getTaskMessages,
  sendTaskMessage,
} from '../../../src/features/execution/executionService';
import { formatCurrency } from '../../../src/utils/formatters';

const LIFECYCLE_STEPS = ['accepted', 'in_progress', 'submitted', 'completed', 'rated'] as const;

export default function ActiveTaskExecutionScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [task, setTask] = useState<TaskItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Proof Modal State
  const [proofModalVisible, setProofModalVisible] = useState(false);
  const [proofPhotos, setProofPhotos] = useState<string[]>([]);
  const [receiptPhotos, setReceiptPhotos] = useState<string[]>([]);
  const [proofNotes, setProofNotes] = useState('');
  const [submittingProof, setSubmittingProof] = useState(false);

  // Completion Code Entry State (For Tasker)
  const [enteredCode, setEnteredCode] = useState('');
  const [completingTask, setCompletingTask] = useState(false);

  // Extension Modal State
  const [extModalVisible, setExtModalVisible] = useState(false);
  const [extMinutes, setExtMinutes] = useState('60');
  const [extReason, setExtReason] = useState('');

  // Dispute Modal State
  const [disputeModalVisible, setDisputeModalVisible] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Task incomplete or damaged');
  const [disputeDesc, setDisputeDesc] = useState('');

  // Rating Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [selectedStars, setSelectedStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  // Chat Drawer / State
  const [chatVisible, setChatVisible] = useState(false);
  const [messages, setMessages] = useState<TaskChatMessage[]>([]);
  const [newMessageText, setNewMessageText] = useState('');

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const loadData = async () => {
    if (id) {
      const t = await getTaskById(id);
      setTask(t);
      const msgs = await getTaskMessages(id);
      setMessages(msgs);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading || !task) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light }]}>
        <View style={styles.loadingBox}>
          <Text style={{ color: textColor }}>Loading active task execution...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPoster = profile?.id === task.poster_id;
  const isTasker = profile?.id === task.tasker_id || (!isPoster && Boolean(task.tasker_id));

  // Step index calculation
  const currentStepIndex = LIFECYCLE_STEPS.indexOf(task.status as (typeof LIFECYCLE_STEPS)[number]);

  // Handlers
  const handleMarkStarted = async () => {
    try {
      await updateTaskExecutionStatus(task.id, 'in_progress', 'Tasker is on the way');
      setActionNotice('🚀 Task marked IN PROGRESS! Poster notified.');
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleSubmitProof = async () => {
    if (proofPhotos.length === 0) {
      setErrorMsg('Please attach at least one proof photo');
      return;
    }
    setSubmittingProof(true);
    try {
      await submitTaskProof(
        task.id,
        profile?.id || 'usr_tasker_demo',
        proofPhotos,
        receiptPhotos,
        proofNotes
      );
      setProofModalVisible(false);
      setActionNotice('📷 Proof submitted! Waiting for poster approval or code entry.');
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Proof submission failed');
    } finally {
      setSubmittingProof(false);
    }
  };

  const handleComplete = async (codeToUse?: string) => {
    setCompletingTask(true);
    setErrorMsg(null);
    try {
      await completeTask(task.id, profile?.id || 'usr_tasker_demo', codeToUse || enteredCode);
      setActionNotice('🎉 Task marked COMPLETED! Escrow released.');
      setRatingModalVisible(true);
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Completion failed');
    } finally {
      setCompletingTask(false);
    }
  };

  const handleRequestExtension = async () => {
    try {
      await requestTimeExtension(
        task.id,
        profile?.id || 'usr_tasker_demo',
        parseInt(extMinutes, 10) || 60,
        extReason
      );
      setExtModalVisible(false);
      setActionNotice(`⏳ Extension of ${extMinutes} minutes requested from poster.`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to request extension');
    }
  };

  const handleTriggerSOS = async () => {
    try {
      await triggerSosAlert(task.id, profile?.id || 'usr_member_1', 31.5204, 74.3587, 'Emergency assistance requested');
      setActionNotice('🚨 SOS Alert Dispatched! Platform Safety Team and emergency contacts alerted with GPS.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to dispatch SOS');
    }
  };

  const handleRaiseDispute = async () => {
    try {
      await submitTaskDispute(task.id, profile?.id || 'usr_member_1', disputeReason, disputeDesc);
      setDisputeModalVisible(false);
      setActionNotice('🛡️ Dispute submitted. Platform administrators are reviewing evidence.');
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to open dispute');
    }
  };

  const handleSendRating = async () => {
    try {
      await submitTaskRating(task.id, profile?.id || 'usr_member_1', selectedStars, ratingComment);
      setRatingModalVisible(false);
      setActionNotice(`⭐ Thank you! Your ${selectedStars}-star review has been recorded.`);
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to submit rating');
    }
  };

  const handleSendChat = async () => {
    if (!newMessageText.trim()) return;
    try {
      const msg = await sendTaskMessage(
        task.id,
        profile?.id || 'usr_current',
        profile?.full_name || 'Member',
        newMessageText
      );
      setMessages([...messages, msg]);
      setNewMessageText('');
    } catch (err: unknown) {
      setErrorMsg('Failed to send message');
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
        {/* Top Action Header */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PillButton label="← Details" variant="outline" onPress={() => router.back()} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PillButton
              label="💬 Chat"
              variant="outline"
              onPress={() => setChatVisible(!chatVisible)}
              style={{ minHeight: 36, paddingHorizontal: 12 }}
            />
            <PillButton
              label="🚨 SOS"
              variant="coral"
              onPress={handleTriggerSOS}
              style={{ minHeight: 36, paddingHorizontal: 12 }}
            />
          </View>
        </View>

        {actionNotice && (
          <SurfaceCard accentBorder="lime" style={{ padding: 12 }}>
            <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800' }}>{actionNotice}</Text>
          </SurfaceCard>
        )}

        {errorMsg && (
          <SurfaceCard accentBorder="coral" style={{ padding: 12 }}>
            <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '700' }}>⚠️ {errorMsg}</Text>
          </SurfaceCard>
        )}

        {/* Task Lifecycle Stepper */}
        <SurfaceCard style={styles.stepperCard}>
          <Text style={[styles.stepperTitle, { color: textColor }]}>
            Task Lifecycle: <Text style={{ color: COLORS.primary.DEFAULT }}>{task.status.toUpperCase()}</Text>
          </Text>
          <View style={styles.stepperRow}>
            {LIFECYCLE_STEPS.map((st, idx) => {
              const isPastOrCurrent = currentStepIndex >= idx;
              return (
                <View key={st} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepCircle,
                      {
                        backgroundColor: isPastOrCurrent
                          ? COLORS.primary.DEFAULT
                          : isDark
                          ? '#272736'
                          : '#E5E7EB',
                      },
                    ]}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '800' }}>
                      {idx + 1}
                    </Text>
                  </View>
                  <Text style={[styles.stepLabel, { color: isPastOrCurrent ? textColor : subTextColor }]}>
                    {st.replace('_', ' ')}
                  </Text>
                </View>
              );
            })}
          </View>
        </SurfaceCard>

        {/* Task Summary Banner */}
        <SurfaceCard accentBorder="violet" style={{ gap: 8 }}>
          <Text style={[styles.taskTitle, { color: textColor }]}>{task.title}</Text>
          <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '900', fontSize: 18 }}>
            Escrow Held: {formatCurrency(task.task_charges, task.currency, language)}
          </Text>
          <Text style={{ color: subTextColor, fontSize: 13 }}>
            📍 {task.location_name || task.location_address || 'Online'}
          </Text>
        </SurfaceCard>

        {/* Poster 4-Digit Completion Code Card */}
        {isPoster && task.status !== 'completed' && task.status !== 'rated' && (
          <SurfaceCard accentBorder="lime" style={styles.codeCard}>
            <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '800' }}>
              4-DIGIT COMPLETION CODE (GIVE TO TASKER UPON SATISFACTION)
            </Text>
            <Text style={styles.codeDisplay}>{task.completion_code || '4829'}</Text>
            <Text style={{ color: subTextColor, fontSize: 12 }}>
              The tasker cannot mark the task completed without this code or your direct approval.
            </Text>
            {task.status === 'submitted' && (
              <PillButton
                label="Approve Proof & Complete ⚡"
                variant="lime"
                loading={completingTask}
                onPress={() => handleComplete(task.completion_code || '4829')}
              />
            )}
          </SurfaceCard>
        )}

        {/* Tasker Action Controller */}
        {isTasker && (
          <SurfaceCard style={{ gap: 12 }}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>Tasker Action Controls</Text>

            {task.status === 'accepted' && (
              <PillButton
                label="🚀 On My Way / Mark Started"
                variant="primary"
                onPress={handleMarkStarted}
              />
            )}

            {task.status === 'in_progress' && (
              <PillButton
                label="📷 Submit Completion Proof & Receipts"
                variant="primary"
                onPress={() => setProofModalVisible(true)}
              />
            )}

            {task.status === 'submitted' && (
              <View style={{ gap: 10 }}>
                <Text style={{ color: textColor, fontWeight: '700' }}>
                  Enter 4-Digit Code provided by Poster:
                </Text>
                <TextInput
                  value={enteredCode}
                  onChangeText={setEnteredCode}
                  placeholder="e.g. 4829"
                  placeholderTextColor={subTextColor}
                  keyboardType="number-pad"
                  maxLength={4}
                  style={[styles.input, { color: textColor, borderColor }]}
                />
                <PillButton
                  label="Verify Code & Complete ⚡"
                  variant="lime"
                  loading={completingTask}
                  onPress={() => handleComplete()}
                />
              </View>
            )}

            <View style={styles.auxButtonsRow}>
              <PillButton
                label="⏳ Request Extension"
                variant="outline"
                onPress={() => setExtModalVisible(true)}
                style={{ flex: 1 }}
              />
              <PillButton
                label="⚠️ Report Problem"
                variant="outline"
                onPress={() => setDisputeModalVisible(true)}
                style={{ flex: 1 }}
              />
            </View>
          </SurfaceCard>
        )}

        {/* In-Task Live Chat Section */}
        {chatVisible && (
          <SurfaceCard style={styles.chatBox}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>In-Task Live Chat</Text>
            <ScrollView style={styles.messagesContainer}>
              {messages.map((m) => (
                <View
                  key={m.id}
                  style={[
                    styles.messageBubble,
                    {
                      backgroundColor:
                        m.sender_id === profile?.id
                          ? COLORS.primary.DEFAULT
                          : isDark
                          ? '#272736'
                          : '#E5E7EB',
                      alignSelf: m.sender_id === profile?.id ? 'flex-end' : 'flex-start',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 10, color: '#D1D5DB', fontWeight: '700' }}>
                    {m.sender_name}
                  </Text>
                  <Text style={{ color: '#FFFFFF', fontSize: 14, marginTop: 2 }}>
                    {m.body}
                  </Text>
                </View>
              ))}
            </ScrollView>
            <View style={[styles.chatInputRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TextInput
                value={newMessageText}
                onChangeText={setNewMessageText}
                placeholder="Type a message..."
                placeholderTextColor={subTextColor}
                style={[styles.chatInput, { color: textColor, borderColor }]}
              />
              <PillButton
                label="Send"
                variant="primary"
                onPress={handleSendChat}
                style={{ minHeight: 40, paddingHorizontal: 16 }}
              />
            </View>
          </SurfaceCard>
        )}

        {/* PROOF SUBMISSION MODAL */}
        <Modal visible={proofModalVisible} animationType="slide" transparent onRequestClose={() => setProofModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Submit Completion Proof</Text>
              <Text style={{ color: subTextColor, fontSize: 13 }}>
                Upload clear photographs of completed work and store receipts if purchases were made.
              </Text>

              <PillButton
                label={
                  proofPhotos.length > 0
                    ? `✓ ${proofPhotos.length} Proof Photos Attached`
                    : '📷 Attach Proof Photos *'
                }
                variant={proofPhotos.length > 0 ? 'lime' : 'outline'}
                onPress={() => setProofPhotos(['https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800'])}
              />

              <PillButton
                label={
                  receiptPhotos.length > 0
                    ? `✓ ${receiptPhotos.length} Receipts Attached`
                    : '🧾 Attach Store Receipt (Optional)'
                }
                variant={receiptPhotos.length > 0 ? 'lime' : 'outline'}
                onPress={() => setReceiptPhotos(['https://images.unsplash.com/photo-1554415707-9e49fe4736f9?w=800'])}
              />

              <TextInput
                value={proofNotes}
                onChangeText={setProofNotes}
                placeholder="Notes for poster (e.g. Completed mirror installation, tested electrical motor)..."
                placeholderTextColor={subTextColor}
                multiline
                style={[styles.input, { color: textColor, borderColor, minHeight: 70 }]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setProofModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Submit Proof" variant="primary" loading={submittingProof} onPress={handleSubmitProof} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* TIME EXTENSION MODAL */}
        <Modal visible={extModalVisible} animationType="slide" transparent onRequestClose={() => setExtModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Request Time Extension</Text>
              <TextInput
                value={extMinutes}
                onChangeText={setExtMinutes}
                placeholder="Additional minutes (e.g. 60)"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.input, { color: textColor, borderColor }]}
              />
              <TextInput
                value={extReason}
                onChangeText={setExtReason}
                placeholder="Reason (e.g. Traffic delay on Ferozepur road)..."
                placeholderTextColor={subTextColor}
                style={[styles.input, { color: textColor, borderColor }]}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setExtModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Send Request" variant="primary" onPress={handleRequestExtension} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* DISPUTE MODAL */}
        <Modal visible={disputeModalVisible} animationType="slide" transparent onRequestClose={() => setDisputeModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Report a Problem / Dispute</Text>
              <TextInput
                value={disputeReason}
                onChangeText={setDisputeReason}
                placeholder="Reason for dispute"
                placeholderTextColor={subTextColor}
                style={[styles.input, { color: textColor, borderColor }]}
              />
              <TextInput
                value={disputeDesc}
                onChangeText={setDisputeDesc}
                placeholder="Detailed explanation of what went wrong..."
                placeholderTextColor={subTextColor}
                multiline
                style={[styles.input, { color: textColor, borderColor, minHeight: 80 }]}
              />
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setDisputeModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Submit Dispute" variant="coral" onPress={handleRaiseDispute} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* MUTUAL RATING MODAL */}
        <Modal visible={ratingModalVisible} animationType="slide" transparent onRequestClose={() => setRatingModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Rate Your Experience ⚡</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Pressable key={star} onPress={() => setSelectedStars(star)}>
                    <Text style={{ fontSize: 32 }}>{star <= selectedStars ? '⭐' : '☆'}</Text>
                  </Pressable>
                ))}
              </View>
              <TextInput
                value={ratingComment}
                onChangeText={setRatingComment}
                placeholder="Leave feedback on punctuality, communication, quality..."
                placeholderTextColor={subTextColor}
                multiline
                style={[styles.input, { color: textColor, borderColor, minHeight: 70 }]}
              />
              <PillButton label="Submit Review" variant="primary" onPress={handleSendRating} />
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  stepperCard: { gap: 10, padding: 16 },
  stepperTitle: { fontSize: 13, fontWeight: '800' },
  stepperRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  stepItem: { alignItems: 'center', gap: 4 },
  stepCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  stepLabel: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  taskTitle: { fontSize: 18, fontWeight: '900' },
  codeCard: { alignItems: 'center', gap: 8, padding: 18 },
  codeDisplay: { fontSize: 36, fontWeight: '900', letterSpacing: 8, color: COLORS.lime.DEFAULT },
  sectionTitle: { fontSize: 16, fontWeight: '800' },
  auxButtonsRow: { flexDirection: 'row', gap: 10 },
  input: { minHeight: TYPOGRAPHY.minTouchTarget, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14 },
  chatBox: { gap: 10, padding: 14 },
  messagesContainer: { maxHeight: 180 },
  messageBubble: { padding: 10, borderRadius: 12, marginBottom: 6, maxWidth: '80%' },
  chatInputRow: { gap: 8, alignItems: 'center' },
  chatInput: { flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, fontSize: 14 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginVertical: 8 },
});
