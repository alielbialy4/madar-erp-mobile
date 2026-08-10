import React, { useState } from 'react';
import { Alert, Platform, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { AppButton } from '@/components/ui';
import { reportsAPI } from '@/api/reports';
import type { ReportDefinition, ReportFilters } from '@/reports/types';
import { spacing } from '@/constants/spacing';
import { normalizeApiError } from '@/utils/errors';

type Props = {
  definition: ReportDefinition;
  filters: ReportFilters;
};

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = String(reader.result ?? '');
      const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

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
    setExporting(true);
    try {
      const blob = await reportsAPI.exportReport(definition.exportType!, format, buildExportFilters());
      const ext = format === 'pdf' ? 'pdf' : 'xlsx';
      const filename = `report-${definition.id}-${filters.to_date}.${ext}`;

      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
        return;
      }

      const base64 = await blobToBase64(blob);
      const dir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
      if (!dir) {
        Alert.alert('تصدير', 'تعذر الوصول إلى مجلد الملفات على الجهاز.');
        return;
      }
      const path = `${dir}${filename}`;
      await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
      const canShare = await Sharing.isAvailableAsync();
      if (!canShare) {
        Alert.alert('تم الحفظ', `تم حفظ الملف في:\n${path}`);
        return;
      }
      await Sharing.shareAsync(path, {
        mimeType: format === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: definition.title,
        UTI: format === 'pdf' ? 'com.adobe.pdf' : 'org.openxmlformats.spreadsheetml.sheet',
      });
    } catch (err) {
      Alert.alert('فشل التصدير', normalizeApiError(err).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={{ flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' }}>
      <AppButton title="Excel" variant="outline" size="sm" disabled={exporting} onPress={() => void runExport('excel')} />
      <AppButton title="PDF" variant="outline" size="sm" disabled={exporting} onPress={() => void runExport('pdf')} />
    </View>
  );
}

export function ReportExportButton({ supported }: { supported?: boolean }) {
  if (!supported) return null;
  return <AppButton title="تصدير" variant="secondary" disabled style={{ opacity: 0.85 }} />;
}
