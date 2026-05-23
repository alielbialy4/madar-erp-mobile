import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Props = {
  isDineIn: boolean;
  dineInLabel?: string | null;
  onSelectTakeaway: () => void;
  onSelectDineIn: () => void;
  disabled?: boolean;
};

export function PosOrderModeToggle({
  isDineIn,
  dineInLabel,
  onSelectTakeaway,
  onSelectDineIn,
  disabled,
}: Props) {
  const c = useColors();
  const s = useMemo(() => createStyles(c), [c]);
  const hallLabel = dineInLabel?.trim() || 'صالة';

  return (
    <View style={s.segment}>
      <Pressable
        onPress={onSelectTakeaway}
        disabled={disabled}
        style={[s.segmentItem, !isDineIn && s.segmentItemActive]}
      >
        <MaterialIcons name="shopping-bag" size={18} color={!isDineIn ? c.primary : c.textMuted} />
        <Text style={[s.segmentLabel, !isDineIn && s.segmentLabelActive]}>تيك أواي</Text>
      </Pressable>
      <Pressable
        onPress={onSelectDineIn}
        disabled={disabled}
        style={[s.segmentItem, isDineIn && s.segmentItemActive]}
      >
        <MaterialIcons name="table-restaurant" size={18} color={isDineIn ? c.primary : c.textMuted} />
        <Text style={[s.segmentLabel, isDineIn && s.segmentLabelActive]} numberOfLines={1}>
          {hallLabel}
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(c: AppColors) {
  const segmentShadow = Platform.select({
    ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 3 },
    android: { elevation: 2 },
    default: {},
  });

  return StyleSheet.create({
    segment: {
      ...flexRow,
      backgroundColor: c.surfaceMuted,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: 3,
      gap: 3,
    },
    segmentItem: {
      flex: 1,
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      minHeight: 40,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.lg,
    },
    segmentItemActive: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      ...segmentShadow,
    },
    segmentLabel: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      fontWeight: '600',
      color: c.textMuted,
      flexShrink: 1,
    },
    segmentLabelActive: {
      color: c.primary,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
  });
}
