import React from 'react';
import { kitchenStationsAPI } from '@/api/kitchenStations';
import { ListScreenTemplate } from '@/components/layout';
import { asText } from '@/utils/format';

export function KitchenStationsListScreen({ navigation }: { navigation: any }) {
  return (
    <ListScreenTemplate
      title="محطات المطبخ"
      subtitle="تصفية KDS وتوجيه الطباعة"
      moduleIcon="kitchen"
      loader={(p) => kitchenStationsAPI.list(p as Parameters<typeof kitchenStationsAPI.list>[0]) as never}
      onItemPress={(row) => navigation.navigate('KitchenStationForm', { id: String(row.id), name: String(row.name ?? '') })}
      itemTitle={(row) => asText(row.name, 'محطة')}
      itemSubtitle={(row) => asText(row.code, '')}
      itemBadge={(row) => ({ label: row.is_active === false ? 'معطلة' : 'نشطة', tone: row.is_active === false ? 'warning' : 'success' })}
      emptyTitle="لا محطات"
      emptyCtaLabel="محطة جديدة"
      onEmptyCta={() => navigation.navigate('KitchenStationForm', {})}
      fab={{ onPress: () => navigation.navigate('KitchenStationForm', {}), label: 'محطة جديدة' }}
    />
  );
}
