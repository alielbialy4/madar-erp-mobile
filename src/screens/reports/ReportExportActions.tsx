import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import { AppButton, AppText } from '@/components/ui';
import { reportsAPI } from '@/api/reports';
import type { ReportDefinition, ReportFilters } from '@/reports/types';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { normalizeApiError } from '@/utils/errors';

type Props = {
  definition: ReportDefinition;
  filters: ReportFilters;
};

const EXPORT_DISABLED_REASON =
  'تصدير الملفات من تطبيق الموبايل غير متاح على iOS/Android حالياً (يتطلب حفظ الملف ومشاركته). استخدم الويب لتصدير PDF/Excel، أو جرّب نسخة الويب من التطبيق.';

export function ReportExportActions({ definition, filters }: Props) {
  const [exporting, setExporting] = useState(false);

  if (!definition.exportSupported || !definition.exportType) {
    return null;
  }

  const buildExportFilters = (): Record<string, string | number | boolean | undefined> => {
    const params: Record<string, string | number | boolean | undefined> = {};
    if (definition.filters.includes('dateRange')) {
      params.from_date = filters.from_date;
      params.to_date = filters.to_date;
    }
    if (filters.branch_id) params.branch_id = filters.branch_id;
    if (filters.warehouse_id) params.warehouse_id = filters.warehouse_id;
    return params;
  };

  const runExport = async (format: 'pdf' | 'excel') => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') {
      Alert.alert('تصدير غير متاح', EXPORT_DISABLED_REASON);
      return;
    }
    setExporting(true);
    try {
      const blob = await reportsAPI.exportReport(definition.exportType!, format, buildExportFilters());
      const url = URL.createObjectURL(blob);
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${definition.id}-${filters.to_date}.${ext}`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      Alert.alert('فشل التصدير', normalizeApiError(err).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
      <AppText style={{ ...textStart, fontWeight: '700' }}>تصدير</AppText>
      {Platform.OS === 'web' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <AppButton title="Excel" variant="secondary" size="sm" disabled={exporting} onPress={() => void runExport('excel')} />
          <AppButton title="PDF" variant="secondary" size="sm" disabled={exporting} onPress={() => void runExport('pdf')} />
        </View>
      ) : (
        <AppText style={{ ...textStart, color: '#888', fontSize: 12 }}>{EXPORT_DISABLED_REASON}</AppText>
      )}
    </View>
  );
}

export function ReportExportButton({ supported }: { supported?: boolean }) {
  if (!supported) return null;
  return (
    <AppButton
      title="تصدير"
      variant="secondary"
      disabled
      onPress={() => Alert.alert('تصدير', EXPORT_DISABLED_REASON)}
      style={{ opacity: 0.85 }}
    />
  );
}
