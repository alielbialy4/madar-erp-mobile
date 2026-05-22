import React, { useState } from 'react';
import { textStart } from '@/constants/layout';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { kitchenAPI } from '@/api/kitchen';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { KitchenOrder } from '@/types/api';
import { dateText, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

export function KitchenOrderScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <Text>معرّف الطلب مفقود</Text>
      </AppScreen>
    );
  }
  return <KitchenOrderInner id={Number(rawId)} navigation={navigation} />;
}

function KitchenOrderInner({ id, navigation }: { id: number; navigation: any }) {
  const [message, setMessage] = useState<string | null>(null);
  const [pendingStatus, setPendingStatus] = useState<string | null>(null);
  const [pendingItem, setPendingItem] = useState<{ itemId: number; status: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const updateOrder = async (status: string) => {
    setBusy(true);
    try {
      const response = await kitchenAPI.updateStatus(id, status);
      setMessage(response.message || 'تم تحديث الحالة');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setPendingStatus(null);
    }
  };

  const updateItem = async (itemId: number, status: string) => {
    setBusy(true);
    try {
      await kitchenAPI.updateItemStatus(id, itemId, status);
      setMessage('تم تحديث صنف');
      setRefreshKey((k) => k + 1);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setPendingItem(null);
    }
  };

  return (
    <>
      <DetailScreen<KitchenOrder & Record<string, unknown>>
        key={refreshKey}
        title={`طلب مطبخ ${id}`}
        onBack={navigation.goBack}
        loader={() => kitchenAPI.getOrder(id)}
        fields={[
          { label: 'الفاتورة', value: (item) => item.invoice_number, ltr: true },
          { label: 'الحالة', value: (item) => item.kitchen_status ?? item.status },
          { label: 'نوع الطلب', value: (item) => item.order_type },
          { label: 'وقت الإنشاء', value: (item) => dateText(item.created_at) },
          {
            label: 'الطاولة',
            value: (item) => {
              const t = item.dining_table as Record<string, unknown> | undefined;
              return t?.name != null ? String(t.name) : t?.number != null ? String(t.number) : undefined;
            },
          },
        ]}
      >
        {(order) => (
          <>
            <AppCard>
              <AppSectionHeader title="الأصناف" />
              {(order.items ?? []).map((item: Record<string, unknown>, index: number) => (
                <AppListItem
                  key={String(item.id ?? index)}
                  title={String((item.product as Record<string, unknown>)?.name ?? 'صنف')}
                  subtitle={`الكمية: ${numberText(item.quantity)}`}
                  meta={String(item.kitchen_status ?? '')}
                  onPress={() => setPendingItem({ itemId: Number(item.id), status: 'ready' })}
                />
              ))}
            </AppCard>
            <AppCard>
              <AppSectionHeader title="حالة الطلب" />
              {message ? <Text style={{ ...textStart, marginBottom: 8 }}>{message}</Text> : null}
              <View style={{ gap: 12 }}>
                <AppButton title="قيد التحضير" variant="secondary" onPress={() => setPendingStatus('preparing')} />
                <AppButton title="جاهز" onPress={() => setPendingStatus('ready')} />
                <AppButton title="تم التقديم" variant="secondary" onPress={() => setPendingStatus('served')} />
              </View>
            </AppCard>
          </>
        )}
      </DetailScreen>
      <ConfirmDialog
        visible={pendingStatus !== null}
        title="تأكيد تحديث الحالة"
        message={`تغيير حالة الطلب إلى «${pendingStatus}»؟`}
        confirmLabel="تأكيد"
        onConfirm={() => pendingStatus && void updateOrder(pendingStatus)}
        onCancel={() => setPendingStatus(null)}
        loading={busy}
      />
      <ConfirmDialog
        visible={pendingItem !== null}
        title="تحديث صنف"
        message="تعيين الصنف كـ «جاهز»؟"
        confirmLabel="جاهز"
        onConfirm={() => pendingItem && void updateItem(pendingItem.itemId, pendingItem.status)}
        onCancel={() => setPendingItem(null)}
        loading={busy}
      />
    </>
  );
}
