import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { COLORS, SHADOWS } from '../src/theme/tokens';
import { useAppStore } from '../src/stores/useAppStore';
import { HighlightHeading } from '../src/components/ui/HighlightHeading';
import { StickerCard } from '../src/components/ui/StickerCard';
import { ArrowLink } from '../src/components/ui/ArrowLink';
import { SectionHeader } from '../src/components/ui/SectionHeader';
import { Accordion } from '../src/components/ui/Accordion';
import { AvatarBlob } from '../src/components/ui/AvatarBlob';
import {
  MegaphoneIllustration,
  FriendlyFaceIllustration,
  DeliveryScooterIllustration,
  CarPartsIllustration,
  SparkleIcon,
} from '../src/components/ui/LineArtIllustrations';

export default function StyleguideScreen() {
  const router = useRouter();
  const theme = useAppStore((s) => s.theme);
  const toggleTheme = useAppStore((s) => s.toggleTheme);
  const isDark = theme === 'dark';

  const [otpVal, setOtpVal] = useState(['5', '2', '8', '', '', '']);
  const [phoneVal, setPhoneVal] = useState('0300 1234567');
  const [textInputVal, setTextInputVal] = useState('Find genuine Honda Civic headlight');

  const textColor = isDark ? '#FFFFFF' : COLORS.ink.DEFAULT;
  const subTextColor = isDark ? COLORS.text.darkSecondary : COLORS.muted;

  const sampleAccordion = [
    {
      number: '01',
      title: 'Get Verified in 60 Seconds',
      content:
        'Submit your basic info, national ID number, and a quick live camera selfie. Our verification team reviews details in under 5 minutes so you can post or pick tasks immediately.',
    },
    {
      number: '02',
      title: 'Post Your Task & Set Price',
      content:
        'Specify pickup/drop-off locations, voice description, or photos. Set your own task reward and expense budget with full transparency on fees.',
    },
    {
      number: '03',
      title: 'Escrow Money Held Safely',
      content:
        'Funds are locked in secure double-entry escrow and only released once you inspect the completion proof and provide the 4-digit verification code.',
    },
  ];

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        { backgroundColor: isDark ? COLORS.background.dark : COLORS.white },
      ]}
    >
      {/* Top Navbar */}
      <View
        style={[
          styles.topNav,
          { borderBottomColor: isDark ? '#23242E' : COLORS.line },
        ]}
      >
        <View style={styles.brandRow}>
          <Text style={[styles.brandText, { color: textColor }]}>
            TaskIt <Text style={{ color: COLORS.lime.DEFAULT }}>⚡</Text>
          </Text>
          <View style={styles.badgePill}>
            <Text style={styles.badgeText}>DESIGN SYSTEM v2.0</Text>
          </View>
        </View>

        <View style={styles.navActions}>
          <TouchableOpacity
            style={[styles.themeBtn, { borderColor: COLORS.ink.border }]}
            onPress={toggleTheme}
            accessibilityLabel="Toggle Theme"
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: textColor }}>
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => router.back()}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '700', fontSize: 13 }}>
              ← Return
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* HERO TITLE */}
        <View style={styles.heroSection}>
          <HighlightHeading
            prefix="TaskIt"
            highlight="Design System"
            suffix="& Tokens"
            size="h1"
          />
          <Text style={[styles.heroSubtitle, { color: subTextColor }]}>
            Clean editorial layout • Lime `#B9FF66` + Ink `#191A23` + Off-White `#F3F3F3` • Chunky sticker cards with hard bottom shadow • Outlined line-art illustrations
          </Text>
        </View>

        {/* 1. PALETTE & TOKENS */}
        <View style={styles.section}>
          <SectionHeader
            label="01. Colour Palette"
            blurb="High-contrast editorial neo-brutalist palette engineered for WCAG AA readability and playful Gen Z energy."
          />

          <View style={styles.paletteGrid}>
            <View style={[styles.swatchCard, { backgroundColor: COLORS.lime.DEFAULT, ...SHADOWS.sticker }]}>
              <Text style={styles.swatchName}>Lime Accent</Text>
              <Text style={styles.swatchHex}>#B9FF66</Text>
              <Text style={styles.swatchDesc}>Primary highlights, active tabs, buttons</Text>
            </View>

            <View style={[styles.swatchCard, { backgroundColor: COLORS.ink.DEFAULT, ...SHADOWS.sticker }]}>
              <Text style={[styles.swatchName, { color: '#FFFFFF' }]}>Ink Black</Text>
              <Text style={[styles.swatchHex, { color: COLORS.lime.DEFAULT }]}>#191A23</Text>
              <Text style={[styles.swatchDesc, { color: '#A1A1AA' }]}>Primary text, stickers, shadows, dark cards</Text>
            </View>

            <View style={[styles.swatchCard, { backgroundColor: COLORS.greyCard, ...SHADOWS.sticker }]}>
              <Text style={styles.swatchName}>Grey Card</Text>
              <Text style={styles.swatchHex}>#F3F3F3</Text>
              <Text style={styles.swatchDesc}>Alternating cards, inputs, CTA band</Text>
            </View>

            <View style={[styles.swatchCard, { backgroundColor: '#FFFFFF', ...SHADOWS.sticker }]}>
              <Text style={styles.swatchName}>Canvas White</Text>
              <Text style={styles.swatchHex}>#FFFFFF</Text>
              <Text style={styles.swatchDesc}>Page background, inner tag blocks</Text>
            </View>
          </View>
        </View>

        {/* 2. HIGHLIGHT HEADINGS & TYPOGRAPHY */}
        <View style={styles.section}>
          <SectionHeader
            label="02. Highlight Headings"
            blurb="Key focus words rest on a rounded 7px lime highlight block, capturing immediate user attention."
          />

          <View style={styles.headingsColumn}>
            <HighlightHeading
              prefix="Post any task."
              highlight="Get it done"
              suffix="on time."
              size="h1"
            />
            <HighlightHeading
              prefix="Verified members"
              highlight="ready to help"
              suffix="near you."
              size="h2"
            />
            <HighlightHeading
              prefix="Double-entry"
              highlight="Escrow hold"
              suffix="protection."
              size="h3"
            />
          </View>
        </View>

        {/* 3. STICKER CARDS WITH HARD SHADOWS */}
        <View style={styles.section}>
          <SectionHeader
            label="03. Sticker Cards"
            blurb="Chunky 45px rounded cards with 1px black border and hard 0 5px 0 #191A23 bottom shadow (no blur). Alternating Grey → Lime → Black rhythm."
          />

          <View style={styles.cardsGrid}>
            {/* Card 1: Grey Variant */}
            <StickerCard variant="grey" interactive style={styles.demoCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardTag, { backgroundColor: COLORS.lime.DEFAULT }]}>
                  <Text style={styles.cardTagText}>Car Parts Finder</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: COLORS.ink.DEFAULT }]}>
                Find spare parts at Bilal Gunj & Montgomery Road
              </Text>
              <Text style={[styles.cardBody, { color: COLORS.muted }]}>
                Car parts specialists inspect part condition, photograph markings, negotiate price and deliver.
              </Text>

              <View style={styles.cardFooterRow}>
                <ArrowLink label="Explore Category" variant="blackOnLime" />
                <CarPartsIllustration width={110} height={90} />
              </View>
            </StickerCard>

            {/* Card 2: Lime Variant */}
            <StickerCard variant="lime" interactive style={styles.demoCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardTag, { backgroundColor: '#FFFFFF' }]}>
                  <Text style={styles.cardTagText}>Express Delivery</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: COLORS.ink.DEFAULT }]}>
                Door-to-door courier parcels & banking documents
              </Text>
              <Text style={[styles.cardBody, { color: COLORS.ink.DEFAULT }]}>
                Verified taskers on motorbikes handle urgent pickups across town with live tracking.
              </Text>

              <View style={styles.cardFooterRow}>
                <ArrowLink label="Explore Delivery" variant="blackOnLime" />
                <DeliveryScooterIllustration width={110} height={90} />
              </View>
            </StickerCard>

            {/* Card 3: Black Variant */}
            <StickerCard variant="black" interactive style={styles.demoCard}>
              <View style={styles.cardHeaderRow}>
                <View style={[styles.cardTag, { backgroundColor: COLORS.lime.DEFAULT }]}>
                  <Text style={styles.cardTagText}>Repairs & Handyman</Text>
                </View>
              </View>

              <Text style={[styles.cardTitle, { color: '#FFFFFF' }]}>
                AC servicing, plumbing & electrical fixers
              </Text>
              <Text style={[styles.cardBody, { color: '#A1A1AA' }]}>
                Experienced household technicians arrive with tools and complete repairs on time.
              </Text>

              <View style={styles.cardFooterRow}>
                <ArrowLink label="Explore Repairs" variant="limeOnBlack" />
                <MegaphoneIllustration width={110} height={90} />
              </View>
            </StickerCard>
          </View>
        </View>

        {/* 4. BUTTONS & ARROW LINKS */}
        <View style={styles.section}>
          <SectionHeader
            label="04. Buttons & Action Links"
            blurb="High-contrast full pill and 14px radius buttons with 1px black outline and hard sticker shadows."
          />

          <View style={styles.buttonsRow}>
            {/* Primary Black Button */}
            <TouchableOpacity style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Post a task ⚡</Text>
            </TouchableOpacity>

            {/* Lime Accent Button */}
            <TouchableOpacity style={styles.limeBtn}>
              <Text style={styles.limeBtnText}>Start earning 💸</Text>
            </TouchableOpacity>

            {/* Secondary Outline Button */}
            <TouchableOpacity
              style={[
                styles.outlineBtn,
                { backgroundColor: isDark ? '#1C1D26' : '#FFFFFF' },
              ]}
            >
              <Text style={[styles.outlineBtnText, { color: textColor }]}>
                How it works
              </Text>
            </TouchableOpacity>

            {/* Arrow Link */}
            <ArrowLink label="Learn more ↗" variant="blackOnLime" />
          </View>
        </View>

        {/* 5. FORM INPUTS & CHIPS */}
        <View style={styles.section}>
          <SectionHeader
            label="05. Form Controls & Chips"
            blurb="Sticker-style form fields, phone OTP verification boxes, and category chips."
          />

          <View style={styles.formsGrid}>
            {/* Text Input */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>
                Task Title
              </Text>
              <TextInput
                value={textInputVal}
                onChangeText={setTextInputVal}
                style={[
                  styles.stickerInput,
                  { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard, color: textColor },
                ]}
              />
            </View>

            {/* Phone Input with Country Code */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>
                Mobile Number (Pakistan +92)
              </Text>
              <View
                style={[
                  styles.phoneRow,
                  { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard },
                ]}
              >
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>🇵🇰 +92</Text>
                </View>
                <TextInput
                  value={phoneVal}
                  onChangeText={setPhoneVal}
                  style={[styles.phoneTextInput, { color: textColor }]}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* 6-Box OTP Verification */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>
                6-Digit SMS Verification Code
              </Text>
              <View style={styles.otpRow}>
                {otpVal.map((digit, i) => (
                  <View
                    key={i}
                    style={[
                      styles.otpBox,
                      {
                        backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard,
                        borderColor: digit ? COLORS.lime.DEFAULT : COLORS.ink.border,
                      },
                    ]}
                  >
                    <Text style={[styles.otpDigit, { color: textColor }]}>
                      {digit || '•'}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Category Chips Scroll */}
            <View style={styles.fieldWrapper}>
              <Text style={[styles.fieldLabel, { color: textColor }]}>
                Category Chips
              </Text>
              <View style={styles.chipsRow}>
                <View style={[styles.chip, { backgroundColor: COLORS.lime.DEFAULT }]}>
                  <Text style={styles.chipText}>🚗 Car Parts</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard }]}>
                  <Text style={[styles.chipText, { color: textColor }]}>📦 Delivery</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard }]}>
                  <Text style={[styles.chipText, { color: textColor }]}>🛒 Grocery</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard }]}>
                  <Text style={[styles.chipText, { color: textColor }]}>💊 Pharmacy</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* 6. NUMBERED ACCORDION (INTERACTIVE) */}
        <View style={styles.section}>
          <SectionHeader
            label="06. Numbered Accordion"
            blurb="Step-by-step numbered FAQ / workflow accordion. The active row lights up in lime with detailed content."
          />
          <Accordion items={sampleAccordion} defaultOpenIndex={0} />
        </View>

        {/* 7. AVATARS WITH LIME BLOBS */}
        <View style={styles.section}>
          <SectionHeader
            label="07. Verified Team & Tasker Avatars"
            blurb="Avatars framed in playful lime blobs with verified trust checkmarks."
          />

          <View style={styles.avatarsRow}>
            <View style={styles.avatarCard}>
              <AvatarBlob
                name="Hamza Malik"
                imageUri="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200"
                size={80}
              />
              <Text style={[styles.avatarName, { color: textColor }]}>Hamza M.</Text>
              <Text style={[styles.avatarRole, { color: subTextColor }]}>⭐ 4.95 • Top Tasker</Text>
            </View>

            <View style={styles.avatarCard}>
              <AvatarBlob
                name="Sara Ahmed"
                imageUri="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200"
                size={80}
              />
              <Text style={[styles.avatarName, { color: textColor }]}>Sara A.</Text>
              <Text style={[styles.avatarRole, { color: subTextColor }]}>⭐ 5.0 • Verified Poster</Text>
            </View>

            <View style={styles.avatarCard}>
              <AvatarBlob
                name="Tariq Mahmood"
                imageUri="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200"
                size={80}
              />
              <Text style={[styles.avatarName, { color: textColor }]}>Tariq M.</Text>
              <Text style={[styles.avatarRole, { color: subTextColor }]}>⭐ 4.9 • Property Owner</Text>
            </View>
          </View>
        </View>

        {/* 8. LINE-ART ILLUSTRATIONS */}
        <View style={styles.section}>
          <SectionHeader
            label="08. Line-Art Vector Illustrations"
            blurb="Black 2px outline line-art with playful lime fills, orbit ellipses, sparkles ✦, and floating dots."
          />

          <View style={styles.illustrationsGrid}>
            <View style={[styles.illustrationCard, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard, ...SHADOWS.sticker }]}>
              <MegaphoneIllustration width={140} height={120} />
              <Text style={[styles.illLabel, { color: textColor }]}>Megaphone Horn 📣</Text>
            </View>

            <View style={[styles.illustrationCard, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard, ...SHADOWS.sticker }]}>
              <FriendlyFaceIllustration width={120} height={120} />
              <Text style={[styles.illLabel, { color: textColor }]}>Friendly Face ✦</Text>
            </View>

            <View style={[styles.illustrationCard, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard, ...SHADOWS.sticker }]}>
              <DeliveryScooterIllustration width={140} height={120} />
              <Text style={[styles.illLabel, { color: textColor }]}>Delivery Scooter 🛵</Text>
            </View>

            <View style={[styles.illustrationCard, { backgroundColor: isDark ? '#1C1D26' : COLORS.greyCard, ...SHADOWS.sticker }]}>
              <CarPartsIllustration width={140} height={120} />
              <Text style={[styles.illLabel, { color: textColor }]}>Car Parts & Gear ⚙️</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandText: {
    fontSize: 24,
    fontWeight: '900',
    fontFamily: 'SpaceGrotesk',
  },
  badgePill: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: COLORS.ink.DEFAULT,
  },
  navActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  themeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
  },
  backBtn: {
    backgroundColor: COLORS.ink.DEFAULT,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 14,
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 60,
    maxWidth: 1240,
    width: '100%',
    alignSelf: 'center',
  },
  heroSection: {
    gap: 12,
  },
  heroSubtitle: {
    fontSize: 18,
    lineHeight: 28,
    maxWidth: 820,
    fontWeight: '500',
  },
  section: {
    width: '100%',
  },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  swatchCard: {
    width: '48%',
    minWidth: 240,
    flex: 1,
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    gap: 6,
  },
  swatchName: {
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
  },
  swatchHex: {
    fontSize: 15,
    fontWeight: '700',
  },
  swatchDesc: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
  },
  headingsColumn: {
    gap: 20,
  },
  cardsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 24,
  },
  demoCard: {
    flex: 1,
    minWidth: 320,
    gap: 14,
  },
  cardHeaderRow: {
    flexDirection: 'row',
  },
  cardTag: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
  },
  cardTagText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'SpaceGrotesk',
    letterSpacing: -0.3,
  },
  cardBody: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '500',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  buttonsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 20,
  },
  primaryBtn: {
    backgroundColor: COLORS.ink.DEFAULT,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    ...SHADOWS.sticker,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  limeBtn: {
    backgroundColor: COLORS.lime.DEFAULT,
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    ...SHADOWS.sticker,
  },
  limeBtnText: {
    color: COLORS.ink.DEFAULT,
    fontSize: 16,
    fontWeight: '800',
  },
  outlineBtn: {
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    ...SHADOWS.sticker,
  },
  outlineBtnText: {
    fontSize: 16,
    fontWeight: '800',
  },
  formsGrid: {
    gap: 24,
    maxWidth: 720,
  },
  fieldWrapper: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  stickerInput: {
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '500',
    ...SHADOWS.sticker,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    borderRadius: 14,
    ...SHADOWS.sticker,
  },
  countryCodeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: COLORS.ink.border,
    backgroundColor: COLORS.lime.DEFAULT,
    borderTopLeftRadius: 13,
    borderBottomLeftRadius: 13,
  },
  countryCodeText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.ink.DEFAULT,
  },
  phoneTextInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    gap: 12,
  },
  otpBox: {
    width: 52,
    height: 58,
    borderRadius: 14,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.sticker,
  },
  otpDigit: {
    fontSize: 22,
    fontWeight: '900',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '700',
  },
  avatarsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 32,
  },
  avatarCard: {
    alignItems: 'center',
    gap: 8,
  },
  avatarName: {
    fontSize: 16,
    fontWeight: '800',
  },
  avatarRole: {
    fontSize: 13,
    fontWeight: '600',
  },
  illustrationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  illustrationCard: {
    flex: 1,
    minWidth: 200,
    alignItems: 'center',
    padding: 24,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: COLORS.ink.border,
    gap: 12,
  },
  illLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
});
