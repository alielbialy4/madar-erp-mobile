import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';

type Item = {
  id: string;
  title: string;
  detail?: string;
  tone?: 'warning' | 'danger' | 'info';
  onPress?: () => void;
};

type Props = {
  title?: string;
  items: Item[];
};

/** Command-center exceptions strip — louder than vanity metrics */
export function AttentionBand({ title = 'يتطلب انتباهك', items }: Props) {
  const c = useColors();
  if (!items.length) return null;

  return (
    <View style={[styles.root, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
      <AppText style={[textStyle('sectionTitle'), { color: c.text }]}>{title}</AppText>
      {items.map((item) => {
        const toneColor =
          item.tone === 'danger' ? c.danger
            : item.tone === 'info' ? c.info
              : c.warning;
        return (
          <Pressable
            key={item.id}
            onPress={item.onPress}
            style={({ pressed }) => [
              styles.item,
              { borderColor: c.borderSubtle, opacity: pressed ? 0.75 : 1 },
            ]}
          >
            <View style={[styles.rail, { backgroundColor: toneColor }]} />
            <View style={styles.body}>
              <AppText style={[textStyle('rowPrimary'), { color: c.text }]} numberOfLines={1}>
                {item.title}
              </AppText>
              {item.detail ? (
                <AppText style={[textStyle('metadata'), { color: c.textMuted }]} numberOfLines={2}>
                  {item.detail}
                </AppText>
              ) : null}
            </View>
            <AppIcon name="caret-right" size={16} color={c.textCaption} />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    borderRadius: radius.surface,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  item: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  rail: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
  body: { flex: 1, gap: 2 },
});
