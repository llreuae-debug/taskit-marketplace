/**
 * TaskIt ⚡ — Unified Design Tokens & Theme Configuration
 * Visual direction: Clean editorial layout, lime-green (#B9FF66) + ink black (#191A23) + off-white (#F3F3F3),
 * chunky "sticker" cards with hard 0 5px 0 #191A23 bottom shadow, highlighted headings.
 */

export const COLORS = {
  // Brand Neo-Brutalist Sticker Palette
  lime: {
    DEFAULT: '#B9FF66', // Primary Lime Accent
    dark: '#9BE34A',    // Hover / pressed
    subtle: 'rgba(185, 255, 102, 0.25)',
  },
  ink: {
    DEFAULT: '#191A23', // Primary text, buttons, dark cards, borders, shadows
    light: '#23242E',
    border: '#191A23',
    shadow: '#191A23',
  },
  greyCard: '#F3F3F3', // Light cards, inputs, CTA band
  white: '#FFFFFF',    // Pure white canvas
  muted: '#6B6B73',    // Secondary / helper text
  line: '#E4E4E7',     // Dividers and subtle outlines

  // Backward-compatible aliases
  primary: {
    DEFAULT: '#191A23', // Main button & action fill in new design
    purple: '#7C3AED',
    light: '#8B5CF6',
    dark: '#111218',
    subtle: 'rgba(185, 255, 102, 0.20)',
  },
  coral: {
    DEFAULT: '#FF5C7A',
    dark: '#F43F5E',
    subtle: 'rgba(255, 92, 122, 0.15)',
  },
  background: {
    dark: '#0E0F14',
    darkElevated: '#191A23',
    darkBorder: '#23242E',
    light: '#FFFFFF',
    lightElevated: '#F3F3F3',
    lightBorder: '#191A23',
  },
  text: {
    darkPrimary: '#FFFFFF',
    darkSecondary: '#A1A1AA',
    lightPrimary: '#191A23',
    lightSecondary: '#6B6B73',
  },
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#FF4D4D',
    danger: '#FF4D4D',
    info: '#3B82F6',
  },
} as const;

export const TYPOGRAPHY = {
  fonts: {
    sans: 'SpaceGrotesk',
    urdu: 'NotoNastaliqUrdu',
    arabic: 'NotoSansArabic',
    devanagari: 'NotoSansDevanagari',
    sc: 'NotoSansSC',
  },
  minTouchTarget: 48,
} as const;

export const SHADOWS = {
  sticker: {
    shadowColor: '#191A23',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  },
  stickerHover: {
    shadowColor: '#191A23',
    shadowOffset: { width: 0, height: 7 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 7,
  },
  stickerPressed: {
    shadowColor: '#191A23',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 2,
  },
} as const;

export type ThemeMode = 'light' | 'dark';
export type ActiveMarketplace = 'tasks' | 'real_estate';
