import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
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
import { getPropertyProjects } from '../../src/features/realEstate/realEstateService';
import { PropertyProjectItem } from '../../src/types/realEstate';

export default function NewProjectsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  const [projects, setProjects] = useState<PropertyProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProjects = async () => {
    try {
      const data = await getPropertyProjects();
      setProjects(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const cardBg = isDark ? COLORS.background.darkElevated : COLORS.background.lightElevated;

  const formatPrice = (price?: number | null) => {
    if (!price) return 'On Request';
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
          <Text style={[styles.title, { color: textColor }]}>New Developments 🌆</Text>
          <Text style={[styles.subtitle, { color: subTextColor }]}>
            Master-planned communities & off-plan investments
          </Text>
        </View>
      </View>

      {/* Hero Banner */}
      <View style={[styles.heroBanner, { backgroundColor: `${COLORS.primary.DEFAULT}15` }]}>
        <Text style={[styles.heroTitle, { color: COLORS.primary.DEFAULT }]}>
          Verified Housing Schemes ⚡
        </Text>
        <Text style={[styles.heroDesc, { color: subTextColor }]}>
          Explore official master plans, government NOC approved residential & commercial projects with flexible installment plans.
        </Text>
      </View>

      {/* Projects List */}
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
                loadProjects();
              }}
              tintColor={COLORS.primary.DEFAULT}
            />
          }
        >
          {projects.map((proj) => (
            <SurfaceCard key={proj.id} style={styles.projectCard}>
              {proj.media && proj.media.length > 0 && (
                <Image
                  source={{ uri: proj.media[0] }}
                  style={styles.projectImage}
                  resizeMode="cover"
                />
              )}

              <View style={styles.cardBody}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.developerText, { color: COLORS.lime.DEFAULT }]}>
                    {proj.developer_name.toUpperCase()}
                  </Text>
                  {proj.is_verified_project && (
                    <View style={styles.verifiedBadge}>
                      <Text style={styles.verifiedText}>⚡ Approved Scheme</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles.projectName, { color: textColor }]}>
                  {proj.project_name}
                </Text>

                <Text style={[styles.locationText, { color: subTextColor }]}>
                  📍 {proj.location_address}, {proj.city}
                </Text>

                <Text style={[styles.descText, { color: subTextColor }]} numberOfLines={3}>
                  {proj.description}
                </Text>

                <View style={[styles.pricingBox, { backgroundColor: isDark ? '#1C1917' : '#F4F4F5' }]}>
                  <View>
                    <Text style={[styles.priceLabel, { color: subTextColor }]}>Starting From</Text>
                    <Text style={[styles.priceValue, { color: COLORS.primary.DEFAULT }]}>
                      {formatPrice(proj.price_from)}
                    </Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.priceLabel, { color: subTextColor }]}>Total Units</Text>
                    <Text style={[styles.priceValue, { color: textColor }]}>
                      {proj.total_units} Units
                    </Text>
                  </View>
                </View>

                <View style={styles.actionsRow}>
                  <PillButton
                    label="Brochure"
                    variant="outline"
                    style={{ minHeight: 40, paddingHorizontal: 14 }}
                    onPress={() =>
                      Alert.alert(
                        'Project Brochure',
                        `Official payment plan and brochure for ${proj.project_name} will be sent to your registered email.`
                      )
                    }
                  />
                  <PillButton
                    label="Inquire Booking"
                    variant="primary"
                    style={{ minHeight: 40, paddingHorizontal: 14 }}
                    onPress={() =>
                      Alert.alert(
                        'Direct Booking Inquiry',
                        `Connecting you directly with ${proj.developer_name} authorized representative.`
                      )
                    }
                  />
                </View>
              </View>
            </SurfaceCard>
          ))}
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
  heroBanner: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 8,
    gap: 4,
  },
  heroTitle: { fontSize: 16, fontWeight: '800' },
  heroDesc: { fontSize: 13, lineHeight: 18 },
  scrollContent: { padding: 16, gap: 16, paddingBottom: 40 },
  centerContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  projectCard: {
    padding: 0,
    overflow: 'hidden',
    borderRadius: 16,
  },
  projectImage: {
    width: '100%',
    height: 180,
  },
  cardBody: {
    padding: 16,
    gap: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  developerText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    backgroundColor: `${COLORS.status.success}20`,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  verifiedText: {
    color: COLORS.status.success,
    fontSize: 11,
    fontWeight: '800',
  },
  projectName: {
    fontSize: 18,
    fontWeight: '900',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
  },
  descText: {
    fontSize: 13,
    lineHeight: 18,
  },
  pricingBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'flex-end',
    marginTop: 8,
  },
});
