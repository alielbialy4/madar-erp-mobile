import React from 'react';
import { driversAPI } from '@/api/drivers';
import { ListScreenTemplate } from '@/components/layout';
import { asText } from '@/utils/format';

export function DriversListScreen({ navigation }: { navigation: any }) {
  return (
    <ListScreenTemplate
      title="السائقون"
      moduleIcon="delivery"
      loader={(p) => driversAPI.getAll(p) as never}
      onItemPress={(row) => navigation.navigate('DriverForm', { id: String(row.id), name: String(row.name ?? '') })}
      itemTitle={(row) => asText(row.name, 'سائق')}
      itemSubtitle={(row) => asText(row.phone, '')}
      itemBadge={(row) => ({ label: String(row.status ?? '—'), tone: row.status === 'available' ? 'success' : 'default' })}
      emptyTitle="لا سائقين"
      emptyCtaLabel="سائق جديد"
      onEmptyCta={() => navigation.navigate('DriverForm', {})}
      fab={{ onPress: () => navigation.navigate('DriverForm', {}), label: 'سائق جديد' }}
    />
  );
}
