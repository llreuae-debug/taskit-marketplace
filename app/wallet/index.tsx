import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  Pressable,
  Modal,
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
  Wallet,
  WalletLedgerEntry,
  PaymentGatewayProvider,
} from '../../src/types/finance';
import {
  getUserWallet,
  getWalletLedger,
  depositToWallet,
  requestWithdrawal,
} from '../../src/features/wallet/walletService';
import { formatCurrency } from '../../src/utils/formatters';

const GATEWAYS: Array<{ id: PaymentGatewayProvider; name: string; icon: string }> = [
  { id: 'jazzcash', name: 'JazzCash Mobile Account', icon: '📱' },
  { id: 'easypaisa', name: 'Easypaisa Wallet', icon: '💳' },
  { id: 'bank_transfer', name: 'Bank Transfer / Raast Instant', icon: '🏦' },
  { id: 'stripe', name: 'Debit / Credit Card (Stripe)', icon: '🌐' },
];

export default function WalletScreen() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [ledger, setLedger] = useState<WalletLedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Deposit Modal State
  const [depositModalVisible, setDepositModalVisible] = useState(false);
  const [depositAmount, setDepositAmount] = useState('2000');
  const [depositProvider, setDepositProvider] = useState<PaymentGatewayProvider>('jazzcash');
  const [depositing, setDepositing] = useState(false);

  // Withdrawal Modal State
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('1000');
  const [withdrawProvider, setWithdrawProvider] = useState<PaymentGatewayProvider>('jazzcash');
  const [accountTitle, setAccountTitle] = useState(profile?.full_name || 'Ali Raza');
  const [accountNumber, setAccountNumber] = useState('03001234567');
  const [bankName, setBankName] = useState('Meezan Bank');
  const [withdrawing, setWithdrawing] = useState(false);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const currentUserId = profile?.id || 'usr_poster_1';

  const loadData = async () => {
    try {
      const [w, l] = await Promise.all([
        getUserWallet(currentUserId),
        getWalletLedger(currentUserId),
      ]);
      setWallet(w);
      setLedger(l);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const handleDeposit = async () => {
    const amt = parseFloat(depositAmount);
    if (!amt || amt < 100) {
      setErrorMsg('Minimum deposit amount is PKR 100');
      return;
    }
    setDepositing(true);
    setErrorMsg(null);
    try {
      const res = await depositToWallet(currentUserId, amt, depositProvider);
      setDepositModalVisible(false);
      setActionNotice(`✓ Successfully deposited ${formatCurrency(amt, 'PKR', language)} via ${depositProvider.toUpperCase()}!`);
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Deposit failed');
    } finally {
      setDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const amt = parseFloat(withdrawAmount);
    if (!amt || amt < 500) {
      setErrorMsg('Minimum withdrawal is PKR 500');
      return;
    }
    setWithdrawing(true);
    setErrorMsg(null);
    try {
      await requestWithdrawal(
        currentUserId,
        amt,
        withdrawProvider,
        accountTitle,
        accountNumber,
        withdrawProvider === 'bank_transfer' ? bankName : undefined
      );
      setWithdrawModalVisible(false);
      setActionNotice(`✓ Withdrawal request of ${formatCurrency(amt, 'PKR', language)} logged! Processing to ${accountNumber}.`);
      loadData();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Withdrawal failed');
    } finally {
      setWithdrawing(false);
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
        {/* Top Header */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PillButton label="← Profile" variant="outline" onPress={() => router.back()} />
          <Text style={[styles.title, { color: textColor }]}>Task Wallet ⚡</Text>
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

        {/* Triple Balance Display Card */}
        <SurfaceCard accentBorder="violet" style={styles.balancesCard}>
          <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '800', letterSpacing: 0.5 }}>
            TOTAL FUNDS HELD
          </Text>
          <Text style={[styles.bigTotal, { color: textColor }]}>
            {formatCurrency(wallet?.total_balance || 0, wallet?.currency || 'PKR', language)}
          </Text>

          <View style={styles.balanceSplitRow}>
            <View style={styles.splitBox}>
              <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>
                AVAILABLE TO SPEND / WITHDRAW
              </Text>
              <Text style={[styles.splitAmount, { color: COLORS.lime.DEFAULT }]}>
                {formatCurrency(wallet?.available_balance || 0, wallet?.currency || 'PKR', language)}
              </Text>
            </View>

            <View style={[styles.splitBox, { alignItems: 'flex-end' }]}>
              <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>
                LOCKED IN TASK ESCROW
              </Text>
              <Text style={[styles.splitAmount, { color: COLORS.primary.light }]}>
                {formatCurrency(wallet?.escrow_balance || 0, wallet?.currency || 'PKR', language)}
              </Text>
            </View>
          </View>

          <View style={styles.actionRow}>
            <PillButton
              label="+ Add Money 💳"
              variant="primary"
              onPress={() => setDepositModalVisible(true)}
              style={{ flex: 1 }}
            />
            <PillButton
              label="Withdraw 🏦"
              variant="outline"
              onPress={() => setWithdrawModalVisible(true)}
              style={{ flex: 1 }}
            />
          </View>
        </SurfaceCard>

        {/* Real Estate Financial Separation Notice */}
        <SurfaceCard style={styles.disclaimerCard}>
          <Text style={{ fontSize: 16 }}>🛡️</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ color: textColor, fontWeight: '800', fontSize: 13 }}>
              Real Estate Financial Separation Guardrail
            </Text>
            <Text style={{ color: subTextColor, fontSize: 12, lineHeight: 17 }}>
              Real Estate marketplace transactions and booking deposits are strictly decoupled from the task escrow engine. Property transactions operate on independent legally-compliant workflows.
            </Text>
          </View>
        </SurfaceCard>

        {/* Immutable Accounting Ledger Section */}
        <View style={styles.ledgerSection}>
          <Text style={[styles.sectionTitle, { color: textColor }]}>
            Immutable Wallet Ledger ({ledger.length})
          </Text>
          <Text style={{ color: subTextColor, fontSize: 12 }}>
            Double-entry accounting log. Entries are permanent and cannot be modified or deleted.
          </Text>

          {ledger.length === 0 ? (
            <SurfaceCard style={{ padding: 18, alignItems: 'center' }}>
              <Text style={{ color: subTextColor }}>No ledger activity yet</Text>
            </SurfaceCard>
          ) : (
            ledger.map((entry) => {
              const isCredit =
                entry.entry_type === 'deposit' ||
                entry.entry_type === 'escrow_release' ||
                entry.entry_type === 'escrow_refund';
              return (
                <SurfaceCard key={entry.id} style={styles.ledgerItem}>
                  <View style={[styles.ledgerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ gap: 2 }}>
                      <Text style={[styles.ledgerType, { color: textColor }]}>
                        {entry.entry_type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={{ color: subTextColor, fontSize: 11 }}>
                        {new Date(entry.created_at).toLocaleString()}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.ledgerAmount,
                        { color: isCredit ? COLORS.lime.DEFAULT : COLORS.coral.DEFAULT },
                      ]}
                    >
                      {isCredit ? '+' : '-'} {formatCurrency(entry.amount, entry.currency, language)}
                    </Text>
                  </View>
                  <Text style={{ color: subTextColor, fontSize: 11, marginTop: 4 }}>
                    Balance: {formatCurrency(entry.balance_before, entry.currency, language)} →{' '}
                    {formatCurrency(entry.balance_after, entry.currency, language)} • Key: {entry.idempotency_key}
                  </Text>
                </SurfaceCard>
              );
            })
          )}
        </View>

        {/* DEPOSIT MODAL */}
        <Modal visible={depositModalVisible} animationType="slide" transparent onRequestClose={() => setDepositModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Add Money to TaskIt Wallet</Text>
              <Text style={{ color: subTextColor, fontSize: 13 }}>
                Deposit funds to post tasks and fund transparent escrow balances.
              </Text>

              <Text style={[styles.label, { color: textColor }]}>Select Payment Gateway</Text>
              {GATEWAYS.map((gw) => (
                <Pressable
                  key={gw.id}
                  onPress={() => setDepositProvider(gw.id)}
                  style={[
                    styles.gatewayRow,
                    {
                      borderColor: depositProvider === gw.id ? COLORS.primary.DEFAULT : borderColor,
                      backgroundColor: depositProvider === gw.id ? COLORS.primary.subtle : 'transparent',
                    },
                  ]}
                >
                  <Text style={{ fontSize: 20 }}>{gw.icon}</Text>
                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>{gw.name}</Text>
                </Pressable>
              ))}

              <Text style={[styles.label, { color: textColor }]}>Deposit Amount (PKR) *</Text>
              <TextInput
                value={depositAmount}
                onChangeText={setDepositAmount}
                placeholder="2000"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setDepositModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Deposit Funds" variant="primary" loading={depositing} onPress={handleDeposit} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* WITHDRAWAL MODAL */}
        <Modal visible={withdrawModalVisible} animationType="slide" transparent onRequestClose={() => setWithdrawModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Withdraw Earnings</Text>
              <Text style={{ color: subTextColor, fontSize: 13 }}>
                Payout available balance directly to your verified mobile wallet or bank account.
              </Text>

              <Text style={[styles.label, { color: textColor }]}>Withdrawal Amount (Min PKR 500) *</Text>
              <TextInput
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
                placeholder="1000"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <Text style={[styles.label, { color: textColor }]}>Account Title (Must Match Legal KYC Name) *</Text>
              <TextInput
                value={accountTitle}
                onChangeText={setAccountTitle}
                placeholder="Muhammad Ahmed"
                placeholderTextColor={subTextColor}
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <Text style={[styles.label, { color: textColor }]}>Account / Mobile Wallet Number *</Text>
              <TextInput
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="03001234567 / IBAN"
                placeholderTextColor={subTextColor}
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setWithdrawModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Request Payout" variant="primary" loading={withdrawing} onPress={handleWithdraw} style={{ flex: 1 }} />
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
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '900' },
  balancesCard: { gap: 12, padding: 18 },
  bigTotal: { fontSize: 32, fontWeight: '900' },
  balanceSplitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
    padding: 12,
    borderRadius: 14,
  },
  splitBox: { flex: 1, gap: 2 },
  splitAmount: { fontSize: 18, fontWeight: '900', marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  disclaimerCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    backgroundColor: 'rgba(255, 92, 122, 0.08)',
    borderColor: 'rgba(255, 92, 122, 0.3)',
  },
  ledgerSection: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '900' },
  ledgerItem: { padding: 12, gap: 4 },
  ledgerRow: { justifyContent: 'space-between', alignItems: 'center' },
  ledgerType: { fontSize: 14, fontWeight: '800' },
  ledgerAmount: { fontSize: 16, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '700' },
  gatewayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
  },
  input: { minHeight: TYPOGRAPHY.minTouchTarget, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14 },
});
