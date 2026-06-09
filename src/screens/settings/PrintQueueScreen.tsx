import React, { useCallback, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppListItem, AppSectionHeader, AppBadge } from '@/components/ui';
import { getPrintJobs, retryPrintJob, cancelPrintJob, recoverStalePrintJobs } from '@/services/printing/printQueue';
import { printEngine } from '@/services/printing/printEngine';
import { getPrinterProfile } from '@/services/printing/printerProfiles';
import type { PrintJobRecord } from '@/types/printing';
import { usePrintStore } from '@/store/printStore';

const STATUS_LABEL: Record<PrintJobRecord['status'], string> = {
  pending: 'معلّق',
  printing: 'جاري الطباعة',
  printed: 'تمت الطباعة',
  failed: 'فشل',
  cancelled: 'ملغى',
};

export function PrintQueueScreen() {
  const refreshPrint = usePrintStore((s) => s.refresh);
  const [jobs, setJobs] = useState<PrintJobRecord[]>([]);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    await recoverStalePrintJobs();
    setJobs(await getPrintJobs());
    await refreshPrint();
  }, [refreshPrint]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const retry = async (job: PrintJobRecord) => {
    setBusyId(job.id);
    await retryPrintJob(job.id);
    const profile = await getPrinterProfile(job.printer_profile_id);
    if (profile) {
      const updated = (await getPrintJobs()).find((j) => j.id === job.id);
      if (updated) await printEngine.print(updated);
    }
    await load();
    setBusyId(null);
  };

  const cancel = async (id: string) => {
    await cancelPrintJob(id);
    await load();
  };

  const groups: PrintJobRecord['status'][] = ['pending', 'printing', 'failed', 'printed', 'cancelled'];

  return (
    <AppScreen title="قائمة انتظار الطباعة">
      <AppButton title="تحديث" variant="outline" onPress={load} fullWidth />
      {groups.map((status) => {
        const rows = jobs.filter((j) => j.status === status);
        if (!rows.length) return null;
        return (
          <AppCard key={status}>
            <AppSectionHeader title={STATUS_LABEL[status]} />
            {rows.map((job) => (
              <View key={job.id}>
                <AppListItem
                  title={`${job.type} · ${job.local_order_id ?? job.server_sale_id ?? '—'}`}
                  subtitle={job.error_message ?? job.created_at}
                  badge={<AppBadge label={STATUS_LABEL[job.status]} tone={job.status === 'failed' ? 'danger' : job.status === 'printed' ? 'success' : 'info'} />}
                  onPress={job.status === 'failed' ? () => void retry(job) : undefined}
                />
                {(job.status === 'pending' || job.status === 'failed' || job.status === 'printing') ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {job.status === 'failed' || job.status === 'printing' ? (
                      <AppButton
                        title="إعادة محاولة"
                        variant="outline"
                        onPress={() => void retry(job)}
                        loading={busyId === job.id}
                      />
                    ) : null}
                    <AppButton title="إلغاء" variant="ghost" onPress={() => void cancel(job.id)} loading={busyId === job.id} />
                  </View>
                ) : null}
              </View>
            ))}
          </AppCard>
        );
      })}
      {jobs.length === 0 ? (
        <AppCard>
          <AppListItem title="القائمة فارغة" subtitle="ستظهر مهام الطباعة بعد حفظ طلب أو طباعة يدوية" />
        </AppCard>
      ) : null}
    </AppScreen>
  );
}
