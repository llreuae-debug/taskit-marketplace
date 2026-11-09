/**
 * TaskIt ⚡ — Unified Design Tokens & Theme Configuration
 * Supports Task Marketplace (Electric Violet + Lime) & Real Estate (Violet + Emerald/Slate)
 */

export const COLORS = {
  primary: {
    DEFAULT: '#7C3AED', // Primary Violet
    light: '#8B5CF6',
    dark: '#6D28D9',
    subtle: 'rgba(124, 58, 237, 0.12)',
  },
  lime: {
    DEFAULT: '#A3E635', // Lime Accent
    dark: '#84CC16',
    subtle: 'rgba(163, 230, 53, 0.15)',
  },
  coral: {
    DEFAULT: '#FF5C7A', // Coral Accent
    dark: '#F43F5E',
    subtle: 'rgba(255, 92, 122, 0.15)',
  },
  background: {
    dark: '#0F0F14',
    darkElevated: '#181822',
    darkBorder: '#272736',
    light: '#FAFAFC',
    lightElevated: '#FFFFFF',
    lightBorder: '#E5E7EB',
  },
  text: {
    darkPrimary: '#F9FAFB',
    darkSecondary: '#9CA3AF',
    lightPrimary: '#111827',
    lightSecondary: '#4B5563',
  },
  status: {
    success: '#22C55E',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
} as const;

export const TYPOGRAPHY = {
  fonts: {
    sans: 'PlusJakartaSans',
    urdu: 'NotoNastaliqUrdu',
    arabic: 'NotoSansArabic',
    devanagari: 'NotoSansDevanagari',
    sc: 'NotoSansSC',
  },
  minTouchTarget: 48,
} as const;

export type ThemeMode = 'light' | 'dark';
export type ActiveMarketplace = 'tasks' | 'real_estate';
