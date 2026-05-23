import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from './dashboardStyles';
import { Text } from '@/components/ui/AppText';

type Props = {
  label: string;
  dotColor?: string;
};

export function DashboardScopePill({ label, dotColor }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  return (
    <View style={ds.scopePill}>
      <View style={[ds.scopeDot, { backgroundColor: dotColor ?? c.accent }]} />
      <Text style={ds.scopePillText}>{label}</Text>
    </View>
  );
}
