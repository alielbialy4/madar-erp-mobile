import React from 'react';
import { deliveryZonesAPI } from '@/api/deliveryZones';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { AppButton } from '@/components/ui';
import { asText, money } from '@/utils/format';

export function DeliveryZonesListScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen
      title="مناطق التوصيل"
      moduleIcon="delivery"
      loader={(p) => deliveryZonesAPI.getAll(p) as never}
      onItemPress={(row) => navigation.navigate('DeliveryZoneForm', { id: String(row.id) })}
      itemTitle={(row) => asText(row.name, 'منطقة')}
      itemMeta={(row) => money(row.delivery_fee ?? 0)}
      itemBadge={(row) => ({ label: row.is_active === false ? 'معطلة' : 'نشطة', tone: row.is_active === false ? 'warning' : 'success' })}
      emptyTitle="لا مناطق"
      headerRight={<AppButton title="منطقة جديدة" onPress={() => navigation.navigate('DeliveryZoneForm', {})} />}
    />
  );
}
