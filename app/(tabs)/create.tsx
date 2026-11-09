import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';

export default function CreateHubScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const theme = useAppStore((s) => s.theme);
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={[styles.title, { color: textColor }]}>
          {t('createHub.title')}
        </Text>
        <Text style={[styles.subtitle, { color: subTextColor }]}>
          {t('createHub.subtitle')}
        </Text>

        <SurfaceCard accentBorder="violet" style={styles.optionCard}>
          <Text style={[styles.optionTitle, { color: textColor }]}>
            {t('createHub.postTask')}
          </Text>
          <Text style={[styles.optionDesc, { color: subTextColor }]}>
            {t('createHub.postTaskDesc')}
          </Text>
          <PillButton
            label={t('createHub.postTask')}
            variant="primary"
            onPress={() => router.push('/tasks/create')}
          />
        </SurfaceCard>

        <SurfaceCard accentBorder="lime" style={styles.optionCard}>
          <Text style={[styles.optionTitle, { color: textColor }]}>
            {t('createHub.sellProperty')}
          </Text>
          <Text style={[styles.optionDesc, { color: subTextColor }]}>
            {t('createHub.sellPropertyDesc')}
          </Text>
          <PillButton
            label={t('createHub.sellProperty')}
            variant="lime"
            onPress={() => router.push('/properties/create')}
          />
        </SurfaceCard>

        <SurfaceCard accentBorder="lime" style={styles.optionCard}>
          <Text style={[styles.optionTitle, { color: textColor }]}>
            {t('createHub.rentProperty')}
          </Text>
          <Text style={[styles.optionDesc, { color: subTextColor }]}>
            {t('createHub.rentPropertyDesc')}
          </Text>
          <PillButton
            label={t('createHub.rentProperty')}
            variant="outline"
            onPress={() => router.push('/properties/create')}
          />
        </SurfaceCard>

        <SurfaceCard style={styles.optionCard}>
          <Text style={[styles.optionTitle, { color: textColor }]}>
            {t('createHub.newProject')}
          </Text>
          <Text style={[styles.optionDesc, { color: subTextColor }]}>
            {t('createHub.newProjectDesc')}
          </Text>
          <PillButton
            label={t('createHub.newProject')}
            variant="outline"
            onPress={() => router.push('/properties/create')}
          />
        </SurfaceCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '900' },
  subtitle: { fontSize: 14, fontWeight: '600' },
  optionCard: { gap: 12 },
  optionTitle: { fontSize: 18, fontWeight: '800' },
  optionDesc: { fontSize: 14, lineHeight: 20 },
});
