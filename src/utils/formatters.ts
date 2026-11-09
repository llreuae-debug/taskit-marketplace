import { SupportedLanguageCode } from '../i18n/languages';

const LOCALE_MAP: Record<SupportedLanguageCode, string> = {
  en: 'en-PK',
  ur: 'ur-PK',
  ar: 'ar-AE',
  hi: 'hi-IN',
  bn: 'bn-BD',
  zh: 'zh-CN',
  es: 'es-ES',
  fr: 'fr-FR',
  pt: 'pt-BR',
  ru: 'ru-RU',
  id: 'id-ID',
  tr: 'tr-TR',
  de: 'de-DE',
  fa: 'fa-IR',
  sw: 'sw-KE',
};

export function formatCurrency(
  amount: number,
  currency: string = 'PKR',
  language: SupportedLanguageCode = 'en'
): string {
  try {
    return new Intl.NumberFormat(LOCALE_MAP[language] || 'en-PK', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}

export function calculateTaskFeeBreakdown(taskCharges: number, feePercent: number = 10) {
  const safeCharges = Math.max(0, Math.round(taskCharges));
  const serviceFee = Math.round((safeCharges * feePercent) / 100);
  const taskerReceives = Math.max(0, safeCharges - serviceFee);
  return {
    taskCharges: safeCharges,
    serviceFee,
    taskerReceives,
    feePercent,
  };
}
