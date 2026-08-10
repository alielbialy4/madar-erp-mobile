import React, { useEffect, useState } from 'react';
import { BillSplitSheet } from './BillSplitSheet';
import { textStart } from '@/constants/layout';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { salesAPI } from '@/api/sales';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog, AppErrorState } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { Sale } from '@/types/api';
import { dateText, money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { extractData } from '@/utils/data';
import { saleTimelineEvents } from '@/utils/saleTimeline';
import { paymentTypeLabel } from '@/utils/paymentLabels';
import { saleStatusLabel } from '@/utils/saleStatus';
import { printSaleReceiptLocal } from '@/services/pos/posReceiptPrint';
import { useBranchStore } from '@/store/branchStore';

export function SaleDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف البيع مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <SaleDetail id={Number(rawId)} route={route} navigation={navigation} />;
}

function canSplitSale(sale: Sale & Record<string, unknown>): boolean {
  const status = String(sale.status ?? '').toLowerCase();
  if (status === 'completed' || status === 'refunded' || status === 'cancelled') return false;
  return Boolean(sale.dining_table_id) || status === 'pending' || status === 'open';
}

function SaleDetail({ id, route, navigation }: { id: number; route: any; navigation: any }) {
  const branchId = useBranchStore((s) => s.activeBranch?.id);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [timeline, setTimeline] = useState<Record<string, unknown>[]>([]);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void salesAPI.timeline(id)
      .then((response) => {
        if (mounted) setTimeline(saleTimelineEvents(extractData(response)));
      })
      .catch((err) => { if (mounted) setTimelineError(normalizeApiError(err).message); });
    return () => { mounted = false; };
  }, [id]);

  const printReceipt = async () => {
    if (!branchId) {
      setMessage('يجب اختيار فرع قبل الطباعة');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      const result = await printSaleReceiptLocal(id, branchId, { isReprint: true });
      setMessage(result.ok ? result.message : result.message);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const refund = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await salesAPI.refund(id);
      setMessage(response.message || 'تم تسجيل المرتجع');
      setConfirmOpen(false);
      if (branchId) {
        const refundId = Number((response as any)?.refund?.id ?? (response as any)?.data?.refund?.id ?? 0) || undefined;
        const printResult = await printSaleReceiptLocal(id, branchId, {
          isReprint: true,
          documentTitle: 'مستند مرتجع',
          asRefund: true,
          mode: 'return',
          refundId,
        });
        if (printResult.ok) {
          setMessage(`${response.message || 'تم تسجيل المرتجع'} — ${printResult.message}`);
        }
      }
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DetailScreen<Sale & Record<string, unknown>>
        title={route.params?.invoice || 'تفاصيل البيع'}
        onBack={navigation.goBack}
        loader={() => salesAPI.getById(id)}
        fields={[
          { label: 'رقم الفاتورة', value: (item) => item.invoice_number, ltr: true },
          { label: 'التاريخ', value: (item) => dateText(item.created_at) },
          { label: 'العميل', value: (item) => item.customer?.name ?? 'عميل نقدي' },
          { label: 'طريقة الدفع', value: (item) => paymentTypeLabel(item.payment_type) },
          { label: 'الحالة', value: (item) => saleStatusLabel(item.status) },
          { label: 'الإجمالي', value: (item) => money(item.total ?? 0) },
          { label: 'المدفوع', value: (item) => money(item.paid ?? 0) },
        ]}
      >
        {(sale) => (
          <>
            <AppCard>
              <AppSectionHeader title="الأصناف" />
              {(sale.items ?? []).length === 0 ? <Text style={{ ...textStart }}>لا توجد أصناف</Text> : sale.items?.map((item, index) => (
                <AppListItem
                  key={String(item.id ?? index)}
                  title={String((item.product as any)?.name ?? item.product_name ?? 'صنف')}
                  subtitle={`الكمية: ${numberText(item.quantity)} • السعر: ${money(item.unit_price)}`}
                  meta={money(item.subtotal ?? Number(item.quantity ?? 0) * Number(item.unit_price ?? 0))}
                />
              ))}
            </AppCard>
            <AppCard>
              <AppSectionHeader title="توزيع المدفوعات" />
              {(sale.payment_lines ?? []).length === 0 ? (
                <Text style={{ ...textStart }}>لا توجد تفاصيل حسابات مالية في استجابة البيع.</Text>
              ) : sale.payment_lines?.map((line, index) => (
                <AppListItem
                  key={String(line.id ?? line.client_line_id ?? index)}
                  title={money(line.amount)}
                  subtitle={[line.payment_method ? paymentTypeLabel(line.payment_method) : null, line.account_name, line.provider_name, line.masked_identifier].filter(Boolean).join(' · ') || 'حساب الدفع غير متاح'}
                  meta={[line.reference, dateText(line.payment_date)].filter(Boolean).join(' · ')}
                />
              ))}
            </AppCard>
            <AppCard>
              <AppSectionHeader title="سجل البيع والاسترداد" />
              {timelineError ? <Text style={{ ...textStart }}>{timelineError}</Text> : null}
              {!timelineError && timeline.length === 0 ? <Text style={{ ...textStart }}>لا توجد أحداث مسجلة.</Text> : null}
              {timeline.map((event, index) => (
                <AppListItem
                  key={String(event.id ?? index)}
                  title={String(event.title ?? event.event_type ?? event.type ?? 'حدث بيع')}
                  subtitle={String(event.description ?? event.message ?? event.reason ?? '')}
                  meta={dateText(String(event.created_at ?? event.occurred_at ?? ''))}
                />
              ))}
            </AppCard>
            <AppCard>
              <AppSectionHeader title="الإجراءات" />
              {message ? <Text style={{ ...textStart }}>{message}</Text> : null}
              <View style={{ gap: 12 }}>
                <AppButton title="طباعة / إعادة طباعة" variant="secondary" loading={busy} onPress={printReceipt} />
                {canSplitSale(sale) ? (
                  <AppButton title="تقسيم الفاتورة" variant="secondary" onPress={() => setSplitOpen(true)} />
                ) : null}
                {sale.status === 'completed' || sale.status === 'partially_refunded' ? (
                  <>
                    <AppButton title="استرداد جزئي" variant="secondary" onPress={() => navigation.navigate('PartialRefund', { saleId: id })} />
                    <AppButton title="استرداد كامل للمتبقي" variant="danger" onPress={() => setConfirmOpen(true)} loading={busy} />
                  </>
                ) : null}
              </View>
            </AppCard>
          </>
        )}
      </DetailScreen>
      <BillSplitSheet
        visible={splitOpen}
        saleId={id}
        onClose={() => setSplitOpen(false)}
        onSuccess={(msg) => setMessage(msg)}
      />
      <ConfirmDialog
        visible={confirmOpen}
        title="تأكيد الاسترداد"
        message="سيتم إرسال طلب استرداد كامل للخادم. لا يمكن اعتبار العملية ناجحة إلا بعد قبول الخادم."
        confirmLabel="تنفيذ الاسترداد"
        onConfirm={refund}
        onCancel={() => setConfirmOpen(false)}
        loading={busy}
      />
    </>
  );
}
