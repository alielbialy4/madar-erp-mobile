import React from 'react';
import { kitchenStationsAPI } from '@/api/kitchenStations';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { AppButton } from '@/components/ui';
import { asText } from '@/utils/format';

export function KitchenStationsListScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen
      title="محطات المطبخ"
      subtitle="تصفية KDS وتوجيه الطباعة"
      loader={(p) => kitchenStationsAPI.list(p as Parameters<typeof kitchenStationsAPI.list>[0]) as never}
      onItemPress={(row) => navigation.navigate('KitchenStationForm', { id: String(row.id), name: String(row.name ?? '') })}
      itemTitle={(row) => asText(row.name, 'محطة')}
      itemSubtitle={(row) => asText(row.code, '')}
      itemBadge={(row) => ({ label: row.is_active === false ? 'معطلة' : 'نشطة', tone: row.is_active === false ? 'warning' : 'success' })}
      emptyTitle="لا محطات"
      headerRight={<AppButton title="محطة جديدة" onPress={() => navigation.navigate('KitchenStationForm', {})} />}
    />
  );
}
