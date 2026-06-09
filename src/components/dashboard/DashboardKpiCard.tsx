import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, shadows, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { Text } from '@/components/ui/AppText';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AppIcon } from '@/components/ui/AppIcon';
import { phosphorIconMap } from '@/constants/iconMap';
import { createDashboardStyles, KPI_TONE_STYLES, type KpiTone } from './dashboardStyles';
import {
  primaryKpiDensity,
  primaryKpiSizing,
  useDashboardContentWidth,
  usePrimaryKpiSlotWidth,
} from './dashboardLayout';

type IconName = Parameters<typeof AppIcon>[0]['name'];

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: KpiTone;
  wide?: boolean;
  tier?: 'primary' | 'secondary';
  index?: number;
};

export function DashboardKpiCard({ label, value, hint, icon, tone = 'accent', wide, tier = 'primary', index = 0 }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const toneStyle = KPI_TONE_STYLES[tone];
  const gradientColor = c[toneStyle.icon as keyof AppColors] as string;

  const contentWidth = useDashboardContentWidth();
  const primarySlotWidth = usePrimaryKpiSlotWidth(contentWidth);
  const primaryDensity = primaryKpiDensity(primarySlotWidth);
  const primarySize = primaryKpiSizing(primaryDensity);
  const isDensePrimary = tier === 'primary' && !wide && primaryDensity !== 'full';

  const rawNum = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  const hasNumber = !isNaN(rawNum) && value.match(/\d/);

  const valueFontSize = tier === 'secondary' ? 20 : isDensePrimary ? primarySize.value : 26;
  const labelFontSize = tier === 'secondary' ? typography.tiny : isDensePrimary ? primarySize.label : typography.label;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16, scale: 0.94 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      transition={{
        type: 'spring',
        damping: 18,
        stiffness: 150,
        delay: index * 60,
      }}
      style={[
        tier === 'secondary' ? ds.kpiCellSecondary : ds.kpiCellPrimary,
        isTablet && !wide && tier === 'secondary' ? ds.kpiCellSecondaryTablet : undefined,
        wide ? ds.kpiCellWide : undefined,
      ]}
    >
      <View style={[styles.cardWrap, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        <View style={[styles.card, isDensePrimary && { padding: primarySize.padding, gap: 2 }]}>
          <View style={[styles.labelRow, isDensePrimary && { gap: spacing.xs }]}>
            <View
              style={[
                styles.iconBadge,
                isDensePrimary && {
                  width: primarySize.iconBox,
                  height: primarySize.iconBox,
                  borderRadius: primarySize.iconBox * 0.3,
                },
              ]}
            >
              <LinearGradient
                colors={[gradientColor, gradientColor + 'BB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.iconBadgeGradient,
                  isDensePrimary && {
                    width: primarySize.iconBox,
                    height: primarySize.iconBox,
                    borderRadius: primarySize.iconBox * 0.3,
                  },
                ]}
              >
                <AppIcon
                  name={(phosphorIconMap[icon as keyof typeof phosphorIconMap] ?? icon) as IconName}
                  size={isDensePrimary ? primarySize.icon : 20}
                  weight="duotone"
                  color="#FFFFFF"
                />
              </LinearGradient>
            </View>
            <Text
              style={[
                styles.label,
                { color: c.textMuted, fontSize: labelFontSize },
                tier === 'secondary' && styles.labelSecondary,
              ]}
              numberOfLines={2}
            >
              {label}
            </Text>
          </View>
          {hasNumber ? (
            <AnimatedCounter
              value={rawNum}
              fontSize={valueFontSize}
              fontWeight="800"
              prefix={value.startsWith('₪') || value.startsWith('ج.م') ? '' : ''}
              suffix=""
              style={styles.value}
            />
          ) : (
            <Text
              style={[styles.valueText, { color: c.text, fontSize: valueFontSize }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {value}
            </Text>
          )}
          {hint ? <Text style={[styles.hint, { color: c.textCaption }]} numberOfLines={1}>{hint}</Text> : null}
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    width: '100%',
    borderRadius: radius.card,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    ...shadows.card,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
    overflow: 'hidden',
  },
  labelRow: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    ...shadows.sm,
  },
  iconBadgeGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    ...textStart,
    flex: 1,
    fontFamily: fonts.bold,
    lineHeight: 16,
  },
  labelSecondary: {
    fontSize: typography.tiny,
  },
  value: {
    ...textLtr,
    marginTop: -2,
  },
  valueText: {
    ...textStart,
    fontFamily: fonts.extraBold,
    marginTop: -2,
  },
  hint: {
    ...textStart,
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
});
