import { useMemo } from 'react';
import { getColors, type AppColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export function useColors(): AppColors {
  const theme = useThemeStore((s) => s.theme);
  const primaryHex = useThemeStore((s) => s.primaryHex);
  return useMemo(() => getColors(theme, primaryHex), [theme, primaryHex]);
}

export function useColorScheme() {
  return useThemeStore((s) => s.theme);
}
