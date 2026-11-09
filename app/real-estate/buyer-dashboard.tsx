import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import {
  getBuyerInquiries,
  getBuyerViewings,
} from '../../src/features/realEstate/realEstateService';
import { PropertyInquiryItem, PropertyViewingItem } from '../../src/types/realEstate';

export default function BuyerDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const buyerId = profile?.id || 'usr-buyer-active';

  const [activeTab, setActiveTab] = useState<'inquiries' | 'viewings'>('inquiries');
  const [inquiries, setInquiries] = useState<PropertyInquiryItem[]>([]);
  const [viewings, setViewings] = useState<PropertyViewingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [inqData, viewData] = await Promise.all([
        getBuyerInquiries(buyerId),
        getBuyerViewings(buyerId),
      ]);
      setInquiries(inqData);
      setViewings(viewData);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [buyerId]);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const cardBg = isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated;

  const formatPrice = (price?: number | null) => {
    if (!price) return 'N/A';
    if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(2)} Lac`;
    return `PKR ${price.toLocaleString()}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted':
      case 'confirmed':
        return COLORS.status.success;
      case 'offer_submitted':
      case 'pending':
        return COLORS.primary.DEFAULT;
      case 'rejected':
      case 'cancelled':
        return COLORS.status.error;
      case 'rescheduled':
        return COLORS.status.warning;
      default:
        return COLORS.coral.DEFAULT;
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: cardBg }]}
          accessibilityLabel="Back"
        >
          <Text style={{ color: textColor, fontSize: 18, fontWeight: '700' }}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: textColor }]}>Buyer Hub 🏡</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Inquiries, viewing schedule & offers
          </Text>
        </View>
      </View>

      {/* Quick Shortcut Buttons */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={[styles.actionChip, { backgroundColor: cardBg, borderColor: COLORS.primary.DEFAULT }]}
          onPress={() => router.push('/properties/saved')}
        >
          <Text style={{ color: COLORS.primary.DEFAULT, fontWeight: '700' }}>❤️ Saved Properties</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionChip, { backgroundColor: cardBg, borderColor: COLORS.lime.DEFAULT }]}
          onPress={() => router.push('/properties/compare')}
        >
          <Text style={{ color: textColor, fontWeight: '700' }}>⚖️ Compare (4)</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'inquiries' && { borderBottomColor: COLORS.primary.DEFAULT, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('inquiries')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'inquiries' ? COLORS.primary.DEFAULT : subTextColor },
            ]}
          >
            My Inquiries & Offers ({inquiries.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'viewings' && { borderBottomColor: COLORS.primary.DEFAULT, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('viewings')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'viewings' ? COLORS.primary.DEFAULT : subTextColor },
            ]}
          >
            Scheduled Viewings ({viewings.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.DEFAULT} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              tintColor={COLORS.primary.DEFAULT}
            />
          }
        >
          {activeTab === 'inquiries' ? (
            inquiries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📬</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Active Inquiries</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>
                  When you inquire or submit offers on properties, they will be tracked here.
                </Text>
                <PillButton
                  label="Explore Properties"
                  variant="primary"
                  onPress={() => router.push('/(tabs)/real-estate')}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              inquiries.map((inq) => (
                <SurfaceCard key={inq.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.propTitle, { color: textColor }]} numberOfLines={1}>
                      {inq.property?.title || 'Property Inquiry'}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: `${getStatusColor(inq.status)}20` },
                      ]}
                    >
                      <Text style={[styles.badgeText, { color: getStatusColor(inq.status) }]}>
                        {inq.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.cityText, { color: subTextColor }]}>
                    📍 {inq.property?.area}, {inq.property?.city}
                  </Text>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, { color: subTextColor }]}>Asking Price:</Text>
                    <Text style={[styles.infoValue, { color: textColor }]}>
                      {formatPrice(inq.property?.price)}
                    </Text>
                  </View>

                  {inq.offer_price && (
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: COLORS.coral.DEFAULT, fontWeight: '700' }]}>
                        Your Offer:
                      </Text>
                      <Text style={[styles.infoValue, { color: COLORS.coral.DEFAULT, fontWeight: '900' }]}>
                        {formatPrice(inq.offer_price)}
                      </Text>
                    </View>
                  )}

                  <Text style={[styles.messageBox, { color: textColor, backgroundColor: isDark ? '#1C1917' : '#F4F4F5' }]}>
                    "{inq.message}"
                  </Text>

                  <View style={styles.cardActions}>
                    <PillButton
                      label="View Property"
                      variant="outline"
                      style={{ minHeight: 38, paddingHorizontal: 12 }}
                      onPress={() => router.push(`/properties/${inq.property_id}`)}
                    />
                    <PillButton
                      label="Chat with Seller"
                      variant="primary"
                      style={{ minHeight: 38, paddingHorizontal: 12 }}
                      onPress={() => {
                        router.push(`/properties/${inq.property_id}`);
                      }}
                    />
                  </View>
                </SurfaceCard>
              ))
            )
          ) : viewings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🗓️</Text>
              <Text style={[styles.emptyTitle, { color: textColor }]}>No Scheduled Viewings</Text>
              <Text style={[styles.emptySub, { color: subTextColor }]}>
                Book in-person physical inspections on properties to view them with verified owners or agents.
              </Text>
              <PillButton
                label="Browse Properties"
                variant="primary"
                onPress={() => router.push('/(tabs)/real-estate')}
                style={{ marginTop: 16 }}
              />
            </View>
          ) : (
            viewings.map((v) => (
              <SurfaceCard key={v.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={[styles.propTitle, { color: textColor }]} numberOfLines={1}>
                    {v.property?.title || 'Property Viewing'}
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: `${getStatusColor(v.status)}20` },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: getStatusColor(v.status) }]}>
                      {v.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={[styles.scheduleBox, { backgroundColor: `${COLORS.primary.DEFAULT}15` }]}>
                  <Text style={{ color: COLORS.primary.DEFAULT, fontWeight: '800', fontSize: 16 }}>
                    📅 {new Date(v.scheduled_at).toLocaleDateString()} at{' '}
                    {new Date(v.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                  <Text style={{ color: subTextColor, fontSize: 12, marginTop: 2 }}>
                    📍 {v.property?.street_address || `${v.property?.area}, ${v.property?.city}`}
                  </Text>
                </View>

                {v.notes && (
                  <Text style={[styles.notesText, { color: subTextColor }]}>
                    Note: {v.notes}
                  </Text>
                )}

                <View style={styles.cardActions}>
                  <PillButton
                    label="Property Specs"
                    variant="outline"
                    style={{ minHeight: 38, paddingHorizontal: 12 }}
                    onPress={() => router.push(`/properties/${v.property_id}`)}
                  />
                  <PillButton
                    label="Contact Seller"
                    variant="primary"
                    style={{ minHeight: 38, paddingHorizontal: 12 }}
                    onPress={() => router.push(`/properties/${v.property_id}`)}
                  />
                </View>
              </SurfaceCard>
            ))
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontWeight: '900' },
  subtitle: { fontSize: 13, marginTop: 2 },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  actionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: { fontSize: 14, fontWeight: '700' },
  scrollContent: { padding: 16, gap: 14, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: { gap: 10, padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  propTitle: { fontSize: 16, fontWeight: '800', flex: 1 },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '900' },
  cityText: { fontSize: 13, fontWeight: '600' },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: { fontSize: 13 },
  infoValue: { fontSize: 14, fontWeight: '700' },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  scheduleBox: {
    padding: 12,
    borderRadius: 12,
  },
  notesText: { fontSize: 12, fontStyle: 'italic' },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    gap: 8,
  },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800' },
  emptySub: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
});
