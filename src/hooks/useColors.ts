import { useMemo } from 'react';
import { getColors, type AppColors } from '@/constants/colors';
import { useThemeStore } from '@/store/themeStore';

export function useColors(): AppColors {
  const theme = useThemeStore((s) => s.theme);
  return useMemo(() => getColors(theme), [theme]);
}

export function useColorScheme() {
  return useThemeStore((s) => s.theme);
}
