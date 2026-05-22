export type AppColors = {
  primary: string;
  primaryPressed: string;
  primaryForeground: string;
  accent: string;
  accentSoft: string;
  accentBorder: string;
  darkNavy: string;
  background: string;
  surface: string;
  surfaceHeader: string;
  surfaceMuted: string;
  surfaceElement: string;
  surfaceHover: string;
  border: string;
  borderSubtle: string;
  borderStrong: string;
  ring: string;
  text: string;
  textMuted: string;
  textCaption: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  softPrimary: string;
  softPrimaryBorder: string;
  softDanger: string;
  softDangerBorder: string;
  softWarning: string;
  softWarningBorder: string;
  softSuccess: string;
  softSuccessBorder: string;
  softInfo: string;
  softInfoBorder: string;
  softNeutral: string;
  softNeutralBorder: string;
  disabled: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarAccent: string;
  sidebarBorder: string;
  brandAccent: string;
  primarySoftStrong: string;
  primarySoftMuted: string;
  primarySoftForeground: string;
  primarySoftBorder: string;
  icon: string;
  shadow: string;
  shadowMd: string;
  overlay: string;
  posShellBg: string;
  tabBarActive: string;
  tabBarInactive: string;
};

/** Light tokens — `front/src/design-system/globals.css` :root */
export const lightColors: AppColors = {
  primary: '#0F172A',
  primaryPressed: '#1E293B',
  primaryForeground: '#FFFFFF',
  accent: '#2563EB',
  accentSoft: '#DBEAFE',
  accentBorder: '#BFDBFE',
  darkNavy: '#0F172A',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceHeader: '#FFFFFF',
  surfaceMuted: '#F1F5F9',
  surfaceElement: '#F1F5F9',
  surfaceHover: '#E8ECF1',

  border: '#CBD5E1',
  borderSubtle: '#E8EDF2',
  borderStrong: '#94A3B8',
  ring: '#2563EB',

  text: '#0F172A',
  textMuted: '#64748B',
  textCaption: '#94A3B8',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  softPrimary: '#EFF6FF',
  softPrimaryBorder: '#BFDBFE',
  softDanger: '#FEE2E2',
  softDangerBorder: '#FECACA',
  softWarning: '#FEF3C7',
  softWarningBorder: '#FDE68A',
  softSuccess: '#DCFCE7',
  softSuccessBorder: '#BBF7D0',
  softInfo: '#DBEAFE',
  softInfoBorder: '#BFDBFE',
  softNeutral: '#F1F5F9',
  softNeutralBorder: '#CBD5E1',

  disabled: '#94A3B8',

  sidebar: '#0F172A',
  sidebarForeground: '#E2E8F0',
  sidebarAccent: '#1E293B',
  sidebarBorder: '#334155',
  brandAccent: '#2563EB',

  primarySoftStrong: '#F1F5F9',
  primarySoftMuted: '#E8ECF1',
  primarySoftForeground: '#0F172A',
  primarySoftBorder: '#CBD5E1',
  icon: '#64748B',

  shadow: 'rgba(15, 23, 42, 0.06)',
  shadowMd: 'rgba(15, 23, 42, 0.12)',
  overlay: 'rgba(15, 23, 42, 0.55)',

  posShellBg: '#F6F7FB',
  tabBarActive: '#2563EB',
  tabBarInactive: '#94A3B8',
};

/** Dark tokens — `front/src/design-system/globals.css` .dark */
export const darkColors: AppColors = {
  primary: '#2D3B52',
  primaryPressed: '#374862',
  primaryForeground: '#FFFFFF',
  accent: '#3B82F6',
  accentSoft: '#1E3A5F',
  accentBorder: '#2563EB',
  darkNavy: '#0A0F1A',

  background: '#0A0F1A',
  surface: '#151B2E',
  surfaceHeader: '#0C1220',
  surfaceMuted: '#1A2238',
  surfaceElement: '#1A2238',
  surfaceHover: '#222B45',

  border: '#2D3A52',
  borderSubtle: '#1E293B',
  borderStrong: '#475569',
  ring: '#3B82F6',

  text: '#F1F5F9',
  textMuted: '#B8C4D4',
  textCaption: '#7B8BA3',

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',

  softPrimary: '#1A2744',
  softPrimaryBorder: '#2D4A7A',
  softDanger: '#3F1D1D',
  softDangerBorder: '#7F1D1D',
  softWarning: '#3F2E12',
  softWarningBorder: '#78350F',
  softSuccess: '#14532D',
  softSuccessBorder: '#166534',
  softInfo: '#1E3A5F',
  softInfoBorder: '#1D4ED8',
  softNeutral: '#1A2238',
  softNeutralBorder: '#334155',

  disabled: '#64748B',

  sidebar: '#0A0D18',
  sidebarForeground: '#E2E8F0',
  sidebarAccent: '#151B2E',
  sidebarBorder: '#1E293B',
  brandAccent: '#3B82F6',

  primarySoftStrong: '#1A2238',
  primarySoftMuted: '#151B2E',
  primarySoftForeground: '#F1F5F9',
  primarySoftBorder: '#334155',
  icon: '#94A3B8',

  shadow: 'rgba(0, 0, 0, 0.35)',
  shadowMd: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 0, 0, 0.65)',

  posShellBg: '#0A0F1A',
  tabBarActive: '#3B82F6',
  tabBarInactive: '#64748B',
};

export type ColorScheme = 'light' | 'dark';

export function getColors(scheme: ColorScheme): AppColors {
  return scheme === 'dark' ? darkColors : lightColors;
}

/** @deprecated Prefer `useColors()` for theme-aware UI */
export const colors = lightColors;

export type AppColor = keyof AppColors;
