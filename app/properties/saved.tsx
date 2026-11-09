import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { PropertyCard } from '../../src/features/realEstate/components/PropertyCard';
import { PropertyItem } from '../../src/types/realEstate';
import {
  getPropertiesFeed,
  togglePropertyFavourite,
} from '../../src/features/realEstate/realEstateService';

export default function SavedPropertiesScreen() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const [savedProperties, setSavedProperties] = useState<PropertyItem[]>([]);
  const [loading, setLoading] = useState(true);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  const currentUserId = profile?.id || 'usr_buyer_demo';

  const loadData = async () => {
    try {
      const all = await getPropertiesFeed({}, currentUserId);
      setSavedProperties(all.filter((p) => p.is_favourited));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUserId]);

  const handleToggleFav = async (propertyId: string) => {
    await togglePropertyFavourite(propertyId, currentUserId);
    setSavedProperties(savedProperties.filter((p) => p.id !== propertyId));
  };

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <PillButton label="← Explore" variant="outline" onPress={() => router.back()} />
          <Text style={[styles.title, { color: textColor }]}>Saved Properties ❤️</Text>
        </View>

        {loading ? (
          <SurfaceCard style={{ padding: 24, alignItems: 'center' }}>
            <Text style={{ color: subTextColor }}>Loading saved properties...</Text>
          </SurfaceCard>
        ) : savedProperties.length === 0 ? (
          <SurfaceCard style={{ padding: 24, alignItems: 'center', gap: 10 }}>
            <Text style={{ fontSize: 36 }}>❤️</Text>
            <Text style={{ color: textColor, fontWeight: '800', fontSize: 16 }}>
              No saved properties yet
            </Text>
            <Text style={{ color: subTextColor, fontSize: 13, textAlign: 'center' }}>
              Tap the heart icon on any property card to save it here for quick access and comparison.
            </Text>
            <PillButton
              label="Explore Properties 🏡"
              variant="lime"
              onPress={() => router.push('/(tabs)/real-estate')}
            />
          </SurfaceCard>
        ) : (
          savedProperties.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              layout="list"
              onToggleFavourite={handleToggleFav}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 14 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 22, fontWeight: '900' },
});
