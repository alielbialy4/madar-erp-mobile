import React from 'react';
import { Pressable } from 'react-native';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { AppText } from './AppText';

export function AppChip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: Boolean(active) } : undefined}
      style={({ pressed }: { pressed?: boolean }) => ({
        ...flexRow,
        minHeight: 36,
        alignItems: 'center',
        gap: spacing.xs,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: active ? c.accent : c.border,
        backgroundColor: pressed ? c.surfaceMuted : active ? c.accentSoft : c.surface,
      })}
    >
      {icon}
      <AppText style={{
        fontSize: 12,
        fontFamily: active ? fonts.bold : fonts.medium,
        fontWeight: active ? '700' : '500',
        color: active ? c.accent : c.textMuted,
        writingDirection: 'rtl',
      }}>
        {label}
      </AppText>
    </Pressable>
  );
}
