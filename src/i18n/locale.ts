export const SUPPORTED_LANGUAGES = ['ar', 'en', 'fr'] as const;
export type AppLanguage = (typeof SUPPORTED_LANGUAGES)[number];

/** Same key as web i18next LanguageDetector cache. */
export const I18N_LANGUAGE_STORAGE_KEY = 'i18nextLng';

export function normalizeAppLanguage(value: unknown): AppLanguage {
  const raw = String(value ?? '')
    .trim()
    .toLowerCase();
  if (raw.startsWith('ar')) return 'ar';
  if (raw.startsWith('fr')) return 'fr';
  if (raw.startsWith('en')) return 'en';
  return 'ar';
}

export function isRtlLanguage(language: AppLanguage): boolean {
  return language === 'ar';
}
