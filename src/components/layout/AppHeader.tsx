import React from 'react';
import { Platform, Pressable, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { backArrowIcon } from '@/utils/rtl';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { Text } from '@/components/ui/AppText';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  right?: React.ReactNode;
};

export function AppHeader({ title, subtitle, onBack, right }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const showBranchPill = width >= 360;
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const isOnline = useNetworkStore((state) => state.isOnline);

  return (
    <View style={{
      backgroundColor: c.surface,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      ...Platform.select({
        ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 2 },
        android: { elevation: 1 },
        default: {},
      }),
    }}>
      <View style={{ ...flexRow, alignItems: 'center', gap: spacing.md }}>
        {onBack ? (
          <Pressable onPress={onBack} style={{
            width: 36, height: 36, borderRadius: radius.lg,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: c.surfaceMuted,
          }} accessibilityRole="button" accessibilityLabel="رجوع">
            <MaterialIcons name={backArrowIcon()} size={20} color={c.text} />
          </Pressable>
        ) : null}
        <View style={{ flex: 1 }}>
          <Text style={{
            ...textStart, color: c.text,
            fontSize: typography.pageTitle,
            fontFamily: fonts.extraBold,
            fontWeight: '800',
          }} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={{ ...textStart, color: c.textMuted, fontSize: typography.micro, fontFamily: fonts.medium, marginTop: 2 }} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
        {showBranchPill ? (
        <View style={{
          ...flexRow, alignItems: 'center', gap: spacing.xs,
          borderRadius: radius.pill, borderWidth: 1, borderColor: c.border,
          paddingHorizontal: spacing.sm, paddingVertical: 4, backgroundColor: c.surface,
        }}>
          <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: isOnline ? c.success : c.danger }} />
          <Text style={{ color: c.textMuted, fontSize: typography.micro, fontFamily: fonts.bold, fontWeight: '700' }} numberOfLines={1}>
            {viewMode === 'global' ? 'عرض عام' : activeBranch?.name || ''}
          </Text>
        </View>
        ) : null}
        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
}
