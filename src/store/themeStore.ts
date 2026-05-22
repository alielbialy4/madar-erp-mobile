import { create } from 'zustand';
import { storageGet, storageSet } from '@/services/storage';
import type { ColorScheme } from '@/constants/colors';

/** Same key as web `front/src/design-system/hooks/use-theme.tsx` */
const THEME_STORAGE_KEY = 'erb-theme';

type ThemeState = {
  theme: ColorScheme;
  hydrated: boolean;
  bootstrap: () => Promise<void>;
  toggleTheme: () => void;
  setTheme: (theme: ColorScheme) => void;
};

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',
  hydrated: false,

  bootstrap: async () => {
    try {
      const stored = await storageGet<ColorScheme>(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') {
        set({ theme: stored, hydrated: true });
        return;
      }
    } catch {
      /* ignore */
    }
    set({ hydrated: true });
  },

  setTheme: (theme) => {
    set({ theme });
    void storageSet(THEME_STORAGE_KEY, theme);
  },

  toggleTheme: () => {
    const next: ColorScheme = get().theme === 'dark' ? 'light' : 'dark';
    get().setTheme(next);
  },
}));
