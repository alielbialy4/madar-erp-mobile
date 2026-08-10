import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { flexRow } from '@/constants/layout';
import { backArrowIcon } from '@/utils/rtl';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';
import { Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { useTu } from '@/i18n/useTu';

type Props = {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, breadcrumb, onBack, right }: Props) {
  const c = useColors();
  const tx = useTu();

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: c.surface,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.borderSubtle,
        },
      ]}
    >
      <View style={{ ...flexRow, alignItems: 'center', gap: spacing.md }}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            style={[styles.backBtn, { backgroundColor: c.surfaceMuted }]}
            accessibilityRole="button"
            accessibilityLabel={tx('رجوع')}
          >
            <AppIcon name={backArrowIcon()} size={20} color={c.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          {breadcrumb ? (
            <Text style={{ ...textStyle('caption', c.textCaption), marginBottom: 2 }} numberOfLines={1}>
              {breadcrumb}
            </Text>
          ) : null}
          <Text style={{ ...textStyle('pageTitle', c.text) }} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={{ ...textStyle('caption', c.textMuted), marginTop: 2 }} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
