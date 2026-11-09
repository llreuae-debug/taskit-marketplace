import {
  SUPPORTED_LANGUAGES,
  RTL_LANGUAGE_CODES,
  isLanguageRTL,
} from '../../src/i18n/languages';
import {
  calculateTaskFeeBreakdown,
  formatCurrency,
} from '../../src/utils/formatters';
import { COLORS, TYPOGRAPHY } from '../../src/theme/tokens';

import en from '../../src/i18n/locales/en.json';
import ur from '../../src/i18n/locales/ur.json';
import ar from '../../src/i18n/locales/ar.json';
import fa from '../../src/i18n/locales/fa.json';

describe('Phase 1 — TaskIt Foundation Verification', () => {
  test('supports exactly 15 launch languages with correct RTL flags', () => {
    expect(SUPPORTED_LANGUAGES).toHaveLength(15);
    expect(RTL_LANGUAGE_CODES).toEqual(['ur', 'ar', 'fa']);
    expect(isLanguageRTL('ur')).toBe(true);
    expect(isLanguageRTL('ar')).toBe(true);
    expect(isLanguageRTL('fa')).toBe(true);
    expect(isLanguageRTL('en')).toBe(false);
    expect(isLanguageRTL('zh')).toBe(false);
  });

  test('English, Urdu, Arabic, and Persian locale files contain core brand & navigation keys', () => {
    expect(en.brand.tagline).toBe('Just TaskIt. ⚡');
    expect(ur.nav.realEstate).toBeTruthy();
    expect(ar.nav.tasks).toBeTruthy();
    expect(fa.nav.home).toBeTruthy();
  });

  test('calculates transparent task escrow fee breakdown accurately (PKR 1,000 -> Fee 100 -> Tasker 900)', () => {
    const breakdown = calculateTaskFeeBreakdown(1000, 10);
    expect(breakdown.taskCharges).toBe(1000);
    expect(breakdown.serviceFee).toBe(100);
    expect(breakdown.taskerReceives).toBe(900);
  });

  test('enforces TaskIt brand colors and 48px minimum accessibility touch target', () => {
    expect(COLORS.lime.DEFAULT).toBe('#B9FF66');
    expect(COLORS.ink.DEFAULT).toBe('#191A23');
    expect(COLORS.greyCard).toBe('#F3F3F3');
    expect(COLORS.background.dark).toBe('#0E0F14');
    expect(TYPOGRAPHY.minTouchTarget).toBeGreaterThanOrEqual(48);
  });

  test('formats localized currency cleanly', () => {
    const formatted = formatCurrency(1000, 'PKR', 'en');
    expect(formatted).toContain('1,000');
  });
});
