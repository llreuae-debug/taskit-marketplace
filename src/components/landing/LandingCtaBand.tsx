import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../theme/tokens';
import { FriendlyFaceIllustration } from '../ui/LineArtIllustrations';

export const LandingCtaBand: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.container,
          { flexDirection: isDesktop ? 'row' : 'column' },
        ]}
      >
        <View style={[styles.textCol, isDesktop && { flex: 1.2 }]}>
          <Text style={styles.title}>Let's make things happen</Text>
          <Text style={styles.subtitle}>
            Have an urgent parcel to deliver, an engine part to find, or a property to list?
            Post your first task today and experience seamless escrow-protected completion.
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/create')}
            style={({ pressed }) => [
              styles.ctaBtn,
              pressed && styles.ctaBtnPressed,
            ]}
          >
            <Text style={styles.ctaBtnText}>Post your first task ⚡</Text>
          </Pressable>
        </View>

        <View style={[styles.visualCol, isDesktop && { flex: 0.8 }]}>
          <FriendlyFaceIllustration width={isDesktop ? 160 : 130} height={isDesktop ? 160 : 130} />
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
    gap: 24,
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
    marginBottom: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: '#3F3F46',
    marginBottom: 24,
    maxWidth: 560,
  },
  ctaBtn: {
    backgroundColor: COLORS.ink.DEFAULT,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 3,
  },
  ctaBtnPressed: {
    transform: [{ translateY: 2 }],
    shadowOffset: { width: 0, height: 1 },
  },
  ctaBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  visualCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
