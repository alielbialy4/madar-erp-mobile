import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { purchaseReturnsAPI } from '@/api/purchases';
import { docRowMeta, docRowSubtitle, docRowTitle, ResourceListScreen } from '@/components/inventory/ResourceListScreen';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'PurchaseReturnsList'>;

export function PurchaseReturnsListScreen({ navigation }: { navigation: Nav }) {
  return (
    <ResourceListScreen
      title="مرتجعات الشراء"
      subtitle="سجل مرتجعات الموردين."
      eyebrow="المشتريات"
      loader={(params) => purchaseReturnsAPI.getAll(params)}
      onBack={navigation.goBack}
      onItemPress={(row) => navigation.navigate('PurchaseReturnDetail', { id: Number(row.id) })}
      mapRow={(row) => ({
        title: docRowTitle(row, 'مرتجع'),
        subtitle: docRowSubtitle(row),
        meta: docRowMeta(row),
        icon: 'undo',
      })}
      emptyTitle="لا توجد مرتجعات"
    />
  );
}
