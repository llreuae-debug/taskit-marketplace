import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../theme/tokens';

const TRUST_PARTNERS = [
  { name: '1BILL', detail: 'National Billing Switch' },
  { name: 'JazzCash', detail: 'Mobile Payments' },
  { name: 'EasyPaisa', detail: 'Instant Transfer' },
  { name: 'Raast ⚡', detail: 'State Bank of Pakistan' },
  { name: 'NADRA', detail: 'Biometric CNIC Verified' },
  { name: 'Meezan Bank', detail: 'Escrow Partner' },
  { name: 'HBL', detail: 'Settlements' },
];

export const LandingTrustStrip: React.FC = () => {
  return (
    <View style={styles.stripContainer}>
      <Text style={styles.stripLabel}>POWERING SECURE TRANSACTIONS & VERIFIED IDENTITY WITH</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.logosRow}
      >
        {TRUST_PARTNERS.map((partner, index) => (
          <View key={index} style={styles.logoBadge}>
            <Text style={styles.partnerName}>{partner.name}</Text>
            <Text style={styles.partnerDetail}>{partner.detail}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  stripContainer: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  stripLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#71717A',
    letterSpacing: 1.2,
    marginBottom: 16,
    textAlign: 'center',
  },
  logosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    justifyContent: 'center',
  },
  logoBadge: {
    backgroundColor: '#F3F3F3',
    borderWidth: 1.5,
    borderColor: '#E4E4E7',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
    alignItems: 'center',
    minWidth: 130,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
    letterSpacing: -0.2,
  },
  partnerDetail: {
    fontSize: 10,
    fontWeight: '600',
    color: '#71717A',
    marginTop: 2,
  },
});
