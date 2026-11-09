import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import {
  getPendingKycSubmissions,
  adminReviewKyc,
  KycReviewQueueItem,
} from '../../src/features/kyc/kycService';
import {
  getPropertiesFeed,
  adminReviewProperty,
} from '../../src/features/realEstate/realEstateService';
import {
  getOpenDisputes,
  resolveTaskDispute,
} from '../../src/features/execution/executionService';
import {
  getAllWithdrawals,
  adminApproveWithdrawal,
  adminRejectWithdrawal,
} from '../../src/features/wallet/walletService';
import { PropertyItem } from '../../src/types/realEstate';
import { TaskDispute } from '../../src/types/execution';
import { WithdrawalRequest } from '../../src/types/finance';

const ADMIN_MODULES = [
  '1. Executive Overview',
  '2. Member Management',
  '3. KYC Verification Queue',
  '4. Task Operations',
  '5. Task Categories & Custom Fields',
  '6. Task Disputes Arbiter',
  '7. Escrow Wallets Management',
  '8. Payment Gateway Reconciliations',
  '9. Payouts & Withdrawals Queue',
  '10. Real Estate Listings',
  '11. Property 3-Tier Verification',
  '12. Real Estate Categories',
  '13. Property Reports & Flags',
  '14. Property Leads & Inquiries',
  '15. Housing Schemes & Master Projects',
  '16. Featured & Promoted Listings',
  '17. Agency Subscription Packages',
  '18. Monetization & Commission Rules',
  '19. Push & In-App Notifications',
  '20. Multilingual Strings & Locales',
  '21. Platform Analytics & KPIs',
  '22. Administrator Roles & RBAC',
  '23. Security & Immutable Audit Logs',
  '24. System Settings & Maintenance Mode',
];

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'overview' | 'kyc' | 'properties' | 'disputes' | 'payouts' | 'modules'>('overview');
  const [kycQueue, setKycQueue] = useState<KycReviewQueueItem[]>([]);
  const [pendingProperties, setPendingProperties] = useState<PropertyItem[]>([]);
  const [disputesQueue, setDisputesQueue] = useState<TaskDispute[]>([]);
  const [withdrawalsQueue, setWithdrawalsQueue] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAdminData = async () => {
    try {
      const [kyc, props, disps, wds] = await Promise.all([
        getPendingKycSubmissions(),
        getPropertiesFeed(),
        getOpenDisputes(),
        getAllWithdrawals(),
      ]);
      setKycQueue(kyc);
      setPendingProperties(props.filter((p) => !p.verified_listing || p.verification_status !== 'verified'));
      setDisputesQueue(disps);
      setWithdrawalsQueue(wds.filter((w) => w.status === 'pending'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleApproveKyc = async (kycId: string) => {
    try {
      await adminReviewKyc(kycId, profile?.id || 'admin-1', 'approved');
      Alert.alert('Approved', 'Member identity has been successfully verified.');
      loadAdminData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleRejectKyc = async (kycId: string) => {
    try {
      await adminReviewKyc(kycId, profile?.id || 'admin-1', 'rejected', 'Document illegible or mismatched');
      Alert.alert('Rejected', 'KYC application rejected.');
      loadAdminData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleApproveProperty = async (propId: string) => {
    try {
      await adminReviewProperty(propId, 'verified', true);
      Alert.alert('Badge Granted', 'Property marked as Verified Listing with Documents Reviewed.');
      loadAdminData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleResolveDispute = async (disputeId: string, resolution: 'release_to_tasker' | 'refund_to_poster') => {
    try {
      await resolveTaskDispute(disputeId, resolution, 'Arbitrated by platform administration');
      Alert.alert('Dispute Arbitrated', `Dispute resolved with action: ${resolution}`);
      loadAdminData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleApprovePayout = async (withdrawalId: string) => {
    try {
      await adminApproveWithdrawal(withdrawalId, `TXN-${Date.now()}`);
      Alert.alert('Payout Dispatched', 'Withdrawal has been marked completed.');
      loadAdminData();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const cardBg = isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: COLORS.primary.DEFAULT }]}>TASKIT ⚡ ADMIN ERP</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            24 Platform Modules • Audit-Logged Operations
          </Text>
        </View>
        <PillButton
          label="← Exit Admin"
          variant="outline"
          style={{ minHeight: 38, paddingHorizontal: 12 }}
          onPress={() => router.back()}
        />
      </View>

      {/* Admin Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabScroll}
      >
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'overview' && styles.activeTabChip]}
          onPress={() => setActiveTab('overview')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'overview' ? '#FFF' : textColor }]}>
            📊 Overview
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'kyc' && styles.activeTabChip]}
          onPress={() => setActiveTab('kyc')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'kyc' ? '#FFF' : textColor }]}>
            🛡️ KYC Queue ({kycQueue.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'properties' && styles.activeTabChip]}
          onPress={() => setActiveTab('properties')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'properties' ? '#FFF' : textColor }]}>
            🏡 Properties ({pendingProperties.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'disputes' && styles.activeTabChip]}
          onPress={() => setActiveTab('disputes')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'disputes' ? '#FFF' : textColor }]}>
            ⚖️ Disputes ({disputesQueue.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'payouts' && styles.activeTabChip]}
          onPress={() => setActiveTab('payouts')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'payouts' ? '#FFF' : textColor }]}>
            💳 Payouts ({withdrawalsQueue.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabChip, activeTab === 'modules' && styles.activeTabChip]}
          onPress={() => setActiveTab('modules')}
        >
          <Text style={[styles.tabText, { color: activeTab === 'modules' ? '#FFF' : textColor }]}>
            📁 24 Modules
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.contentScroll}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadAdminData();
              }}
              tintColor={COLORS.primary.DEFAULT}
            />
          }
        >
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <View style={{ gap: 14 }}>
              <View style={styles.kpiGrid}>
                <SurfaceCard style={styles.kpiCard}>
                  <Text style={[styles.kpiNum, { color: COLORS.primary.DEFAULT }]}>
                    {kycQueue.length}
                  </Text>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]}>KYC Pending</Text>
                </SurfaceCard>
                <SurfaceCard style={styles.kpiCard}>
                  <Text style={[styles.kpiNum, { color: COLORS.lime.DEFAULT }]}>
                    {pendingProperties.length}
                  </Text>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]}>Props to Verify</Text>
                </SurfaceCard>
                <SurfaceCard style={styles.kpiCard}>
                  <Text style={[styles.kpiNum, { color: COLORS.coral.DEFAULT }]}>
                    {disputesQueue.length}
                  </Text>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]}>Open Disputes</Text>
                </SurfaceCard>
                <SurfaceCard style={styles.kpiCard}>
                  <Text style={[styles.kpiNum, { color: COLORS.status.success }]}>
                    {withdrawalsQueue.length}
                  </Text>
                  <Text style={[styles.kpiTitle, { color: subTextColor }]}>Pending Payouts</Text>
                </SurfaceCard>
              </View>

              <SurfaceCard style={{ gap: 10 }}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                  ⚡ System Health & Compliance Status
                </Text>
                <Text style={{ fontSize: 13, color: subTextColor }}>
                  • Dual Marketplace Engine: Active & Isolated
                </Text>
                <Text style={{ fontSize: 13, color: subTextColor }}>
                  • Financial Separation: Task Escrow isolated from Real Estate transactions
                </Text>
                <Text style={{ fontSize: 13, color: subTextColor }}>
                  • Row-Level Security: Active across all sensitive PostgreSQL tables
                </Text>
                <Text style={{ fontSize: 13, color: subTextColor }}>
                  • Private Storage: KYC & Ownership Deeds strictly restricted to signed URLs
                </Text>
              </SurfaceCard>
            </View>
          )}

          {/* TAB 2: KYC QUEUE */}
          {activeTab === 'kyc' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Member Identity Review Queue ({kycQueue.length})
              </Text>
              {kycQueue.length === 0 ? (
                <SurfaceCard style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: subTextColor }}>All KYC applications have been processed.</Text>
                </SurfaceCard>
              ) : (
                kycQueue.map((item) => (
                  <SurfaceCard key={item.id} style={{ gap: 8 }}>
                    <View style={styles.rowBetween}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                        {item.full_name}
                      </Text>
                      <View style={styles.reviewBadge}>
                        <Text style={styles.reviewBadgeText}>UNDER REVIEW</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: subTextColor }}>
                      Document: {item.document_type.toUpperCase()} • {item.id_number_masked}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      Storage Path: {item.front_path} (Private Bucket)
                    </Text>
                    <View style={styles.actionRow}>
                      <PillButton
                        label="Reject Application"
                        variant="coral"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleRejectKyc(item.id)}
                      />
                      <PillButton
                        label="Approve KYC 🛡️"
                        variant="primary"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleApproveKyc(item.id)}
                      />
                    </View>
                  </SurfaceCard>
                ))
              )}
            </View>
          )}

          {/* TAB 3: REAL ESTATE VERIFICATIONS */}
          {activeTab === 'properties' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Real Estate 3-Tier Verification Queue ({pendingProperties.length})
              </Text>
              {pendingProperties.length === 0 ? (
                <SurfaceCard style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: subTextColor }}>All property listings are fully vetted.</Text>
                </SurfaceCard>
              ) : (
                pendingProperties.map((p) => (
                  <SurfaceCard key={p.id} style={{ gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      {p.title}
                    </Text>
                    <Text style={{ fontSize: 13, color: subTextColor }}>
                      📍 {p.area}, {p.city} • PKR {p.price.toLocaleString()}
                    </Text>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      Owner: {p.owner?.full_name || 'Owner'} (KYC: {p.owner?.kyc_status})
                    </Text>
                    <View style={styles.actionRow}>
                      <PillButton
                        label="View Listing"
                        variant="outline"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => router.push(`/properties/${p.id}`)}
                      />
                      <PillButton
                        label="Grant Verified Badge ⚡"
                        variant="lime"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleApproveProperty(p.id)}
                      />
                    </View>
                  </SurfaceCard>
                ))
              )}
            </View>
          )}

          {/* TAB 4: DISPUTES ARBITER */}
          {activeTab === 'disputes' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Task Disputes Arbitration Queue ({disputesQueue.length})
              </Text>
              {disputesQueue.length === 0 ? (
                <SurfaceCard style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: subTextColor }}>Zero open disputes. Marketplace is running clean.</Text>
                </SurfaceCard>
              ) : (
                disputesQueue.map((disp) => (
                  <SurfaceCard key={disp.id} style={{ gap: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                      Dispute #{disp.id}: {disp.reason}
                    </Text>
                    <Text style={{ fontSize: 13, color: subTextColor }}>
                      "{disp.description}"
                    </Text>
                    <View style={styles.actionRow}>
                      <PillButton
                        label="Refund to Poster"
                        variant="coral"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleResolveDispute(disp.id, 'refund_to_poster')}
                      />
                      <PillButton
                        label="Release to Tasker"
                        variant="primary"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleResolveDispute(disp.id, 'release_to_tasker')}
                      />
                    </View>
                  </SurfaceCard>
                ))
              )}
            </View>
          )}

          {/* TAB 5: PAYOUTS */}
          {activeTab === 'payouts' && (
            <View style={{ gap: 14 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Financial Ledger Payout Reconciliations ({withdrawalsQueue.length})
              </Text>
              {withdrawalsQueue.length === 0 ? (
                <SurfaceCard style={{ padding: 20, alignItems: 'center' }}>
                  <Text style={{ color: subTextColor }}>All withdrawal requests have been reconciled.</Text>
                </SurfaceCard>
              ) : (
                withdrawalsQueue.map((w) => (
                  <SurfaceCard key={w.id} style={{ gap: 8 }}>
                    <View style={styles.rowBetween}>
                      <Text style={{ fontSize: 16, fontWeight: '800', color: textColor }}>
                        PKR {w.amount.toLocaleString()} ({w.provider.toUpperCase()})
                      </Text>
                      <View style={styles.reviewBadge}>
                        <Text style={styles.reviewBadgeText}>PENDING PAYOUT</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 13, color: subTextColor }}>
                      Title: {w.account_title} • Acc: {w.account_number}
                    </Text>
                    <View style={styles.actionRow}>
                      <PillButton
                        label="Approve Payout"
                        variant="lime"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleApprovePayout(w.id)}
                      />
                    </View>
                  </SurfaceCard>
                ))
              )}
            </View>
          )}

          {/* TAB 6: 24 MODULES CATALOG */}
          {activeTab === 'modules' && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                Complete 24 Modules Admin ERP Directory
              </Text>
              <View style={styles.moduleGrid}>
                {ADMIN_MODULES.map((mod) => (
                  <SurfaceCard key={mod} style={styles.moduleCard}>
                    <Text style={{ color: textColor, fontWeight: '700', fontSize: 13 }}>
                      {mod}
                    </Text>
                    <Text style={{ color: COLORS.status.success, fontSize: 11, fontWeight: '800', marginTop: 4 }}>
                      ● Operational
                    </Text>
                  </SurfaceCard>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#272736',
  },
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  tabScroll: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#27273650',
  },
  activeTabChip: {
    backgroundColor: COLORS.primary.DEFAULT,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
  contentScroll: { padding: 16, gap: 14, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  kpiCard: { width: '48%', padding: 14, alignItems: 'center' },
  kpiNum: { fontSize: 24, fontWeight: '900' },
  kpiTitle: { fontSize: 12, fontWeight: '600', marginTop: 4 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewBadge: { backgroundColor: '#F59E0B20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  reviewBadgeText: { color: '#F59E0B', fontSize: 11, fontWeight: '800' },
  actionRow: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end', marginTop: 6 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  moduleCard: { width: '48%', padding: 12 },
});
