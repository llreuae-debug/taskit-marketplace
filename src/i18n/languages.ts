export type SupportedLanguageCode =
  | 'en'
  | 'ur'
  | 'ar'
  | 'hi'
  | 'bn'
  | 'zh'
  | 'es'
  | 'fr'
  | 'pt'
  | 'ru'
  | 'id'
  | 'tr'
  | 'de'
  | 'fa'
  | 'sw';

export interface LanguageMetadata {
  code: SupportedLanguageCode;
  name: string;
  nativeName: string;
  isRTL: boolean;
  defaultCurrency: string;
  flag: string;
  fontFamily: string;
}

export const SUPPORTED_LANGUAGES: readonly LanguageMetadata[] = [
  { code: 'en', name: 'English', nativeName: 'English', isRTL: false, defaultCurrency: 'PKR', flag: '🇬🇧', fontFamily: 'PlusJakartaSans' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', isRTL: true, defaultCurrency: 'PKR', flag: '🇵🇰', fontFamily: 'NotoNastaliqUrdu' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', isRTL: true, defaultCurrency: 'AED', flag: '🇸🇦', fontFamily: 'NotoSansArabic' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', isRTL: false, defaultCurrency: 'INR', flag: '🇮🇳', fontFamily: 'NotoSansDevanagari' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', isRTL: false, defaultCurrency: 'BDT', flag: '🇧🇩', fontFamily: 'PlusJakartaSans' },
  { code: 'zh', name: 'Simplified Chinese', nativeName: '简体中文', isRTL: false, defaultCurrency: 'CNY', flag: '🇨🇳', fontFamily: 'NotoSansSC' },
  { code: 'es', name: 'Spanish', nativeName: 'Español', isRTL: false, defaultCurrency: 'EUR', flag: '🇪🇸', fontFamily: 'PlusJakartaSans' },
  { code: 'fr', name: 'French', nativeName: 'Français', isRTL: false, defaultCurrency: 'EUR', flag: '🇫🇷', fontFamily: 'PlusJakartaSans' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', isRTL: false, defaultCurrency: 'BRL', flag: '🇧🇷', fontFamily: 'PlusJakartaSans' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', isRTL: false, defaultCurrency: 'RUB', flag: '🇷🇺', fontFamily: 'PlusJakartaSans' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', isRTL: false, defaultCurrency: 'IDR', flag: '🇮🇩', fontFamily: 'PlusJakartaSans' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', isRTL: false, defaultCurrency: 'TRY', flag: '🇹🇷', fontFamily: 'PlusJakartaSans' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', isRTL: false, defaultCurrency: 'EUR', flag: '🇩🇪', fontFamily: 'PlusJakartaSans' },
  { code: 'fa', name: 'Persian', nativeName: 'فارسی', isRTL: true, defaultCurrency: 'IRR', flag: '🇮🇷', fontFamily: 'NotoSansArabic' },
  { code: 'sw', name: 'Swahili', nativeName: 'Kiswahili', isRTL: false, defaultCurrency: 'KES', flag: '🇰🇪', fontFamily: 'PlusJakartaSans' },
] as const;

export const RTL_LANGUAGE_CODES: readonly SupportedLanguageCode[] = ['ur', 'ar', 'fa'];

export function isLanguageRTL(code: string): boolean {
  return RTL_LANGUAGE_CODES.includes(code as SupportedLanguageCode);
}
