import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { stockTransfersAPI } from '@/api/stockTransfers';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { dateText, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';
import { asText } from '@/utils/format';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockTransferDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockTransferDetail'>;

export function StockTransferDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const id = route.params.id;
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [completing, setCompleting] = useState(false);

  return (
    <DetailScreen
      title="تفاصيل التحويل"
      onBack={navigation.goBack}
      loader={() => stockTransfersAPI.get(id)}
      badge={(item) => ({
        label: asText(item.status_label_ar ?? item.status, '—'),
        tone: item.status === 'completed' ? 'success' : 'info',
      })}
      fields={[
        { label: 'من', value: (i) => asText(i.from_warehouse_name) },
        { label: 'إلى', value: (i) => asText(i.to_warehouse_name) },
        { label: 'المرجع', value: (i) => asText(i.reference_no, '—'), ltr: true },
        { label: 'التاريخ', value: (i) => dateText(String(i.created_at ?? '')) },
      ]}
    >
      {(doc, { refresh }) => {
        const items = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];
        const canComplete = doc.status !== 'completed' && doc.status !== 'cancelled';
        return (
          <>
            <AppCard>
              <AppSectionHeader title="الأصناف" />
              {items.map((item, index) => (
                <AppListItem
                  key={String(item.id ?? index)}
                  title={asText((item.product as Record<string, unknown>)?.name ?? item.product_name, 'صنف')}
                  subtitle={
                    (item.batch as Record<string, unknown> | undefined)?.batch_number
                      ? `دفعة: ${String((item.batch as Record<string, unknown>).batch_number)}`
                      : undefined
                  }
                  meta={`× ${numberText(item.quantity)}`}
                />
              ))}
            </AppCard>
            {canComplete ? (
              <View style={{ paddingVertical: spacing.md }}>
                <AppButton title="إكمال التحويل" onPress={() => setConfirmComplete(true)} />
              </View>
            ) : null}
            <ConfirmDialog
              visible={confirmComplete}
              title="إكمال التحويل"
              message="سيتم خصم الكميات من المخزن المصدر وإضافتها للمخزن الوجهة."
              confirmLabel="إكمال"
              loading={completing}
              onCancel={() => setConfirmComplete(false)}
              onConfirm={() => {
                setConfirmComplete(false);
                setCompleting(true);
                void stockTransfersAPI
                  .complete(id)
                  .then(() => {
                    Alert.alert('تم', 'تم إكمال التحويل');
                    refresh();
                  })
                  .catch((err) => Alert.alert('خطأ', normalizeApiError(err).message))
                  .finally(() => setCompleting(false));
              }}
            />
          </>
        );
      }}
    </DetailScreen>
  );
}
