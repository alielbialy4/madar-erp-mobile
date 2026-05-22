import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { flexRow, rootRtl, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppButton, AppInput } from '@/components/ui';
import { FormError } from '@/components/forms';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { BrandLogo } from '@/components/brand/BrandLogo';

const schema = z.object({
  tenant_slug: z.string().optional(),
  identifier: z.string().min(3, 'البريد أو رقم الهاتف مطلوب'),
  password: z.string().min(6, 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'),
});

type LoginForm = z.infer<typeof schema>;

const TABLET_MIN = 768;

export function LoginScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isWide = width >= TABLET_MIN;
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const styles = useMemo(() => StyleSheet.create({
    safe: { flex: 1, backgroundColor: c.sidebar },
    flex: { flex: 1 },
    scroll: { flexGrow: 1 },
    scrollWide: { minHeight: '100%' },
    split: { flexGrow: 1 },
    splitWide: { ...flexRow, minHeight: '100%' },
    brandPanel: {
      backgroundColor: c.sidebar,
      paddingHorizontal: spacing.xxl,
      paddingVertical: spacing.xxxl,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
      minHeight: 260,
      borderBottomLeftRadius: radius.xxxl,
      borderBottomRightRadius: radius.xxxl,
      overflow: 'hidden',
    },
    brandPanelWide: { flex: 1, minHeight: undefined, borderRadius: 0 },
    logoWrap: { alignItems: 'center', marginBottom: spacing.sm },
    logoTitle: { color: c.primaryForeground, fontSize: 28, fontFamily: fonts.extraBold, fontWeight: '800' },
    tagline: { color: '#94A3B8', fontSize: typography.body, fontFamily: fonts.medium, textAlign: 'center', lineHeight: 24 },
    divider: { width: 40, height: 2, backgroundColor: c.brandAccent, borderRadius: 1, marginVertical: spacing.sm },
    brandHint: { color: '#64748B', fontSize: typography.tiny, fontFamily: fonts.regular },
    formSection: {
      flex: 1,
      backgroundColor: c.background,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xxl,
      paddingBottom: spacing.xxl,
      gap: spacing.lg,
      justifyContent: 'center',
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
    },
    formSectionWide: { flex: 1, maxWidth: 520, borderTopLeftRadius: radius.xxxl },
    formHeader: { gap: spacing.xs },
    formTitle: { ...textStart, color: c.text, fontSize: typography.pageTitle, fontFamily: fonts.extraBold, fontWeight: '800' },
    formSubtitle: { ...textStart, color: c.textMuted, fontSize: typography.body, fontFamily: fonts.regular },
    formCard: {
      gap: spacing.lg,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      borderRadius: radius.xxl,
      padding: spacing.cardPadding,
    },
    apiHint: { ...textStart, color: c.textCaption, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
    footer: { color: c.textCaption, fontSize: typography.tiny, textAlign: 'center', fontFamily: fonts.regular },
  }), [c]);

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_slug: env.defaultTenantSlug, identifier: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    await login({
      identifier: values.identifier,
      password: values.password,
      tenant_slug: values.tenant_slug?.trim() || undefined,
    });
  });

  return (
    <SafeAreaView style={[styles.safe, rootRtl]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.select({ ios: 'padding', android: undefined })}
      >
        <ScrollView contentContainerStyle={[styles.scroll, isWide ? styles.scrollWide : undefined]} keyboardShouldPersistTaps="handled">
          <View style={[styles.split, isWide ? styles.splitWide : undefined]}>
            <View style={[styles.brandPanel, isWide ? styles.brandPanelWide : undefined]}>
              <View style={styles.logoWrap}>
                <BrandLogo height={64} inverted />
              </View>
              <Text style={styles.logoTitle}>Madar ERP</Text>
              <Text style={styles.tagline}>سجّل دخولك لإدارة المبيعات ونقاط البيع بسهولة</Text>
              <View style={styles.divider} />
              <Text style={styles.brandHint}>دخول آمن — بياناتك محمية</Text>
            </View>

            <View style={[styles.formSection, isWide ? styles.formSectionWide : undefined]}>
              <View style={styles.formHeader}>
                <Text style={styles.formTitle}>تسجيل الدخول</Text>
                <Text style={styles.formSubtitle}>أدخل بياناتك للمتابعة</Text>
              </View>

              <View style={styles.formCard}>
                <Controller
                  control={control}
                  name="tenant_slug"
                  render={({ field: { onChange, value } }) => (
                    <AppInput label="معرف المستأجر" value={value} onChangeText={onChange} placeholder="اتركه فارغاً للقيمة الافتراضية" autoCapitalize="none" />
                  )}
                />
                <Controller
                  control={control}
                  name="identifier"
                  render={({ field: { onChange, value } }) => (
                    <AppInput
                      label="البريد الإلكتروني أو رقم الهاتف"
                      value={value}
                      onChangeText={onChange}
                      placeholder="أدخل البريد أو رقم الهاتف"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      error={errors.identifier?.message}
                      required
                    />
                  )}
                />
                <Controller
                  control={control}
                  name="password"
                  render={({ field: { onChange, value } }) => (
                    <AppInput
                      label="كلمة المرور"
                      value={value}
                      onChangeText={onChange}
                      placeholder="أدخل كلمة المرور"
                      secureTextEntry
                      error={errors.password?.message}
                      required
                    />
                  )}
                />
                <FormError message={error} />
                <AppButton title="تسجيل الدخول" onPress={submit} loading={loading} fullWidth size="lg" />
              </View>

              <Text style={styles.apiHint}>عنوان API: {env.apiUrl}</Text>
              <Text style={styles.footer}>© {new Date().getFullYear()} Madar. جميع الحقوق محفوظة.</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
