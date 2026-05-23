import React, { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { flexRow, textStart } from '@/constants/layout';
import { apiUrlDisplayHost } from '@/config/env';

type Props = {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

function splitMessage(message: string): { summary: string; detail: string | null } {
  const trimmed = message.trim();
  if (trimmed.length <= 96) return { summary: trimmed, detail: null };
  const firstPeriod = trimmed.indexOf('. ');
  if (firstPeriod > 0 && firstPeriod < 120) {
    return {
      summary: trimmed.slice(0, firstPeriod + 1),
      detail: trimmed.slice(firstPeriod + 2),
    };
  }
  return {
    summary: 'تعذر تحميل البيانات. تحقق من الاتصال ثم أعد المحاولة.',
    detail: trimmed,
  };
}

export function AppErrorState({
  message = 'حدث خطأ أثناء تحميل البيانات',
  title = 'عذراً، حدث خطأ',
  onRetry,
  retryLabel = 'إعادة المحاولة',
}: Props) {
  const c = useColors();
  const { summary, detail } = useMemo(() => splitMessage(message), [message]);
  const isNetwork = /اتصال|خادم|EXPO_PUBLIC_API_URL|انتهت مهلة/i.test(message);
  const host = apiUrlDisplayHost();

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xxl,
        paddingHorizontal: spacing.xl,
        gap: spacing.lg,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: radius.xxxl,
          backgroundColor: c.softDanger,
          borderWidth: 1,
          borderColor: c.softDangerBorder,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name={isNetwork ? 'cloud-off' : 'error-outline'} size={36} color={c.danger} />
      </View>

      <View style={{ width: '100%', maxWidth: 400, gap: spacing.sm, alignItems: 'center' }}>
        <AppText
          style={{
            fontSize: typography.sectionTitle,
            fontFamily: fonts.extraBold,
            fontWeight: '800',
            color: c.text,
            textAlign: 'center',
            writingDirection: 'rtl',
          }}
        >
          {title}
        </AppText>
        <AppText
          style={{
            fontSize: typography.body,
            fontFamily: fonts.medium,
            color: c.text,
            textAlign: 'center',
            writingDirection: 'rtl',
            lineHeight: 24,
          }}
        >
          {summary}
        </AppText>

        {isNetwork ? (
          <View
            style={{
              width: '100%',
              ...flexRow,
              alignItems: 'center',
              gap: spacing.sm,
              padding: spacing.md,
              borderRadius: radius.xl,
              backgroundColor: c.surfaceMuted,
              borderWidth: 1,
              borderColor: c.borderSubtle,
            }}
          >
            <MaterialIcons name="dns" size={18} color={c.textMuted} />
            <AppText style={{ ...textStart, flex: 1, fontSize: typography.small, fontFamily: fonts.bold, color: c.textMuted }}>
              {host}
            </AppText>
          </View>
        ) : null}

        {detail ? (
          <ScrollView
            style={{
              width: '100%',
              maxHeight: 120,
              borderRadius: radius.lg,
              backgroundColor: c.surfaceMuted,
              borderWidth: 1,
              borderColor: c.borderSubtle,
            }}
            contentContainerStyle={{ padding: spacing.md }}
          >
            <AppText
              style={{
                ...textStart,
                fontSize: typography.tiny,
                fontFamily: fonts.regular,
                color: c.textCaption,
                lineHeight: 18,
              }}
            >
              {detail}
            </AppText>
          </ScrollView>
        ) : null}
      </View>

      {onRetry ? <AppButton title={retryLabel} variant="primary" onPress={onRetry} size="default" /> : null}
    </View>
  );
}
