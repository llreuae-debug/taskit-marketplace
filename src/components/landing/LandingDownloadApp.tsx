import React from 'react';
import { View, Text, StyleSheet, Pressable, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SectionHeader } from '../ui/SectionHeader';
import { PhoneMockupIllustration } from '../ui/LineArtIllustrations';
import { COLORS } from '../../theme/tokens';

export const LandingDownloadApp: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.wrapper}>
      <SectionHeader
        label="Get The App"
        blurb="Access instant errands, real-time map tracking, and biometric escrow wherever you are."
      />

      <View
        style={[
          styles.container,
          { flexDirection: isDesktop ? 'row' : 'column' },
        ]}
      >
        {/* Left Column: Download Info, Store Buttons & QR Code */}
        <View style={[styles.textCol, isDesktop && { flex: 1.1 }]}>
          <Text style={styles.title}>Take TaskIt with you anywhere</Text>
          <Text style={styles.subtitle}>
            Post errands on the go, follow runners live on the city map with turn-by-turn tracking,
            and approve payments safely in seconds. Available across all modern mobile and desktop platforms.
          </Text>

          {/* QR Code and Scan info */}
          <View style={styles.qrRow}>
            <View style={styles.qrCard}>
              <View style={styles.qrGrid}>
                {/* Stylized QR Code Matrix */}
                <View style={styles.qrCornerTopLeft} />
                <View style={styles.qrCornerTopRight} />
                <View style={styles.qrCornerBottomLeft} />
                <View style={styles.qrCenterBolt}>
                  <Text style={styles.qrBoltText}>⚡</Text>
                </View>
                <View style={styles.qrNoise1} />
                <View style={styles.qrNoise2} />
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.qrTitle}>Scan with phone camera</Text>
              <Text style={styles.qrSub}>Instantly open TaskIt mobile app on iOS or Android.</Text>
            </View>
          </View>

          {/* App Store Buttons Row */}
          <View style={styles.badgesRow}>
            <Pressable
              onPress={() => router.push('/(tabs)')}
              style={styles.storeBtn}
            >
              <Text style={styles.storeIcon}>🍏</Text>
              <View>
                <Text style={styles.storeSub}>Download on the</Text>
                <Text style={styles.storeName}>App Store</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)')}
              style={styles.storeBtn}
            >
              <Text style={styles.storeIcon}>▶</Text>
              <View>
                <Text style={styles.storeSub}>Get it on</Text>
                <Text style={styles.storeName}>Google Play</Text>
              </View>
            </Pressable>

            <Pressable
              onPress={() => router.push('/(tabs)')}
              style={[styles.storeBtn, styles.pwaBtn]}
            >
              <Text style={styles.storeIcon}>🌐</Text>
              <View>
                <Text style={styles.storeSub}>Open Instant</Text>
                <Text style={styles.storeName}>Web PWA</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Right Column: Phone Mockup Line-Art Illustration */}
        <View style={[styles.visualCol, isDesktop && { flex: 0.9 }]}>
          <PhoneMockupIllustration width={isDesktop ? 220 : 180} height={isDesktop ? 280 : 230} />
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
    backgroundColor: '#F3F3F3',
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    padding: 36,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 32,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  textCol: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3F3F46',
    marginBottom: 24,
    maxWidth: 540,
  },
  qrRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 18,
    padding: 14,
    marginBottom: 24,
    maxWidth: 420,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  qrCard: {
    width: 68,
    height: 68,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 10,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrGrid: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  qrCornerTopLeft: {
    position: 'absolute',
    top: 2,
    left: 2,
    width: 18,
    height: 18,
    borderWidth: 3,
    borderColor: COLORS.ink.DEFAULT,
  },
  qrCornerTopRight: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 18,
    height: 18,
    borderWidth: 3,
    borderColor: COLORS.ink.DEFAULT,
  },
  qrCornerBottomLeft: {
    position: 'absolute',
    bottom: 2,
    left: 2,
    width: 18,
    height: 18,
    borderWidth: 3,
    borderColor: COLORS.ink.DEFAULT,
  },
  qrCenterBolt: {
    position: 'absolute',
    top: 18,
    left: 18,
    width: 20,
    height: 20,
    backgroundColor: COLORS.lime.DEFAULT,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrBoltText: {
    fontSize: 12,
  },
  qrNoise1: {
    position: 'absolute',
    top: 24,
    right: 4,
    width: 8,
    height: 8,
    backgroundColor: COLORS.ink.DEFAULT,
  },
  qrNoise2: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 14,
    height: 8,
    backgroundColor: COLORS.ink.DEFAULT,
  },
  qrTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  qrSub: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flexWrap: 'wrap',
  },
  storeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
  pwaBtn: {
    backgroundColor: COLORS.lime.DEFAULT,
  },
  storeIcon: {
    fontSize: 20,
  },
  storeSub: {
    fontSize: 10,
    textTransform: 'uppercase',
    color: COLORS.muted,
    fontWeight: '700',
  },
  storeName: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  visualCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
