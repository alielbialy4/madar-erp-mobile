import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { textStart, flexRow } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { purchasesAPI, purchaseReturnsAPI } from '@/api/purchases';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { AppButton, AppInput, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { DocumentHeader, MadarSection, MadarSurface, MetricBlock, QuickActionBar, FinancialRow } from '@/components/madar';
import { ConfirmDialog, AppErrorState, useToast } from '@/components/feedback';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { extractArray } from '@/utils/data';
import { dateText, money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
export function PurchaseDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف الشراء مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return (
    <PurchaseDetail
      id={Number(rawId)}
      navigation={navigation}
      onBack={navigation.goBack}
      embedded={Boolean(route.params?.embedded)}
    />
  );
}

export function PurchaseDetail({
  id,
  navigation,
  onBack,
  embedded = false,
}: {
  id: number;
  navigation: any;
  onBack?: () => void;
  embedded?: boolean;
}) {
  const toast = useToast();
  const loadReturns = React.useCallback(() => purchaseReturnsAPI.getByPurchase(id), [id]);
  const returns = useAsyncResource<Record<string, unknown>[]>(loadReturns);
  const returnItems = extractArray<Record<string, unknown>>(returns.data);
  const [payOpen, setPayOpen] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payConfirm, setPayConfirm] = useState(false);

  useEffect(() => {
    let cancelled = false;
    financialAccountsAPI.paymentSources({ operation: 'purchase_payment', include_unavailable: true })
      .then((response) => {
        if (!cancelled) setPaymentSources(extractArray<PaymentSource>(response));
      })
      .catch(() => {
        if (!cancelled) setPaymentSources([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const availablePaymentSources = paymentSources.filter((source) => source.is_available !== false);
  const paymentAccountOptions = availablePaymentSources.map((source) => ({
    label: [source.name, source.provider_name, source.masked_identifier].filter(Boolean).join(' · '),
    value: String(source.id),
  }));

  useEffect(() => {
    if (!paymentAccountId && availablePaymentSources[0]?.id) {
      setPaymentAccountId(String(availablePaymentSources.find((source) => source.is_default)?.id ?? availablePaymentSources[0].id));
    }
  }, [availablePaymentSources, paymentAccountId]);

  const recordPayment = async (refresh: () => void) => {
    setPayConfirm(false);
    setPaySubmitting(true);
    try {
      const paymentSource = availablePaymentSources.find((source) => String(source.id) === paymentAccountId);
      await purchasesAPI.addPayment(id, {
        amount: Number(payAmount),
        payment_date: new Date().toISOString().slice(0, 10),
        financial_account_id: paymentAccountId || undefined,
        vault_id: paymentSource?.payment_method === 'cash' ? paymentSource.linked_vault_id ?? undefined : undefined,
      });
      toast.success('تم تسجيل الدفعة');
      setPayOpen(false);
      setPayAmount('');
      refresh();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <DetailScreen<Record<string, unknown>>
      title="تفاصيل الشراء"
      onBack={onBack}
      embedded={embedded}
      loader={() => purchasesAPI.getById(id)}
      fields={[
        { label: 'رقم الفاتورة', value: (item) => String(item.invoice_number ?? item.reference_no ?? '—'), ltr: true },
        { label: 'التاريخ', value: (item) => dateText(String(item.purchase_date ?? item.created_at ?? '')) },
        { label: 'المورد', value: (item) => String((item.supplier as { name?: string } | undefined)?.name ?? item.supplier_name ?? '—') },
        { label: 'الإجمالي', value: (item) => money(item.total ?? item.subtotal ?? 0) },
        { label: 'المدفوع', value: (item) => money(item.paid ?? 0) },
        { label: 'الحالة', value: (item) => String(item.status ?? '—') },
      ]}
    >
      {(purchase, { refresh }) => {
        const total = Number(purchase.total ?? purchase.subtotal ?? 0);
        const paid = Number(purchase.paid ?? 0);
        const remaining = Math.max(0, total - paid);
        const items = Array.isArray(purchase.items) ? purchase.items : [];

        return (
          <>
            <DocumentHeader
              title={String(purchase.invoice_number ?? purchase.reference_no ?? `شراء #${id}`)}
              subtitle={String((purchase.supplier as { name?: string } | undefined)?.name ?? purchase.supplier_name ?? 'مورد')}
              meta={dateText(String(purchase.purchase_date ?? purchase.created_at ?? ''))}
              statusLabel={String(purchase.status ?? '—')}
              amount={total}
              currency="ج.م"
            />
            <QuickActionBar
              actions={[
                { id: 'edit', label: 'تعديل', icon: 'pencil', onPress: () => navigation.navigate('EditPurchase', { id }) },
                { id: 'pay', label: 'تسجيل دفعة', icon: 'wallet', onPress: () => setPayOpen(true), tone: 'accent' },
                { id: 'return', label: 'مرتجع', icon: 'arrow-u-up-left', onPress: () => navigation.navigate('CreatePurchaseReturn', { purchaseId: id }) },
              ]}
            />

            <MadarSection title="الملخص المالي">
              <View style={styles.metricRow}>
                <MetricBlock label="المدفوع" value={money(paid)} level="C" tone="positive" style={styles.metric} />
                <MetricBlock
                  label="المتبقي"
                  value={money(remaining)}
                  level="C"
                  tone={remaining > 0.01 ? 'negative' : 'neutral'}
                  style={styles.metric}
                />
              </View>
            </MadarSection>

            <MadarSection title="الأصناف">
              <MadarSurface padded={false}>
                {items.length === 0 ? (
                  <Text style={{ ...textStart, padding: spacing.md }}>لا توجد أصناف</Text>
                ) : (
                  items.map((item: Record<string, unknown>, index: number) => (
                    <FinancialRow
                      key={String(item.id ?? index)}
                      primary={String((item.product as { name?: string } | undefined)?.name ?? item.product_name ?? 'صنف')}
                      secondary={`الكمية: ${numberText(item.quantity)}`}
                      amount={Number(item.cost_price ?? item.unit_price ?? 0)}
                      currency="ج.م"
                      showDivider={index < items.length - 1}
                    />
                  ))
                )}
              </MadarSurface>
            </MadarSection>

            <MadarSection title="مرتجعات الشراء">
              <MadarSurface padded={false}>
                {returnItems.length === 0 ? (
                  <Text style={{ ...textStart, padding: spacing.md }}>لا توجد مرتجعات</Text>
                ) : (
                  returnItems.map((item, index) => (
                    <AppListItem
                      key={String(item.id ?? index)}
                      title={String(item.reference_no ?? item.id)}
                      subtitle={dateText(String(item.created_at ?? ''))}
                      meta={money(item.total ?? 0)}
                    />
                  ))
                )}
              </MadarSurface>
              <AppButton title="كل المرتجعات" variant="ghost" size="sm" onPress={() => navigation.navigate('PurchaseReturnsList')} />
            </MadarSection>

            <AppBottomSheet visible={payOpen} onClose={() => setPayOpen(false)}>
              <View style={{ gap: spacing.md }}>
                <AppSectionHeader title="دفعة على الفاتورة" />
                <AppInput label="المبلغ" keyboardType="numeric" value={payAmount} onChangeText={setPayAmount} />
                <AppSelect label="حساب الدفع" value={paymentAccountId} options={paymentAccountOptions} onChange={setPaymentAccountId} />
                <AppButton title="تسجيل" disabled={!payAmount || !paymentAccountId} onPress={() => setPayConfirm(true)} />
              </View>
            </AppBottomSheet>
            <ConfirmDialog
              visible={payConfirm}
              title="تأكيد الدفعة"
              message={money(Number(payAmount) || 0)}
              confirmLabel="تسجيل"
              loading={paySubmitting}
              onCancel={() => setPayConfirm(false)}
              onConfirm={() => void recordPayment(refresh)}
            />
          </>
        );
      }}
    </DetailScreen>
  );
}

const styles = StyleSheet.create({
  metricRow: {
    ...flexRow,
    gap: spacing.sm,
  },
  metric: {
    flex: 1,
  },
});
