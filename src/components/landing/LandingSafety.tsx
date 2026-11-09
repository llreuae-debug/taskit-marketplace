import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { StickerCard } from '../ui/StickerCard';
import { HighlightHeading } from '../ui/HighlightHeading';
import {
  ShieldLockIllustration,
  FriendlyFaceIllustration,
} from '../ui/LineArtIllustrations';
import { COLORS } from '../../theme/tokens';

export const LandingSafety: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const safetyFeatures = [
    {
      title: 'Biometric CNIC Vetting',
      description:
        'All active taskers and property sellers submit verified national ID and selfie biometrics. We maintain zero-tolerance against anonymous or fraudulent activity.',
      variant: 'grey' as const,
      illustration: <ShieldLockIllustration width={120} height={110} />,
    },
    {
      title: '100% Escrow Protection',
      description:
        'Funds are held safely in licensed bank escrow until the poster confirms satisfaction with photographic and GPS proof of completion.',
      variant: 'lime' as const,
      illustration: <FriendlyFaceIllustration width={120} height={110} />,
    },
    {
      title: 'Live GPS & 24/7 SOS',
      description:
        'Real-time tracking of runners with route telemetry, geofenced drop-offs, and an instant SOS dispatcher for emergency security.',
      variant: 'black' as const,
      illustration: <ShieldLockIllustration width={120} height={110} accent="#FFFFFF" color="#B9FF66" />,
    },
  ];

  return (
    <View style={styles.container}>
      <SectionHeader
        label="Safety & Security"
        blurb="Your peace of mind is engineered into every transaction with bank-grade escrow, identity vetting, and real-time incident resolution."
      />

      <View style={styles.grid}>
        {safetyFeatures.map((feat, idx) => {
          const isDark = feat.variant === 'black';
          const isLime = feat.variant === 'lime';

          return (
            <View
              key={idx}
              style={[styles.col, isDesktop && { width: '31.5%' }]}
            >
              <StickerCard variant={feat.variant}>
                <View style={styles.cardContent}>
                  <View style={styles.textPart}>
                    <HighlightHeading
                      highlight={feat.title.split(' ')[0]}
                      suffix={' ' + feat.title.split(' ').slice(1).join(' ')}
                      highlightColor={isLime ? '#FFFFFF' : COLORS.lime.DEFAULT}
                      size="h3"
                    />
                    <Text
                      style={[
                        styles.descText,
                        { color: isDark ? '#A1A1AA' : '#3F3F46' },
                      ]}
                    >
                      {feat.description}
                    </Text>
                  </View>
                  <View style={styles.visualPart}>{feat.illustration}</View>
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
    gap: 20,
  },
  col: {
    width: '100%',
  },
  cardContent: {
    padding: 30,
    justifyContent: 'space-between',
    minHeight: 280,
  },
  textPart: {
    marginBottom: 20,
  },
  descText: {
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
  },
  visualPart: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
