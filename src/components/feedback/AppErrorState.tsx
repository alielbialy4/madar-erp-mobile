import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { textStart } from '@/constants/layout';

type IconName = Parameters<typeof AppIcon>[0]['name'];

type Props = {
  message?: string;
  title?: string;
  onRetry?: () => void;
  retryLabel?: string;
};

function splitMessage(message: string): { summary: string; detail: string | null } {
  const trimmed = message.trim();
  const latinCharacters = (trimmed.match(/[A-Za-z]/g) ?? []).length;
  if (latinCharacters > trimmed.length * 0.35) {
    return { summary: 'تعذر تحميل البيانات المطلوبة.', detail: trimmed };
  }
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

  return (
    <View style={styles.container}>
      <View style={[styles.iconBg, { backgroundColor: c.softDanger, borderColor: c.softDangerBorder }]}>
        <AppIcon
          name={(isNetwork ? 'cloud-slash' : 'warning-octagon') as IconName}
          size={28}
          weight="regular"
          color={c.danger}
        />
      </View>

      <View style={styles.textBlock}>
        <AppText style={{
          fontSize: typography.sectionTitle,
          fontFamily: fonts.extraBold,
          color: c.text,
          textAlign: 'center',
          writingDirection: 'rtl',
        }}>{title}</AppText>
        <AppText style={{
          fontSize: typography.body,
          fontFamily: fonts.medium,
          color: c.text,
          textAlign: 'center',
          writingDirection: 'rtl',
          lineHeight: 24,
        }}>{summary}</AppText>

        {detail ? (
          <ScrollView
            style={[styles.detailBox, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}
            contentContainerStyle={{ padding: spacing.md }}
          >
            <AppText style={{
              ...textStart,
              fontSize: typography.tiny,
              fontFamily: fonts.regular,
              color: c.textCaption,
              lineHeight: 18,
            }}>{detail}</AppText>
          </ScrollView>
        ) : null}
      </View>

      {onRetry ? <AppButton title={retryLabel} variant="primary" onPress={onRetry} size="default" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  iconBg: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
  textBlock: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.sm,
    alignItems: 'center',
  },
  detailBox: {
    width: '100%',
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
