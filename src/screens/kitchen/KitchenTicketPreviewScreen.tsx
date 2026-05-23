import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { kitchenAPI } from '@/api/kitchen';
import { getEnabledProfilesByRole } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { getPrintJobs } from '@/services/printing/printQueue';
import type { KitchenTicketPayload } from '@/types/printing';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, numberText } from '@/utils/format';
import { textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type TicketPayload = {
  store?: { name?: string | null; kitchen_ticket_font_size?: number | null };
  order?: {
    id?: number;
    invoice_number?: string | null;
    print_sequence?: number | null;
    order_type?: string | null;
    created_at?: string | null;
    cashier_name?: string | null;
    kitchen_notes?: string | null;
    dining_table?: { name?: string | null; number?: string | null } | null;
    items?: {
      id?: number;
      quantity?: number;
      notes?: string | null;
      product?: { name?: string | null } | null;
      options?: { group_title?: string; options?: { name?: string | null }[] }[];
    }[];
  };
};

function toPrintPayload(ticket: TicketPayload): KitchenTicketPayload {
  const order = ticket.order ?? {};
  const tableName = order.dining_table?.name ?? order.dining_table?.number ?? null;
  return {
    order_label: String(order.invoice_number ?? order.id ?? 'Kitchen'),
    table_name: tableName,
    is_reprint: true,
    ticket_type: 'kitchen',
    items: (order.items ?? []).map((item) => ({
      name: item.product?.name ?? 'صنف',
      quantity: Number(item.quantity ?? 1),
      notes: item.notes ?? undefined,
      modifiers: item.options?.flatMap((group) => group.options?.map((option) => option.name ?? '') ?? []) ?? [],
    })),
  };
}

export function KitchenTicketPreviewScreen({ route, navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const id = Number(route.params?.id);
  const [ticket, setTicket] = useState<TicketPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!id || Number.isNaN(id)) {
      setError('رقم تذكرة غير صالح.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await kitchenAPI.getTicket(id);
      const data = extractData<TicketPayload>(response as never) ?? (response.data as TicketPayload | undefined) ?? null;
      setTicket(data);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const printPayload = useMemo(() => (ticket ? toPrintPayload(ticket) : null), [ticket]);

  const printTicket = async () => {
    if (!printPayload) return;
    setPrinting(true);
    setMessage(null);
    try {
      const profiles = await getEnabledProfilesByRole('kitchen');
      if (!profiles.length) {
        setMessage('لا يوجد ملف طابعة مطبخ مفعّل. أضف ملف طابعة من الإعدادات ثم أعد المحاولة.');
        return;
      }
      const job = await printEngine.printKitchenTicket(printPayload, profiles[0]);
      const updated = (await getPrintJobs()).find((row) => row.id === job.id);
      if (updated?.status === 'failed') {
        setMessage(updated.error_message || 'تمت إضافة أمر الطباعة إلى الطابور لكنه فشل على الجهاز.');
      } else if (updated?.status === 'printed') {
        setMessage('تمت طباعة تذكرة المطبخ.');
      } else {
        setMessage('تمت إضافة التذكرة إلى طابور الطباعة. راجع قائمة انتظار الطباعة لمتابعة الحالة.');
      }
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setPrinting(false);
    }
  };

  const order = ticket?.order;

  return (
    <AppScreen
      title="معاينة تذكرة المطبخ"
      subtitle={order?.invoice_number ? `فاتورة ${order.invoice_number}` : undefined}
      onBack={navigation.goBack}
      refreshing={loading}
      onRefresh={load}
    >
      {loading && !ticket ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error && !ticket ? <AppEmptyState title="تعذر تحميل التذكرة" /> : null}
      {ticket && order ? (
        <View style={{ gap: spacing.md }}>
          <AppCard>
            <AppSectionHeader title={ticket.store?.name ?? 'تذكرة مطبخ'} />
            <AppListItem title="الفاتورة" subtitle={String(order.invoice_number ?? order.id ?? '—')} />
            <AppListItem title="تسلسل الطباعة" subtitle={String(order.print_sequence ?? '—')} />
            <AppListItem title="نوع الطلب" subtitle={String(order.order_type ?? '—')} />
            <AppListItem title="الطاولة" subtitle={String(order.dining_table?.name ?? order.dining_table?.number ?? '—')} />
            <AppListItem title="الوقت" subtitle={dateText(order.created_at ?? undefined)} />
          </AppCard>
          <AppCard>
            <AppSectionHeader title="الأصناف" />
            {(order.items ?? []).map((item, index) => (
              <AppListItem
                key={String(item.id ?? index)}
                title={item.product?.name ?? 'صنف'}
                subtitle={`× ${numberText(item.quantity ?? 1)}${item.notes ? ` • ${item.notes}` : ''}`}
                meta={item.options?.flatMap((group) => group.options?.map((option) => option.name).filter(Boolean) ?? []).join(', ')}
              />
            ))}
          </AppCard>
          {order.kitchen_notes ? (
            <AppCard>
              <Text style={{ ...textStart, color: c.text }}>{order.kitchen_notes}</Text>
            </AppCard>
          ) : null}
          {message ? <Text style={{ ...textStart, color: c.info, fontWeight: '700' }}>{message}</Text> : null}
          <View style={{ gap: spacing.sm }}>
            <AppButton title="طباعة / إعادة طباعة" onPress={() => void printTicket()} loading={printing} />
            <AppButton title="قائمة انتظار الطباعة" variant="secondary" onPress={() => navigation.navigate('PrintQueue')} />
            <AppButton title="ملفات طابعات المطبخ" variant="outline" onPress={() => navigation.navigate('PrinterProfiles')} />
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}
