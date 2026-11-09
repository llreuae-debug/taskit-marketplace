import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';
import { LanguageSelector } from '../../src/components/ui/LanguageSelector';
import { evaluateKycAccessGate } from '../../src/features/kyc/validation';

export default function ProfileTabScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const isDark = theme === 'dark';
  const textColor = isDark ? COLORS.text.darkPrimary : COLORS.text.lightPrimary;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.text.lightSecondary;

  const [deletionRequested, setDeletionRequested] = useState(false);

  const kycStatus = profile?.kyc_status || 'pending';
  const postTaskGate = evaluateKycAccessGate('post_task', kycStatus, profile?.is_suspended);
  const publishPropertyGate = evaluateKycAccessGate('publish_property', kycStatus, profile?.is_suspended);

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.background.light },
      ]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{t('nav.profile')}</Text>

        {/* Member Identity & KYC Status Card */}
        <SurfaceCard
          accentBorder={kycStatus === 'approved' ? 'lime' : 'violet'}
          style={{ gap: 12 }}
        >
          <View style={styles.badgeRow}>
            <Text style={{ color: textColor, fontSize: 20, fontWeight: '900' }}>
              {profile?.full_name || 'Unverified Member'}
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    kycStatus === 'approved'
                      ? COLORS.lime.subtle
                      : kycStatus === 'under_review'
                      ? COLORS.primary.subtle
                      : COLORS.coral.subtle,
                },
              ]}
            >
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '800',
                  color:
                    kycStatus === 'approved'
                      ? COLORS.lime.DEFAULT
                      : kycStatus === 'under_review'
                      ? COLORS.primary.light
                      : COLORS.coral.DEFAULT,
                }}
              >
                KYC: {kycStatus.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={{ color: subTextColor, fontSize: 13 }}>
            Single Account Permissions:
          </Text>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>
            • Post & Accept Tasks: {postTaskGate.allowed ? '✅ Enabled' : '🔒 Requires Approved KYC'}
          </Text>
          <Text style={{ color: textColor, fontSize: 13, fontWeight: '600' }}>
            • List & Inquire Properties: {publishPropertyGate.allowed ? '✅ Enabled' : '🔒 Requires Approved KYC'}
          </Text>

          <PillButton
            label="🛡️ Complete 5-Step KYC Verification Wizard"
            variant="primary"
            onPress={() => router.push('/(auth)/kyc-wizard')}
          />

          <PillButton
            label={t('auth.loginTitle')}
            variant="outline"
            onPress={() => router.push('/(auth)/login')}
          />
        </SurfaceCard>

        {/* Language Picker */}
        <SurfaceCard style={{ gap: 12 }}>
          <Text style={{ color: textColor, fontWeight: '700' }}>
            {t('common.switchLanguage')}
          </Text>
          <LanguageSelector />
        </SurfaceCard>

        {/* Privacy, Terms & Account Deletion Compliance */}
        <SurfaceCard style={{ gap: 12 }}>
          <Text style={{ color: textColor, fontWeight: '700' }}>
            Security, Privacy & Account Compliance
          </Text>
          <PillButton
            label="📄 Privacy Policy & Terms of Service"
            variant="outline"
            onPress={() => router.push('/privacy')}
          />
          <PillButton
            label={
              deletionRequested
                ? '✓ Account Deletion Request Logged'
                : '🗑️ Request Account Deletion'
            }
            variant="coral"
            disabled={deletionRequested}
            onPress={() => {
              setDeletionRequested(true);
              if (profile) {
                setProfile({ ...profile, is_suspended: true });
              }
            }}
          />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '900' },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
});
