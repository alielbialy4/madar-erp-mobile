import React from 'react';
import { Pressable, StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { rowHeight, spacing } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';

export type DenseRowProps = {
  primary: string;
  secondary?: string;
  meta?: string;
  leading?: React.ReactNode;
  status?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  height?: number;
  style?: ViewStyle;
  showDivider?: boolean;
  selected?: boolean;
};

export function DenseRow({
  primary,
  secondary,
  meta,
  leading,
  status,
  trailing,
  onPress,
  onLongPress,
  height = rowHeight.dense,
  style,
  showDivider = true,
  selected = false,
}: DenseRowProps) {
  const c = useColors();
  const content = (
    <View
      style={[
        styles.row,
        {
          minHeight: height,
          backgroundColor: selected ? c.surfaceMuted : c.surface,
          borderBottomColor: showDivider ? c.borderSubtle : 'transparent',
          borderBottomWidth: showDivider ? StyleSheet.hairlineWidth : 0,
          borderStartWidth: selected ? 3 : 0,
          borderStartColor: selected ? c.accent : 'transparent',
        },
        style,
      ]}
    >
      {leading}
      <View style={styles.body}>
        <AppText style={[textStyle('rowPrimary'), { color: c.text }]} numberOfLines={1}>
          {primary}
        </AppText>
        {secondary ? (
          <AppText style={[textStyle('rowSecondary'), { color: c.textMuted }]} numberOfLines={1}>
            {secondary}
          </AppText>
        ) : null}
        {meta ? (
          <AppText style={[textStyle('metadata'), { color: c.textCaption }]} numberOfLines={1}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {status}
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </View>
  );

  if (!onPress && !onLongPress) return content;
  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => pressed && { opacity: 0.72 }}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  body: { flex: 1, gap: 2, minWidth: 0 },
  trailing: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
});
