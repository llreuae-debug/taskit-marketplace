import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';

const REAL_ESTATE_CATEGORIES = [
  { id: '1', icon: '🏠', name: 'Houses' },
  { id: '2', icon: '🏢', name: 'Apartments' },
  { id: '3', icon: '📐', name: 'Residential Plots' },
  { id: '4', icon: '🏗️', name: 'Commercial Plots' },
  { id: '5', icon: '🏪', name: 'Shops' },
  { id: '6', icon: '💼', name: 'Offices' },
  { id: '7', icon: '🏛️', name: 'Buildings' },
  { id: '8', icon: '🌾', name: 'Agricultural Land' },
  { id: '9', icon: '🌆', name: 'New Projects & Developments' },
  { id: '10', icon: '🤝', name: 'Property Agent Services' },
];

export default function RealEstateTabScreen() {
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';
  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('home.realEstateTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          Buy • Sell • Rent • Marla / Kanal / Sq.Ft • 3-Tier Property Verification
        </Text>

        <View style={styles.grid}>
          {REAL_ESTATE_CATEGORIES.map((cat) => (
            <SurfaceCard key={cat.id} accentBorder="lime" style={styles.catCard}>
              <Text style={styles.catIcon}>{cat.icon}</Text>
              <Text style={[styles.catName, { color: textColor }]}>{cat.name}</Text>
            </SurfaceCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 14, fontWeight: '600' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  catCard: {
    width: '47%',
    padding: 16,
    gap: 8,
  },
  catIcon: { fontSize: 26 },
  catName: { fontSize: 14, fontWeight: '700' },
});
