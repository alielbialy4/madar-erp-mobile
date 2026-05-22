import React, { useState } from 'react';
import { textStart } from '@/constants/layout';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { kitchenAPI } from '@/api/kitchen';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppErrorState } from '@/components/feedback';
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
        <AppErrorState message="معرّف الطلب مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <KitchenOrderInner id={Number(rawId)} navigation={navigation} />;
}

function KitchenOrderInner({ id, navigation }: { id: number; navigation: any }) {
  const [message, setMessage] = useState<string | null>(null);

  const update = async (status: string) => {
    setMessage(null);
    try {
      const response = await kitchenAPI.updateStatus(id, status);
      setMessage(response.message || 'تم تحديث الحالة');
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    }
  };

  return (
    <DetailScreen<KitchenOrder & Record<string, unknown>>
      title={`طلب مطبخ ${id}`}
      onBack={navigation.goBack}
      loader={() => kitchenAPI.getOrder(id)}
      fields={[
        { label: 'الفاتورة', value: (item) => item.invoice_number, ltr: true },
        { label: 'الحالة', value: (item) => item.kitchen_status ?? item.status },
        { label: 'نوع الطلب', value: (item) => item.order_type },
        { label: 'وقت الإنشاء', value: (item) => dateText(item.created_at) },
        { label: 'الطاولة', value: (item) => item.dining_table?.name ?? item.dining_table?.number },
      ]}
    >
      {(order) => (
        <>
          <AppCard>
            <AppSectionHeader title="الأصناف" />
            {(order.items ?? []).map((item: any, index) => (
              <AppListItem key={String(item.id ?? index)} title={String(item.product?.name ?? 'صنف')} subtitle={`الكمية: ${numberText(item.quantity)}`} meta={String(item.kitchen_status ?? '')} />
            ))}
          </AppCard>
          <AppCard>
            <AppSectionHeader title="تحديث الحالة" />
            {message ? <Text style={{ ...textStart }}>{message}</Text> : null}
            <View style={{ gap: 12 }}>
              <AppButton title="قيد التحضير" variant="secondary" onPress={() => update('preparing')} />
              <AppButton title="جاهز" onPress={() => update('ready')} />
              <AppButton title="تم التقديم" variant="secondary" onPress={() => update('served')} />
            </View>
          </AppCard>
        </>
      )}
    </DetailScreen>
  );
}
