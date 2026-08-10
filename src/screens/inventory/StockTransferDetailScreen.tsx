import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { stockTransfersAPI } from '@/api/stockTransfers';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { dateText, numberText , asText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockTransferDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockTransferDetail'>;

type ConfirmAction = 'complete' | 'reject' | 'in_transit' | 'delete' | null;

export function StockTransferDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const id = route.params.id;
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [acting, setActing] = useState(false);

  const runAction = async (action: ConfirmAction, refresh: () => void) => {
    if (!action) return;
    setConfirmAction(null);
    setActing(true);
    try {
      if (action === 'complete') {
        await stockTransfersAPI.complete(id);
        Alert.alert('تم', 'تم إكمال التحويل');
      } else if (action === 'reject') {
        await stockTransfersAPI.updateStatus(id, 'rejected');
        Alert.alert('تم', 'تم رفض التحويل');
      } else if (action === 'in_transit') {
        await stockTransfersAPI.updateStatus(id, 'in_transit');
        Alert.alert('تم', 'تم تحديث الحالة إلى قيد النقل');
      } else if (action === 'delete') {
        await stockTransfersAPI.destroy(id);
        Alert.alert('تم', 'تم حذف التحويل');
        navigation.goBack();
        return;
      }
      refresh();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setActing(false);
    }
  };

  const confirmCopy: Record<Exclude<ConfirmAction, null>, { title: string; message: string; label: string }> = {
    complete: {
      title: 'إكمال التحويل',
      message: 'سيتم خصم الكميات من المخزن المصدر وإضافتها للمخزن الوجهة.',
      label: 'إكمال',
    },
    reject: {
      title: 'رفض التحويل',
      message: 'سيتم رفض التحويل ولن تُنفَّذ حركات المخزون.',
      label: 'رفض',
    },
    in_transit: {
      title: 'قيد النقل',
      message: 'تأكيد أن البضاعة في الطريق بين المخازن.',
      label: 'تأكيد',
    },
    delete: {
      title: 'حذف التحويل',
      message: 'حذف مسودة التحويل نهائياً.',
      label: 'حذف',
    },
  };

  return (
    <DetailScreen
      title="تفاصيل التحويل"
      onBack={navigation.goBack}
      loader={() => stockTransfersAPI.get(id)}
      badge={(item) => ({
        label: asText(item.status_label_ar ?? item.status, '—'),
        tone: item.status === 'completed' ? 'success' : item.status === 'rejected' ? 'danger' : 'info',
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
        const status = String(doc.status ?? '');
        const canComplete = status !== 'completed' && status !== 'cancelled' && status !== 'rejected';
        const canReject = canComplete && status !== 'in_transit';
        const canInTransit = canComplete && status === 'pending';
        const canDelete = status === 'draft' || status === 'pending';

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
            <View style={{ gap: spacing.sm, paddingVertical: spacing.md }}>
              {canInTransit ? (
                <AppButton title="قيد النقل" variant="secondary" onPress={() => setConfirmAction('in_transit')} />
              ) : null}
              {canComplete ? (
                <AppButton title="إكمال التحويل" onPress={() => setConfirmAction('complete')} />
              ) : null}
              {canReject ? (
                <AppButton title="رفض التحويل" variant="outline" onPress={() => setConfirmAction('reject')} />
              ) : null}
              {canDelete ? (
                <AppButton title="حذف التحويل" variant="outline" onPress={() => setConfirmAction('delete')} />
              ) : null}
            </View>
            {confirmAction ? (
              <ConfirmDialog
                visible
                title={confirmCopy[confirmAction].title}
                message={confirmCopy[confirmAction].message}
                confirmLabel={confirmCopy[confirmAction].label}
                loading={acting}
                onCancel={() => setConfirmAction(null)}
                onConfirm={() => void runAction(confirmAction, refresh)}
              />
            ) : null}
          </>
        );
      }}
    </DetailScreen>
  );
}
