import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { stockCountsAPI } from '@/api/stockCounts';
import { docRowMeta, docRowSubtitle, docRowTitle, ResourceListScreen } from '@/components/inventory/ResourceListScreen';
import type { MoreStackParamList } from '@/types/navigation';
import { inventoryStatusLabel } from '@/utils/inventoryLabels';
import { useInventoryScope } from '@/hooks/useInventoryScope';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockCountsList'>;

export function StockCountsListScreen({ navigation }: { navigation: Nav }) {
  const { canOperateDocuments } = useInventoryScope();
  return (
    <ResourceListScreen
      title="جرد المخزون"
      subtitle="جلسات الجرد — إنشاء جلسة ثم إدخال الكميات وترحيلها."
      surface="stockCounts"
      loader={(params) => stockCountsAPI.list(params)}
      onBack={navigation.goBack}
      headerAction={canOperateDocuments ? { label: 'جرد جديد', onPress: () => navigation.navigate('StockCountCreate') } : undefined}
      onItemPress={(row) => navigation.navigate('StockCountDetail', { id: String(row.id) })}
      mapRow={(row) => ({
        title: docRowTitle(row, 'جرد'),
        subtitle: docRowSubtitle(row),
        meta: docRowMeta(row),
        badgeLabel: inventoryStatusLabel(row.status_label_ar ?? row.status),
        badgeTone: row.status === 'posted' ? 'success' : row.status === 'draft' ? 'warning' : 'default',
        icon: 'fact-check',
      })}
      emptyTitle="لا توجد جلسات جرد"
    />
  );
}
