import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PropertyItem } from '../../../types/realEstate';
import { COLORS } from '../../../theme/tokens';
import { useAppStore } from '../../../stores/useAppStore';
import { SurfaceCard } from '../../../components/ui/SurfaceCard';
import { PillButton } from '../../../components/ui/PillButton';
import { formatCurrency } from '../../../utils/formatters';

interface PropertyCardProps {
  property: PropertyItem;
  layout?: 'list' | 'grid';
  onToggleFavourite?: (propertyId: string) => void;
  onAddToCompare?: (propertyId: string) => void;
  isInComparison?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({
  property,
  layout = 'list',
  onToggleFavourite,
  onAddToCompare,
  isInComparison = false,
}) => {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const isDark = theme === 'dark';

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;
  const borderColor = isDark ? COLORS.background.darkBorder : COLORS.background.lightBorder;

  const thumbnail =
    property.media && property.media.length > 0
      ? property.media[0].storage_path
      : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800';

  const formatSizeLabel = () => {
    const unitUpper = property.size_unit.replace('_', ' ').toUpperCase();
    return `${property.land_size} ${unitUpper}`;
  };

  const isRent = property.listing_type.includes('rent');

  if (layout === 'grid') {
    return (
      <Pressable
        onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
        style={styles.gridCardWrapper}
        accessibilityRole="button"
        accessibilityLabel={`Property: ${property.title}`}
      >
        <SurfaceCard accentBorder={property.verified_listing ? 'lime' : 'none'} style={styles.gridCard}>
          <View style={styles.imageContainer}>
            <Image source={{ uri: thumbnail }} style={styles.gridImage} />
            <View style={styles.badgeTopLeft}>
              <Text style={styles.badgeText}>{isRent ? 'FOR RENT' : 'FOR SALE'}</Text>
            </View>
            {property.verified_listing && (
              <View style={[styles.badgeTopRight, { backgroundColor: COLORS.lime.DEFAULT }]}>
                <Text style={[styles.badgeText, { color: '#0F0F14' }]}>✓ VERIFIED</Text>
              </View>
            )}
          </View>

          <View style={styles.gridContent}>
            <Text style={[styles.priceText, { color: COLORS.lime.DEFAULT }]}>
              {formatCurrency(property.price, property.currency, language)}
              {isRent ? ' /mo' : ''}
            </Text>
            <Text style={[styles.gridTitle, { color: textColor }]} numberOfLines={1}>
              {property.title}
            </Text>
            <Text style={{ color: subTextColor, fontSize: 11 }} numberOfLines={1}>
              📍 {property.area}, {property.city}
            </Text>
            <Text style={{ color: COLORS.primary.light, fontSize: 11, fontWeight: '800' }}>
              📐 {formatSizeLabel()}
              {property.bedrooms ? ` • 🛏️ ${property.bedrooms} Beds` : ''}
            </Text>
          </View>
        </SurfaceCard>
      </Pressable>
    );
  }

  // List View Layout (Default)
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property.id } })}
      accessibilityRole="button"
      accessibilityLabel={`Property: ${property.title}`}
    >
      <SurfaceCard
        accentBorder={property.verified_listing ? 'lime' : 'none'}
        style={styles.listCard}
      >
        <View style={styles.imageContainer}>
          <Image source={{ uri: thumbnail }} style={styles.listImage} />
          <View style={styles.badgeTopLeft}>
            <Text style={styles.badgeText}>{isRent ? 'FOR RENT' : 'FOR SALE'}</Text>
          </View>
          {onToggleFavourite && (
            <Pressable
              onPress={() => onToggleFavourite(property.id)}
              style={styles.favButton}
            >
              <Text style={{ fontSize: 16 }}>{property.is_favourited ? '❤️' : '🤍'}</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.listContent}>
          {/* Price & 3-Tier Badge Header */}
          <View style={[styles.priceHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.priceBig, { color: COLORS.lime.DEFAULT }]}>
              {formatCurrency(property.price, property.currency, language)}
              {isRent ? <Text style={{ fontSize: 13, color: subTextColor }}> / month</Text> : ''}
            </Text>
            {property.verified_listing && (
              <View style={[styles.verifiedBadge, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={{ fontSize: 12 }}>🛡️</Text>
                <Text style={styles.verifiedBadgeText}>VERIFIED</Text>
              </View>
            )}
          </View>

          {/* Title & Location */}
          <Text
            style={[styles.title, { color: textColor, textAlign: isRTL ? 'right' : 'left' }]}
            numberOfLines={2}
          >
            {property.title}
          </Text>

          <Text style={[styles.locationText, { color: subTextColor, textAlign: isRTL ? 'right' : 'left' }]}>
            📍 {property.society ? `${property.society}, ` : ''}{property.area}, {property.city}
          </Text>

          {/* Specifications Bar */}
          <View style={[styles.specsBar, { borderColor, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.specItem}>
              <Text style={styles.specIcon}>📐</Text>
              <Text style={[styles.specText, { color: textColor }]}>{formatSizeLabel()}</Text>
            </View>
            {property.bedrooms !== null && property.bedrooms !== undefined && (
              <View style={styles.specItem}>
                <Text style={styles.specIcon}>🛏️</Text>
                <Text style={[styles.specText, { color: textColor }]}>{property.bedrooms} Beds</Text>
              </View>
            )}
            {property.bathrooms !== null && property.bathrooms !== undefined && (
              <View style={styles.specItem}>
                <Text style={styles.specIcon}>🚿</Text>
                <Text style={[styles.specText, { color: textColor }]}>{property.bathrooms} Baths</Text>
              </View>
            )}
            {property.parking_spaces ? (
              <View style={styles.specItem}>
                <Text style={styles.specIcon}>🚗</Text>
                <Text style={[styles.specText, { color: textColor }]}>{property.parking_spaces} Parking</Text>
              </View>
            ) : null}
          </View>

          {/* Footer: Seller & Compare CTA */}
          <View style={[styles.footerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.sellerInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.sellerAvatar}>
                <Text style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 12 }}>
                  {property.owner?.full_name ? property.owner.full_name[0] : 'O'}
                </Text>
              </View>
              <View>
                <Text style={[styles.sellerName, { color: textColor }]}>
                  {property.owner?.full_name || 'Property Owner'}
                </Text>
                <Text style={{ fontSize: 11, color: COLORS.lime.dark, fontWeight: '700' }}>
                  {property.is_agent_listing ? '🤝 Verified Agent' : '🏡 Direct Owner'}
                </Text>
              </View>
            </View>

            {onAddToCompare && (
              <PillButton
                label={isInComparison ? '✓ In Compare' : '+ Compare'}
                variant={isInComparison ? 'lime' : 'outline'}
                onPress={() => onAddToCompare(property.id)}
                style={styles.compareBtn}
                textStyle={{ fontSize: 12 }}
              />
            )}
          </View>
        </View>
      </SurfaceCard>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  listCard: {
    padding: 0,
    overflow: 'hidden',
    marginBottom: 14,
  },
  gridCardWrapper: {
    width: '48%',
    marginBottom: 12,
  },
  gridCard: {
    padding: 0,
    overflow: 'hidden',
  },
  imageContainer: {
    width: '100%',
    position: 'relative',
  },
  listImage: {
    width: '100%',
    height: 190,
  },
  gridImage: {
    width: '100%',
    height: 130,
  },
  badgeTopLeft: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(15, 15, 20, 0.82)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  favButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    gap: 8,
  },
  gridContent: {
    padding: 10,
    gap: 4,
  },
  priceHeader: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceBig: {
    fontSize: 20,
    fontWeight: '900',
  },
  priceText: {
    fontSize: 16,
    fontWeight: '900',
  },
  verifiedBadge: {
    backgroundColor: COLORS.lime.subtle,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    alignItems: 'center',
    gap: 4,
  },
  verifiedBadgeText: {
    color: COLORS.lime.dark,
    fontSize: 11,
    fontWeight: '800',
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 22,
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  specsBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    paddingVertical: 8,
    marginTop: 2,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specIcon: {
    fontSize: 14,
  },
  specText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sellerInfo: {
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sellerAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellerName: {
    fontSize: 12,
    fontWeight: '700',
  },
  compareBtn: {
    minHeight: 34,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
});
