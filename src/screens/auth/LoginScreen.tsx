import React, { useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { MotiView } from 'moti';
import { AppText as Text } from '@/components/ui/AppText';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { rootRtl, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { glassTokens } from '@/constants/glass';
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

export function LoginScreen() {
  const c = useColors();
  const { width, height } = useWindowDimensions();
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: c.sidebar },
        flex: { flex: 1 },
        scroll: { flexGrow: 1 },
        mesh: { ...StyleSheet.absoluteFillObject },
        deco1: {
          position: 'absolute',
          top: -height * 0.1,
          right: -width * 0.2,
          width: width * 0.7,
          height: width * 0.7,
          borderRadius: width * 0.35,
          backgroundColor: c.meshGradient1,
          opacity: 0.35,
        },
        deco2: {
          position: 'absolute',
          bottom: -height * 0.15,
          left: -width * 0.15,
          width: width * 0.6,
          height: width * 0.6,
          borderRadius: width * 0.3,
          backgroundColor: c.meshGradient3,
          opacity: 0.25,
        },
        container: {
          flex: 1,
          paddingHorizontal: spacing.xl,
          justifyContent: 'center',
          gap: spacing.xxl,
          paddingVertical: spacing.xxxl,
        },
        logoCard: {
          overflow: 'hidden',
          borderRadius: radius.xxl,
          ...glassTokens.shadow.lg,
        },
        logoInner: {
          alignItems: 'center',
          paddingVertical: spacing.xxxl,
          paddingHorizontal: spacing.xxl,
          gap: spacing.sm,
        },
        logoTitle: {
          color: c.text,
          fontSize: 32,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          marginTop: spacing.md,
        },
        tagline: {
          color: c.textMuted,
          fontSize: typography.body,
          fontFamily: fonts.medium,
          textAlign: 'center',
          lineHeight: 24,
        },
        formCard: {
          overflow: 'hidden',
          borderRadius: radius.xxl,
          ...glassTokens.shadow.xl,
        },
        formInner: {
          paddingHorizontal: spacing.xxl,
          paddingVertical: spacing.xxl,
          gap: spacing.lg,
        },
        formHeader: { gap: spacing.xs, marginBottom: spacing.xs },
        formTitle: {
          ...textStart,
          color: c.text,
          fontSize: typography.pageTitle,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
        },
        formSubtitle: {
          ...textStart,
          color: c.textMuted,
          fontSize: typography.body,
          fontFamily: fonts.regular,
        },
        inputLabel: {
          color: c.text,
          fontSize: typography.label,
          fontFamily: fonts.bold,
          fontWeight: '700',
          marginBottom: spacing.xs,
        },
        apiHint: {
          ...textStart,
          color: c.textCaption,
          fontSize: typography.tiny,
          fontFamily: fonts.bold,
          fontWeight: '700',
          textAlign: 'center',
        },
        footer: {
          color: c.textCaption,
          fontSize: typography.tiny,
          textAlign: 'center',
          fontFamily: fonts.regular,
        },
      }),
    [c, width, height],
  );

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
    <View style={[styles.safe, rootRtl, { backgroundColor: c.background }]}>
      {/* Gradient mesh background */}
      <LinearGradient
        colors={[c.meshGradient1, c.background, c.meshGradient2]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.mesh}
      />
      {/* Decorative blurred circles for depth */}
      <View style={styles.deco1} />
      <View style={styles.deco2} />

      <SafeAreaView style={styles.flex} edges={['top']}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.container}>
              {/* Logo Glass Card */}
              <MotiView
                from={{ opacity: 0, translateY: -20, scale: 0.95 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 120 }}
              >
                <View style={styles.logoCard}>
                  <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFillObject} />
                  <View style={[styles.logoInner, { backgroundColor: c.glassOverlay }]}>
                    <BrandLogo height={56} />
                    <Text style={styles.logoTitle}>Madar ERP</Text>
                    <Text style={styles.tagline}>سجّل دخولك لإدارة المبيعات ونقاط البيع</Text>
                  </View>
                </View>
              </MotiView>

              {/* Form Glass Card */}
              <MotiView
                from={{ opacity: 0, translateY: 30, scale: 0.96 }}
                animate={{ opacity: 1, translateY: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 18, stiffness: 100, delay: 150 }}
              >
                <View style={styles.formCard}>
                  <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFillObject} />
                  <View style={[styles.formInner, { backgroundColor: c.glassOverlay }]}>
                    <View style={styles.formHeader}>
                      <Text style={styles.formTitle}>تسجيل الدخول</Text>
                      <Text style={styles.formSubtitle}>أدخل بياناتك للمتابعة</Text>
                    </View>

                    <Controller
                      control={control}
                      name="tenant_slug"
                      render={({ field: { onChange, value } }) => (
                        <AppInput
                          label="معرف المستأجر"
                          value={value}
                          onChangeText={onChange}
                          placeholder="اتركه فارغاً للقيمة الافتراضية"
                          autoCapitalize="none"
                        />
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
                </View>
              </MotiView>

              <MotiView
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: 'timing', duration: 600, delay: 400 }}
              >
                <Text style={styles.apiHint}>عنوان API: {env.apiUrl}</Text>
                <Text style={[styles.footer, { marginTop: spacing.sm }]}>
                  © {new Date().getFullYear()} Madar. جميع الحقوق محفوظة.
                </Text>
              </MotiView>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
