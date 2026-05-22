import React from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';

type Props<T> = {
  items: T[];
  keyExtractor: (item: T) => string;
  title: (item: T) => string;
  subtitle?: (item: T) => string | undefined;
  onChange: (items: T[]) => void;
  emptyMessage?: string;
};

function moveItem<T>(items: T[], index: number, direction: -1 | 1): T[] {
  const target = index + direction;
  if (target < 0 || target >= items.length) return items;
  const next = [...items];
  const tmp = next[index];
  next[index] = next[target];
  next[target] = tmp;
  return next;
}

export function ReorderList<T>({ items, keyExtractor, title, subtitle, onChange, emptyMessage }: Props<T>) {
  const c = useColors();

  if (items.length === 0) {
    return <Text style={styles.empty}>{emptyMessage ?? 'لا توجد عناصر'}</Text>;
  }

  return (
    <FlatList
      data={items}
      keyExtractor={(item, index) => `${keyExtractor(item)}-${index}`}
      contentContainerStyle={styles.list}
      renderItem={({ item, index }) => (
        <View style={[styles.row, { borderBottomColor: c.borderSubtle, backgroundColor: c.surface }]}>
          <View style={styles.body}>
            <Text style={[styles.title, { color: c.text }]}>{title(item)}</Text>
            {subtitle?.(item) ? <Text style={[styles.sub, { color: c.textMuted }]}>{subtitle(item)}</Text> : null}
          </View>
          <View style={styles.actions}>
            <Pressable
              onPress={() => onChange(moveItem(items, index, -1))}
              disabled={index === 0}
              style={({ pressed }) => [styles.btn, pressed && { opacity: 0.7 }, index === 0 && styles.btnDisabled]}
              accessibilityLabel="تحريك لأعلى"
            >
              <MaterialIcons name="keyboard-arrow-up" size={24} color={index === 0 ? c.textCaption : c.accent} />
            </Pressable>
            <Pressable
              onPress={() => onChange(moveItem(items, index, 1))}
              disabled={index === items.length - 1}
              style={({ pressed }) => [
                styles.btn,
                pressed && { opacity: 0.7 },
                index === items.length - 1 && styles.btnDisabled,
              ]}
              accessibilityLabel="تحريك لأسفل"
            >
              <MaterialIcons
                name="keyboard-arrow-down"
                size={24}
                color={index === items.length - 1 ? c.textCaption : c.accent}
              />
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxl },
  row: {
    ...flexRow,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
  },
  body: { flex: 1, gap: 2 },
  title: { ...textStart, fontSize: 16, fontWeight: '700' },
  sub: { ...textStart, fontSize: 13 },
  actions: { ...flexRow, gap: spacing.xs },
  btn: { padding: spacing.xs },
  btnDisabled: { opacity: 0.35 },
  empty: { textAlign: 'center', padding: spacing.xxl, writingDirection: 'rtl' },
});
