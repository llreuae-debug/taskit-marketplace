import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Image,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { PropertyItem } from '../../src/types/realEstate';
import {
  getPropertiesFeed,
  compareProperties,
} from '../../src/features/realEstate/realEstateService';
import { convertToSquareFeet } from '../../src/features/realEstate/validation';
import { formatCurrency } from '../../src/utils/formatters';

export default function PropertyCompareScreen() {
  const router = useRouter();
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const theme = useAppStore((s) => s.theme);
  const language = useAppStore((s) => s.language);
  const isDark = theme === 'dark';

  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  useEffect(() => {
    const fetchProps = async () => {
      let targetIds = ids ? ids.split(',').filter(Boolean) : [];
      if (targetIds.length === 0) {
        // Fallback: load first 2 demo properties to demonstrate comparison
        const all = await getPropertiesFeed();
        targetIds = all.slice(0, 2).map((p) => p.id);
      }
      const compared = await compareProperties(targetIds.slice(0, 4));
      setProperties(compared);
      setLoading(false);
    };
    fetchProps();
  }, [ids]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light }]}>
        <View style={styles.loadingBox}>
          <Text style={{ color: textColor }}>Loading comparison...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header */}
        <View style={styles.headerRow}>
          <PillButton label="← Explore" variant="outline" onPress={() => router.back()} />
          <Text style={[styles.title, { color: textColor }]}>Compare Properties ⚖️</Text>
        </View>

        <Text style={{ color: subTextColor, fontSize: 13 }}>
          Side-by-side comparison of {properties.length} / 4 properties.
        </Text>

        {properties.length === 0 ? (
          <SurfaceCard style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: textColor, fontWeight: '700' }}>No properties selected for comparison</Text>
          </SurfaceCard>
        ) : (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.compareColumns}>
            {properties.map((p) => {
              const sqFt = convertToSquareFeet(p.land_size, p.size_unit);
              const thumbnail = p.media && p.media.length > 0 ? p.media[0].storage_path : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200';

              return (
                <SurfaceCard key={p.id} accentBorder={p.verified_listing ? 'lime' : 'none'} style={styles.columnCard}>
                  <Image source={{ uri: thumbnail }} style={styles.propImage} />

                  <Text style={[styles.propPrice, { color: COLORS.lime.DEFAULT }]}>
                    {formatCurrency(p.price, p.currency, language)}
                  </Text>

                  <Text style={[styles.propTitle, { color: textColor }]} numberOfLines={2}>
                    {p.title}
                  </Text>

                  {/* Feature Rows */}
                  <View style={[styles.metricBox, { borderColor }]}>
                    <Text style={styles.metricLabel}>VERIFICATION</Text>
                    <Text style={{ color: p.verified_listing ? COLORS.lime.DEFAULT : subTextColor, fontWeight: '800', fontSize: 12 }}>
                      {p.verified_listing ? '⭐ VERIFIED' : 'PENDING'}
                    </Text>
                  </View>

                  <View style={[styles.metricBox, { borderColor }]}>
                    <Text style={styles.metricLabel}>LOCATION</Text>
                    <Text style={[styles.metricVal, { color: textColor }]}>
                      {p.area}, {p.city}
                    </Text>
                  </View>

                  <View style={[styles.metricBox, { borderColor }]}>
                    <Text style={styles.metricLabel}>LAND SIZE</Text>
                    <Text style={[styles.metricVal, { color: textColor }]}>
                      {p.land_size} {p.size_unit.toUpperCase()} ({sqFt.toLocaleString()} sq ft)
                    </Text>
                  </View>

                  <View style={[styles.metricBox, { borderColor }]}>
                    <Text style={styles.metricLabel}>ROOMS</Text>
                    <Text style={[styles.metricVal, { color: textColor }]}>
                      {p.bedrooms !== null ? `🛏️ ${p.bedrooms} Beds • 🚿 ${p.bathrooms || 0} Baths` : 'Exempt (Plot/Land)'}
                    </Text>
                  </View>

                  <View style={[styles.metricBox, { borderColor }]}>
                    <Text style={styles.metricLabel}>FURNISHING</Text>
                    <Text style={[styles.metricVal, { color: textColor, textTransform: 'capitalize' }]}>
                      {p.furnishing_status.replace('_', ' ')}
                    </Text>
                  </View>

                  <View style={[styles.metricBox, { borderColor }]}>
                    <Text style={styles.metricLabel}>CONSTRUCTION</Text>
                    <Text style={[styles.metricVal, { color: textColor, textTransform: 'capitalize' }]}>
                      {p.construction_status.replace('_', ' ')}
                    </Text>
                  </View>

                  <PillButton
                    label="View Details"
                    variant="lime"
                    onPress={() => router.push({ pathname: '/properties/[id]', params: { id: p.id } })}
                    style={{ marginTop: 6 }}
                    textStyle={{ fontSize: 12 }}
                  />
                </SurfaceCard>
              );
            })}
          </ScrollView>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
  compareColumns: { gap: 14, paddingVertical: 8 },
  columnCard: { width: 230, padding: 14, gap: 8 },
  propImage: { width: '100%', height: 120, borderRadius: 12 },
  propPrice: { fontSize: 18, fontWeight: '900' },
  propTitle: { fontSize: 14, fontWeight: '800', lineHeight: 18 },
  metricBox: { borderTopWidth: 1, paddingTop: 6, gap: 2 },
  metricLabel: { fontSize: 9, fontWeight: '800', color: '#9CA3AF', letterSpacing: 0.5 },
  metricVal: { fontSize: 12, fontWeight: '700' },
});
