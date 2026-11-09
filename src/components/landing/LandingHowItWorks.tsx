import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { Accordion } from '../ui/Accordion';
import { COLORS } from '../../theme/tokens';

export const LandingHowItWorks: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'poster' | 'tasker'>('poster');

  const posterSteps = [
    {
      number: '01',
      title: 'Post your task with budget & deadline',
      content:
        'Describe what you need done in under 60 seconds. Add photos, voice instructions, pickup/drop-off locations, and set your budget with transparent platform fee calculation.',
    },
    {
      number: '02',
      title: 'Escrow payment authorization & safe hold',
      content:
        'Fund your task safely through 1BILL, JazzCash, EasyPaisa, or Raast. Your payment is held securely in escrow—the tasker is only paid when you inspect and approve the completed job.',
    },
    {
      number: '03',
      title: 'Match with vetted, CNIC-verified locals',
      content:
        'Review verified profiles, star ratings, past reviews, and completed errand badges. Select the highest rated applicant or let our smart matching assign the closest verified runner.',
    },
    {
      number: '04',
      title: 'Real-time GPS tracking & encrypted chat',
      content:
        'Follow your tasker live on the map, exchange voice notes, and receive instant photos as items are purchased, inspected, and delivered.',
    },
    {
      number: '05',
      title: 'Inspect proof, release escrow & rate',
      content:
        'When the tasker submits photographic proof of completion, verify the result, release payment in one tap, and celebrate with instant feedback.',
    },
  ];

  const taskerSteps = [
    {
      number: '01',
      title: 'Complete 5-step biometric verification',
      content:
        'Submit your CNIC, live selfie, and contact details. Our team verifies your credentials against NADRA standards to ensure trust and protect the community.',
    },
    {
      number: '02',
      title: 'Browse local tasks matching your skills',
      content:
        'Filter tasks by distance, payout, and category—from automotive parts hunting to parcel runs and property inspections in your city.',
    },
    {
      number: '03',
      title: 'Submit competitive offers or accept instantly',
      content:
        'Quote your price, clarify details via pre-acceptance chat, and secure tasks that fit your schedule.',
    },
    {
      number: '04',
      title: 'Execute with in-app check-ins & live GPS',
      content:
        'Update status checkpoints, upload receipts, and communicate with the poster directly inside TaskIt.',
    },
    {
      number: '05',
      title: 'Instant payout to JazzCash, EasyPaisa or Bank',
      content:
        'As soon as the poster approves completion, earnings transfer immediately to your TaskIt digital wallet with 0-fee withdrawal options.',
    },
  ];

  const currentSteps = activeTab === 'poster' ? posterSteps : taskerSteps;

  return (
    <View style={styles.container}>
      <SectionHeader
        label="How It Works"
        blurb="Step-by-step workflow engineered for total transparency, safety, and guaranteed escrow protection."
      />

      {/* Mode Switcher Tabs */}
      <View style={styles.tabsRow}>
        <Pressable
          onPress={() => setActiveTab('poster')}
          style={[
            styles.tabBtn,
            activeTab === 'poster' && styles.tabBtnActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'poster' && styles.tabTextActive,
            ]}
          >
            I Need Help (Posters) ⚡
          </Text>
        </Pressable>

        <Pressable
          onPress={() => setActiveTab('tasker')}
          style={[
            styles.tabBtn,
            activeTab === 'tasker' && styles.tabBtnActive,
          ]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'tasker' && styles.tabTextActive,
            ]}
          >
            I Want to Earn (Taskers) 💰
          </Text>
        </Pressable>
      </View>

      {/* Accordion Component */}
      <Accordion items={currentSteps} defaultOpenIndex={0} />
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
  tabsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  tabBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F3F3F3',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
  },
  tabBtnActive: {
    backgroundColor: COLORS.lime.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  tabTextActive: {
    color: COLORS.ink.DEFAULT,
  },
});
