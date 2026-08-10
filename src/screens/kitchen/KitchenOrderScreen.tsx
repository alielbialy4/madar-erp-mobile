import React, { useState } from 'react';
import { kitchenAPI } from '@/api/kitchen';
import { AppListItem } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { MadarSection, MadarSurface, QuickActionBar } from '@/components/madar';
import { ConfirmDialog } from '@/components/feedback';
import { AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { KitchenOrder } from '@/types/api';
import { dateText, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { textStart } from '@/constants/layout';

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
            <MadarSection title="الأصناف">
              <MadarSurface padded={false}>
                {(order.items ?? []).map((item: Record<string, unknown>, index: number) => (
                  <AppListItem
                    key={String(item.id ?? index)}
                    title={String((item.product as Record<string, unknown>)?.name ?? 'صنف')}
                    subtitle={`الكمية: ${numberText(item.quantity)}`}
                    meta={String(item.kitchen_status ?? '')}
                    onPress={() => setPendingItem({ itemId: Number(item.id), status: 'ready' })}
                  />
                ))}
              </MadarSurface>
            </MadarSection>
            <MadarSection title="حالة الطلب">
              <MadarSurface>
                {message ? <Text style={{ ...textStart, marginBottom: 8 }}>{message}</Text> : null}
                <QuickActionBar
                  actions={[
                    { id: 'ticket', label: 'تذكرة', icon: 'print', onPress: () => navigation.navigate('KitchenTicketPreview', { id }) },
                    { id: 'preparing', label: 'قيد التحضير', icon: 'timer', onPress: () => setPendingStatus('preparing') },
                    { id: 'ready', label: 'جاهز', icon: 'check-circle', onPress: () => setPendingStatus('ready'), tone: 'accent' },
                    { id: 'served', label: 'تم التقديم', icon: 'restaurant', onPress: () => setPendingStatus('served') },
                  ]}
                />
              </MadarSurface>
            </MadarSection>
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
