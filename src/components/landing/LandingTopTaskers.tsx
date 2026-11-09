import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '../ui/SectionHeader';
import { AvatarBlob } from '../ui/AvatarBlob';
import { COLORS } from '../../theme/tokens';

const TASKERS = [
  {
    name: 'Bilal Ahmed',
    role: 'Automotive Spares Specialist',
    location: 'Lahore (Montgomery Rd / Sultan Khoo)',
    tasks: 342,
    rating: '4.98 ★',
    bio: '7+ years sourcing rare Japanese & European automotive spares. Specializes in Honda, Toyota, and Mercedes engine components.',
  },
  {
    name: 'Sara Khan',
    role: 'Executive & Banking Runner',
    location: 'Islamabad (Blue Area / F-6)',
    tasks: 189,
    rating: '5.00 ★',
    bio: 'Trusted corporate courier handling embassy documentation, banking challans, and urgent contract signatures.',
  },
  {
    name: 'Muhammad Usman',
    role: 'Express Fleet Courier',
    location: 'Karachi (DHA / Clifton / Saddar)',
    tasks: 520,
    rating: '4.95 ★',
    bio: 'High-speed motorbike dispatch across Karachi. Average turnaround under 45 minutes for urgent documents & medical packages.',
  },
  {
    name: 'Ayesha Tariq',
    role: 'Real Estate Advisor',
    location: 'Rawalpindi (Bahria Town / DHA)',
    tasks: 94,
    rating: '4.97 ★',
    bio: 'Licensed property inspector verifying title deeds, conducting video walkthroughs, and vetting tenancy agreements.',
  },
  {
    name: 'Hamza Malik',
    role: 'Home Maintenance Lead',
    location: 'Faisalabad (Civil Lines / People’s Colony)',
    tasks: 280,
    rating: '4.92 ★',
    bio: 'Certified technician with expertise in electrical systems, inverter AC maintenance, and turnkey home plumbing.',
  },
  {
    name: 'Zainab Noor',
    role: 'Pharmacy & Healthcare Runner',
    location: 'Multan (Cantt / Bosan Rd)',
    tasks: 160,
    rating: '5.00 ★',
    bio: 'Specialized healthcare assistant handling temperature-sensitive medications, doctor prescriptions, and hospital runs.',
  },
];

export const LandingTopTaskers: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.container}>
      <SectionHeader
        label="Top Taskers"
        blurb="Meet the verified, highest-rated members powering thousands of successful daily errands across Pakistan."
      />

      <View style={styles.grid}>
        {TASKERS.map((tasker, idx) => (
          <View
            key={idx}
            style={[styles.col, isDesktop && { width: '31.5%' }]}
          >
            <View style={styles.card}>
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <AvatarBlob name={tasker.name} size={54} verified />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.taskerName}>{tasker.name}</Text>
                  <Text style={styles.taskerRole}>{tasker.role}</Text>
                  <Text style={styles.taskerLoc}>{tasker.location}</Text>
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingText}>{tasker.rating}</Text>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Bio & Stats */}
              <Text style={styles.bioText}>{tasker.bio}</Text>
              <View style={styles.statsRow}>
                <Text style={styles.tasksDoneText}>⚡ {tasker.tasks} tasks completed</Text>
                <Text style={styles.verifiedTag}>CNIC Verified ✓</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Action to Browse all taskers */}
      <View style={styles.actionRow}>
        <Pressable
          onPress={() => router.push('/(tabs)/tasks')}
          style={({ pressed }) => [
            styles.seeAllBtn,
            pressed && styles.seeAllBtnPressed,
          ]}
        >
          <Text style={styles.seeAllText}>Browse all verified taskers</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    marginBottom: 60,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
  },
  col: {
    width: '100%',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 32,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    padding: 24,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskerName: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  taskerRole: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3F3F46',
    marginTop: 2,
  },
  taskerLoc: {
    fontSize: 11,
    color: COLORS.muted,
    marginTop: 2,
  },
  ratingBadge: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.ink.DEFAULT,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E4E7',
    marginVertical: 14,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#52525B',
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tasksDoneText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  verifiedTag: {
    fontSize: 11,
    fontWeight: '800',
    color: '#16A34A',
  },
  actionRow: {
    alignItems: 'center',
    marginTop: 28,
  },
  seeAllBtn: {
    backgroundColor: COLORS.ink.DEFAULT,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  seeAllBtnPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: { width: 0, height: 1 },
  },
  seeAllText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
