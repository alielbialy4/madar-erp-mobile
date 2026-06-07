import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui/AppButton';
import { flexRow, textStart } from '@/constants/layout';
import { apiUrlDisplayHost } from '@/config/env';

type IconName = Parameters<typeof AppIcon>[0]['name'];

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
    <View style={styles.container}>
      <LinearGradient
        colors={[c.danger + '20', c.danger + '08', 'transparent']}
        style={styles.iconBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <AppIcon
          name={(isNetwork ? 'cloud-slash' : 'warning-octagon') as IconName}
          size={36}
          weight="duotone"
          color={c.danger}
        />
      </LinearGradient>

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

        {isNetwork ? (
          <View style={[styles.hostBox, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }, flexRow]}>
            <AppIcon name="hard-drives" size={18} color={c.textMuted} />
            <AppText style={{ ...textStart, flex: 1, fontSize: typography.small, fontFamily: fonts.bold, color: c.textMuted }}>
              {host}
            </AppText>
          </View>
        ) : null}

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
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.xl,
    gap: spacing.lg,
  },
  iconBg: {
    width: 80,
    height: 80,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  textBlock: {
    width: '100%',
    maxWidth: 400,
    gap: spacing.sm,
    alignItems: 'center',
  },
  hostBox: {
    width: '100%',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  detailBox: {
    width: '100%',
    maxHeight: 120,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
