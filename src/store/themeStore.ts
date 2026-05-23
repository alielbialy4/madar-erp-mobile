import { create } from 'zustand';
import { storageDelete, storageGet, storageKeys, storageSet } from '@/services/storage';
import type { ColorScheme } from '@/constants/colors';

/** Same key as web `front/src/design-system/hooks/use-theme.tsx` */
const THEME_STORAGE_KEY = 'erb-theme';

type ThemeState = {
  theme: ColorScheme;
  primaryHex: string | null;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: ColorScheme) => void;
  setPrimaryHex: (hex: string | null) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  primaryHex: null,
  hydrated: false,

  bootstrap: async () => {
    let primaryHex: string | null = null;
    try {
      const storedPrimary = await storageGet<string>(storageKeys.tenantPrimaryHex);
      if (/^#([0-9a-fA-F]{6})$/.test(String(storedPrimary ?? '').trim())) {
        primaryHex = String(storedPrimary).trim().toUpperCase();
      }
    } catch {
      /* ignore */
    }
    try {
      const stored = await storageGet<ColorScheme>(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        set({ theme: stored, primaryHex, hydrated: true });
        return;
      }
    } catch {
      /* ignore */
    }
    set({ primaryHex, hydrated: true });
  },

  setTheme: (theme) => {
    set({ theme });
    void storageSet(THEME_STORAGE_KEY, theme);
  },

  toggleTheme: () => {
    const next: ColorScheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },

  setPrimaryHex: (hex) => {
    const clean = String(hex ?? '').trim();
    const valid = /^#([0-9a-fA-F]{6})$/.test(clean) ? clean.toUpperCase() : null;
    set({ primaryHex: valid });
    if (valid) void storageSet(storageKeys.tenantPrimaryHex, valid);
    else void storageDelete(storageKeys.tenantPrimaryHex);
  },
}));
