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
  getSellerProperties,
  getSellerInquiries,
  getSellerViewings,
  getSellerAnalytics,
  updateViewingStatus,
  respondToInquiry,
} from '../../src/features/realEstate/realEstateService';
import {
  PropertyItem,
  PropertyInquiryItem,
  PropertyViewingItem,
  ViewingAppointmentStatus,
  PropertyInquiryStatus,
} from '../../src/types/realEstate';

export default function SellerDashboardScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  // Seller defaults to logged in user or demo seller ID
  const sellerId = profile?.id || 'usr-seller-1';

  const [activeTab, setActiveTab] = useState<'listings' | 'viewings' | 'leads'>('listings');
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [inquiries, setInquiries] = useState<PropertyInquiryItem[]>([]);
  const [viewings, setViewings] = useState<PropertyViewingItem[]>([]);
  const [analytics, setAnalytics] = useState({
    totalListings: 0,
    activeListings: 0,
    totalViews: 0,
    totalInquiries: 0,
    totalViewings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [props, inqs, views, stats] = await Promise.all([
        getSellerProperties(sellerId),
        getSellerInquiries(sellerId),
        getSellerViewings(sellerId),
        getSellerAnalytics(sellerId),
      ]);
      setProperties(props);
      setInquiries(inqs);
      setViewings(views);
      setAnalytics(stats);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [sellerId]);

  const handleUpdateViewing = async (viewingId: string, status: ViewingAppointmentStatus) => {
    try {
      await updateViewingStatus(viewingId, status);
      Alert.alert('Status Updated', `Viewing appointment has been marked as ${status}.`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update viewing status');
    }
  };

  const handleRespondOffer = async (inquiryId: string, status: PropertyInquiryStatus) => {
    try {
      await respondToInquiry(inquiryId, status);
      Alert.alert('Offer Updated', `Offer has been marked as ${status}.`);
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Could not update offer status');
    }
  };

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const cardBg = isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated;

  const formatPrice = (price?: number | null) => {
    if (!price) return 'N/A';
    if (price >= 10000000) return `PKR ${(price / 10000000).toFixed(2)} Cr`;
    if (price >= 100000) return `PKR ${(price / 100000).toFixed(2)} Lac`;
    return `PKR ${price.toLocaleString()}`;
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
          <Text style={[styles.title, { color: textColor }]}>Seller & Agent Hub 📈</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Listings portfolio, leads & inspection requests
          </Text>
        </View>
        <PillButton
          label="+ List Property"
          variant="lime"
          style={{ minHeight: 38, paddingHorizontal: 12 }}
          onPress={() => router.push('/properties/create')}
        />
      </View>

      {/* Analytics KPI Ribbon */}
      <View style={styles.kpiContainer}>
        <SurfaceCard style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: COLORS.primary.DEFAULT }]}>
            {analytics.totalListings}
          </Text>
          <Text style={[styles.kpiLabel, { color: subTextColor }]}>Total Listed</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: COLORS.status.success }]}>
            {analytics.activeListings}
          </Text>
          <Text style={[styles.kpiLabel, { color: subTextColor }]}>Active</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: COLORS.coral.DEFAULT }]}>
            {analytics.totalViews}
          </Text>
          <Text style={[styles.kpiLabel, { color: subTextColor }]}>Total Views</Text>
        </SurfaceCard>
        <SurfaceCard style={styles.kpiCard}>
          <Text style={[styles.kpiValue, { color: textColor }]}>
            {analytics.totalInquiries}
          </Text>
          <Text style={[styles.kpiLabel, { color: subTextColor }]}>Leads</Text>
        </SurfaceCard>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabBar, { borderBottomColor: isDark ? '#27272A' : '#E4E4E7' }]}>
        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'listings' && { borderBottomColor: COLORS.lime.DEFAULT, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('listings')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'listings' ? textColor : subTextColor },
            ]}
          >
            My Properties ({properties.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'viewings' && { borderBottomColor: COLORS.lime.DEFAULT, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('viewings')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'viewings' ? textColor : subTextColor },
            ]}
          >
            Viewings ({viewings.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabItem,
            activeTab === 'leads' && { borderBottomColor: COLORS.lime.DEFAULT, borderBottomWidth: 3 },
          ]}
          onPress={() => setActiveTab('leads')}
        >
          <Text
            style={[
              styles.tabText,
              { color: activeTab === 'leads' ? textColor : subTextColor },
            ]}
          >
            Inquiries ({inquiries.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.lime.DEFAULT} />
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
              tintColor={COLORS.lime.DEFAULT}
            />
          }
        >
          {activeTab === 'listings' && (
            properties.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🏢</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Properties Listed</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>
                  Publish your house, apartment, commercial plaza or plot in seconds.
                </Text>
                <PillButton
                  label="Publish New Property"
                  variant="lime"
                  onPress={() => router.push('/properties/create')}
                  style={{ marginTop: 16 }}
                />
              </View>
            ) : (
              properties.map((prop) => (
                <SurfaceCard key={prop.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.propTitle, { color: textColor }]} numberOfLines={1}>
                      {prop.title}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            prop.listing_status === 'active'
                              ? `${COLORS.status.success}20`
                              : '#71717A20',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              prop.listing_status === 'active'
                                ? COLORS.status.success
                                : subTextColor,
                          },
                        ]}
                      >
                        {prop.listing_status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.priceText, { color: COLORS.primary.DEFAULT }]}>
                    {formatPrice(prop.price)}
                  </Text>
                  <Text style={[styles.cityText, { color: subTextColor }]}>
                    📍 {prop.area}, {prop.city} • {prop.land_size} {prop.size_unit.toUpperCase()}
                  </Text>

                  {/* 3-Tier Badges Status */}
                  <View style={styles.tierStatusRow}>
                    <Text style={{ fontSize: 12, color: subTextColor }}>
                      {prop.verified_listing ? '⚡ Verified Listing' : '⏳ Review Pending'} •{' '}
                      {prop.documents_reviewed ? '📑 Docs Approved' : '📑 Docs Under Review'}
                    </Text>
                  </View>

                  <View style={styles.statsRow}>
                    <Text style={[styles.statsItem, { color: subTextColor }]}>
                      👁️ {prop.views_count} views
                    </Text>
                    <Text style={[styles.statsItem, { color: subTextColor }]}>
                      📩 {prop.inquiries_count} inquiries
                    </Text>
                    <Text style={[styles.statsItem, { color: subTextColor }]}>
                      ❤️ {prop.favourites_count} saved
                    </Text>
                  </View>

                  <View style={styles.cardActions}>
                    <PillButton
                      label="View Live"
                      variant="outline"
                      style={{ minHeight: 38, paddingHorizontal: 12 }}
                      onPress={() => router.push(`/properties/${prop.id}`)}
                    />
                    <PillButton
                      label="Edit Listing"
                      variant="primary"
                      style={{ minHeight: 38, paddingHorizontal: 12 }}
                      onPress={() => router.push(`/properties/${prop.id}`)}
                    />
                  </View>
                </SurfaceCard>
              ))
            )
          )}

          {activeTab === 'viewings' && (
            viewings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Viewing Requests</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>
                  When buyers request physical site visits, you can confirm or reschedule them here.
                </Text>
              </View>
            ) : (
              viewings.map((v) => (
                <SurfaceCard key={v.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.propTitle, { color: textColor }]} numberOfLines={1}>
                      {v.property?.title || 'Inspection Request'}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            v.status === 'confirmed'
                              ? `${COLORS.status.success}20`
                              : `${COLORS.primary.DEFAULT}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              v.status === 'confirmed'
                                ? COLORS.status.success
                                : COLORS.primary.DEFAULT,
                          },
                        ]}
                      >
                        {v.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  <Text style={{ color: textColor, fontWeight: '700', fontSize: 15 }}>
                    📅 {new Date(v.scheduled_at).toLocaleDateString()} at{' '}
                    {new Date(v.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>

                  {v.notes && (
                    <Text style={[styles.notesText, { color: subTextColor }]}>
                      Buyer Note: {v.notes}
                    </Text>
                  )}

                  {v.status === 'pending' && (
                    <View style={styles.cardActions}>
                      <PillButton
                        label="Reject"
                        variant="coral"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleUpdateViewing(v.id, 'cancelled')}
                      />
                      <PillButton
                        label="Confirm Viewing"
                        variant="lime"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleUpdateViewing(v.id, 'confirmed')}
                      />
                    </View>
                  )}
                </SurfaceCard>
              ))
            )
          )}

          {activeTab === 'leads' && (
            inquiries.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>💌</Text>
                <Text style={[styles.emptyTitle, { color: textColor }]}>No Leads Yet</Text>
                <Text style={[styles.emptySub, { color: subTextColor }]}>
                  Buyer inquiries and purchase offers will be delivered straight to this inbox.
                </Text>
              </View>
            ) : (
              inquiries.map((inq) => (
                <SurfaceCard key={inq.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.propTitle, { color: textColor }]} numberOfLines={1}>
                      {inq.property?.title || 'Property Lead'}
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        {
                          backgroundColor:
                            inq.status === 'accepted'
                              ? `${COLORS.status.success}20`
                              : `${COLORS.coral.DEFAULT}20`,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeText,
                          {
                            color:
                              inq.status === 'accepted'
                                ? COLORS.status.success
                                : COLORS.coral.DEFAULT,
                          },
                        ]}
                      >
                        {inq.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {inq.offer_price && (
                    <View style={styles.offerRow}>
                      <Text style={{ color: subTextColor, fontSize: 13 }}>Submitted Offer:</Text>
                      <Text style={{ color: COLORS.coral.DEFAULT, fontWeight: '900', fontSize: 16 }}>
                        {formatPrice(inq.offer_price)}
                      </Text>
                    </View>
                  )}

                  <Text
                    style={[
                      styles.messageBox,
                      { color: textColor, backgroundColor: isDark ? '#1C1917' : '#F4F4F5' },
                    ]}
                  >
                    "{inq.message}"
                  </Text>

                  {inq.status === 'offer_submitted' && (
                    <View style={styles.cardActions}>
                      <PillButton
                        label="Decline"
                        variant="coral"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleRespondOffer(inq.id, 'rejected')}
                      />
                      <PillButton
                        label="Accept Offer"
                        variant="lime"
                        style={{ minHeight: 38, paddingHorizontal: 12 }}
                        onPress={() => handleRespondOffer(inq.id, 'accepted')}
                      />
                    </View>
                  )}
                </SurfaceCard>
              ))
            )
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
  title: { fontSize: 20, fontWeight: '900' },
  subtitle: { fontSize: 12, marginTop: 2 },
  kpiContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 8,
  },
  kpiCard: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiValue: { fontSize: 18, fontWeight: '900' },
  kpiLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginHorizontal: 16,
    marginTop: 4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabText: { fontSize: 13, fontWeight: '700' },
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
  priceText: { fontSize: 18, fontWeight: '900' },
  cityText: { fontSize: 13, fontWeight: '600' },
  tierStatusRow: { marginVertical: 2 },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingTop: 6,
    borderTopWidth: 0.5,
    borderTopColor: '#3F3F4650',
  },
  statsItem: { fontSize: 12, fontWeight: '600' },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '900' },
  messageBox: {
    padding: 10,
    borderRadius: 10,
    fontSize: 13,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  notesText: { fontSize: 12, fontStyle: 'italic' },
  offerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
