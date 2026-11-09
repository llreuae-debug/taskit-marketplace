import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { SectionHeader } from '../ui/SectionHeader';
import { COLORS } from '../../theme/tokens';

const TESTIMONIALS = [
  {
    quote:
      '"Found an obsolete radiator for my Honda Civic in Shershah Karachi within 45 minutes. The tasker video-called me directly from the wholesale shop to verify part numbers before I authorized escrow release. Absolute lifesaver!"',
    author: 'Omer Farooq',
    role: 'Automotive Enthusiast',
    city: 'Karachi, Pakistan',
  },
  {
    quote:
      '"As a university student in Islamabad, TaskIt pays for my semester expenses. I complete 3-4 pickup errands every evening between classes and receive instant payouts directly into my JazzCash wallet with zero delays."',
    author: 'Danyal Shah',
    role: 'Verified Tasker & Student',
    city: 'Islamabad, Pakistan',
  },
  {
    quote:
      '"Listed my rental apartment in Bahria Town and found an approved, background-checked tenant within 3 days without paying exorbitant broker commissions or dealing with endless nuisance calls."',
    author: 'Farah Sheikh',
    role: 'Property Owner',
    city: 'Rawalpindi, Pakistan',
  },
];

export const LandingTestimonials: React.FC = () => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);
  };

  return (
    <View style={styles.container}>
      <SectionHeader
        label="Testimonials"
        blurb="Hear from our community of task posters, verified runners, and real estate owners across the country."
      />

      <View style={styles.panel}>
        {/* Testimonials Grid or Active Slide */}
        <View style={styles.speechBubblesRow}>
          {(isDesktop ? TESTIMONIALS : [TESTIMONIALS[activeIndex]]).map((item, idx) => (
            <View
              key={idx}
              style={[
                styles.bubbleCol,
                isDesktop && { width: '31.5%' },
              ]}
            >
              {/* Speech Bubble Container with Lime Outline */}
              <View style={styles.speechBubble}>
                <Text style={styles.quoteText}>{item.quote}</Text>
                {/* Triangular Callout Notch */}
                <View style={styles.bubbleTail} />
              </View>

              {/* Author Info */}
              <View style={styles.authorRow}>
                <Text style={styles.authorName}>{item.author}</Text>
                <Text style={styles.authorRole}>
                  {item.role} • {item.city}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Carousel Navigation Controls */}
        <View style={styles.controlsRow}>
          <View style={styles.dotsRow}>
            {TESTIMONIALS.map((_, i) => (
              <Pressable
                key={i}
                onPress={() => setActiveIndex(i)}
                style={[
                  styles.dot,
                  (isDesktop ? i === 0 : i === activeIndex) && styles.dotActive,
                ]}
              />
            ))}
          </View>

          {!isDesktop && (
            <View style={styles.arrowsRow}>
              <Pressable onPress={handlePrev} style={styles.arrowBtn}>
                <Text style={styles.arrowIcon}>←</Text>
              </Pressable>
              <Pressable onPress={handleNext} style={styles.arrowBtn}>
                <Text style={styles.arrowIcon}>→</Text>
              </Pressable>
            </View>
          )}
        </View>
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
  panel: {
    backgroundColor: COLORS.ink.DEFAULT,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    padding: 36,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  speechBubblesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 20,
    marginBottom: 28,
  },
  bubbleCol: {
    width: '100%',
  },
  speechBubble: {
    position: 'relative',
    backgroundColor: COLORS.ink.DEFAULT,
    borderWidth: 1.5,
    borderColor: COLORS.lime.DEFAULT,
    borderRadius: 28,
    padding: 24,
    minHeight: 160,
  },
  quoteText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#FFFFFF',
    fontStyle: 'italic',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -10,
    left: 40,
    width: 18,
    height: 18,
    backgroundColor: COLORS.ink.DEFAULT,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: COLORS.lime.DEFAULT,
    transform: [{ rotate: '45deg' }],
  },
  authorRow: {
    marginTop: 22,
    marginLeft: 36,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.lime.DEFAULT,
  },
  authorRole: {
    fontSize: 12,
    color: '#A1A1AA',
    marginTop: 2,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 20,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#3F3F46',
  },
  dotActive: {
    backgroundColor: COLORS.lime.DEFAULT,
    width: 22,
    borderRadius: 5,
  },
  arrowsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  arrowBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#272736',
    borderWidth: 1,
    borderColor: COLORS.lime.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    color: COLORS.lime.DEFAULT,
    fontSize: 18,
    fontWeight: '900',
  },
});
