import React from 'react';
import { StyleSheet, View } from 'react-native';
import { MadarSection, MetricBlock } from '@/components/madar';
import { numberText } from '@/utils/format';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Dining = {
  active_tables?: number;
  total_tables?: number;
};

type Props = {
  dining: Dining;
};

export function DashboardDiningPanel({ dining }: Props) {
  const total = Number(dining.total_tables ?? 0);
  if (!total) return null;

  const active = Number(dining.active_tables ?? 0);
  const pressure = total > 0 && active / total >= 0.85;

  return (
    <MadarSection title="صالة الطعام">
      <View style={styles.row}>
        <MetricBlock
          label="طاولات مشغولة"
          value={numberText(active)}
          hint={`من ${numberText(total)}`}
          level="C"
          tone={pressure ? 'warning' : 'neutral'}
          style={styles.cell}
        />
        <MetricBlock
          label="إجمالي الطاولات"
          value={numberText(total)}
          level="C"
          style={styles.cell}
        />
      </View>
    </MadarSection>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    gap: spacing.md,
  },
  cell: {
    flex: 1,
  },
});
