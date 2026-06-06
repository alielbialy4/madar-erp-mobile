import React from 'react';
import { driversAPI } from '@/api/drivers';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { AppButton } from '@/components/ui';
import { asText } from '@/utils/format';

export function DriversListScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen
      title="السائقون"
      moduleIcon="delivery"
      loader={(p) => driversAPI.getAll(p) as never}
      onItemPress={(row) => navigation.navigate('DriverForm', { id: String(row.id), name: String(row.name ?? '') })}
      itemTitle={(row) => asText(row.name, 'سائق')}
      itemSubtitle={(row) => asText(row.phone, '')}
      itemBadge={(row) => ({ label: String(row.status ?? '—'), tone: row.status === 'available' ? 'success' : 'default' })}
      emptyTitle="لا سائقين"
      headerRight={<AppButton title="سائق جديد" onPress={() => navigation.navigate('DriverForm', {})} />}
    />
  );
}
