import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
import { numberText } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { createDashboardStyles } from './dashboardStyles';
import { DashboardSection } from './DashboardSection';

type Dining = {
  active_tables?: number;
  total_tables?: number;
};

type Props = {
  dining: Dining;
};

export function DashboardDiningPanel({ dining }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const total = Number(dining.total_tables ?? 0);
  if (!total) return null;

  const active = Number(dining.active_tables ?? 0);

  return (
    <DashboardSection title="صالة الطعام" icon="restaurant" iconTone="warning" badge={`${active}/${total}`} badgeTone="warning">
      <View style={[ds.surfaceCard, { padding: spacing.lg, gap: spacing.sm }]}>
        <View style={ds.metricStrip}>
          <View style={[ds.metricBox, { backgroundColor: c.softWarning }]}>
            <Text style={[ds.metricValue, { color: c.warning }]}>{numberText(active)}</Text>
            <Text style={ds.metricLabel}>طاولات مشغولة</Text>
          </View>
          <View style={[ds.metricBox, { backgroundColor: c.surfaceMuted }]}>
            <Text style={[ds.metricValue, { color: c.text }]}>{numberText(total)}</Text>
            <Text style={ds.metricLabel}>إجمالي الطاولات</Text>
          </View>
        </View>
      </View>
    </DashboardSection>
  );
}
