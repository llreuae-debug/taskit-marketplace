import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
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
import { PropertyItem } from '../../src/types/realEstate';
import {
  getPropertyById,
  togglePropertyFavourite,
  createPropertyInquiry,
  schedulePropertyViewing,
} from '../../src/features/realEstate/realEstateService';
import { convertToSquareFeet } from '../../src/features/realEstate/validation';
import { formatCurrency } from '../../src/utils/formatters';

export default function PropertyDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Inquiry / Offer Modal
  const [inquiryModalVisible, setInquiryModalVisible] = useState(false);
  const [inquiryMsg, setInquiryMsg] = useState('Hello, I am interested in this property. Is it available for viewing?');
  const [offerPrice, setOfferPrice] = useState('');
  const [submittingInquiry, setSubmittingInquiry] = useState(false);

  // Viewing Appointment Modal
  const [viewingModalVisible, setViewingModalVisible] = useState(false);
  const [viewingDate, setViewingDate] = useState('2026-11-15T15:00:00Z');
  const [viewingNotes, setViewingNotes] = useState('Would like to visit this Saturday afternoon.');
  const [schedulingViewing, setSchedulingViewing] = useState(false);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const currentUserId = profile?.id || 'usr_buyer_demo';

  const loadData = async () => {
    if (id) {
      const p = await getPropertyById(id, currentUserId);
      setProperty(p);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id, currentUserId]);

  if (loading || !property) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light }]}>
        <View style={styles.loadingBox}>
          <Text style={{ color: textColor }}>Loading property details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwner = property.owner_id === currentUserId;
  const isRent = property.listing_type.includes('rent');
  const sqFt = convertToSquareFeet(property.land_size, property.size_unit);

  const handleToggleFav = async () => {
    const isFav = await togglePropertyFavourite(property.id, currentUserId);
    setProperty({
      ...property,
      is_favourited: isFav,
      favourites_count: isFav ? property.favourites_count + 1 : Math.max(0, property.favourites_count - 1),
    });
    setActionNotice(isFav ? '❤️ Added to saved properties' : 'Removed from saved properties');
  };

  const handleSendInquiry = async () => {
    setSubmittingInquiry(true);
    setErrorMsg(null);
    try {
      await createPropertyInquiry(
        property.id,
        currentUserId,
        inquiryMsg,
        offerPrice ? parseFloat(offerPrice) : null
      );
      setInquiryModalVisible(false);
      setActionNotice('💬 Inquiry sent to seller! Check Chats tab to communicate.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Inquiry failed');
    } finally {
      setSubmittingInquiry(false);
    }
  };

  const handleScheduleViewing = async () => {
    setSchedulingViewing(true);
    setErrorMsg(null);
    try {
      await schedulePropertyViewing(
        property.id,
        currentUserId,
        new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
        null,
        viewingNotes
      );
      setViewingModalVisible(false);
      setActionNotice('📅 Viewing appointment requested! Seller notified.');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Viewing request failed');
    } finally {
      setSchedulingViewing(false);
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
        {/* Top Header Actions */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <PillButton label="← Explore" variant="outline" onPress={() => router.back()} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Pressable onPress={handleToggleFav} style={[styles.circleBtn, { borderColor }]}>
              <Text style={{ fontSize: 18 }}>{property.is_favourited ? '❤️' : '🤍'}</Text>
            </Pressable>
            <PillButton
              label="⚖️ Compare"
              variant="outline"
              onPress={() => router.push({ pathname: '/properties/compare', params: { ids: property.id } })}
              style={{ minHeight: 38, paddingHorizontal: 12 }}
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

        {/* Media Hero Carousel */}
        <View style={styles.mediaContainer}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {(property.media && property.media.length > 0 ? property.media : [{ id: 'm1', storage_path: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200' }]).map((m, idx) => (
              <Image key={idx} source={{ uri: m.storage_path }} style={styles.heroImage} />
            ))}
          </ScrollView>
        </View>

        {/* Main Details Card */}
        <SurfaceCard accentBorder="lime" style={styles.detailsCard}>
          {/* Price & 3-Tier Badges */}
          <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.priceBig, { color: COLORS.lime.DEFAULT }]}>
              {formatCurrency(property.price, property.currency, language)}
              {isRent ? <Text style={{ fontSize: 14, color: subTextColor }}> / month</Text> : ''}
            </Text>
          </View>

          {/* 3-Tier Verification Badge Banner */}
          <View style={styles.tierVerificationRow}>
            <View style={[styles.tierPill, { backgroundColor: COLORS.lime.subtle }]}>
              <Text style={{ fontSize: 12 }}>🛡️</Text>
              <Text style={[styles.tierPillText, { color: COLORS.lime.dark }]}>Owner KYC Verified</Text>
            </View>
            {property.documents_reviewed && (
              <View style={[styles.tierPill, { backgroundColor: COLORS.primary.subtle }]}>
                <Text style={{ fontSize: 12 }}>📄</Text>
                <Text style={[styles.tierPillText, { color: COLORS.primary.light }]}>Docs Reviewed</Text>
              </View>
            )}
            {property.verified_listing && (
              <View style={[styles.tierPill, { backgroundColor: COLORS.lime.DEFAULT }]}>
                <Text style={{ fontSize: 12 }}>⭐</Text>
                <Text style={[styles.tierPillText, { color: '#0F0F14' }]}>Verified Listing</Text>
              </View>
            )}
          </View>

          <Text style={[styles.title, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {property.title}
          </Text>

          {/* Location Breakdown */}
          <Text style={[styles.locationText, { color: subTextColor, textAlign: isRTL ? 'right' : 'left' }]}>
            📍 {property.society ? `${property.society}, ` : ''}{property.area}, {property.city}
          </Text>

          {property.hide_exact_address ? (
            <View style={styles.privacyNotice}>
              <Text style={{ color: COLORS.lime.DEFAULT, fontSize: 12, fontWeight: '700' }}>
                🔒 Exact Street Address Masked for Owner Privacy
              </Text>
              <Text style={{ color: subTextColor, fontSize: 11 }}>
                Full street address is revealed upon viewing appointment confirmation.
              </Text>
            </View>
          ) : property.street_address ? (
            <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>
              🏠 Street: {property.street_address}
            </Text>
          ) : null}

          {/* Specifications Grid */}
          <View style={[styles.specsGrid, { borderColor }]}>
            <View style={styles.specBox}>
              <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>LAND SIZE</Text>
              <Text style={[styles.specValue, { color: textColor }]}>
                {property.land_size} {property.size_unit.toUpperCase()}
              </Text>
              <Text style={{ color: subTextColor, fontSize: 10 }}>({sqFt.toLocaleString()} sq ft)</Text>
            </View>

            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <View style={styles.specBox}>
                <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>BEDROOMS</Text>
                <Text style={[styles.specValue, { color: textColor }]}>🛏️ {property.bedrooms}</Text>
              </View>
            )}

            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <View style={styles.specBox}>
                <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>BATHROOMS</Text>
                <Text style={[styles.specValue, { color: textColor }]}>🚿 {property.bathrooms}</Text>
              </View>
            )}

            <View style={styles.specBox}>
              <Text style={{ color: subTextColor, fontSize: 11, fontWeight: '700' }}>FURNISHING</Text>
              <Text style={[styles.specValue, { color: textColor, textTransform: 'capitalize' }]}>
                {property.furnishing_status.replace('_', ' ')}
              </Text>
            </View>
          </View>

          {/* Description */}
          <Text style={[styles.descTitle, { color: textColor }]}>About This Property</Text>
          <Text style={[styles.descBody, { color: subTextColor, textAlign: isRTL ? 'right' : 'left' }]}>
            {property.description}
          </Text>

          {/* Seller / Agent Profile Card */}
          <View style={[styles.sellerCard, { borderColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.sellerAvatar}>
              <Text style={{ color: '#FFFFFF', fontWeight: '800' }}>
                {property.owner?.full_name ? property.owner.full_name[0] : 'S'}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sellerName, { color: textColor }]}>
                {property.owner?.full_name || 'Property Representative'}
              </Text>
              <Text style={{ color: COLORS.lime.dark, fontSize: 12, fontWeight: '700' }}>
                ⭐ {property.owner?.seller_rating || '5.0'} • {property.is_agent_listing ? 'Authorized Agent' : 'Direct Property Owner'}
              </Text>
            </View>
            <PillButton
              label="💬 Message"
              variant="outline"
              onPress={() => router.push('/(tabs)/chats')}
              style={{ minHeight: 36, paddingHorizontal: 12 }}
            />
          </View>
        </SurfaceCard>

        {/* Primary Buyer Action Controls */}
        {!isOwner && (
          <View style={styles.ctaRow}>
            <PillButton
              label="💬 Send Inquiry / Offer"
              variant="lime"
              onPress={() => setInquiryModalVisible(true)}
              style={{ flex: 1 }}
            />
            <PillButton
              label="📅 Schedule Viewing"
              variant="primary"
              onPress={() => setViewingModalVisible(true)}
              style={{ flex: 1 }}
            />
          </View>
        )}

        {/* INQUIRY / OFFER MODAL */}
        <Modal visible={inquiryModalVisible} animationType="slide" transparent onRequestClose={() => setInquiryModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Send Inquiry or Make an Offer</Text>
              <Text style={{ color: subTextColor, fontSize: 13 }}>
                Connect directly with the verified seller. All messages link directly to your shared TaskIt chat inbox.
              </Text>

              <Text style={[styles.label, { color: textColor }]}>Optional Offer Price (PKR)</Text>
              <TextInput
                value={offerPrice}
                onChangeText={setOfferPrice}
                placeholder="e.g. 23500000"
                placeholderTextColor={subTextColor}
                keyboardType="numeric"
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <Text style={[styles.label, { color: textColor }]}>Message to Seller *</Text>
              <TextInput
                value={inquiryMsg}
                onChangeText={setInquiryMsg}
                placeholder="Ask about floor plans, possession date, or final demand..."
                placeholderTextColor={subTextColor}
                multiline
                style={[styles.input, { color: textColor, borderColor, minHeight: 80 }]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setInquiryModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Submit Inquiry" variant="lime" loading={submittingInquiry} onPress={handleSendInquiry} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </Modal>

        {/* VIEWING APPOINTMENT MODAL */}
        <Modal visible={viewingModalVisible} animationType="slide" transparent onRequestClose={() => setViewingModalVisible(false)}>
          <View style={styles.modalBackdrop}>
            <View style={[styles.modalSheet, { backgroundColor: isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated, borderColor }]}>
              <Text style={[styles.modalTitle, { color: textColor }]}>Request Property Viewing</Text>
              <Text style={{ color: subTextColor, fontSize: 13 }}>
                Select your preferred date & time. The seller will confirm and exact street coordinates will be unlocked.
              </Text>

              <Text style={[styles.label, { color: textColor }]}>Appointment Timing</Text>
              <View style={styles.timeOptions}>
                {[
                  { label: 'Saturday 11:00 AM' },
                  { label: 'Saturday 4:00 PM' },
                  { label: 'Sunday 12:00 PM' },
                  { label: 'Sunday 5:00 PM' },
                ].map((t) => (
                  <Pressable
                    key={t.label}
                    onPress={() => setViewingNotes(`Preferred slot: ${t.label}`)}
                    style={[styles.timeChip, { borderColor }]}
                  >
                    <Text style={{ color: textColor, fontWeight: '700', fontSize: 12 }}>{t.label}</Text>
                  </Pressable>
                ))}
              </View>

              <TextInput
                value={viewingNotes}
                onChangeText={setViewingNotes}
                placeholder="Additional notes for seller..."
                placeholderTextColor={subTextColor}
                style={[styles.input, { color: textColor, borderColor }]}
              />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <PillButton label="Cancel" variant="outline" onPress={() => setViewingModalVisible(false)} style={{ flex: 1 }} />
                <PillButton label="Schedule Visit" variant="primary" loading={schedulingViewing} onPress={handleScheduleViewing} style={{ flex: 1 }} />
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
  scroll: { padding: 20, gap: 14 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { justifyContent: 'space-between', alignItems: 'center' },
  circleBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaContainer: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 220,
  },
  heroImage: { width: 350, height: 220 },
  detailsCard: { padding: 18, gap: 10 },
  priceRow: { justifyContent: 'space-between', alignItems: 'center' },
  priceBig: { fontSize: 26, fontWeight: '900' },
  tierVerificationRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 2 },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  tierPillText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 20, fontWeight: '900', lineHeight: 26 },
  locationText: { fontSize: 13, fontWeight: '600' },
  privacyNotice: {
    padding: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(163, 230, 53, 0.08)',
    gap: 2,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 12,
    marginVertical: 4,
    gap: 12,
  },
  specBox: { minWidth: '45%', gap: 2 },
  specValue: { fontSize: 15, fontWeight: '800' },
  descTitle: { fontSize: 15, fontWeight: '800', marginTop: 4 },
  descBody: { fontSize: 14, lineHeight: 21 },
  sellerCard: {
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  sellerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.lime.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: { fontSize: 14, fontWeight: '800' },
  ctaRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.65)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, padding: 20, gap: 12 },
  modalTitle: { fontSize: 18, fontWeight: '900' },
  label: { fontSize: 13, fontWeight: '700' },
  input: { minHeight: TYPOGRAPHY.minTouchTarget, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, fontSize: 14 },
  timeOptions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  timeChip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
});
