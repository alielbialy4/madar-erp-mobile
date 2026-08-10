import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import ar from './locales/ar.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import { normalizeAppLanguage, type AppLanguage } from '@/i18n/locale';

export const i18nResources = {
  ar: { translation: ar },
  en: { translation: en },
  fr: { translation: fr },
} as const;

let initialized = false;

export async function initI18n(language: AppLanguage = 'ar'): Promise<typeof i18n> {
  const lng = normalizeAppLanguage(language);
  if (initialized) {
    if (i18n.language !== lng) {
      await i18n.changeLanguage(lng);
    }
    return i18n;
  }

  await i18n.use(initReactI18next).init({
    resources: i18nResources,
    lng,
    fallbackLng: {
      fr: ['en', 'ar'],
      en: ['ar'],
      default: ['ar'],
    },
    supportedLngs: ['ar', 'en', 'fr'],
    /** Match web — keys are flat strings, including dotted names like `header.syncNow`. */
    keySeparator: false,
    interpolation: { escapeValue: false },
    compatibilityJSON: 'v4',
    returnNull: false,
  });

  initialized = true;
  return i18n;
}

export { i18n };
export default i18n;
