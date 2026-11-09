import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { PropertyCard } from '../../src/features/realEstate/components/PropertyCard';
import { PropertyFilterBar } from '../../src/features/realEstate/components/PropertyFilterBar';
import { PropertyMapView } from '../../src/features/realEstate/components/PropertyMapView';
import {
  PropertyItem,
  PropertyCategory,
  PropertyFilterOptions,
} from '../../src/types/realEstate';
import {
  getPropertyCategories,
  getPropertiesFeed,
  togglePropertyFavourite,
} from '../../src/features/realEstate/realEstateService';

export default function RealEstateTabScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [categories, setCategories] = useState<PropertyCategory[]>([]);
  const [properties, setProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'map'>('list');
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [filters, setFilters] = useState<PropertyFilterOptions>({
    sortBy: 'newest',
  });

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  const currentUserId = profile?.id || 'usr_buyer_demo';

  const loadData = async () => {
    try {
      const [cats, feed] = await Promise.all([
        getPropertyCategories(),
        getPropertiesFeed(filters, currentUserId),
      ]);
      setCategories(cats);
      setProperties(feed);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters, currentUserId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleToggleFavourite = async (propertyId: string) => {
    const isFav = await togglePropertyFavourite(propertyId, currentUserId);
    setProperties(
      properties.map((p) =>
        p.id === propertyId ? { ...p, is_favourited: isFav } : p
      )
    );
    setActionNotice(isFav ? '❤️ Saved to favourites' : 'Removed from favourites');
  };

  const handleAddToCompare = (propertyId: string) => {
    if (compareIds.includes(propertyId)) {
      setCompareIds(compareIds.filter((id) => id !== propertyId));
    } else {
      if (compareIds.length >= 4) {
        setActionNotice('⚠️ Maximum 4 properties can be compared');
        return;
      }
      setCompareIds([...compareIds, propertyId]);
      setActionNotice(`⚖️ Added to comparison (${compareIds.length + 1}/4)`);
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header */}
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View>
            <Text style={[styles.title, { color: textColor }]}>
              {t('home.realEstateTitle')}
            </Text>
            <Text style={[styles.subtitle, { color: subTextColor }]}>
              Buy • Sell • Rent • 3-Tier Verified Properties
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6 }}>
            <PillButton
              label="❤️ Saved"
              variant="outline"
              onPress={() => router.push('/properties/saved')}
              style={styles.topBtn}
              textStyle={{ fontSize: 12 }}
            />
            <PillButton
              label="+ List 🏡"
              variant="lime"
              onPress={() => router.push('/properties/create')}
              style={styles.topBtn}
              textStyle={{ fontSize: 12 }}
            />
          </View>
        </View>

        {actionNotice && (
          <SurfaceCard accentBorder="lime" style={{ padding: 12 }}>
            <Text style={{ color: COLORS.lime.DEFAULT, fontWeight: '800' }}>
              {actionNotice}
            </Text>
          </SurfaceCard>
        )}

        {/* Filter Bar (Search, Buy/Rent, 15 Categories, Filter Modal, View Mode, Compare Pill) */}
        <PropertyFilterBar
          categories={categories}
          filters={filters}
          onFilterChange={(newF) => setFilters(newF)}
          viewMode={viewMode}
          onToggleViewMode={(mode) => setViewMode(mode)}
          comparisonCount={compareIds.length}
          onOpenCompare={() =>
            router.push({
              pathname: '/properties/compare',
              params: { ids: compareIds.join(',') },
            })
          }
        />

        {/* Mode Renders: Map View vs Grid View vs List View */}
        {viewMode === 'map' ? (
          <PropertyMapView properties={properties} />
        ) : loading ? (
          <SurfaceCard style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: subTextColor }}>Loading verified properties...</Text>
          </SurfaceCard>
        ) : properties.length === 0 ? (
          <SurfaceCard style={{ padding: 24, alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 32 }}>🏡</Text>
            <Text style={{ color: textColor, fontWeight: '800', fontSize: 16 }}>
              No properties found matching your criteria
            </Text>
            <PillButton
              label="Clear Filters"
              variant="outline"
              onPress={() => setFilters({ sortBy: 'newest' })}
            />
          </SurfaceCard>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                layout="grid"
                onToggleFavourite={handleToggleFavourite}
                onAddToCompare={handleAddToCompare}
                isInComparison={compareIds.includes(prop.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {properties.map((prop) => (
              <PropertyCard
                key={prop.id}
                property={prop}
                layout="list"
                onToggleFavourite={handleToggleFavourite}
                onAddToCompare={handleAddToCompare}
                isInComparison={compareIds.includes(prop.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  headerRow: { justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  title: { fontSize: 24, fontWeight: '900' },
  subtitle: { fontSize: 13, fontWeight: '600' },
  topBtn: { minHeight: 38, paddingHorizontal: 12, paddingVertical: 4 },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  listContainer: { gap: 2 },
});
