import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { kitchenPrintJobsAPI } from '@/api/kitchenPrintJobs';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppBadge, AppButton, AppListItem, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import { asText, dateText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import type { ApiEnvelope, ListParams } from '@/types/api';

export function KitchenPrintJobsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const [status, setStatus] = useState('');
  const [retryId, setRetryId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const params = useMemo(() => ({ per_page: 50, ...(status ? { status } : {}) }), [status]);

  const loader = useCallback(
    (p: ListParams) => kitchenPrintJobsAPI.list(p as Parameters<typeof kitchenPrintJobsAPI.list>[0]) as Promise<ApiEnvelope<Record<string, unknown>[]>>,
    [],
  );

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource(loader, params);

  const retryJob = async () => {
    if (!retryId) return;
    setBusy(true);
    try {
      await kitchenPrintJobsAPI.retry(retryId);
      setMessage('تمت إعادة المحاولة');
      await refresh();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setRetryId(null);
    }
  };

  return (
    <AppScreen title="طابور طباعة المطبخ" onBack={navigation.goBack} scroll={false}>
      <View style={{ padding: spacing.lg, gap: spacing.sm }}>
        <AppSelect
          label="الحالة"
          value={status || null}
          onChange={(v) => setStatus(v ?? '')}
          options={[
            { label: 'الكل', value: '' },
            { label: 'معلق', value: 'pending' },
            { label: 'فشل', value: 'failed' },
            { label: 'مطبوع', value: 'printed' },
          ]}
        />
        <AppButton title="إعادة محاولة الكل الفاشلة" variant="secondary" onPress={() => void kitchenPrintJobsAPI.retryFailedBulk().then(() => refresh())} />
        <Text style={{ fontSize: 12, color: c.textMuted }}>
          مسار تذكرة الويب /kitchen/ticket/:id للمعاينة في المتصفح. الطباعة المحلية عبر ملفات الطابعة في الإعدادات.
        </Text>
        {message ? <Text style={{ color: c.info }}>{message}</Text> : null}
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا مهام طباعة"
        keyExtractor={(row, i) => String(row.id ?? i)}
        renderItem={({ item }) => (
          <AppListItem
            title={asText(item.printer_name, 'طابعة')}
            subtitle={`${asText((item.kitchen_station as Record<string, unknown>)?.name, 'عام')} • ${dateText(asText(item.created_at, ''))}${item.sale_id ? ' • اضغط لمعاينة التذكرة' : ''}`}
            meta={asText(item.last_error, '')}
            badge={
              <AppBadge
                label={String(item.status ?? 'pending')}
                tone={item.status === 'failed' ? 'danger' : item.status === 'printed' ? 'success' : 'warning'}
              />
            }
            onPress={
              item.sale_id
                ? () => navigation.navigate('KitchenTicketPreview', { id: Number(item.sale_id) })
                : item.status === 'failed'
                  ? () => setRetryId(String(item.id))
                  : undefined
            }
          />
        )}
      />
      <ConfirmDialog
        visible={retryId !== null}
        title="إعادة محاولة الطباعة"
        message="إعادة إرسال مهمة الطباعة الفاشلة؟"
        confirmLabel="إعادة"
        onConfirm={() => void retryJob()}
        onCancel={() => setRetryId(null)}
        loading={busy}
      />
    </AppScreen>
  );
}
