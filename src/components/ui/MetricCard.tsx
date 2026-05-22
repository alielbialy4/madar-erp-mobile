import React from 'react';
import { Platform, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { textStart } from '@/constants/layout';
import { AppText } from './AppText';

type Tone = 'primary' | 'success' | 'warning' | 'danger' | 'info';

type Props = {
  label: string;
  value: string;
  subtitle?: string;
  tone?: Tone;
  icon?: React.ReactNode;
  trend?: string;
  trendUp?: boolean;
};

export function MetricCard({ label, value, subtitle, tone = 'primary', icon, trend, trendUp }: Props) {
  const c = useColors();

  const toneColors: Record<Tone, { bg: string; soft: string; iconBg: string }> = {
    primary: { bg: c.accent, soft: c.accentSoft, iconBg: c.accentSoft },
    success: { bg: c.success, soft: c.softSuccess, iconBg: c.softSuccess },
    warning: { bg: c.warning, soft: c.softWarning, iconBg: c.softWarning },
    danger: { bg: c.danger, soft: c.softDanger, iconBg: c.softDanger },
    info: { bg: c.info, soft: c.softInfo, iconBg: c.softInfo },
  };

  const t = toneColors[tone];

  return (
    <View style={{
      flex: 1,
      minWidth: 140,
      backgroundColor: c.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.lg,
      gap: spacing.sm,
      ...Platform.select({
        ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8 },
        android: { elevation: 2 },
        default: { boxShadow: `0 2px 8px ${c.shadow}` } as object,
      }),
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: radius.lg,
          backgroundColor: t.iconBg,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon ?? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: t.bg }} />}
        </View>
        {trend ? (
          <View style={{
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: radius.badge,
            backgroundColor: trendUp !== false ? c.softSuccess : c.softDanger,
          }}>
            <AppText style={{
              fontSize: typography.micro,
              fontFamily: fonts.bold,
              fontWeight: '700',
              color: trendUp !== false ? c.success : c.danger,
            }}>
              {trend}
            </AppText>
          </View>
        ) : null}
      </View>
      <AppText style={{
        color: c.textMuted,
        fontSize: typography.caption,
        fontFamily: fonts.medium,
        fontWeight: '500',
        ...textStart,
      }}>
        {label}
      </AppText>
      <AppText style={{
        color: c.text,
        fontSize: typography.metric,
        fontFamily: fonts.extraBold,
        fontWeight: '800',
        ...textStart,
        lineHeight: typography.metric + 4,
      }}>
        {value}
      </AppText>
      {subtitle ? (
        <AppText style={{
          color: c.textCaption,
          fontSize: typography.micro,
          fontFamily: fonts.regular,
          ...textStart,
        }}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );
}
