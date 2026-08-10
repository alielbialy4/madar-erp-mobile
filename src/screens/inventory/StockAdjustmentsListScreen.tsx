import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { stockAdjustmentsAPI } from '@/api/stockAdjustments';
import { docRowMeta, docRowSubtitle, docRowTitle, ResourceListScreen } from '@/components/inventory/ResourceListScreen';
import type { MoreStackParamList } from '@/types/navigation';
import { inventoryStatusLabel } from '@/utils/inventoryLabels';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockAdjustmentsList'>;

export function StockAdjustmentsListScreen({ navigation }: { navigation: Nav }) {
  return (
    <ResourceListScreen
      title="تسويات المخزون"
      subtitle="سجل التسويات — إنشاء تسوية جديدة من الزر أدناه."
      surface="adjustments"
      loader={(params) => stockAdjustmentsAPI.list(params)}
      onBack={navigation.goBack}
      headerAction={{ label: 'تسوية جديدة', onPress: () => navigation.navigate('StockAdjustment') }}
      onItemPress={(row) => navigation.navigate('StockAdjustmentDetail', { id: String(row.id) })}
      mapRow={(row) => ({
        title: docRowTitle(row, 'تسوية'),
        subtitle: docRowSubtitle(row),
        meta: docRowMeta(row),
        badgeLabel: inventoryStatusLabel(row.status_label_ar ?? row.status),
        badgeTone: row.status === 'posted' ? 'success' : 'warning',
        icon: 'edit',
      })}
      emptyTitle="لا توجد تسويات"
    />
  );
}
