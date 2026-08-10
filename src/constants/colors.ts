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
  refund: string;
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
  softRefund: string;
  softRefundBorder: string;
  disabled: string;
  sidebar: string;
  sidebarForeground: string;
  sidebarAccent: string;
  sidebarBorder: string;
  sidebarTextMuted: string;
  sidebarTextHint: string;
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
  gradientStart: string;
  gradientEnd: string;
  premiumGold: string;
  metricPositive: string;
  metricNegative: string;
  cardGlow: string;
  ringOffset: string;
  paymentVisaBg: string;
  paymentVisaBorder: string;
  paymentVisaFg: string;
  paymentInstapayBg: string;
  paymentInstapayBorder: string;
  paymentInstapayFg: string;
  paymentEwalletBg: string;
  paymentEwalletBorder: string;
  paymentEwalletFg: string;
  paymentCashBg: string;
  paymentCashBorder: string;
  paymentCashFg: string;
  onPrimary: string;
  shiftAlertBg: string;
  shiftAlertBorder: string;
  shiftAlertFg: string;
  shiftInfoBg: string;
  meshGradient1: string;
  meshGradient2: string;
  meshGradient3: string;
  shadowColored: string;
  navDot: string;
  chartPrimary: string;
  chartSecondary: string;
  chartTertiary: string;
  chartQuaternary: string;
  chartMuted: string;
};

/**
 * MADAR Executive Operational Fintech — static brand reference.
 * Runtime UI must use getColors / useColors.
 */
export const designColors = {
  white: '#FFFFFF',
  black: '#000000',
  // Dark materials
  obsidian: '#080D18',
  midnight: '#101725',
  elevated: '#172033',
  interactive: '#202A40',
  // Light materials
  canvas: '#F3F5F9',
  surface: '#FFFFFF',
  elevatedLight: '#F8F9FC',
  ink: '#111827',
  // Brand cobalt
  cobalt: '#3B5BDB',
  cobaltIntense: '#2948C8',
  cobaltDarkMode: '#7792FF',
  // Neutrals
  slate900: '#111827',
  slate800: '#1F2937',
  slate700: '#374151',
  slate600: '#5B6578',
  slate500: '#8B93A7',
  slate400: '#C9D0DE',
  slate300: '#E2E6EF',
  slate200: '#EBEEF5',
  slate100: '#F3F5F9',
  slate50: '#F8F9FC',
  // Semantic
  success: '#159A70',
  warning: '#C98719',
  danger: '#D54848',
  refund: '#C83F61',
  info: '#3478E5',
  // Legacy aliases (migrate away)
  navy: '#111827',
  navyPressed: '#0B1220',
  blue: '#3B5BDB',
  blueLight: '#C5D0F5',
  blueSoft: '#EEF2FC',
  purple: '#5B6578',
  green: '#159A70',
  greenLight: '#C8E8DC',
  greenSoft: '#EDF8F3',
  yellow: '#C98719',
  yellowLight: '#EBD9B0',
  yellowSoft: '#F8F2E6',
  red: '#D54848',
  redSoft: '#F8EEEE',
  redBorder: '#E8C8C8',
  redDark: '#A83333',
  redLight: '#E35D5D',
  orange: '#C98719',
  cyan: '#3478E5',
  pink: '#C83F61',
  teal: '#159A70',
  indigo: '#3B5BDB',
  gray: '#5B6578',
  grayLight: '#8B93A7',
  graySoft: '#F3F5F9',
  grayBorder: '#E2E6EF',
  dark: '#111827',
  darkBorder: '#243049',
  darkSoft: '#172033',
  darkMuted: '#9AA6BC',
  greenDark: '#0E7A57',
  blueDark: '#2948C8',
  deepNavy: '#080D18',
  deepPanel: '#101725',
} as const;

