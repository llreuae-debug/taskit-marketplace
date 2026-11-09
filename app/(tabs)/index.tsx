import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS, TYPOGRAPHY } from '../../src/theme/tokens';
import { LanguageSelector } from '../../src/components/ui/LanguageSelector';
import { MarketplaceSwitcher } from '../../src/components/ui/MarketplaceSwitcher';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { formatCurrency } from '../../src/utils/formatters';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isRTL = useAppStore((s) => s.isRTL);
  const language = useAppStore((s) => s.language);
  const activeMarketplace = useAppStore((s) => s.activeMarketplace);
  const profile = useAppStore((s) => s.profile);
  const isDark = theme === 'dark';

  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light,
        },
      ]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Bar: Brand + Language + Theme Toggle */}
        <View
          style={[
            styles.headerRow,
            { flexDirection: isRTL ? 'row-reverse' : 'row' },
          ]}
        >
          <View>
            <Text style={[styles.brandTitle, { color: COLORS.primary.DEFAULT }]}>
              {t('brand.name')}
            </Text>
            <Text style={[styles.tagline, { color: subTextColor }]}>
              {t('brand.subtitle')}
            </Text>
          </View>

          <View
            style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <LanguageSelector />
            <Pressable
              onPress={toggleTheme}
              accessibilityRole="button"
              accessibilityLabel={t('common.switchTheme')}
              style={[
                styles.themeBtn,
                {
                  backgroundColor: isDark
                    ? COLORS.background.darkElevated
                    : COLORS.background.lightElevated,
                  borderColor: isDark
                    ? COLORS.background.darkBorder
                    : COLORS.background.lightBorder,
                },
              ]}
            >
              <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
            </Pressable>
          </View>
        </View>

        {/* RTL Indicator Badge when Urdu / Arabic / Persian is active */}
        {isRTL && (
          <View style={styles.rtlBadge}>
            <Text style={styles.rtlBadgeText}>↔️ {t('common.rtlActive')}</Text>
          </View>
        )}

        {/* Dual Marketplace Switcher */}
        <MarketplaceSwitcher />

        {/* KYC Status Banner */}
        {(!profile || profile.kyc_status !== 'approved') && (
          <SurfaceCard accentBorder="coral" style={styles.kycCard}>
            <Text
              style={[
                styles.kycBannerTitle,
                { color: textColor, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              🛡️ {t('auth.kycRequiredBanner')}
            </Text>
            <View style={{ marginTop: 12 }}>
              <PillButton
                label={t('auth.registerTitle')}
                variant="coral"
                onPress={() => router.push('/(auth)/login')}
              />
            </View>
          </SurfaceCard>
        )}

        {/* Dynamic Marketplace Hero Card */}
        {activeMarketplace === 'tasks' ? (
          <SurfaceCard accentBorder="violet" style={styles.heroCard}>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>MARKETPLACE A • ESCROW PROTECTED</Text>
            </View>
            <Text
              style={[
                styles.heroTitle,
                { color: textColor, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('home.taskMarketplaceTitle')}
            </Text>
            <Text
              style={[
                styles.heroDesc,
                { color: subTextColor, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('home.taskMarketplaceDesc')}
            </Text>

            <View style={styles.sampleFeeBox}>
              <Text style={{ color: subTextColor, fontSize: 12, fontWeight: '600' }}>
                TRANSPARENT ESCROW EXAMPLE
              </Text>
              <Text style={{ color: textColor, fontSize: 15, fontWeight: '800', marginTop: 4 }}>
                Task: {formatCurrency(1000, 'PKR', language)} → Fee:{' '}
                {formatCurrency(100, 'PKR', language)} → Tasker Gets:{' '}
                {formatCurrency(900, 'PKR', language)}
              </Text>
            </View>

            <View style={styles.actionRow}>
              <PillButton
                label={t('home.postTaskCta')}
                variant="primary"
                onPress={() => router.push('/tasks/create')}
                style={{ flex: 1 }}
              />
              <PillButton
                label={t('home.findWorkCta')}
                variant="lime"
                onPress={() => router.push('/(tabs)/tasks')}
                style={{ flex: 1 }}
              />
            </View>
          </SurfaceCard>
        ) : (
          <SurfaceCard accentBorder="lime" style={styles.heroCard}>
            <View
              style={[
                styles.badgePill,
                { backgroundColor: COLORS.lime.subtle },
              ]}
            >
              <Text style={[styles.badgePillText, { color: COLORS.lime.DEFAULT }]}>
                MARKETPLACE B • VERIFIED PORTAL
              </Text>
            </View>
            <Text
              style={[
                styles.heroTitle,
                { color: textColor, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('home.realEstateTitle')}
            </Text>
            <Text
              style={[
                styles.heroDesc,
                { color: subTextColor, textAlign: isRTL ? 'right' : 'left' },
              ]}
            >
              {t('home.realEstateDesc')}
            </Text>

            <View style={styles.actionRow}>
              <PillButton
                label={t('home.listPropertyCta')}
                variant="lime"
                onPress={() => router.push('/(tabs)/create')}
                style={{ flex: 1 }}
              />
              <PillButton
                label={t('home.searchPropertyCta')}
                variant="outline"
                onPress={() => router.push('/(tabs)/real-estate')}
                style={{ flex: 1 }}
              />
            </View>
          </SurfaceCard>
        )}

        {/* Quick Navigation to Admin ERP & Onboarding */}
        <View style={styles.footerLinks}>
          <PillButton
            label={`🔐 ${t('nav.admin')} (/admin)`}
            variant="outline"
            onPress={() => router.push('/admin')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  headerRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandTitle: {
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  themeBtn: {
    minWidth: TYPOGRAPHY.minTouchTarget,
    minHeight: TYPOGRAPHY.minTouchTarget,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rtlBadge: {
    backgroundColor: COLORS.primary.subtle,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  rtlBadgeText: {
    color: COLORS.primary.light,
    fontWeight: '700',
    fontSize: 12,
  },
  kycCard: {
    marginVertical: 4,
  },
  kycBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  heroCard: {
    gap: 12,
  },
  badgePill: {
    backgroundColor: COLORS.primary.subtle,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  badgePillText: {
    color: COLORS.primary.light,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: '900',
  },
  heroDesc: {
    fontSize: 15,
    lineHeight: 22,
  },
  sampleFeeBox: {
    padding: 14,
    borderRadius: 14,
    backgroundColor: 'rgba(124, 58, 237, 0.08)',
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  footerLinks: {
    marginTop: 8,
  },
});
