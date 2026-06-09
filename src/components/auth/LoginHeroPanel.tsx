import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { authCopy } from '@/constants/authCopy';
import { HERO_MUTED_FG, HERO_PANEL_BG } from '@/constants/dashboardHeroTheme';
import { fonts } from '@/constants/fonts';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

type Props = {
  compact?: boolean;
};

export function LoginHeroPanel({ compact = false }: Props) {
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: HERO_PANEL_BG,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: compact ? spacing.xxl : spacing.xxxl,
        },
        inner: {
          width: '100%',
          maxWidth: 400,
          alignItems: 'center',
        },
        title: {
          marginTop: spacing.lg,
          color: '#FFFFFF',
          fontSize: typography.pageTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
          textAlign: 'center',
        },
        tagline: {
          marginTop: spacing.sm,
          color: HERO_MUTED_FG,
          fontSize: typography.body,
          fontFamily: fonts.regular,
          textAlign: 'center',
          lineHeight: 22,
        },
        divider: {
          marginTop: spacing.xl,
          width: 64,
          height: StyleSheet.hairlineWidth,
          backgroundColor: '#334155',
        },
        secureNote: {
          marginTop: spacing.md,
          color: '#64748B',
          fontSize: typography.tiny,
          fontFamily: fonts.regular,
          textAlign: 'center',
        },
      }),
    [compact],
  );

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        <BrandLogo height={compact ? 48 : 64} inverted />
        <Text style={styles.title}>{authCopy.brandName}</Text>
        <Text style={styles.tagline}>{authCopy.heroTagline}</Text>
        {!compact ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.secureNote}>{authCopy.heroSecureNote}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}
