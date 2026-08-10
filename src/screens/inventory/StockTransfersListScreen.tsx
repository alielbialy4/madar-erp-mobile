import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { stockTransfersAPI } from '@/api/stockTransfers';
import { docRowMeta, docRowTitle, ResourceListScreen } from '@/components/inventory/ResourceListScreen';
import type { MoreStackParamList } from '@/types/navigation';
import { asText } from '@/utils/format';
import { inventoryStatusLabel } from '@/utils/inventoryLabels';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockTransfersList'>;

export function StockTransfersListScreen({ navigation }: { navigation: Nav }) {
  return (
    <ResourceListScreen
      title="تحويلات المخزون"
      subtitle="سجل التحويلات بين المخازن."
      surface="transfers"
      loader={(params) => stockTransfersAPI.list(params)}
      onBack={navigation.goBack}
      headerAction={{ label: 'تحويل جديد', onPress: () => navigation.navigate('StockTransfer') }}
      onItemPress={(row) => navigation.navigate('StockTransferDetail', { id: String(row.id) })}
      mapRow={(row) => ({
        title: docRowTitle(row, 'تحويل'),
        subtitle: `${asText(row.from_warehouse_name, 'من')} → ${asText(row.to_warehouse_name, 'إلى')}`,
        meta: docRowMeta(row),
        badgeLabel: inventoryStatusLabel(row.status_label_ar ?? row.status),
        badgeTone: row.status === 'completed' ? 'success' : 'info',
        icon: 'swap-horiz',
      })}
      emptyTitle="لا توجد تحويلات"
    />
  );
}
