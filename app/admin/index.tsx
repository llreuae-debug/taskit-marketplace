import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../../src/stores/useAppStore';
import { COLORS } from '../../src/theme/tokens';
import { SurfaceCard } from '../../src/components/ui/SurfaceCard';
import { PillButton } from '../../src/components/ui/PillButton';

const ADMIN_MODULES = [
  '1. Overview Dashboard',
  '2. Member Management',
  '3. KYC Verification',
  '4. Task Management',
  '5. Task Categories',
  '6. Task Disputes',
  '7. Wallet Management',
  '8. Payment Management',
  '9. Payout Management',
  '10. Real Estate Management',
  '11. Property Verification',
  '12. Property Categories',
  '13. Property Reports',
  '14. Property Inquiries',
  '15. New Projects Management',
  '16. Featured Listings',
  '17. Subscription Packages',
  '18. Monetization Settings',
  '19. Notification Management',
  '20. Translation Management',
  '21. Analytics and Reports',
  '22. Administrator Management',
  '23. Security and Audit Logs',
  '24. Platform Settings',
];

export default function AdminDashboardShell() {
  const router = useRouter();
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
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: COLORS.primary.DEFAULT }]}>
              TASKIT ⚡ ERP ADMIN CONTROL (/admin)
            </Text>
            <Text style={{ color: subTextColor, fontWeight: '600' }}>
              24 Unified Administration Modules • Audit-Logged & RBAC Protected
            </Text>
          </View>
          <PillButton
            label="← App"
            variant="outline"
            onPress={() => router.back()}
          />
        </View>

        <View style={styles.grid}>
          {ADMIN_MODULES.map((mod) => (
            <SurfaceCard key={mod} style={styles.moduleCard}>
              <Text style={{ color: textColor, fontWeight: '700', fontSize: 14 }}>
                {mod}
              </Text>
            </SurfaceCard>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '900' },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  moduleCard: {
    width: '48%',
    padding: 14,
  },
});
