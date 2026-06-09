import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { Control, FieldErrors } from 'react-hook-form';
import { Controller } from 'react-hook-form';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput, AppPasswordInput } from '@/components/ui';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { authCopy } from '@/constants/authCopy';
import { textStart } from '@/constants/layout';
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
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: '#FFFFFF',
          justifyContent: keyboardOpen ? 'flex-start' : 'center',
          paddingHorizontal: spacing.xl,
          paddingVertical: isTablet ? spacing.xxxl : spacing.xxl,
          paddingTop: keyboardOpen && !isTablet ? spacing.lg : undefined,
          minHeight: isTablet || keyboardOpen ? undefined : Math.max(height * 0.68, 480),
        },
        inner: {
          width: '100%',
          maxWidth: 440,
          alignSelf: 'center',
          flexGrow: keyboardOpen ? 0 : 1,
          justifyContent: keyboardOpen ? 'flex-start' : 'center',
        },
        header: {
          gap: spacing.sm,
          marginBottom: spacing.xxl,
        },
        heading: {
          ...textStart,
          color: '#0F172A',
          fontSize: typography.pageTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
        },
        subheading: {
          ...textStart,
          color: '#64748B',
          fontSize: typography.body,
          fontFamily: fonts.regular,
        },
        card: {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: '#E2E8F0',
          borderRadius: radius.xl,
          backgroundColor: '#FFFFFF',
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.xxl,
          gap: spacing.lg,
          ...shadows.lg,
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
          borderColor: '#86EFAC',
          backgroundColor: '#F0FDF4',
        },
        bannerError: {
          borderColor: c.danger,
          backgroundColor: '#FEF2F2',
        },
        bannerTextSuccess: {
          color: '#166534',
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
        tenantHint: {
          ...textStart,
          color: c.textMuted,
          fontSize: typography.small,
          fontFamily: fonts.medium,
          fontWeight: '600',
          marginTop: spacing.xs,
          lineHeight: 20,
        },
        submitWrap: {
          marginTop: spacing.md,
          paddingTop: spacing.sm,
        },
        footer: {
          marginTop: spacing.xxl,
          paddingTop: spacing.lg,
          alignItems: 'center',
          gap: spacing.sm,
        },
        footerText: {
          color: '#94A3B8',
          fontSize: typography.tiny,
          fontFamily: fonts.regular,
          textAlign: 'center',
        },
        footerBrand: {
          color: '#475569',
          fontFamily: fonts.medium,
        },
      }),
    [c.danger, c.textMuted, height, isTablet, keyboardOpen],
  );

  const bannerMessage = successMessage ?? errorMessage;

  return (
    <View style={styles.root}>
      <View style={styles.inner}>
        <View style={styles.header}>
          <Text style={styles.heading}>{authCopy.loginHeading}</Text>
          <Text style={styles.subheading}>{authCopy.loginSubheading}</Text>
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
                  onFocus={onFieldFocus}
                />
                <Text style={styles.tenantHint}>{authCopy.tenantHint}</Text>
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
        </View>

        <View style={styles.footer}>
          <BrandLogo height={20} />
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
