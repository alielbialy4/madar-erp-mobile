import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { purchasesAPI, purchaseReturnsAPI } from '@/api/purchases';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { AppButton, AppCard, AppInput, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { ConfirmDialog, AppErrorState } from '@/components/feedback';
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
  return <PurchaseDetail id={Number(rawId)} navigation={navigation} />;
}

function PurchaseDetail({ id, navigation }: { id: number; navigation: any }) {
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
      Alert.alert('تم', 'تم تسجيل الدفعة');
      setPayOpen(false);
      setPayAmount('');
      refresh();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setPaySubmitting(false);
    }
  };

  return (
    <DetailScreen<Record<string, unknown>>
      title="تفاصيل الشراء"
      onBack={navigation.goBack}
      loader={() => purchasesAPI.getById(id)}
      fields={[
        { label: 'رقم الفاتورة', value: (item) => String(item.invoice_number ?? item.reference_no ?? '—'), ltr: true },
        { label: 'التاريخ', value: (item) => dateText(String(item.purchase_date ?? item.created_at ?? '')) },
        { label: 'المورد', value: (item) => String((item.supplier as any)?.name ?? item.supplier_name ?? '—') },
        { label: 'الإجمالي', value: (item) => money(item.total ?? item.subtotal ?? 0) },
        { label: 'المدفوع', value: (item) => money(item.paid ?? 0) },
        { label: 'الحالة', value: (item) => String(item.status ?? '—') },
      ]}
    >
      {(purchase, { refresh }) => (
        <>
          <View style={{ gap: spacing.sm }}>
            <AppButton title="تعديل الفاتورة" variant="secondary" onPress={() => navigation.navigate('EditPurchase', { id })} />
            <AppButton title="تسجيل دفعة" variant="outline" onPress={() => setPayOpen(true)} />
          </View>
          <AppCard>
            <AppSectionHeader title="الأصناف" />
            {Array.isArray(purchase.items) && purchase.items.length > 0 ? purchase.items.map((item: any, index) => (
              <AppListItem key={String(item.id ?? index)} title={String(item.product?.name ?? item.product_name ?? 'صنف')} subtitle={`الكمية: ${numberText(item.quantity)}`} meta={money(item.cost_price ?? item.unit_price ?? 0)} />
            )) : <Text style={{ ...textStart }}>لا توجد أصناف</Text>}
          </AppCard>
          <AppCard>
            <AppSectionHeader title="مرتجعات الشراء" />
            {returnItems.length === 0 ? <Text style={{ ...textStart }}>لا توجد مرتجعات</Text> : returnItems.map((item, index) => (
              <AppListItem key={String(item.id ?? index)} title={String(item.reference_no ?? item.id)} subtitle={dateText(String(item.created_at ?? ''))} meta={money(item.total ?? 0)} />
            ))}
            <AppButton title="إنشاء مرتجع شراء" variant="secondary" onPress={() => navigation.navigate('CreatePurchaseReturn', { purchaseId: id })} />
            <AppButton title="كل المرتجعات" variant="ghost" onPress={() => navigation.navigate('PurchaseReturnsList')} />
          </AppCard>
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
      )}
    </DetailScreen>
  );
}
