import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';

export default function ChatsTabScreen() {
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
      <View style={styles.content}>
        <Text style={[styles.title, { color: textColor }]}>{t('nav.chats')}</Text>
        <SurfaceCard>
          <Text style={{ color: textColor, fontWeight: '700', fontSize: 16 }}>
            Unified Task & Property Inquiry Inbox
          </Text>
          <Text style={{ color: subTextColor, marginTop: 6, lineHeight: 20 }}>
            Real-time conversations for active tasks and property buyer/seller inquiries appear here with text, voice notes, photos, and location sharing.
          </Text>
        </SurfaceCard>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 16 },
  title: { fontSize: 26, fontWeight: '900' },
});
