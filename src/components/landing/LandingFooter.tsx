import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '../../theme/tokens';

export const LandingFooter: React.FC = () => {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = () => {
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        {/* Top Header Row: Brand Logo + Nav Links + Socials */}
        <View
          style={[
            styles.topRow,
            { flexDirection: isDesktop ? 'row' : 'column' },
          ]}
        >
          {/* Logo & Tagline */}
          <View style={styles.brandCol}>
            <View style={styles.logoRow}>
              <View style={styles.boltBadge}>
                <Text style={styles.boltIcon}>⚡</Text>
              </View>
              <Text style={styles.brandTitle}>TASKIT</Text>
            </View>
            <Text style={styles.tagline}>Just TaskIt. ⚡</Text>
          </View>

          {/* Nav Links */}
          <View style={styles.linksRow}>
            <Pressable onPress={() => router.push('/how-it-works' as any)}>
              <Text style={styles.linkText}>How it works</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/categories' as any)}>
              <Text style={styles.linkText}>Categories</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/safety' as any)}>
              <Text style={styles.linkText}>Safety</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/earn' as any)}>
              <Text style={styles.linkText}>Earn</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/faq' as any)}>
              <Text style={styles.linkText}>FAQ</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/styleguide')}>
              <Text style={styles.linkText}>Styleguide</Text>
            </Pressable>
            <Pressable onPress={() => router.push('/admin')}>
              <Text style={styles.linkText}>Admin ERP</Text>
            </Pressable>
          </View>

          {/* Social Icons */}
          <View style={styles.socialsRow}>
            {['𝕏', 'in', 'f', 'ig'].map((s, idx) => (
              <View key={idx} style={styles.socialCircle}>
                <Text style={styles.socialIconText}>{s}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Middle Section: Contact Card & Newsletter Subscription */}
        <View
          style={[
            styles.middleRow,
            { flexDirection: isDesktop ? 'row' : 'column' },
          ]}
        >
          {/* Left Contact Card */}
          <View style={[styles.contactCol, isDesktop && { flex: 1 }]}>
            <View style={styles.contactBadge}>
              <Text style={styles.contactBadgeText}>Contact us:</Text>
            </View>
            <Text style={styles.contactInfo}>Email: support@taskit.pk</Text>
            <Text style={styles.contactInfo}>Phone: +92 51 111-TASKIT (827548)</Text>
            <Text style={styles.contactInfo}>
              Address: Level 4, Tech City Tower, Blue Area, Islamabad, Pakistan
            </Text>
          </View>

          {/* Right Newsletter Input Box */}
          <View style={[styles.newsletterCol, isDesktop && { flex: 1 }]}>
            <View style={styles.newsletterBox}>
              <TextInput
                style={styles.newsletterInput}
                placeholder="Enter your email address"
                placeholderTextColor="#71717A"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Pressable
                onPress={handleSubscribe}
                style={({ pressed }) => [
                  styles.newsletterBtn,
                  pressed && { opacity: 0.8 },
                ]}
              >
                <Text style={styles.newsletterBtnText}>
                  {subscribed ? 'Subscribed ✓' : 'Subscribe to news'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.bottomDivider} />

        {/* Bottom Legal & Copyright Bar */}
        <View
          style={[
            styles.bottomRow,
            { flexDirection: isDesktop ? 'row' : 'column' },
          ]}
        >
          <Text style={styles.copyText}>
            © 2026 TASKIT Inc. All Rights Reserved. Built for Pakistan & Global.
          </Text>

          <View style={styles.legalLinksRow}>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={styles.legalLink}>Privacy Policy</Text>
            </Pressable>
            <Text style={styles.legalDot}>•</Text>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={styles.legalLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalDot}>•</Text>
            <Pressable onPress={() => router.push('/privacy')}>
              <Text style={styles.legalLink}>Escrow Agreement</Text>
            </Pressable>
          </View>
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
    marginBottom: 40,
  },
  container: {
    backgroundColor: COLORS.ink.DEFAULT,
    borderRadius: 45,
    borderWidth: 1.5,
    borderColor: COLORS.ink.DEFAULT,
    padding: 40,
    shadowColor: COLORS.ink.DEFAULT,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  topRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 24,
    paddingBottom: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#2E2F3D',
  },
  brandCol: {
    gap: 6,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  boltBadge: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: COLORS.lime.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boltIcon: {
    fontSize: 18,
    color: COLORS.ink.DEFAULT,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 13,
    color: COLORS.lime.DEFAULT,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
    justifyContent: 'center',
  },
  linkText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },
  socialsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  socialCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIconText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  middleRow: {
    paddingVertical: 36,
    gap: 28,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contactCol: {
    gap: 8,
  },
  contactBadge: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  contactBadgeText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  contactInfo: {
    fontSize: 14,
    color: '#D4D4D8',
    lineHeight: 22,
  },
  newsletterCol: {
    width: '100%',
  },
  newsletterBox: {
    backgroundColor: '#23242E',
    borderRadius: 20,
    padding: 16,
    gap: 12,
  },
  newsletterInput: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#3F3F46',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    color: '#FFFFFF',
    fontSize: 14,
  },
  newsletterBtn: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  newsletterBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  bottomDivider: {
    height: 1,
    backgroundColor: '#2E2F3D',
    marginBottom: 24,
  },
  bottomRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
  },
  copyText: {
    fontSize: 13,
    color: '#A1A1AA',
  },
  legalLinksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legalLink: {
    fontSize: 13,
    color: '#D4D4D8',
    textDecorationLine: 'underline',
  },
  legalDot: {
    color: '#71717A',
    fontSize: 12,
  },
});
