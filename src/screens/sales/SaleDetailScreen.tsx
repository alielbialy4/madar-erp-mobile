import React, { useEffect, useRef, useState } from 'react';
import { BillSplitSheet } from './BillSplitSheet';
import { textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { salesAPI } from '@/api/sales';
import { AppListItem } from '@/components/ui';
import { DocumentHeader, MadarSection, MadarSurface, FinancialRow, QuickActionBar } from '@/components/madar';
import { ConfirmDialog, AppErrorState } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { Sale } from '@/types/api';
import { dateText, money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { decideRefundClientUuidLifecycle } from '@/utils/refundClientUuidLifecycle';
import { extractData } from '@/utils/data';
import { saleTimelineEvents } from '@/utils/saleTimeline';
import { paymentTypeLabel } from '@/utils/paymentLabels';
import { saleStatusBadgeTone, saleStatusLabel } from '@/utils/saleStatus';
import { printSaleReceiptLocal } from '@/services/pos/posReceiptPrint';
import { useBranchStore } from '@/store/branchStore';
import { createUuid } from '@/utils/uuid';

export function SaleDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف البيع مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return (
    <SaleDetail
      id={Number(rawId)}
      invoice={route.params?.invoice}
      navigation={navigation}
      onBack={navigation.goBack}
      embedded={Boolean(route.params?.embedded)}
    />
  );
}

function canSplitSale(sale: Sale & Record<string, unknown>): boolean {
  const status = String(sale.status ?? '').toLowerCase();
  if (status === 'completed' || status === 'refunded' || status === 'cancelled') return false;
  return Boolean(sale.dining_table_id) || status === 'pending' || status === 'open';
}

export function SaleDetail({
  id,
  invoice,
  navigation,
  onBack,
  embedded = false,
}: {
  id: number;
  invoice?: string;
  navigation: any;
  onBack?: () => void;
  embedded?: boolean;
}) {
  const refundClientUuidRef = useRef<string | null>(null);
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
      if (!refundClientUuidRef.current) refundClientUuidRef.current = createUuid();
      const response = await salesAPI.refund(id, { client_uuid: refundClientUuidRef.current });
      setMessage(response.message || 'تم تسجيل المرتجع');
      refundClientUuidRef.current = null;
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
      const normalized = normalizeApiError(err);
      const decision = decideRefundClientUuidLifecycle({
        status: normalized.status,
        code: normalized.code,
      });
      if (decision.action === 'clear') {
        refundClientUuidRef.current = null;
      }
      setMessage(normalized.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DetailScreen<Sale & Record<string, unknown>>
        title={invoice || 'تفاصيل البيع'}
        onBack={onBack}
        embedded={embedded}
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
            <DocumentHeader
              title={String(sale.invoice_number || invoice || `فاتورة #${id}`)}
              subtitle={`${sale.customer?.name ?? 'عميل نقدي'} · ${paymentTypeLabel(sale.payment_type)}`}
              meta={dateText(sale.created_at)}
              statusLabel={saleStatusLabel(sale.status)}
              statusTone={saleStatusBadgeTone(sale.status)}
              amount={sale.total ?? 0}
              currency="ج.م"
            />
            <QuickActionBar
              actions={[
                { id: 'print', label: 'طباعة', icon: 'printer', onPress: () => void printReceipt() },
                ...(canSplitSale(sale)
                  ? [{ id: 'split', label: 'تقسيم', icon: 'rows', onPress: () => setSplitOpen(true) }]
                  : []),
                ...(sale.status === 'completed' || sale.status === 'partially_refunded'
                  ? [
                      { id: 'partial', label: 'استرداد جزئي', icon: 'arrow-u-up-left', onPress: () => navigation.navigate('PartialRefund', { saleId: id }) },
                      { id: 'full', label: 'استرداد كامل', icon: 'arrow-counter-clockwise', onPress: () => setConfirmOpen(true), tone: 'danger' as const },
                    ]
                  : []),
              ]}
            />
            {message ? <Text style={{ ...textStart }}>{message}</Text> : null}

            <MadarSection title="الأصناف">
              <MadarSurface padded={false}>
                {(sale.items ?? []).length === 0 ? (
                  <Text style={{ ...textStart, padding: 16 }}>لا توجد أصناف</Text>
                ) : (
                  sale.items?.map((item, index) => (
                    <FinancialRow
                      key={String(item.id ?? index)}
                      primary={String((item.product as any)?.name ?? item.product_name ?? 'صنف')}
                      secondary={`الكمية: ${numberText(item.quantity)} · السعر: ${money(item.unit_price)}`}
                      amount={Number(item.subtotal ?? Number(item.quantity ?? 0) * Number(item.unit_price ?? 0))}
                      currency="ج.م"
                      showDivider={index < (sale.items?.length ?? 0) - 1}
                    />
                  ))
                )}
              </MadarSurface>
            </MadarSection>

            <MadarSection title="الملخص المالي">
              <MadarSurface>
                <FinancialRow primary="المدفوع" amount={sale.paid ?? 0} currency="ج.م" amountTone="positive" showDivider />
                <FinancialRow
                  primary="المتبقي"
                  amount={Math.max(0, Number(sale.total ?? 0) - Number(sale.paid ?? 0))}
                  currency="ج.م"
                  amountTone={Number(sale.total ?? 0) - Number(sale.paid ?? 0) > 0.01 ? 'negative' : 'muted'}
                  showDivider={false}
                />
              </MadarSurface>
            </MadarSection>

            <MadarSection title="توزيع المدفوعات">
              <MadarSurface padded={false}>
                {(sale.payment_lines ?? []).length === 0 ? (
                  <Text style={{ ...textStart, padding: 16 }}>لا توجد تفاصيل حسابات مالية في استجابة البيع.</Text>
                ) : (
                  sale.payment_lines?.map((line, index) => (
                    <FinancialRow
                      key={String(line.id ?? line.client_line_id ?? index)}
                      primary={line.account_name || paymentTypeLabel(line.payment_method) || 'حساب الدفع'}
                      secondary={[line.provider_name, line.masked_identifier, line.reference].filter(Boolean).join(' · ') || undefined}
                      meta={dateText(line.payment_date)}
                      amount={line.amount}
                      currency="ج.م"
                      showDivider={index < (sale.payment_lines?.length ?? 0) - 1}
                    />
                  ))
                )}
              </MadarSurface>
            </MadarSection>

            <MadarSection title="سجل البيع والاسترداد">
              <MadarSurface padded={false}>
                {timelineError ? <Text style={{ ...textStart, padding: 16 }}>{timelineError}</Text> : null}
                {!timelineError && timeline.length === 0 ? (
                  <Text style={{ ...textStart, padding: 16 }}>لا توجد أحداث مسجلة.</Text>
                ) : null}
                {timeline.map((event, index) => (
                  <AppListItem
                    key={String(event.id ?? index)}
                    title={String(event.title ?? event.event_type ?? event.type ?? 'حدث بيع')}
                    subtitle={String(event.description ?? event.message ?? event.reason ?? '')}
                    meta={dateText(String(event.created_at ?? event.occurred_at ?? ''))}
                  />
                ))}
              </MadarSurface>
            </MadarSection>
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