/** Light — Executive Clean */
export const lightColors: AppColors = {
  primary: '#111827',
  primaryPressed: '#0B1220',
  primaryForeground: '#FFFFFF',
  accent: '#3B5BDB',
  accentSoft: '#EEF2FC',
  accentBorder: '#C5D0F5',
  darkNavy: '#111827',

  background: '#F3F5F9',
  surface: '#FFFFFF',
  surfaceHeader: '#FFFFFF',
  surfaceMuted: '#F8F9FC',
  surfaceElement: '#EEF1F6',
  surfaceHover: '#E8ECF3',

  border: '#E2E6EF',
  borderSubtle: '#EBEEF5',
  borderStrong: '#C9D0DE',
  ring: '#3B5BDB',

  text: '#111827',
  textMuted: '#5B6578',
  textCaption: '#8B93A7',

  success: '#159A70',
  warning: '#C98719',
  danger: '#D54848',
  info: '#3478E5',
  refund: '#C83F61',

  softPrimary: '#EEF2FC',
  softPrimaryBorder: '#C5D0F5',
  softDanger: '#F8EEEE',
  softDangerBorder: '#E8C8C8',
  softWarning: '#F8F2E6',
  softWarningBorder: '#EBD9B0',
  softSuccess: '#EDF8F3',
  softSuccessBorder: '#C8E8DC',
  softInfo: '#EEF2FC',
  softInfoBorder: '#C5D0F5',
  softNeutral: '#F3F5F9',
  softNeutralBorder: '#E2E6EF',
  softRefund: '#F9EDF1',
  softRefundBorder: '#E8C0CC',

  disabled: '#8B93A7',

  sidebar: '#080D18',
  sidebarForeground: '#E8ECF3',
  sidebarAccent: '#172033',
  sidebarBorder: '#243049',
  sidebarTextMuted: '#9AA6BC',
  sidebarTextHint: '#6B7790',
  brandAccent: '#3B5BDB',

  primarySoftStrong: '#EEF2FC',
  primarySoftMuted: '#F3F5F9',
  primarySoftForeground: '#111827',
  primarySoftBorder: '#C5D0F5',
  icon: '#5B6578',

  shadow: 'rgba(8, 13, 24, 0.06)',
  shadowMd: 'rgba(8, 13, 24, 0.10)',
  overlay: 'rgba(8, 13, 24, 0.52)',

  posShellBg: '#F3F5F9',
  tabBarActive: '#111827',
  tabBarInactive: '#8B93A7',

  gradientStart: '#111827',
  gradientEnd: '#172033',
  premiumGold: '#C98719',
  metricPositive: '#159A70',
  metricNegative: '#D54848',
  cardGlow: 'rgba(8, 13, 24, 0.04)',
  ringOffset: '#FFFFFF',

  // Payment methods: neutral structure + ink — selection uses ring/accent
  paymentVisaBg: '#F8F9FC',
  paymentVisaBorder: '#E2E6EF',
  paymentVisaFg: '#111827',
  paymentInstapayBg: '#F8F9FC',
  paymentInstapayBorder: '#E2E6EF',
  paymentInstapayFg: '#111827',
  paymentEwalletBg: '#F8F9FC',
  paymentEwalletBorder: '#E2E6EF',
  paymentEwalletFg: '#111827',
  paymentCashBg: '#F8F9FC',
  paymentCashBorder: '#E2E6EF',
  paymentCashFg: '#111827',
  onPrimary: '#FFFFFF',
  shiftAlertBg: '#F8EEEE',
  shiftAlertBorder: '#E8C8C8',
  shiftAlertFg: '#A83333',
  shiftInfoBg: '#EEF2FC',
  meshGradient1: '#F3F5F9',
  meshGradient2: '#EEF2FC',
  meshGradient3: '#F8F9FC',
  shadowColored: 'rgba(59, 91, 219, 0.12)',
  navDot: '#3B5BDB',

  chartPrimary: '#3B5BDB',
  chartSecondary: '#111827',
  chartTertiary: '#5B6578',
  chartQuaternary: '#3478E5',
  chartMuted: '#C9D0DE',
};

