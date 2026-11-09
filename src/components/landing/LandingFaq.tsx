import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { Accordion } from '../ui/Accordion';

const FAQS = [
  {
    number: '01',
    title: 'How does the escrow payment system protect my money?',
    content:
      'When you publish a task, your payment is pre-authorized and held securely in a licensed banking escrow account. The tasker never receives the payout until you review their photo/GPS proof of delivery or service and tap "Approve & Release". If an errand cannot be fulfilled, your funds are returned directly to your digital wallet.',
  },
  {
    number: '02',
    title: 'How are taskers and property sellers vetted?',
    content:
      'Every member wishing to accept tasks or publish property listings must complete our 5-step biometric onboarding. We verify government-issued CNIC documents, cross-check identity against national databases, and require live selfie verification to prevent fraud and identity theft.',
  },
  {
    number: '03',
    title: 'Can I both post tasks and earn as a tasker on the same account?',
    content:
      'Yes! TaskIt uses a unified member architecture. You do not need separate accounts. In your profile or navigation bar, you can seamlessly switch between posting tasks, browsing real estate, and taking on errands as a verified tasker.',
  },
  {
    number: '04',
    title: 'What are the platform service fees?',
    content:
      'TaskIt maintains transparent pricing with no hidden charges. Task posters enjoy 0% introductory booking fees. Taskers pay a modest 10% platform service fee upon successful completion, which covers banking escrow settlement, live GPS tracking infrastructure, and 24/7 dispute coverage.',
  },
  {
    number: '05',
    title: 'How does TaskIt handle property buy, sell, and rental listings?',
    content:
      'TaskIt Real Estate connects genuine buyers, sellers, landlords, and tenants directly without traditional middlemen commissions. All property listings include title deed verification checks, GPS pinned map coordinates, high-resolution media, and direct in-app inquiry chat.',
  },
  {
    number: '06',
    title: 'What happens if a task is delayed or disputed?',
    content:
      'Our in-app dispute resolution team operates 24/7. If an issue arises, you can pause escrow release with one tap. Both parties submit photo proof, communication logs, and receipts. Our mediation team investigates and resolves disputes within 4 hours, ensuring fair outcomes backed by full escrow guarantees.',
  },
];

export const LandingFaq: React.FC = () => {
  return (
    <View style={styles.container}>
      <SectionHeader
        label="FAQ"
        blurb="Clear answers to the most common questions regarding escrow security, member vetting, and marketplace guidelines."
      />

      <Accordion items={FAQS} defaultOpenIndex={0} />
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
});
