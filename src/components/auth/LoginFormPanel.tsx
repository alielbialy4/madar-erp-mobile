import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput, AppPasswordInput } from '@/components/ui';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { authCopy } from '@/constants/authCopy';
import { flexRow, textStart, appTextAlignStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, shadows, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import { responsive } from '@/constants/responsive';

export type LoginFormValues = {
  tenant_slug?: string;
  email: string;
  password: string;
};

type Props = {
  control: Control<LoginFormValues>;
  errors: FieldErrors<LoginFormValues>;
  loading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onSubmit: () => void;
  keyboardOpen?: boolean;
  onFieldFocus?: () => void;
};

export function LoginFormPanel({
  control,
  errors,
  loading,
  errorMessage,
  successMessage,
  onSubmit,
  keyboardOpen = false,
  onFieldFocus,
}: Props) {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= responsive.tabletMinSplit;
  const compact = keyboardOpen && !isTablet;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          justifyContent: keyboardOpen ? 'flex-start' : 'center',
          paddingHorizontal: isTablet ? spacing.xxl : spacing.lg,
          paddingVertical: isTablet ? spacing.xxxl : spacing.xl,
          paddingTop: compact ? spacing.lg : undefined,
          minHeight: isTablet || keyboardOpen ? undefined : Math.max(height - spacing.xxxl, 560),
        },
        inner: {
          width: '100%',
          maxWidth: 460,
          alignSelf: 'center',
          flexGrow: keyboardOpen ? 0 : 1,
          justifyContent: keyboardOpen ? 'flex-start' : 'center',
        },
        brand: {
          alignItems: 'center',
          marginBottom: compact ? spacing.lg : spacing.xxl,
          gap: spacing.sm,
        },
        logoMark: {
          width: compact ? 52 : 64,
          height: compact ? 52 : 64,
          borderRadius: radius.xxl,
          backgroundColor: c.darkNavy,
          alignItems: 'center',
          justifyContent: 'center',
          ...shadows.md,
        },
        brandName: {
          color: c.text,
          fontSize: typography.entityTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
          textAlign: 'center',
        },
        brandContext: {
          color: c.textMuted,
          fontSize: typography.tiny,
          fontFamily: fonts.medium,
          textAlign: 'center',
        },
        header: {
          gap: spacing.xs,
          marginBottom: spacing.lg,
          alignItems: 'center',
        },
        heading: {
          color: c.text,
          fontSize: compact ? typography.h3 : typography.pageTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
          textAlign: 'center',
        },
        subheading: {
          color: c.textMuted,
          fontSize: typography.body,
          fontFamily: fonts.regular,
          textAlign: 'center',
        },
        card: {
          borderWidth: 1,
          borderColor: c.borderSubtle,
          borderRadius: radius.xxl,
          backgroundColor: c.surface,
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xl,
          gap: spacing.lg,
          ...shadows.card,
        },
        fieldBlock: {
          gap: spacing.xs,
        },
        banner: {
          borderRadius: radius.md,
          borderWidth: 1,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
        },
        bannerSuccess: {
          borderColor: c.softSuccessBorder,
          backgroundColor: c.softSuccess,
        },
        bannerError: {
          borderColor: c.softDangerBorder,
          backgroundColor: c.softDanger,
        },
        bannerTextSuccess: {
          color: c.success,
          fontSize: typography.body,
          fontFamily: fonts.medium,
          fontWeight: '600',
        },
        bannerTextError: {
          color: c.danger,
          fontSize: typography.body,
          fontFamily: fonts.medium,
          fontWeight: '600',
        },
        submitWrap: {
          marginTop: spacing.xs,
        },
        secureRow: {
          ...flexRow,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.xs,
          paddingTop: spacing.xs,
        },
        secureText: {
          color: c.textCaption,
          fontSize: typography.tiny,
          fontFamily: fonts.regular,
          textAlign: 'center',
          flexShrink: 1,
        },
        footer: {
          marginTop: spacing.xl,
          alignItems: 'center',
        },
        footerText: {
          color: c.textCaption,
          fontSize: typography.tiny,
          fontFamily: fonts.regular,
          textAlign: 'center',
        },
        footerBrand: {
          color: c.textMuted,
          fontFamily: fonts.medium,
        },
        tabletBrandName: {
          color: c.text,
          fontSize: typography.cardTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
          textAlign: appTextAlignStart,
        },
        tabletBrandContext: {
          color: c.textMuted,
          fontSize: typography.tiny,
          fontFamily: fonts.medium,
          textAlign: appTextAlignStart,
        },
        tabletHeader: {
          gap: spacing.xs,
          marginBottom: spacing.lg,
        },
        tabletHeading: {
          ...textStart,
          color: c.text,
          fontSize: typography.pageTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
        },
        tabletSubheading: {
          ...textStart,
          color: c.textMuted,
          fontSize: typography.body,
          fontFamily: fonts.regular,
        },
      }),
    [c, compact, height, isTablet, keyboardOpen],
  );

  const bannerMessage = successMessage ?? errorMessage;

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        {isTablet ? (
          <View style={[styles.brand, { alignItems: 'flex-start' }]}>
            <View style={styles.logoMark}>
              <BrandLogo height={28} inverted />
            </View>
            <Text style={styles.tabletBrandName}>{authCopy.brandName}</Text>
            <Text style={styles.tabletBrandContext} translate={false}>منصة التشغيل والإدارة</Text>
          </View>
        ) : (
          <View style={styles.brand}>
            <View style={styles.logoMark}>
              <BrandLogo height={compact ? 24 : 28} inverted />
            </View>
            <Text style={styles.brandName}>{authCopy.brandName}</Text>
            <Text style={styles.brandContext} translate={false}>منصة التشغيل والإدارة</Text>
          </View>
        )}

        <View style={isTablet ? styles.tabletHeader : styles.header}>
          <Text style={isTablet ? styles.tabletHeading : styles.heading}>{authCopy.loginHeading}</Text>
          <Text style={isTablet ? styles.tabletSubheading : styles.subheading}>{authCopy.loginSubheading}</Text>
        </View>

        <View style={styles.card}>
          {bannerMessage ? (
            <View
              style={[
                styles.banner,
                successMessage ? styles.bannerSuccess : styles.bannerError,
              ]}
            >
              <Text style={successMessage ? styles.bannerTextSuccess : styles.bannerTextError}>
                {bannerMessage}
              </Text>
            </View>
          ) : null}

          <Controller
            control={control}
            name="tenant_slug"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldBlock}>
                <AppInput
                  label={authCopy.tenantId}
                  value={value}
                  onChangeText={onChange}
                  placeholder={authCopy.tenantIdPlaceholder}
                  autoCapitalize="none"
                  prefixIcon="apartment"
                  onFocus={onFieldFocus}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="email"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldBlock}>
                <AppInput
                  label={authCopy.email}
                  value={value}
                  onChangeText={onChange}
                  placeholder={authCopy.emailPlaceholder}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="email"
                  error={errors.email?.message}
                  required
                  prefixIcon="mail-outline"
                  onFocus={onFieldFocus}
                />
              </View>
            )}
          />

          <Controller
            control={control}
            name="password"
            render={({ field: { onChange, value } }) => (
              <View style={styles.fieldBlock}>
                <AppPasswordInput
                  label={authCopy.password}
                  value={value}
                  onChangeText={onChange}
                  placeholder={authCopy.passwordPlaceholder}
                  autoComplete="password"
                  error={errors.password?.message}
                  required
                  prefixIcon="lock-outline"
                  onFocus={onFieldFocus}
                />
              </View>
            )}
          />

          <View style={styles.submitWrap}>
            <AppButton
              title={authCopy.signIn}
              onPress={onSubmit}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>

          <View style={styles.secureRow}>
            <MaterialIcons name="verified-user" size={14} color={c.textCaption} />
            <Text style={styles.secureText}>{authCopy.tenantHint}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {authCopy.developedBy}{' '}
            <Text style={styles.footerBrand}>{authCopy.developerName}</Text>
            {' · © '}
            {new Date().getFullYear()}
          </Text>
        </View>
      </View>
    </View>
  );
}
