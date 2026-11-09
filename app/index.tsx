import React, { useRef } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  StatusBar,
  findNodeHandle,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../src/theme/tokens';
import { useAppStore } from '../src/stores/useAppStore';

// The 13 Landing Page Sections (Positivus Neo-Brutalist Design)
import { LandingNavbar } from '../src/components/landing/LandingNavbar';
import { LandingHero } from '../src/components/landing/LandingHero';
import { LandingTrustStrip } from '../src/components/landing/LandingTrustStrip';
import { LandingCategories } from '../src/components/landing/LandingCategories';
import { LandingCtaBand } from '../src/components/landing/LandingCtaBand';
import { LandingHowItWorks } from '../src/components/landing/LandingHowItWorks';
import { LandingStatsBand } from '../src/components/landing/LandingStatsBand';
import { LandingSafety } from '../src/components/landing/LandingSafety';
import { LandingTopTaskers } from '../src/components/landing/LandingTopTaskers';
import { LandingTestimonials } from '../src/components/landing/LandingTestimonials';
import { LandingDownloadApp } from '../src/components/landing/LandingDownloadApp';
import { LandingFaq } from '../src/components/landing/LandingFaq';
import { LandingFooter } from '../src/components/landing/LandingFooter';

export default function LandingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const theme = useAppStore((s) => s.theme);
  const isDark = theme === 'dark';

  // Section references for in-page jumping
  const sectionPositions = useRef<{ [key: string]: number }>({});

  const handleLayout = (key: string, y: number) => {
    sectionPositions.current[key] = y;
  };

  const handleNavigateSection = (sectionId: string) => {
    const yPos = sectionPositions.current[sectionId];
    if (typeof yPos === 'number' && scrollRef.current) {
      scrollRef.current.scrollTo({ y: Math.max(0, yPos - 20), animated: true });
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        {
          backgroundColor: isDark ? COLORS.background.dark : '#FFFFFF',
        },
      ]}
      edges={['top']}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Section 1: Top Navigation Bar */}
      <LandingNavbar onNavigateSection={handleNavigateSection} />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Section 2: Hero Section */}
        <View
          onLayout={(e) => handleLayout('hero', e.nativeEvent.layout.y)}
        >
          <LandingHero />
        </View>

        {/* Section 3: Trust Strip */}
        <LandingTrustStrip />

        {/* Section 4: Task & Real Estate Categories */}
        <View
          onLayout={(e) => handleLayout('categories', e.nativeEvent.layout.y)}
        >
          <LandingCategories />
        </View>

        {/* Section 5: CTA Band (Post your first task) */}
        <LandingCtaBand />

        {/* Section 6: How It Works (Numbered Accordion with Tabs) */}
        <View
          onLayout={(e) => handleLayout('how-it-works', e.nativeEvent.layout.y)}
        >
          <LandingHowItWorks />
        </View>

        {/* Section 7: Stats Band (Black Panel with Lime Numbers) */}
        <LandingStatsBand />

        {/* Section 8: Safety & Escrow Protection */}
        <View
          onLayout={(e) => handleLayout('safety', e.nativeEvent.layout.y)}
        >
          <LandingSafety />
        </View>

        {/* Section 9: Top Verified Taskers Grid */}
        <LandingTopTaskers />

        {/* Section 10: Testimonials Speech Bubbles */}
        <LandingTestimonials />

        {/* Section 11: Download Mobile App */}
        <LandingDownloadApp />

        {/* Section 12: Frequently Asked Questions */}
        <View
          onLayout={(e) => handleLayout('faq', e.nativeEvent.layout.y)}
        >
          <LandingFaq />
        </View>

        {/* Section 13: Footer Block */}
        <LandingFooter />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
});
