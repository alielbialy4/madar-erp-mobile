import React, { useState } from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { requisitionsAPI, type RequisitionStatus } from '@/api/requisitions';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppListItem } from '@/components/ui';
import { MadarSection, MadarSurface, QuickActionBar } from '@/components/madar';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { dateText, numberText , asText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
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
  const toast = useToast();
  const [pendingStatus, setPendingStatus] = useState<RequisitionStatus | null>(null);
  const [updating, setUpdating] = useState(false);

  const applyStatus = async (status: RequisitionStatus, refresh: () => void) => {
    setPendingStatus(null);
    setUpdating(true);
    try {
      await requisitionsAPI.updateStatus(id, status);
      toast.success('تم تحديث حالة الطلب');
      refresh();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
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
            <MadarSection title="البنود">
              <MadarSurface padded={false}>
                {items.map((it, index) => (
                  <AppListItem
                    key={String(it.id ?? index)}
                    title={asText((it.product as Record<string, unknown>)?.name, 'منتج')}
                    meta={`× ${numberText(it.quantity)}`}
                  />
                ))}
              </MadarSurface>
            </MadarSection>
            {action ? (
              <QuickActionBar
                actions={[
                  {
                    id: 'next',
                    label: updating ? '...' : action.label,
                    icon: 'check-circle',
                    onPress: () => setPendingStatus(action.next),
                    tone: 'accent',
                  },
                  ...(status === 'submitted'
                    ? [{
                        id: 'reject',
                        label: 'رفض',
                        icon: 'x-circle' as const,
                        onPress: () => setPendingStatus('rejected'),
                        tone: 'danger' as const,
                      }]
                    : []),
                ]}
              />
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
