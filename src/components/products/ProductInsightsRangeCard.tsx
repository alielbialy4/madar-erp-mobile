import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppDatePicker } from '@/components/ui/AppDatePicker';
import { AppChip } from '@/components/ui';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import {
  RANGE_PRESETS,
  detectActivePreset,
  formatShortDate,
  parseIsoDate,
  rangeDaysBadge,
} from './productInsightsUtils';
import { Text } from '@/components/ui/AppText';

type Range = { from: string; to: string };

type Props = {
  range: Range;
  appliedRange?: Range | null;
  onRangeChange: (key: 'from' | 'to', value: string) => void;
  onPresetSelect: (days: number) => void;
};

export function ProductInsightsRangeCard({ range, appliedRange, onRangeChange, onPresetSelect }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const styles = useMemo(() => createStyles(c), [c]);

  const fromDate = useMemo(() => parseIsoDate(range.from), [range.from]);
  const toDate = useMemo(() => parseIsoDate(range.to), [range.to]);
  const activePreset = useMemo(() => detectActivePreset(range.from, range.to), [range.from, range.to]);
  const daysBadge = rangeDaysBadge(range.from, range.to);

  const appliedLabel = appliedRange
    ? `${formatShortDate(appliedRange.from)} → ${formatShortDate(appliedRange.to)}`
    : null;

  return (
    <DashboardSection title="الفترة" icon="calendar" iconTone="info" badge={daysBadge} badgeTone="neutral">
      <View style={styles.body}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetsRow}>
          {RANGE_PRESETS.map((preset) => (
            <AppChip
              key={preset.days}
              label={preset.label}
              active={activePreset === preset.days}
              onPress={() => onPresetSelect(preset.days)}
            />
          ))}
        </ScrollView>

        <View style={[styles.dateRow, isTablet && styles.dateRowTablet]}>
          <View style={styles.dateField}>
            <AppDatePicker
              label="من تاريخ"
              value={range.from}
              onChange={(from) => onRangeChange('from', from)}
              maximumDate={toDate}
            />
          </View>
          <View style={styles.dateField}>
            <AppDatePicker
              label="إلى تاريخ"
              value={range.to}
              onChange={(to) => onRangeChange('to', to)}
              minimumDate={fromDate}
            />
          </View>
        </View>

        {appliedLabel ? <Text style={styles.applied}>{appliedLabel}</Text> : null}
      </View>
    </DashboardSection>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    body: { gap: spacing.md },
    presetsRow: {
      ...flexRow,
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dateRow: { gap: spacing.md },
    dateRowTablet: {
      ...flexRow,
      alignItems: 'flex-start',
    },
    dateField: {
      flex: 1,
      minWidth: 0,
    },
    applied: {
      ...textStart,
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
  });
}