/** Dark — Obsidian layered materials */
export const darkColors: AppColors = {
  primary: '#7792FF',
  primaryPressed: '#93A8FF',
  primaryForeground: '#080D18',
  accent: '#7792FF',
  accentSoft: 'rgba(119, 146, 255, 0.14)',
  accentBorder: 'rgba(119, 146, 255, 0.28)',
  darkNavy: '#080D18',

  background: '#080D18',
  surface: '#101725',
  surfaceHeader: '#0C121F',
  surfaceMuted: '#172033',
  surfaceElement: '#202A40',
  surfaceHover: '#273352',

  border: '#243049',
  borderSubtle: '#1A2438',
  borderStrong: '#334564',
  ring: '#7792FF',

  text: '#F3F5F9',
  textMuted: '#9AA6BC',
  textCaption: '#6B7790',

  success: '#2BB88A',
  warning: '#D9A03A',
  danger: '#E35D5D',
  info: '#5B94F0',
  refund: '#E05A7A',

  softPrimary: 'rgba(119, 146, 255, 0.14)',
  softPrimaryBorder: 'rgba(119, 146, 255, 0.28)',
  softDanger: 'rgba(227, 93, 93, 0.12)',
  softDangerBorder: 'rgba(227, 93, 93, 0.28)',
  softWarning: 'rgba(217, 160, 58, 0.12)',
  softWarningBorder: 'rgba(217, 160, 58, 0.28)',
  softSuccess: 'rgba(43, 184, 138, 0.12)',
  softSuccessBorder: 'rgba(43, 184, 138, 0.28)',
  softInfo: 'rgba(91, 148, 240, 0.12)',
  softInfoBorder: 'rgba(91, 148, 240, 0.28)',
  softNeutral: '#172033',
  softNeutralBorder: 'rgba(154, 166, 188, 0.18)',
  softRefund: 'rgba(224, 90, 122, 0.12)',
  softRefundBorder: 'rgba(224, 90, 122, 0.28)',

  disabled: '#6B7790',

  sidebar: '#060A14',
  sidebarForeground: '#E8ECF3',
  sidebarAccent: '#172033',
  sidebarBorder: '#243049',
  sidebarTextMuted: '#6B7790',
  sidebarTextHint: '#4A5568',
  brandAccent: '#7792FF',

  primarySoftStrong: 'rgba(119, 146, 255, 0.16)',
  primarySoftMuted: 'rgba(119, 146, 255, 0.10)',
  primarySoftForeground: '#F3F5F9',
  primarySoftBorder: 'rgba(119, 146, 255, 0.28)',
  icon: '#9AA6BC',

  shadow: 'rgba(0, 0, 0, 0.45)',
  shadowMd: 'rgba(0, 0, 0, 0.58)',
  overlay: 'rgba(0, 0, 0, 0.72)',

  posShellBg: '#080D18',
  tabBarActive: '#F3F5F9',
  tabBarInactive: '#6B7790',

  gradientStart: '#080D18',
  gradientEnd: '#172033',
  premiumGold: '#D9A03A',
  metricPositive: '#2BB88A',
  metricNegative: '#E35D5D',
  cardGlow: 'rgba(243, 245, 249, 0.04)',
  ringOffset: '#101725',

  paymentVisaBg: '#172033',
  paymentVisaBorder: '#243049',
  paymentVisaFg: '#F3F5F9',
  paymentInstapayBg: '#172033',
  paymentInstapayBorder: '#243049',
  paymentInstapayFg: '#F3F5F9',
  paymentEwalletBg: '#172033',
  paymentEwalletBorder: '#243049',
  paymentEwalletFg: '#F3F5F9',
  paymentCashBg: '#172033',
  paymentCashBorder: '#243049',
  paymentCashFg: '#F3F5F9',
  onPrimary: '#080D18',
  shiftAlertBg: 'rgba(227, 93, 93, 0.12)',
  shiftAlertBorder: 'rgba(227, 93, 93, 0.28)',
  shiftAlertFg: '#F0A0A0',
  shiftInfoBg: 'rgba(119, 146, 255, 0.12)',
  meshGradient1: '#101725',
  meshGradient2: '#172033',
  meshGradient3: '#080D18',
  shadowColored: 'rgba(0, 0, 0, 0.50)',
  navDot: '#7792FF',

  chartPrimary: '#7792FF',
  chartSecondary: '#F3F5F9',
  chartTertiary: '#9AA6BC',
  chartQuaternary: '#5B94F0',
  chartMuted: '#334564',
};

export type ColorScheme = 'light' | 'dark';

function normalizeHex(hex?: string | null): string | null {
  const match = /^#?([0-9a-fA-F]{6})$/.exec(String(hex ?? '').trim());
  return match ? `#${match[1].toUpperCase()}` : null;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  };
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function mix(hex: string, target: '#FFFFFF' | '#000000', amount: number): string {
  const a = Math.min(1, Math.max(0, amount));
  const src = hexToRgb(hex);
  const dst = hexToRgb(target);
  const channel = (s: number, d: number) => Math.round(s + (d - s) * a).toString(16).padStart(2, '0');
  return `#${channel(src.r, dst.r)}${channel(src.g, dst.g)}${channel(src.b, dst.b)}`.toUpperCase();
}

function readableForeground(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  const luminance = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return luminance > 0.58 ? '#111827' : '#FFFFFF';
}

export function getColors(scheme: ColorScheme, tenantPrimaryHex?: string | null): AppColors {
  const base = scheme === 'dark' ? darkColors : lightColors;
  const primary = normalizeHex(tenantPrimaryHex);
  if (!primary) return base;

  const foreground = readableForeground(primary);
  const soft = scheme === 'dark' ? rgba(primary, 0.18) : rgba(primary, 0.10);
  const border = scheme === 'dark' ? rgba(primary, 0.42) : rgba(primary, 0.24);
  const pressed = mix(primary, scheme === 'dark' ? '#FFFFFF' : '#000000', 0.12);

  return {
    ...base,
    primary,
    primaryPressed: pressed,
    primaryForeground: foreground,
    softPrimary: soft,
    softPrimaryBorder: border,
    primarySoftStrong: soft,
    primarySoftMuted: scheme === 'dark' ? rgba(primary, 0.12) : rgba(primary, 0.07),
    primarySoftForeground: primary,
    primarySoftBorder: border,
    tabBarActive: primary,
    cardGlow: rgba(primary, scheme === 'dark' ? 0.16 : 0.10),
    gradientStart: primary,
    gradientEnd: mix(primary, scheme === 'dark' ? '#FFFFFF' : '#000000', 0.2),
  };
}

/** @deprecated Prefer `useColors()` for theme-aware UI */
export const colors = lightColors;

export type AppColor = keyof AppColors;
