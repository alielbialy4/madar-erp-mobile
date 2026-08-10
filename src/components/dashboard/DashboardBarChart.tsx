import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { flexRow, textStart, appWritingDirection } from '@/constants/layout';
import { Text } from '@/components/ui/AppText';
import { money } from '@/utils/format';
import { DashboardSection } from './DashboardSection';

type BarItem = { label: string; value: number };

type Props = {
  title: string;
  hint?: string;
  data: BarItem[];
  icon?: string;
  iconTone?: 'accent' | 'success' | 'info' | 'warning' | 'danger' | 'neutral';
};

export function DashboardBarChart({ title, hint, data, icon = 'chart-bar', iconTone = 'accent' }: Props) {
  const c = useColors();
  if (!data.length) return null;
  const max = Math.max(...data.map((item) => Math.abs(item.value)), 1);

  return (
    <DashboardSection title={title} hint={hint} icon={icon} iconTone={iconTone}>
      <View style={[styles.surface, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}> 
        {data.map((item, index) => (
          <View key={`${item.label}-${index}`} style={[styles.row, index < data.length - 1 && { borderBottomColor: c.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth }]}> 
            <View style={styles.copy}>
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: c.text }]} numberOfLines={1}>{item.label}</Text>
                <Text style={[styles.value, { color: c.text }]} numberOfLines={1}>{money(item.value)}</Text>
              </View>
              <View style={[styles.track, { backgroundColor: c.surfaceMuted }]}> 
                <View style={[styles.fill, { width: `${Math.max(item.value !== 0 ? 3 : 0, (Math.abs(item.value) / max) * 100)}%`, backgroundColor: item.value < 0 ? c.danger : c.primary }]} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  surface: { borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  row: { ...flexRow, minHeight: 58, alignItems: 'center', padding: spacing.md },
  copy: { flex: 1, minWidth: 0, gap: spacing.xs },
  labelRow: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  label: { ...textStart, flex: 1, fontFamily: fonts.bold, fontSize: typography.small },
  value: { fontFamily: fonts.extraBold, fontSize: typography.caption, writingDirection: appWritingDirection },
  track: { height: 5, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: radius.pill },
});
