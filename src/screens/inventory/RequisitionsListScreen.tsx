import React from 'react';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { requisitionsAPI } from '@/api/requisitions';
import { docRowMeta, docRowSubtitle, docRowTitle, ResourceListScreen } from '@/components/inventory/ResourceListScreen';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'RequisitionsList'>;

export function RequisitionsListScreen({ navigation }: { navigation: Nav }) {
  return (
    <ResourceListScreen
      title="طلبات الشراء الداخلية"
      subtitle="طلبات التوريد بين الفروع."
      surface="requisitions"
      searchEnabled={false}
      loader={(params) => requisitionsAPI.list(params)}
      onBack={navigation.goBack}
      headerAction={{ label: 'طلب جديد', onPress: () => navigation.navigate('RequisitionCreate') }}
      onItemPress={(row) => navigation.navigate('RequisitionDetail', { id: String(row.id) })}
      mapRow={(row) => ({
        title: docRowTitle(row, 'طلب'),
        subtitle: docRowSubtitle(row),
        meta: docRowMeta(row),
        badgeLabel: String(row.status ?? ''),
        icon: 'assignment',
      })}
      emptyTitle="لا توجد طلبات"
    />
  );
}
