import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { LanguageSelector } from '../../src/components/ui/LanguageSelector';
import { PillButton } from '../../src/components/ui/PillButton';

export default function OnboardingScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const setOnboardingCompleted = useAppStore((s) => s.setOnboardingCompleted);
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
      <View style={styles.content}>
        <Text style={[styles.brand, { color: COLORS.primary.DEFAULT }]}>
          {t('brand.name')}
        </Text>
        <Text style={[styles.title, { color: textColor }]}>
          {t('auth.welcomeTitle')}
        </Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          {t('auth.welcomeSubtitle')}
        </Text>

        <LanguageSelector />

        <PillButton
          label={t('common.continue')}
          variant="primary"
          onPress={() => {
            setOnboardingCompleted(true);
            router.replace('/(tabs)');
          }}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, gap: 20, justifyContent: 'center', flex: 1 },
  brand: { fontSize: 32, fontWeight: '900' },
  title: { fontSize: 28, fontWeight: '900' },
  subtitle: { fontSize: 16, lineHeight: 24 },
});
