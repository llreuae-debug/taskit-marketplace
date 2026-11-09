import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../theme/tokens';
import { useAppStore } from '../../stores/useAppStore';
import { MegaphoneIllustration, SparkleIcon } from '../ui/LineArtIllustrations';

export const LandingHero: React.FC = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const isRTL = useAppStore((s) => s.isRTL);

  return (
    <View style={styles.heroWrapper}>
      <View
        style={[
          styles.heroGrid,
          {
            flexDirection: isDesktop
              ? isRTL
                ? 'row-reverse'
                : 'row'
              : 'column',
          },
        ]}
      >
        {/* Left / Primary Column: Editorial Typography & Actions */}
        <View style={[styles.textCol, isDesktop && { flex: 1.1 }]}>
          {/* Subtle Live Badge */}
          <View style={styles.badgeRow}>
            <View style={styles.liveDot} />
            <Text style={styles.badgeText}>Pakistan's #1 Unified Task & Property Platform</Text>
          </View>

          {/* H1 Title with Neo-brutalist Lime Highlight Block */}
          <View style={styles.titleContainer}>
            <Text style={styles.titleLine}>Get anything done,</Text>
            <View style={styles.highlightRow}>
              <Text style={styles.titleLine}>or sell property </Text>
              <View style={styles.limeHighlightBadge}>
                <Text style={styles.highlightText}>faster.</Text>
              </View>
            </View>
          </View>

          {/* Editorial Subtitle */}
          <Text style={styles.subtitle}>
            TaskIt unites everyday local tasks with verified real estate discovery.
            Post automotive parts errands, deliveries, and home repairs—or list houses
            and commercial plots with 100% CNIC-verified members and safe escrow protection.
          </Text>

          {/* Action Buttons */}
          <View
            style={[
              styles.actionsRow,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <Pressable
              onPress={() => router.push('/(tabs)/create')}
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.primaryBtnText}>
                {t('landing.postTask', 'Post a task')} ⚡
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)/tasks')}
              style={({ pressed }) => [
                styles.secondaryBtn,
                pressed && styles.btnPressed,
              ]}
              accessibilityRole="button"
            >
              <Text style={styles.secondaryBtnText}>
                {t('landing.startEarning', 'Start earning')} ↗
              </Text>
            </Pressable>
          </View>

          {/* App Store & Trust Highlights */}
          <View style={styles.storeStrip}>
            <View style={styles.storeBadge}>
              <Text style={styles.storeIcon}>🍏</Text>
              <View>
                <Text style={styles.storeSub}>Download on</Text>
                <Text style={styles.storeTitle}>App Store</Text>
              </View>
            </View>

            <View style={styles.storeBadge}>
              <Text style={styles.storeIcon}>▶</Text>
              <View>
                <Text style={styles.storeSub}>Get it on</Text>
                <Text style={styles.storeTitle}>Google Play</Text>
              </View>
            </View>

            <View style={styles.storeBadge}>
              <Text style={styles.storeIcon}>⚡</Text>
              <View>
                <Text style={styles.storeSub}>Instant Web</Text>
                <Text style={styles.storeTitle}>PWA Ready</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Right Column: Positivus-Style Line-Art Illustration */}
        <View style={[styles.visualCol, isDesktop && { flex: 0.9 }]}>
          <View style={styles.illustrationFrame}>
            <MegaphoneIllustration width={isDesktop ? 360 : 260} height={isDesktop ? 290 : 210} />
            <View style={styles.floatingSticker}>
              <SparkleIcon size={22} color={COLORS.lime.DEFAULT} />
              <Text style={styles.floatingStickerText}>Zero Escrow Fees for New Posters</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  heroWrapper: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  heroGrid: {
    alignItems: 'center',
    gap: 36,
  },
  textCol: {
    width: '100%',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F3F3F3',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#E4E4E7',
    marginBottom: 16,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.ink.DEFAULT,
  },
  titleContainer: {
    marginBottom: 20,
  },
  titleLine: {
    fontSize: 44,
    lineHeight: 52,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
    letterSpacing: -1,
  },
  highlightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  limeHighlightBadge: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  highlightText: {
    fontSize: 42,
    lineHeight: 48,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 17,
    lineHeight: 26,
    color: '#3F3F46',
    fontWeight: '400',
    marginBottom: 28,
    maxWidth: 580,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
    marginBottom: 36,
  },
  primaryBtn: {
    backgroundColor: COLORS.ink.DEFAULT,
    paddingHorizontal: 26,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  btnPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: { width: 0, height: 2 },
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryBtnText: {
    color: COLORS.ink.DEFAULT,
    fontSize: 16,
    fontWeight: '800',
  },
  storeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  storeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  storeIcon: {
    fontSize: 18,
    color: COLORS.ink.DEFAULT,
  },
  storeSub: {
    fontSize: 10,
    color: COLORS.muted,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  storeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  visualCol: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationFrame: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  floatingSticker: {
    position: 'absolute',
    bottom: -10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 9999,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  floatingStickerText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
});
