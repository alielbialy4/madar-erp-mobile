import React, { useMemo } from 'react';
import { View, StyleSheet, useWindowDimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { glassTokens } from '@/constants/glass';
import { Text } from '@/components/ui/AppText';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';
import { AppIcon } from '@/components/ui/AppIcon';
import { phosphorIconMap } from '@/constants/iconMap';
import { createDashboardStyles, KPI_TONE_STYLES, type KpiTone } from './dashboardStyles';

type IconName = Parameters<typeof AppIcon>[0]['name'];

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: string;
  tone?: KpiTone;
  wide?: boolean;
  index?: number;
};

export function DashboardKpiCard({ label, value, hint, icon, tone = 'accent', wide, index = 0 }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const toneStyle = KPI_TONE_STYLES[tone];
  const gradientColor = c[toneStyle.icon as keyof AppColors] as string;

  const rawNum = parseFloat(value.replace(/[^0-9.-]/g, '')) || 0;
  const hasNumber = !isNaN(rawNum) && value.match(/\d/);

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
        ds.kpiCell,
        isTablet && !wide ? ds.kpiCellTablet : undefined,
        wide ? ds.kpiCellWide : undefined,
      ]}
    >
      <View style={styles.cardWrap}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFillObject} />
        ) : null}
        <LinearGradient
          colors={Platform.OS === 'ios' ? ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.35)'] : ['#FFFFFF', '#FAFBFF']}
          style={StyleSheet.absoluteFillObject}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={[styles.card, { borderColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.50)' : 'rgba(15,23,42,0.04)' }]}>
          <View style={styles.top}>
            <View style={styles.iconBadge}>
              <LinearGradient
                colors={[gradientColor, gradientColor + 'BB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBadgeGradient}
              >
                <AppIcon name={(phosphorIconMap[icon as keyof typeof phosphorIconMap] ?? icon) as IconName} size={20} weight="duotone" color="#FFFFFF" />
              </LinearGradient>
            </View>
          </View>
          <Text style={[styles.label, { color: c.textMuted }]}>{label}</Text>
          {hasNumber ? (
            <AnimatedCounter
              value={rawNum}
              fontSize={26}
              fontWeight="800"
              prefix={value.startsWith('₪') || value.startsWith('ج.م') ? '' : ''}
              suffix=""
              style={styles.value}
            />
          ) : (
            <Text style={[styles.value, { color: c.text }]} numberOfLines={1}>
              {value}
            </Text>
          )}
          {hint ? <Text style={[styles.hint, { color: c.textCaption }]}>{hint}</Text> : null}
        </View>
      </View>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    borderRadius: radius.card,
    overflow: 'hidden',
    ...glassTokens.shadow.sm,
  },
  card: {
    borderRadius: radius.card,
    padding: spacing.lg,
    gap: spacing.xs,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    overflow: 'hidden',
    ...glassTokens.shadow.sm,
  },
  iconBadgeGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.label,
    fontFamily: fonts.bold,
  },
  value: {
    fontSize: 26,
    fontFamily: fonts.extraBold,
    marginTop: -2,
  },
  hint: {
    fontSize: typography.caption,
    fontFamily: fonts.regular,
  },
});
