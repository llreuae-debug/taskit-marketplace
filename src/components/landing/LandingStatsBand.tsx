import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { COLORS } from '../../theme/tokens';

const STATS = [
  { value: '98.4%', label: 'Completed On-Time', sub: 'Verified by GPS & photo receipts' },
  { value: 'PKR 45M+', label: 'Escrow Disbursed', sub: 'Zero payment defaults or fraud' },
  { value: '12,000+', label: 'Verified Members', sub: 'NADRA biometric & CNIC validated' },
  { value: '4.9 ★', label: 'Average Rating', sub: 'From 50,000+ completed errands' },
];

export const LandingStatsBand: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <View style={styles.grid}>
          {STATS.map((stat, idx) => (
            <View
              key={idx}
              style={[
                styles.statItem,
                isDesktop && { width: '25%' },
                !isDesktop && { width: '48%' },
                idx < STATS.length - 1 && isDesktop && styles.borderRight,
              ]}
            >
              <Text style={styles.valueText}>{stat.value}</Text>
              <Text style={styles.labelText}>{stat.label}</Text>
              <Text style={styles.subText}>{stat.sub}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  container: {
    backgroundColor: COLORS.ink.DEFAULT,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    paddingVertical: 40,
    paddingHorizontal: 24,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  borderRight: {
    borderRightWidth: 1,
    borderRightColor: '#2E2F3D',
  },
  valueText: {
    fontSize: 40,
    lineHeight: 46,
    fontWeight: '900',
    color: COLORS.lime.DEFAULT,
    marginBottom: 6,
    letterSpacing: -1,
  },
  labelText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  subText: {
    fontSize: 12,
    color: '#A1A1AA',
    textAlign: 'center',
  },
});
