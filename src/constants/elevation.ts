import { Platform, ViewStyle } from 'react-native';
import type { AppColors } from '@/constants/colors';

export type ElevationTier = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export function elevation(c: AppColors, tier: ElevationTier): ViewStyle {
  if (tier === 'none') return {};

  const ios = {
    sm: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2 },
    md: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
    lg: { shadowColor: c.shadowMd, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.1, shadowRadius: 16 },
    xl: { shadowColor: c.shadowMd, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.14, shadowRadius: 24 },
  } as const;

  const android = {
    sm: { elevation: 1 },
    md: { elevation: 2 },
    lg: { elevation: 4 },
    xl: { elevation: 8 },
  } as const;

  return Platform.OS === 'ios' ? ios[tier] : android[tier];
}
