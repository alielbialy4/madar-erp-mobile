import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { phosphorIconMap } from '@/constants/iconMap';
import { createDashboardStyles, KPI_TONE_STYLES, type KpiTone } from './dashboardStyles';
import {
  primaryKpiDensity,
  primaryKpiSizing,
  useDashboardContentWidth,
  useDashboardKpiSlotWidth,
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

export function DashboardKpiCard({ label, value, hint, icon, tone = 'accent', wide, tier = 'primary' }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const toneStyle = KPI_TONE_STYLES[tone];
  const toneColor = c[toneStyle.icon as keyof AppColors] as string;
  const contentWidth = useDashboardContentWidth();
  const slotWidth = useDashboardKpiSlotWidth(contentWidth, tier);
  const primarySlotWidth = useDashboardKpiSlotWidth(contentWidth, 'primary');
  const density = primaryKpiDensity(primarySlotWidth);
  const sizing = primaryKpiSizing(density);
  const dense = tier === 'primary' && !wide && density !== 'full';

  return (
    <View
      style={[
        tier === 'secondary' ? ds.kpiCellSecondary : ds.kpiCellPrimary,
        !wide && { width: slotWidth, maxWidth: slotWidth, flexBasis: slotWidth, flexGrow: 0 },
        wide ? ds.kpiCellWide : undefined,
      ]}
      accessibilityLabel={`${label}، ${value}${hint ? `، ${hint}` : ''}`}
    >
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={styles.heading}>
          <Text style={[styles.label, { color: c.textMuted }, dense && { fontSize: sizing.label }]} numberOfLines={2}>
            {label}
          </Text>
          <View style={[styles.icon, { backgroundColor: c.surfaceMuted }, dense && { width: sizing.iconBox, height: sizing.iconBox }]}>
            <AppIcon
              name={(phosphorIconMap[icon as keyof typeof phosphorIconMap] ?? icon) as IconName}
              size={dense ? sizing.icon : 18}
              weight="regular"
              color={toneColor}
            />
          </View>
        </View>
        <Text
          style={[styles.value, { color: c.text }, dense && { fontSize: sizing.value }]}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.68}
        >
          {value}
        </Text>
        {hint ? <Text style={[styles.hint, { color: c.textCaption }]} numberOfLines={1}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 104,
    justifyContent: 'space-between',
    gap: spacing.xs,
    padding: spacing.md,
    borderRadius: 0,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderStartWidth: StyleSheet.hairlineWidth,
  },
  heading: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { ...textStart, flex: 1, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.caption, lineHeight: 18 },
  icon: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  value: { ...textLtr, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: 24, lineHeight: 30 },
  hint: { ...textStart, fontFamily: fonts.regular, fontSize: typography.micro },
});
