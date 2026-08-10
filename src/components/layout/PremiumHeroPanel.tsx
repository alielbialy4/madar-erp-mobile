import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { contentAreaRtl, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';

export type PremiumHeroPanelProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  badges?: React.ReactNode;
  /** Footer rail — refresh / actions. */
  rail?: React.ReactNode;
  compact?: boolean;
  /** When false, parent provides horizontal padding (list screens). */
  edgeInset?: boolean;
};

export function PremiumHeroPanel({ eyebrow, title, subtitle, badges, rail, compact, edgeInset = true }: PremiumHeroPanelProps) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const isTablet = isProductTablet(getProductLayoutTier(width));
  const isLandscape = width > height;
  const landscapeTablet = isTablet && isLandscape;
  const dense = compact || landscapeTablet || (!isTablet && isLandscape);
  const splitRail = landscapeTablet && Boolean(rail);

  const styles = useMemo(
    () => createStyles(c, { isTablet, landscapeTablet, dense, edgeInset, splitRail }),
    [c, isTablet, landscapeTablet, dense, edgeInset, splitRail],
  );

  const mainBlock = (
    <View style={styles.mainColumn}>
      {eyebrow ? <AppText style={styles.eyebrow}>{eyebrow}</AppText> : null}
      <AppText style={styles.title} numberOfLines={landscapeTablet ? 1 : 2}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText style={styles.subtitle} numberOfLines={dense ? 1 : 2}>
          {subtitle}
        </AppText>
      ) : null}
      {badges ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgesRow}>
          {badges}
        </ScrollView>
      ) : null}
      {!splitRail && rail ? <View style={styles.rail}>{rail}</View> : null}
    </View>
  );

  return (
    <View style={styles.outer}>
      <View style={styles.body}>
        {splitRail ? (
          <View style={styles.splitRow}>
            {mainBlock}
            <View style={styles.railColumn}>{rail}</View>
          </View>
        ) : (
          mainBlock
        )}
      </View>
    </View>
  );
}

type StyleOpts = {
  isTablet: boolean;
  landscapeTablet: boolean;
  dense: boolean;
  edgeInset: boolean;
  splitRail: boolean;
};

function createStyles(c: AppColors, opts: StyleOpts) {
  const { isTablet, landscapeTablet, dense, edgeInset, splitRail } = opts;

  return StyleSheet.create({
    outer: {
      marginHorizontal: edgeInset ? spacing.lg : 0,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
      backgroundColor: c.background,
    },
    body: {
      paddingVertical: dense ? spacing.sm : spacing.md,
      paddingHorizontal: 0,
    },
    /** RTL row: title block on the right, refresh rail on the visual left (matches front lg:flex-row). */
    splitRow: {
      ...contentAreaRtl,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.lg,
    },
    mainColumn: {
      ...contentAreaRtl,
      flex: splitRail ? 1 : undefined,
      minWidth: 0,
      maxWidth: splitRail ? '72%' : undefined,
      gap: dense ? spacing.xs : spacing.sm,
    },
    railColumn: {
      ...contentAreaRtl,
      minWidth: 200,
      maxWidth: 280,
      flexShrink: 0,
      alignSelf: 'flex-start',
    },
    eyebrow: {
      ...textStart,
      fontSize: 11,
      fontFamily: fonts.bold,
      color: c.textCaption,
      letterSpacing: 0.8,
    },
    title: {
      ...textStart,
      fontSize: dense ? (landscapeTablet ? 21 : 18) : isTablet ? 24 : 22,
      fontFamily: fonts.extraBold,
      color: c.text,
      lineHeight: dense ? (landscapeTablet ? 28 : 24) : isTablet ? 30 : 28,
    },
    subtitle: {
      ...textStart,
      fontSize: dense ? 12 : 13,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: dense ? 18 : 20,
    },
    badgesRow: {
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rail: {
      width: '100%',
      gap: spacing.sm,
      paddingTop: dense ? spacing.xs : spacing.sm,
    },
  });
}
