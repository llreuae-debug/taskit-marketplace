import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAppStore } from '../src/stores/useAppStore';
import { COLORS } from '../src/theme/tokens';
import { SurfaceCard } from '../src/components/ui/SurfaceCard';
import { PillButton } from '../src/components/ui/PillButton';

export default function PrivacyAndTermsScreen() {
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
        <Text style={[styles.title, { color: textColor }]}>
          Privacy Policy, Terms & Data Protection
        </Text>

        <SurfaceCard style={{ gap: 10 }}>
          <Text style={[styles.heading, { color: textColor }]}>
            1. Private Identity & Ownership Document Vault
          </Text>
          <Text style={[styles.body, { color: subTextColor }]}>
            Government IDs (CNIC, National ID, Passport, Driving Licence), live selfies, and property ownership documents are encrypted and stored in private Supabase Storage buckets (`kyc-documents` and `property-documents`). They are never exposed publicly and can only be accessed via short-lived signed URLs by the document owner and authorized KYC administrators.
          </Text>
        </SurfaceCard>

        <SurfaceCard style={{ gap: 10 }}>
          <Text style={[styles.heading, { color: textColor }]}>
            2. Identity Masking & Audit Trail
          </Text>
          <Text style={[styles.body, { color: subTextColor }]}>
            Full identity numbers are masked (`*********5671`) across member views, and every administrative KYC review or status change is permanently recorded in `audit_logs`.
          </Text>
        </SurfaceCard>

        <SurfaceCard style={{ gap: 10 }}>
          <Text style={[styles.heading, { color: textColor }]}>
            3. Right to Account & Data Deletion
          </Text>
          <Text style={[styles.body, { color: subTextColor }]}>
            Members may request permanent account deletion at any time from their Profile settings (`request_account_deletion()`), subject to active escrow settlement completion.
          </Text>
        </SurfaceCard>

        <PillButton
          label="← Back"
          variant="outline"
          onPress={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { padding: 20, gap: 16 },
  title: { fontSize: 24, fontWeight: '900' },
  heading: { fontSize: 16, fontWeight: '800' },
  body: { fontSize: 14, lineHeight: 21 },
});
