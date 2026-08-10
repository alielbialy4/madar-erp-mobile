import React from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { controlHeight, radius, spacing } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';
import type { ComponentProps } from 'react';

type IconName = ComponentProps<typeof AppIcon>['name'];

type Action = {
  id: string;
  label: string;
  icon?: IconName;
  onPress: () => void;
  tone?: 'default' | 'danger' | 'accent';
};

type Props = {
  actions: Action[];
};

export function QuickActionBar({ actions }: Props) {
  const c = useColors();
  if (!actions.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {actions.map((action) => {
        const color =
          action.tone === 'danger' ? c.danger
            : action.tone === 'accent' ? c.accent
              : c.text;
        return (
          <Pressable
            key={action.id}
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: c.surface,
                borderColor: c.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            {action.icon ? <AppIcon name={action.icon} size={16} color={color} /> : null}
            <AppText style={[textStyle('controlLabel'), { color }]}>{action.label}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  btn: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: controlHeight.chip + 12,
    paddingHorizontal: spacing.md,
    borderRadius: radius.control,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
