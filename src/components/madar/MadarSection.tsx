import React from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';

type Props = {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  style?: ViewStyle;
};

/** Section grouping via typography + spacing — not a card. */
export function MadarSection({ title, action, children, style }: Props) {
  const c = useColors();
  return (
    <View style={[styles.root, style]}>
      {title || action ? (
        <View style={styles.header}>
          {title ? (
            <AppText style={[textStyle('sectionTitle'), { color: c.text, flex: 1 }]} numberOfLines={1}>
              {title}
            </AppText>
          ) : <View style={{ flex: 1 }} />}
          {action}
        </View>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  header: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
});
