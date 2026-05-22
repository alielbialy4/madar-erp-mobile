import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { AppBadge, AppCard, AppSectionHeader, AppText } from '@/components/ui';
import type { ReportRowField, ReportRowSection } from '@/reports/types';
import { formatRowField, pickRowTitle, REPORT_FALLBACK } from '@/utils/reportNormalizers';
import { money, numberText, dateText, asText } from '@/utils/format';
import { textStart, textLtr, flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

const formatters = {
  money,
  number: numberText,
  date: dateText,
  text: asText,
};

type Props = {
  section: ReportRowSection;
  rows: Record<string, unknown>[];
};

function ReportRowCard({ row, fields, titleKey, metaKey }: { row: Record<string, unknown>; fields: ReportRowField[]; titleKey?: string; metaKey?: string }) {
  const c = useColors();
  const primary = fields.find((f) => f.primary) ?? fields[0];
  const title = titleKey
    ? pickRowTitle(row, [titleKey], REPORT_FALLBACK.unspecified)
    : primary
      ? formatRowField(row, primary, formatters)
      : REPORT_FALLBACK.unspecified;
  const meta = metaKey ? formatRowField(row, { key: metaKey, format: 'money' }, formatters) : undefined;
  const secondary = fields.filter((f) => f !== primary);

  return (
    <AppCard style={{ gap: spacing.sm, flex: 1, minWidth: 280 }}>
      <View style={{ ...flexRow, justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.md }}>
        <AppText style={{ flex: 1, fontWeight: '700', ...textStart }}>{title}</AppText>
        {meta ? <AppText style={{ fontWeight: '800', ...textLtr }}>{meta}</AppText> : null}
      </View>
      {secondary.map((field) => {
        const value = formatRowField(row, field, formatters);
        if (field.format === 'badge') {
          return (
            <View key={field.key} style={{ ...flexRow, justifyContent: 'space-between' }}>
              <AppText style={{ color: c.textMuted, ...textStart }}>{field.label}</AppText>
              <AppBadge label={value} tone="info" />
            </View>
          );
        }
        return (
          <View key={field.key} style={{ ...flexRow, justifyContent: 'space-between', gap: spacing.sm }}>
            <AppText style={{ color: c.textMuted, ...textStart }}>{field.label}</AppText>
            <AppText style={field.format === 'money' || field.format === 'number' ? textLtr : textStart}>{value}</AppText>
          </View>
        );
      })}
    </AppCard>
  );
}

export function ReportListCards({ section, rows }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const useGrid = isTablet && rows.length > 2;

  if (!rows.length) return null;

  return (
    <View style={{ gap: spacing.md }}>
      <AppSectionHeader title={section.title} />
      <View style={useGrid ? { ...flexRow, flexWrap: 'wrap', gap: spacing.md } : { gap: spacing.md }}>
        {rows.map((row, index) => (
          <ReportRowCard
            key={`${section.id}-${String(row.id ?? row.product_id ?? index)}`}
            row={row}
            fields={section.fields}
            titleKey={section.titleKey}
            metaKey={section.metaKey}
          />
        ))}
      </View>
    </View>
  );
}
