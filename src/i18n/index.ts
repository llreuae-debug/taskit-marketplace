import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { isLanguageRTL, SUPPORTED_LANGUAGES, SupportedLanguageCode } from './languages';

import en from './locales/en.json';
import ur from './locales/ur.json';
import ar from './locales/ar.json';
import hi from './locales/hi.json';
import bn from './locales/bn.json';
import zh from './locales/zh.json';
import es from './locales/es.json';
import fr from './locales/fr.json';
import pt from './locales/pt.json';
import ru from './locales/ru.json';
import id from './locales/id.json';
import tr from './locales/tr.json';
import de from './locales/de.json';
import fa from './locales/fa.json';
import sw from './locales/sw.json';

export const LANGUAGE_STORAGE_KEY = '@taskit:preferred_language';

export const resources = {
  en: { translation: en },
  ur: { translation: ur },
  ar: { translation: ar },
  hi: { translation: hi },
  bn: { translation: bn },
  zh: { translation: zh },
  es: { translation: es },
  fr: { translation: fr },
  pt: { translation: pt },
  ru: { translation: ru },
  id: { translation: id },
  tr: { translation: tr },
  de: { translation: de },
  fa: { translation: fa },
  sw: { translation: sw },
} as const;

export function applyRTLForLanguage(code: SupportedLanguageCode): boolean {
  const rtl = isLanguageRTL(code);
  try {
    I18nManager.allowRTL(true);
    if (I18nManager.isRTL !== rtl) {
      I18nManager.forceRTL(rtl);
    }
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.dir = rtl ? 'rtl' : 'ltr';
      document.documentElement.lang = code;
    }
  } catch {
    // Ignore in test environments where native bridge is mocked
  }
  return rtl;
}

export function detectDeviceLanguage(): SupportedLanguageCode {
  try {
    const locales = Localization.getLocales();
    const deviceCode = locales?.[0]?.languageCode?.toLowerCase();
    const match = SUPPORTED_LANGUAGES.find((l) => l.code === deviceCode);
    return match ? match.code : 'en';
  } catch {
    return 'en';
  }
}

export async function initializeI18n(): Promise<SupportedLanguageCode> {
  let savedLang: SupportedLanguageCode = 'en';
  try {
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored && SUPPORTED_LANGUAGES.some((l) => l.code === stored)) {
      savedLang = stored as SupportedLanguageCode;
    } else {
      savedLang = detectDeviceLanguage();
    }
  } catch {
    savedLang = 'en';
  }

  applyRTLForLanguage(savedLang);

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources,
      lng: savedLang,
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
      compatibilityJSON: 'v4',
    });
  } else {
    await i18n.changeLanguage(savedLang);
  }

  return savedLang;
}

export async function changeAppLanguage(code: SupportedLanguageCode): Promise<boolean> {
  await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  const rtl = applyRTLForLanguage(code);
  await i18n.changeLanguage(code);
  return rtl;
}

// Synchronous default initialization for immediate render safety
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
  });
}

export default i18n;
