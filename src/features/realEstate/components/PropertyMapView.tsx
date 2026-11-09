import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, DimensionValue } from 'react-native';
import { useRouter } from 'expo-router';
import { PropertyItem } from '../../../types/realEstate';
import { COLORS } from '../../../theme/tokens';
import { useAppStore } from '../../../stores/useAppStore';
import { SurfaceCard } from '../../../components/ui/SurfaceCard';
import { formatCurrency } from '../../../utils/formatters';

interface PropertyMapViewProps {
  properties: PropertyItem[];
}

export const PropertyMapView: React.FC<PropertyMapViewProps> = ({ properties }) => {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';
  const language = useAppStore((s) => s.language);

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  return (
    <View style={styles.container}>
      {/* Privacy-Preserving Map Radar Canvas */}
      <View
        style={[
          styles.mapCanvas,
          {
            backgroundColor: isDark ? '#14141E' : '#E2E8F0',
            borderColor: isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder,
          },
        ]}
      >
        <View style={styles.overlayBanner}>
          <Text style={{ color: COLORS.lime.DEFAULT, fontSize: 11, fontWeight: '800' }}>
            🏡 PRIVACY MAP • REAL ESTATE DISCOVERY
          </Text>
          <Text style={{ color: '#FFFFFF', fontSize: 12, fontWeight: '700' }}>
            {properties.length} Verified Properties Located
          </Text>
          <Text style={{ color: '#9CA3AF', fontSize: 10 }}>
            Exact street numbers are masked until viewing confirmation for owner safety.
          </Text>
        </View>

        {/* Distributed Property Pins */}
        <View style={styles.pinsContainer}>
          {properties.slice(0, 5).map((prop, idx) => {
            const positions: Array<{ top: DimensionValue; left?: DimensionValue; right?: DimensionValue }> = [
              { top: '24%', left: '20%' },
              { top: '35%', right: '18%' },
              { top: '58%', left: '26%' },
              { top: '72%', right: '22%' },
              { top: '50%', left: '55%' },
            ];
            const pos = positions[idx % positions.length];

            return (
              <Pressable
                key={prop.id}
                onPress={() => router.push({ pathname: '/properties/[id]', params: { id: prop.id } })}
                style={[styles.pinWrapper, pos]}
              >
                <View style={styles.pinBubble}>
                  <Text style={styles.pinText}>
                    {formatCurrency(prop.price, prop.currency, language)}
                  </Text>
                </View>
                <View style={styles.pinTip} />
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Horizontal Carousel of Map Selected Properties */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.cardsScroll}>
        {properties.map((prop) => (
          <Pressable
            key={prop.id}
            onPress={() => router.push({ pathname: '/properties/[id]', params: { id: prop.id } })}
            style={styles.carouselCard}
          >
            <SurfaceCard accentBorder={prop.verified_listing ? 'lime' : 'none'} style={{ padding: 12, gap: 6 }}>
              <View style={styles.cardHeader}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.primary.light }}>
                  {prop.listing_type.includes('rent') ? 'FOR RENT' : 'FOR SALE'}
                </Text>
                <Text style={[styles.cardPrice, { color: COLORS.lime.DEFAULT }]}>
                  {formatCurrency(prop.price, prop.currency, language)}
                </Text>
              </View>
              <Text style={[styles.cardTitle, { color: textColor }]} numberOfLines={1}>
                {prop.title}
              </Text>
              <Text style={{ fontSize: 11, color: subTextColor }} numberOfLines={1}>
                📍 {prop.area}, {prop.city}
              </Text>
              <Text style={{ fontSize: 11, color: COLORS.lime.dark, fontWeight: '700' }}>
                📐 {prop.land_size} {prop.size_unit.toUpperCase()} {prop.bedrooms ? `• ${prop.bedrooms} Beds` : ''}
              </Text>
            </SurfaceCard>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 12 },
  mapCanvas: {
    height: 280,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBanner: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    backgroundColor: 'rgba(15, 15, 20, 0.85)',
    padding: 10,
    borderRadius: 12,
    gap: 2,
  },
  pinsContainer: { ...StyleSheet.absoluteFillObject },
  pinWrapper: { position: 'absolute', alignItems: 'center' },
  pinBubble: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinText: { color: '#0F0F14', fontSize: 11, fontWeight: '900' },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: COLORS.lime.DEFAULT,
  },
  cardsScroll: { gap: 12, paddingVertical: 4 },
  carouselCard: { width: 250 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardPrice: { fontSize: 14, fontWeight: '900' },
  cardTitle: { fontSize: 13, fontWeight: '800' },
});
