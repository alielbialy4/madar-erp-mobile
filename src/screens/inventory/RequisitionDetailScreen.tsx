import React, { useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { requisitionsAPI, type RequisitionStatus } from '@/api/requisitions';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppButton, AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { dateText, numberText , asText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'RequisitionDetail'>;
type Route = RouteProp<MoreStackParamList, 'RequisitionDetail'>;

const NEXT_STATUS: Partial<Record<RequisitionStatus, { label: string; next: RequisitionStatus }>> = {
  draft: { label: 'إرسال للموافقة', next: 'submitted' },
  submitted: { label: 'اعتماد', next: 'approved' },
  approved: { label: 'تنفيذ / توريد', next: 'fulfilled' },
};

export function RequisitionDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const id = route.params.id;
  const [pendingStatus, setPendingStatus] = useState<RequisitionStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  const applyStatus = async (status: RequisitionStatus, refresh: () => void) => {
    setPendingStatus(null);
    setUpdating(true);
    try {
      await requisitionsAPI.updateStatus(id, status);
      Alert.alert('تم', 'تم تحديث حالة الطلب');
      refresh();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <DetailScreen
      title="طلب توريد"
      onBack={navigation.goBack}
      loader={() => requisitionsAPI.get(id)}
      badge={(doc) => ({ label: asText(doc.status, '—'), tone: 'info' })}
      fields={[
        { label: 'المرجع', value: (d) => asText(d.reference_no, '—'), ltr: true },
        { label: 'التاريخ', value: (d) => dateText(String(d.created_at ?? '')) },
        { label: 'ملاحظات', value: (d) => asText(d.notes, '—') },
      ]}
    >
      {(doc, { refresh }) => {
        const items = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];
        const status = doc.status as RequisitionStatus;
        const action = NEXT_STATUS[status];
        return (
          <>
            <AppCard>
              <AppSectionHeader title="البنود" />
              {items.map((it, index) => (
                <AppListItem
                  key={String(it.id ?? index)}
                  title={asText((it.product as Record<string, unknown>)?.name, 'منتج')}
                  meta={`× ${numberText(it.quantity)}`}
                />
              ))}
            </AppCard>
            {action ? (
              <View style={{ paddingVertical: spacing.md, gap: spacing.sm }}>
                <AppButton title={action.label} loading={updating} onPress={() => setPendingStatus(action.next)} />
                {status === 'submitted' ? (
                  <AppButton
                    title="رفض"
                    variant="secondary"
                    loading={updating}
                    onPress={() => setPendingStatus('rejected')}
                  />
                ) : null}
              </View>
            ) : null}
            <ConfirmDialog
              visible={!!pendingStatus}
              title="تغيير الحالة"
              message={`الحالة الجديدة: ${pendingStatus}`}
              confirmLabel="تأكيد"
              loading={updating}
              onCancel={() => setPendingStatus(null)}
              onConfirm={() => pendingStatus && void applyStatus(pendingStatus, refresh)}
            />
          </>
        );
      }}
    </DetailScreen>
  );
}
