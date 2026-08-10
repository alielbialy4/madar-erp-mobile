import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppBadge, AppSectionHeader, AppText } from '@/components/ui';
import type { ReportRowField, ReportRowSection } from '@/reports/types';
import { formatRowField, pickRowTitle, REPORT_FALLBACK } from '@/utils/reportNormalizers';
import { money, numberText, dateText, asText } from '@/utils/format';
import { textStart, textLtr, flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import type { AppColors } from '@/constants/colors';

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

function ReportDataRow({ row, fields, titleKey, metaKey, tablet }: { row: Record<string, unknown>; fields: ReportRowField[]; titleKey?: string; metaKey?: string; tablet: boolean }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, tablet), [c, tablet]);
  const primary = fields.find((f) => f.primary) ?? fields[0];
  const title = titleKey
    ? pickRowTitle(row, [titleKey], REPORT_FALLBACK.unspecified)
    : primary
      ? formatRowField(row, primary, formatters)
      : REPORT_FALLBACK.unspecified;
  const meta = metaKey ? formatRowField(row, { key: metaKey, format: 'money' }, formatters) : undefined;
  const secondary = fields.filter((f) => f !== primary);

  return (
    <View style={styles.row} accessibilityLabel={`${title}${meta ? `، ${meta}` : ''}`}>
      <View style={styles.identity}>
        <AppText style={styles.title} numberOfLines={2}>{title}</AppText>
        {meta ? <AppText style={styles.meta} numberOfLines={1}>{meta}</AppText> : null}
      </View>
      <View style={styles.fieldGrid}>
        {secondary.map((field) => {
          const value = formatRowField(row, field, formatters);
          if (field.format === 'badge') {
            return (
              <View key={field.key} style={styles.field}>
                <AppText style={styles.label}>{field.label}</AppText>
                <AppBadge label={value} tone="info" />
              </View>
            );
          }
          return (
            <View key={field.key} style={styles.field}>
              <AppText style={styles.label} numberOfLines={1}>{field.label}</AppText>
              <AppText
                style={[styles.value, field.format === 'money' || field.format === 'number' ? textLtr : textStart]}
                numberOfLines={2}
              >
                {value}
              </AppText>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export function ReportListCards({ section, rows }: Props) {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const c = useColors();
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);

  if (!rows.length) return null;

  return (
    <View style={styles.section}>
      <AppSectionHeader title={section.title} />
      <View style={styles.table}>
        {rows.map((row, index) => (
          <ReportDataRow
            key={`${section.id}-${String(row.id ?? row.product_id ?? index)}`}
            row={row}
            fields={section.fields}
            titleKey={section.titleKey}
            metaKey={section.metaKey}
            tablet={isTablet}
          />
        ))}
      </View>
    </View>
  );
}

function createStyles(c: AppColors, tablet: boolean) {
  return StyleSheet.create({
    section: { gap: spacing.sm },
    table: {
      overflow: 'hidden',
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    row: {
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    identity: { ...flexRow, alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.md },
    title: { ...textStart, flex: 1, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
    meta: { ...textLtr, color: c.text, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.body },
    fieldGrid: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
    field: {
      minWidth: tablet ? '30%' : '47%',
      flex: 1,
      gap: 2,
      paddingTop: spacing.xs,
    },
    label: { ...textStart, color: c.textCaption, fontFamily: fonts.medium, fontSize: typography.micro },
    value: { color: c.textMuted, fontFamily: fonts.medium, fontSize: typography.small },
  });
}
