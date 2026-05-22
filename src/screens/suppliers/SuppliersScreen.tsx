import React from 'react';
import { suppliersAPI } from '@/api/suppliers';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { money } from '@/utils/format';

export function SuppliersScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen<Record<string, unknown>>
      title="الموردين"
      subtitle="أرصدة وسجل مشتريات"
      loader={suppliersAPI.getAll}
      onItemPress={(item) => navigation.navigate('SupplierDetail', { id: item.id, name: item.name })}
      itemTitle={(item) => String(item.name ?? 'مورد')}
      itemSubtitle={(item) => String(item.phone ?? item.email ?? '—')}
      itemMeta={(item) => `الرصيد: ${money(item.balance ?? item.current_balance ?? 0)}`}
      itemBadge={(item) => ({ label: item.active === false ? 'غير نشط' : 'نشط', tone: item.active === false ? 'warning' : 'success' })}
      emptyTitle="لا يوجد موردون"
    />
  );
}
