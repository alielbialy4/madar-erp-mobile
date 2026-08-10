import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { purchaseReturnsAPI } from '@/api/purchases';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { dateText, money, numberText , asText } from '@/utils/format';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'PurchaseReturnDetail'>;
type Route = RouteProp<MoreStackParamList, 'PurchaseReturnDetail'>;

export function PurchaseReturnDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const id = route.params.id;
  return (
    <DetailScreen
      title="مرتجع شراء"
      onBack={navigation.goBack}
      loader={() => purchaseReturnsAPI.getById(id)}
      fields={[
        { label: 'المرجع', value: (i) => asText(i.reference_no ?? i.id, '—'), ltr: true },
        { label: 'التاريخ', value: (i) => dateText(String(i.created_at ?? '')) },
        { label: 'الإجمالي', value: (i) => money(i.total ?? 0) },
        { label: 'السبب', value: (i) => asText(i.reason, '—') },
      ]}
    >
      {(doc) => {
        const items = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];
        return (
          <AppCard>
            <AppSectionHeader title="الأصناف" />
            {items.map((it, index) => (
              <AppListItem
                key={String(it.id ?? index)}
                title={asText((it.product as Record<string, unknown>)?.name, 'صنف')}
                meta={`× ${numberText(it.quantity)}`}
              />
            ))}
          </AppCard>
        );
      }}
    </DetailScreen>
  );
}
