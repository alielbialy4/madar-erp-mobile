import type { TextStyle } from 'react-native';
import { textStart, textLtr } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';

export type TextStylePreset =
  | 'display'
  | 'pageTitle'
  | 'sectionTitle'
  | 'cardTitle'
  | 'body'
  | 'bodyMedium'
  | 'caption'
  | 'metric'
  | 'metricLarge'
  | 'label'
  | 'helper';

const presets: Record<TextStylePreset, TextStyle> = {
  display: {
    ...textStart,
    fontSize: typography.heroTitle,
    lineHeight: 40,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  pageTitle: {
    ...textStart,
    fontSize: typography.pageTitle,
    lineHeight: 32,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  sectionTitle: {
    ...textStart,
    fontSize: typography.sectionTitle,
    lineHeight: 26,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  cardTitle: {
    ...textStart,
    fontSize: typography.cardTitle,
    lineHeight: 22,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  body: {
    ...textStart,
    fontSize: typography.body,
    lineHeight: 22,
    fontFamily: fonts.regular,
  },
  bodyMedium: {
    ...textStart,
    fontSize: typography.body,
    lineHeight: 22,
    fontFamily: fonts.medium,
    fontWeight: '500',
  },
  caption: {
    ...textStart,
    fontSize: typography.caption,
    lineHeight: 16,
    fontFamily: fonts.regular,
  },
  metric: {
    ...textLtr,
    fontSize: typography.metric,
    lineHeight: 34,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  metricLarge: {
    ...textLtr,
    fontSize: typography.metricLarge,
    lineHeight: 42,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
  },
  label: {
    ...textStart,
    fontSize: typography.label,
    lineHeight: 18,
    fontFamily: fonts.medium,
    fontWeight: '600',
  },
  helper: {
    ...textStart,
    fontSize: typography.helper,
    lineHeight: 18,
    fontFamily: fonts.regular,
  },
};

export function textStyle(preset: TextStylePreset, color?: string): TextStyle {
  return color ? { ...presets[preset], color } : presets[preset];
}

export const textStyles = presets;
