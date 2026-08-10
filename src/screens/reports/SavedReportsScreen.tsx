import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppListItem } from '@/components/ui';
import { MadarSection, MadarSurface } from '@/components/madar';
import { AppText as Text } from '@/components/ui/AppText';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { reportsAPI } from '@/api/reports';
import { REPORT_DEFINITIONS } from '@/reports/reportDefinitions';
import type { ReportId } from '@/reports/types';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, numberText } from '@/utils/format';
import { textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type SavedReportRow = {
  id?: string | number;
  _id?: string | number;
  name?: string | null;
  type?: string | null;
  branch_name?: string | null;
  branch_id?: string | null;
  filters?: Record<string, string | number | boolean | undefined> | null;
  created_at?: string | null;
};

function normalizeType(value?: string | null): string {
  return String(value ?? '').trim().toLowerCase().replace(/_/g, '-');
}

function resolveReportId(row: SavedReportRow): ReportId | null {
  const type = normalizeType(row.type);
  if (!type) return null;
  const byId = REPORT_DEFINITIONS.find((definition) => definition.id === type);
  if (byId) return byId.id;
  const byMethod = REPORT_DEFINITIONS.find((definition) => normalizeType(definition.apiMethod) === type);
  if (byMethod) return byMethod.id;
  const byRoute = REPORT_DEFINITIONS.find((definition) => normalizeType(definition.webRoute.split('/').pop()) === type);
  return byRoute?.id ?? null;
}

export function SavedReportsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const [rows, setRows] = useState<SavedReportRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async (nextPage = page) => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsAPI.savedList({ page: nextPage, per_page: 20 });
      const data = extractData<Record<string, unknown>>(response) ?? {};
      const list = Array.isArray(data.data) ? data.data : Array.isArray(response.data) ? response.data : [];
      setRows(list as SavedReportRow[]);
      setPage(Number(data.current_page ?? nextPage) || nextPage);
      setTotalPages(Number(data.last_page ?? 1) || 1);
      setTotal(Number(data.total ?? list.length) || 0);
    } catch (err) {
      setError(normalizeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void load(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const deleteSaved = async () => {
    if (!deletingId) return;
    setBusy(true);
    setMessage(null);
    try {
      await reportsAPI.savedDelete(deletingId);
      setRows((prev) => prev.filter((row) => String(row.id ?? row._id) !== deletingId));
      setMessage('تم حذف التقرير المحفوظ.');
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setDeletingId(null);
    }
  };

  const summary = useMemo(() => `إجمالي: ${numberText(total)} • صفحة ${numberText(page)} / ${numberText(totalPages)}`, [page, total, totalPages]);

  return (
    <AppScreen title="التقارير المحفوظة" subtitle="قائمة وتشغيل وحذف مطابق لسلوك الويب" onBack={navigation.goBack} refreshing={loading} onRefresh={() => void load(1)}>
      {loading && rows.length === 0 ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={() => void load(page)} /> : null}
      {message ? <Text style={{ ...textStart, color: c.info, fontWeight: '700' }}>{message}</Text> : null}
      {!loading && !error && rows.length === 0 ? <AppEmptyState title="لا توجد تقارير محفوظة" /> : null}
      {rows.length > 0 ? (
        <MadarSection title="المحفوظة">
          <MadarSurface>
          <Text style={{ ...textStart, color: c.textMuted, marginBottom: spacing.sm }}>{summary}</Text>
          <View style={{ gap: spacing.md }}>
            {rows.map((row) => {
              const id = String(row.id ?? row._id ?? '');
              const reportId = resolveReportId(row);
              return (
                <View key={id} style={{ gap: spacing.sm }}>
                  <AppListItem
                    title={String(row.name ?? 'تقرير محفوظ')}
                    subtitle={`${row.type ?? '—'} • ${row.branch_name ?? row.branch_id ?? 'كل الفروع'} • ${dateText(row.created_at ?? undefined)}`}
                  />
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    <AppButton
                      title="تشغيل"
                      size="sm"
                      variant="secondary"
                      disabled={!reportId}
                      onPress={() => {
                        if (!reportId) {
                          setMessage('نوع هذا التقرير المحفوظ غير معروف لتطبيق الجوال. افتحه من الويب أو أعد حفظه بنوع تقرير مدعوم.');
                          return;
                        }
                        navigation.navigate('ReportViewer', {
                          reportId,
                          initialFilters: row.filters ?? undefined,
                        });
                      }}
                    />
                    <AppButton
                      title="حذف"
                      size="sm"
                      variant="danger"
                      onPress={() => setDeletingId(id)}
                      disabled={!id}
                    />
                  </View>
                </View>
              );
            })}
          </View>
          </MadarSurface>
        </MadarSection>
      ) : null}
      {rows.length > 0 ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
          <AppButton title="السابق" variant="outline" disabled={page <= 1 || loading} onPress={() => void load(page - 1)} />
          <AppButton title="التالي" variant="outline" disabled={page >= totalPages || loading} onPress={() => void load(page + 1)} />
        </View>
      ) : null}
      <ConfirmDialog
        visible={deletingId !== null}
        title="حذف تقرير محفوظ"
        message="سيتم حذف التقرير المحفوظ من الخادم. هل تريد المتابعة؟"
        confirmLabel="حذف"
        onConfirm={() => void deleteSaved()}
        onCancel={() => setDeletingId(null)}
        loading={busy}
      />
    </AppScreen>
  );
}
