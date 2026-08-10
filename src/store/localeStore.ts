import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Updates from 'expo-updates';
import { Platform } from 'react-native';
import { applyWebDocumentDirection, ensureNativeRtl } from '@/bootstrap/rtl';
import { initI18n } from '@/i18n';
import {
  I18N_LANGUAGE_STORAGE_KEY,
  isRtlLanguage,
  normalizeAppLanguage,
  type AppLanguage,
} from '@/i18n/locale';

type LocaleState = {
  language: AppLanguage;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  setLanguage: (next: AppLanguage) => Promise<'reloaded' | 'applied'>;
};

async function persistLanguage(language: AppLanguage): Promise<void> {
  await AsyncStorage.setItem(I18N_LANGUAGE_STORAGE_KEY, language);
}

async function readStoredLanguage(): Promise<AppLanguage> {
  try {
    const raw = await AsyncStorage.getItem(I18N_LANGUAGE_STORAGE_KEY);
    return normalizeAppLanguage(raw);
  } catch {
    return 'ar';
  }
}

async function reloadApp(): Promise<void> {
  try {
    await Updates.reloadAsync();
    return;
  } catch {
    /* fall through */
  }
  try {
    const { DevSettings } = await import('react-native');
    if (typeof DevSettings?.reload === 'function') {
      DevSettings.reload();
      return;
    }
  } catch {
    /* fall through */
  }
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.reload();
  }
}

export const useLocaleStore = create<LocaleState>((set, get) => ({
  language: 'ar',
  hydrated: false,

  bootstrap: async () => {
    const language = await readStoredLanguage();
    const rtl = isRtlLanguage(language);
    applyWebDocumentDirection(language, rtl);

    const needsReload = ensureNativeRtl(rtl);
    if (needsReload) {
      await persistLanguage(language);
      set({ language, hydrated: true });
      await reloadApp();
      return;
    }

    await initI18n(language);
    set({ language, hydrated: true });
  },

  setLanguage: async (next) => {
    const language = normalizeAppLanguage(next);
    const prev = get().language;
    if (language === prev) return 'applied';

    const prevRtl = isRtlLanguage(prev);
    const nextRtl = isRtlLanguage(language);
    await persistLanguage(language);
    await initI18n(language);
    applyWebDocumentDirection(language, nextRtl);
    set({ language });

    if (prevRtl !== nextRtl) {
      const needsReload = ensureNativeRtl(nextRtl);
      if (needsReload) {
        await reloadApp();
        return 'reloaded';
      }
    }

    return 'applied';
  },
}));
