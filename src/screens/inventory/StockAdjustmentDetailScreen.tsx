import React, { useState } from 'react';
import { View } from 'react-native';import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { stockAdjustmentsAPI } from '@/api/stockAdjustments';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppListItem } from '@/components/ui';
import { MadarSection, MadarSurface, QuickActionBar } from '@/components/madar';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { dateText, money, numberText , asText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockAdjustmentDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockAdjustmentDetail'>;

export function StockAdjustmentDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const id = route.params.id;
  const toast = useToast();
  const [confirmPost, setConfirmPost] = useState(false);
  const [posting, setPosting] = useState(false);

  return (
    <>
      <DetailScreen
        title="تفاصيل التسوية"
        onBack={navigation.goBack}
        loader={() => stockAdjustmentsAPI.get(id)}
        badge={(item) => ({
          label: asText(item.status_label_ar ?? item.status, '—'),
          tone: item.status === 'posted' ? 'success' : 'warning',
        })}
        fields={[
          { label: 'المستودع', value: (i) => asText(i.warehouse_name) },
          { label: 'النوع', value: (i) => asText(i.type_label_ar ?? i.type) },
          { label: 'السبب', value: (i) => asText(i.reason_label_ar ?? i.reason) },
          { label: 'التاريخ', value: (i) => dateText(String(i.created_at ?? '')) },
        ]}
      >
        {(doc, { refresh }) => {
          const items = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];
          const canPost = doc.status !== 'posted';
          return (
            <>
              <MadarSection title="الأصناف">
                <MadarSurface padded={false}>
                  {items.map((item, index) => (
                    <AppListItem
                      key={String(item.id ?? index)}
                      title={asText((item.product as Record<string, unknown>)?.name ?? item.product_name, 'صنف')}
                      subtitle={`كمية: ${numberText(item.quantity)}`}
                      meta={money(item.unit_cost ?? 0)}
                    />
                  ))}
                </MadarSurface>
              </MadarSection>
              {canPost ? (
                <QuickActionBar
                  actions={[{ id: 'post', label: 'ترحيل التسوية', icon: 'check-circle', onPress: () => setConfirmPost(true), tone: 'accent' }]}
                />
              ) : null}
              <ConfirmDialog
                visible={confirmPost}
                title="ترحيل التسوية"
                message="سيتم تطبيق التسوية على المخزون. هل تريد المتابعة؟"
                confirmLabel="ترحيل"
                loading={posting}
                onCancel={() => setConfirmPost(false)}
                onConfirm={() => {
                  setConfirmPost(false);
                  setPosting(true);
                  void stockAdjustmentsAPI
                    .post(id)
                    .then(() => {
                      toast.success('تم ترحيل التسوية');
                      refresh();
                    })
                    .catch((err) => toast.error(normalizeApiError(err).message))
                    .finally(() => setPosting(false));
                }}
              />
            </>
          );
        }}
      </DetailScreen>
    </>
  );
}
