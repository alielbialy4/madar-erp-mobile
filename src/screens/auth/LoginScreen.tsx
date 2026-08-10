import { designColors } from '@/constants/colors';
import React, { useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { spacing } from '@/constants/spacing';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { LoginFormPanel } from '@/components/auth/LoginFormPanel';
import { LoginHeroPanel } from '@/components/auth/LoginHeroPanel';
import { rootRtl } from '@/constants/layout';
import { responsive } from '@/constants/responsive';
import { env } from '@/config/env';
import { useAuthStore } from '@/store/authStore';
import { useLocaleStore } from '@/store/localeStore';

type LoginForm = {
  tenant_slug?: string;
  email: string;
  password: string;
};

export function LoginScreen() {
  const { t } = useTranslation();
  const language = useLocaleStore((s) => s.language);
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const keyboardHeight = useKeyboardHeight();
  const scrollRef = useRef<ScrollView>(null);
  const isTablet = width >= responsive.tabletMinSplit;
  const keyboardOpen = keyboardHeight > 0;
  const login = useAuthStore((state) => state.login);
  const loading = useAuthStore((state) => state.loading);
  const storeError = useAuthStore((state) => state.error);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const schema = useMemo(
    () =>
      z.object({
        tenant_slug: z.string().optional(),
        email: z.string().min(1, t('auth.emailRequired')).email(t('auth.emailInvalid')),
        password: z.string().min(6, t('auth.passwordMinLength')),
      }),
    [t, language],
  );

  const keyboardVerticalOffset = Platform.OS === 'ios' ? insets.top : 0;
  const scrollPaddingBottom = keyboardHeight + insets.bottom + spacing.xl;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: designColors.white },
        flex: { flex: 1 },
        row: { flexDirection: 'row', flex: 1 },
        column: { flex: 1 },
        formColumn: { flex: isTablet ? 1 : undefined },
        heroColumn: { flex: isTablet ? 1 : undefined },
        scroll: { flexGrow: 1 },
        formSection: { flexGrow: keyboardOpen ? 0 : 1 },
      }),
    [isTablet, keyboardOpen],
  );

  const { control, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { tenant_slug: env.defaultTenantSlug, email: '', password: '' },
  });

  const submit = handleSubmit(async (values) => {
    setSuccessMessage(null);
    const ok = await login({
      email: values.email,
      password: values.password,
      tenant_slug: values.tenant_slug?.trim() || undefined,
    });
    if (ok) {
      setSuccessMessage(t('auth.loginSuccess'));
    }
  });

  const scrollToForm = () => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  };

  const formPanel = (
    <LoginFormPanel
      control={control}
      errors={errors}
      loading={loading}
      errorMessage={storeError}
      successMessage={successMessage}
      onSubmit={submit}
      keyboardOpen={keyboardOpen}
      onFieldFocus={scrollToForm}
    />
  );

  const keyboardWrapper = (content: React.ReactNode) => (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.select({ ios: 'padding', android: undefined })}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {content}
    </KeyboardAvoidingView>
  );

  return (
    <View style={[styles.safe, rootRtl]}>
      <SafeAreaView style={styles.flex} edges={['top', 'bottom', 'left', 'right']}>
        {isTablet ? (
          <View style={styles.row}>
            <View style={styles.formColumn}>{keyboardWrapper(formPanel)}</View>
            <View style={styles.heroColumn}>
              <LoginHeroPanel />
            </View>
          </View>
        ) : (
          keyboardWrapper(
            <ScrollView
              ref={scrollRef}
              style={styles.flex}
              contentContainerStyle={[styles.scroll, { paddingBottom: scrollPaddingBottom }]}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
              automaticallyAdjustKeyboardInsets
            >
              <View style={styles.formSection}>{formPanel}</View>
            </ScrollView>,
          )
        )}
      </SafeAreaView>
    </View>
  );
}
