import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { ComponentProps } from 'react';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

type Row = { key: string; label: string; value: string };

type Props = {
  title: string;
  icon: IconName;
  rows: Row[];
  emptyMessage?: string;
};

export function ProductInsightBlock({ title, icon, rows, emptyMessage }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.block}>
      <View style={styles.blockHeader}>
        <MaterialIcons name={icon} size={20} color={c.accent} />
        <Text style={styles.blockTitle}>{title}</Text>
      </View>
      {rows.length === 0 ? (
        <Text style={styles.empty}>{emptyMessage ?? 'لا توجد بيانات'}</Text>
      ) : (
        rows.map((r) => (
          <View key={r.key} style={styles.row}>
            <Text style={styles.rowLabel} numberOfLines={1}>
              {r.label}
            </Text>
            <Text style={styles.rowValue} numberOfLines={2}>
              {r.value}
            </Text>
          </View>
        ))
      )}
    </View>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    block: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.sm,
    },
    blockHeader: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    blockTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
    },
    row: {
      ...flexRow,
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.md,
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    rowLabel: {
      flex: 1,
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    rowValue: {
      flex: 1,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      color: c.text,
      ...textStart,
    },
    empty: { ...textStart, fontSize: typography.small, color: c.textMuted },
  });
}
