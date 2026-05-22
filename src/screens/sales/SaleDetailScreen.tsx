import React, { useState } from 'react';
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

function SaleDetail({ id, route, navigation }: { id: number; route: any; navigation: any }) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refund = async () => {
    setBusy(true);
    setMessage(null);
    try {
      const response = await salesAPI.refund(id);
      setMessage(response.message || 'تم تسجيل المرتجع');
      setConfirmOpen(false);
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
          { label: 'طريقة الدفع', value: (item) => item.payment_type },
          { label: 'الحالة', value: (item) => item.status },
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
              <AppSectionHeader title="الإجراءات" />
              {message ? <Text style={{ ...textStart }}>{message}</Text> : null}
              <View style={{ gap: 12 }}>
                <AppButton title="طباعة / إعادة إرسال للطباعة" variant="secondary" onPress={() => salesAPI.print(id).catch(() => undefined)} />
                <AppButton title="استرداد جزئي" variant="secondary" onPress={() => navigation.navigate('PartialRefund', { saleId: id })} />
                <AppButton title="استرداد كامل" variant="danger" onPress={() => setConfirmOpen(true)} loading={busy} />
              </View>
            </AppCard>
          </>
        )}
      </DetailScreen>
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
