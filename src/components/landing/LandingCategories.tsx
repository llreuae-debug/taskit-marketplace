import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '../ui/SectionHeader';
import { StickerCard } from '../ui/StickerCard';
import { ArrowLink } from '../ui/ArrowLink';
import { HighlightHeading } from '../ui/HighlightHeading';
import {
  CarPartsIllustration,
  DeliveryScooterIllustration,
  GroceryBasketIllustration,
  RealEstateIllustration,
  ShieldLockIllustration,
  FriendlyFaceIllustration,
} from '../ui/LineArtIllustrations';
import { COLORS } from '../../theme/tokens';

export const LandingCategories: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const categories = [
    {
      id: 'car-parts',
      title: 'Car Parts Finder',
      description: 'Locate genuine automotive parts from wholesale hubs (Shershah, Sultan Ka Khoo, Montgomery Rd).',
      variant: 'grey' as const,
      illustration: <CarPartsIllustration width={130} height={110} />,
      route: '/tasks/create?category=car-parts',
    },
    {
      id: 'delivery',
      title: 'Urgent Courier & Delivery',
      description: 'Fast, trackable city deliveries for documents, laptops, parcels, and keys within hours.',
      variant: 'lime' as const,
      illustration: <DeliveryScooterIllustration width={130} height={110} />,
      route: '/tasks/create?category=delivery',
    },
    {
      id: 'grocery',
      title: 'Grocery & Pharmacy Run',
      description: 'Prescription pickups, supermarket shopping, and bulk household supplies delivered fresh.',
      variant: 'black' as const,
      illustration: <GroceryBasketIllustration width={130} height={110} />,
      route: '/tasks/create?category=grocery',
    },
    {
      id: 'repairs',
      title: 'Repairs & Handyman',
      description: 'Electricians, plumbers, AC technicians, and appliance specialists on demand.',
      variant: 'lime' as const,
      illustration: <FriendlyFaceIllustration width={120} height={110} />,
      route: '/tasks/create?category=repairs',
    },
    {
      id: 'real-estate',
      title: 'Real Estate Buy & Sell',
      description: 'Browse verified houses, plots, apartments, and commercial projects with zero broker scams.',
      variant: 'grey' as const,
      illustration: <RealEstateIllustration width={130} height={110} />,
      route: '/(tabs)/real-estate',
    },
    {
      id: 'banking',
      title: 'Queue Standing & Banking',
      description: 'Trained runners for embassy queues, bank challans, stamp papers, and government offices.',
      variant: 'black' as const,
      illustration: <ShieldLockIllustration width={120} height={110} accent="#FFFFFF" color="#B9FF66" />,
      route: '/tasks/create?category=banking',
    },
  ];

  return (
    <View style={styles.container}>
      <SectionHeader
        label="Categories"
        blurb="From difficult-to-source automotive spares to turnkey property sales, browse high-demand task categories with verified local taskers."
      />

      <View style={styles.grid}>
        {categories.map((cat) => {
          const isDarkCard = cat.variant === 'black';
          const isLimeCard = cat.variant === 'lime';
          const linkVariant = isDarkCard
            ? 'whiteOnBlack'
            : isLimeCard
            ? 'blackOnLime'
            : 'blackOnWhite';

          return (
            <View
              key={cat.id}
              style={[styles.cardCol, isDesktop && { width: '48.5%' }]}
            >
              <StickerCard variant={cat.variant} interactive>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <View style={{ flex: 1 }}>
                      <HighlightHeading
                        highlight={cat.title.split(' ')[0]}
                        suffix={' ' + cat.title.split(' ').slice(1).join(' ')}
                        highlightColor={isLimeCard ? '#FFFFFF' : COLORS.lime.DEFAULT}
                        size="h3"
                      />
                      <Text
                        style={[
                          styles.cardDesc,
                          { color: isDarkCard ? '#A1A1AA' : '#3F3F46' },
                        ]}
                      >
                        {cat.description}
                      </Text>
                    </View>
                    <View style={styles.illustrationWrap}>
                      {cat.illustration}
                    </View>
                  </View>

                  <View style={styles.cardFooter}>
                    <ArrowLink
                      label="Learn more"
                      onPress={() => router.push(cat.route as any)}
                      variant={linkVariant}
                    />
                  </View>
                </View>
              </StickerCard>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 24,
  },
  cardCol: {
    width: '100%',
  },
  cardContent: {
    padding: 32,
    justifyContent: 'space-between',
    minHeight: 280,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
  },
  cardDesc: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  illustrationWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardFooter: {
    marginTop: 24,
  },
});
