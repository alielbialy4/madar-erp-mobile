import type { AppColors } from './colors';

export const glassTokens = {
  blur: {
    none: 0,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  border: {
    light: 0.6,
    medium: 0.4,
    subtle: 0.2,
  },
  shadow: {
    sm: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    md: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 16,
      elevation: 5,
    },
    lg: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 24,
      elevation: 8,
    },
    xl: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
      elevation: 12,
    },
    colored: (hex: string) => ({
      shadowColor: hex,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.20,
      shadowRadius: 20,
      elevation: 6,
    }),
  },
  gradient: (c: AppColors) => [
    [0, c.meshGradient1, 0.0],
    [0.5, c.meshGradient2, 0.3],
    [1, c.meshGradient3, 0.0],
  ],
} as const;

export const motionPresets = {
  spring: {
    damping: 18,
    stiffness: 200,
    mass: 0.8,
  },
  springGentle: {
    damping: 24,
    stiffness: 120,
    mass: 1,
  },
  springSnappy: {
    damping: 14,
    stiffness: 280,
    mass: 0.6,
  },
  timing: {
    duration: 300,
  },
  stagger: {
    stagger: 40,
    initialDelay: 50,
  },
} as const;
