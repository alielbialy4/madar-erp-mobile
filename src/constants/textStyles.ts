import type { TextStyle } from 'react-native';
import { textStart, textLtr } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';

export type TextStylePreset =
  | 'display'
  | 'pageTitle'
  | 'entityTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'rowPrimary'
  | 'rowSecondary'
  | 'body'
  | 'bodyMedium'
  | 'caption'
  | 'metadata'
  | 'statusText'
  | 'controlLabel'
  | 'heroMetric'
  | 'largeFinancial'
  | 'financialValue'
  | 'metric'
  | 'metricLarge'
  | 'label'
  | 'helper';

const tabular: TextStyle = {
  fontVariant: ['tabular-nums'],
};

const presets: Record<TextStylePreset, TextStyle> = {
  display: {
    ...textStart,
    fontSize: typography.heroTitle,
    lineHeight: 34,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  pageTitle: {
    ...textStart,
    fontSize: typography.pageTitle,
    lineHeight: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  entityTitle: {
    ...textStart,
    fontSize: typography.entityTitle,
    lineHeight: 24,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  sectionTitle: {
    ...textStart,
    fontSize: typography.sectionTitle,
    lineHeight: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  cardTitle: {
    ...textStart,
    fontSize: typography.cardTitle,
    lineHeight: 20,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  rowPrimary: {
    ...textStart,
    fontSize: typography.rowPrimary,
    lineHeight: 20,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  rowSecondary: {
    ...textStart,
    fontSize: typography.rowSecondary,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
  body: {
    ...textStart,
    fontSize: typography.body,
    lineHeight: 20,
    fontFamily: fonts.regular,
  },
  bodyMedium: {
    ...textStart,
    fontSize: typography.body,
    lineHeight: 20,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  caption: {
    ...textStart,
    fontSize: typography.caption,
    lineHeight: 15,
    fontFamily: fonts.regular,
  },
  metadata: {
    ...textStart,
    fontSize: typography.metadata,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  statusText: {
    ...textStart,
    fontSize: typography.statusText,
    lineHeight: 14,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  controlLabel: {
    ...textStart,
    fontSize: typography.controlLabel,
    lineHeight: 17,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  heroMetric: {
    ...textLtr,
    ...tabular,
    fontSize: typography.heroMetric,
    lineHeight: 46,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.6,
  },
  largeFinancial: {
    ...textLtr,
    ...tabular,
    fontSize: typography.largeFinancial,
    lineHeight: 38,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  financialValue: {
    ...textLtr,
    ...tabular,
    fontSize: typography.financialValue,
    lineHeight: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metric: {
    ...textLtr,
    ...tabular,
    fontSize: typography.metric,
    lineHeight: 28,
    fontFamily: fonts.bold,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricLarge: {
    ...textLtr,
    ...tabular,
    fontSize: typography.metricLarge,
    lineHeight: 38,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  label: {
    ...textStart,
    fontSize: typography.label,
    lineHeight: 17,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  helper: {
    ...textStart,
    fontSize: typography.helper,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
};

export function textStyle(preset: TextStylePreset, color?: string): TextStyle {
  return color ? { ...presets[preset], color } : presets[preset];
}

export const textStyles = presets;
