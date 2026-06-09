import React from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { flexRow } from '@/constants/layout';
import { backArrowIcon } from '@/utils/rtl';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';

type Props = {
  title: string;
  subtitle?: string;
  breadcrumb?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, breadcrumb, onBack, right }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const showBranchPill = width >= 360;
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const isOnline = useNetworkStore((state) => state.isOnline);

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
            accessibilityLabel="رجوع"
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
        {showBranchPill ? (
          <View
            style={[
              styles.branchPill,
              {
                backgroundColor: c.surfaceMuted,
                borderColor: c.borderSubtle,
              },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: isOnline ? c.success : c.danger },
              ]}
            />
            <Text
              style={{ color: c.textMuted, ...textStyle('caption', c.textMuted), fontFamily: undefined }}
              numberOfLines={1}
            >
              {viewMode === 'global' ? 'عرض عام' : activeBranch?.name || ''}
            </Text>
          </View>
        ) : null}
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchPill: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
});
