import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { createDashboardStyles, KPI_TONE_STYLES, type KpiTone } from './dashboardStyles';

type Props = {
  label: string;
  value: string;
  hint?: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  tone?: KpiTone;
  wide?: boolean;
};

export function DashboardKpiCard({ label, value, hint, icon, tone = 'accent', wide }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const toneStyle = KPI_TONE_STYLES[tone];
  const bg = c[toneStyle.bg as keyof AppColors] as string;
  const border = c[toneStyle.border as keyof AppColors] as string;
  const iconColor = c[toneStyle.icon as keyof AppColors] as string;

  return (
    <View style={[ds.kpiCell, wide ? ds.kpiCellWide : undefined]}>
      <View style={[ds.kpiCard, { backgroundColor: c.surface, borderColor: border }]}>
        <View style={ds.kpiTop}>
          <View style={[ds.kpiIconWrap, { backgroundColor: bg }]}>
            <MaterialIcons name={icon} size={22} color={iconColor} />
          </View>
        </View>
        <Text style={ds.kpiLabel}>{label}</Text>
        <Text style={ds.kpiValue} numberOfLines={1}>
          {value}
        </Text>
        {hint ? <Text style={ds.kpiHint}>{hint}</Text> : null}
      </View>
    </View>
  );
}
