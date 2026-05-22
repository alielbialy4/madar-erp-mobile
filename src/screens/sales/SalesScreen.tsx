import React from 'react';
import { salesAPI } from '@/api/sales';
import { CrudListScreen, statusTone } from '@/screens/shared/CrudListScreen';
import { Sale } from '@/types/api';
import { dateText, money } from '@/utils/format';

export function SalesScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen<Sale & Record<string, unknown>>
      title="المبيعات"
      subtitle="الفواتير والطلبات"
      loader={salesAPI.getAll}
      searchParam="search"
      onItemPress={(item) => navigation.navigate('SaleDetail', { id: item.id, invoice: item.invoice_number })}
      itemTitle={(item) => item.invoice_number || `فاتورة ${item.id}`}
      itemSubtitle={(item) => `${dateText(item.created_at)} • ${item.customer?.name ?? 'عميل نقدي'}`}
      itemMeta={(item) => `${money(item.total ?? 0)} • ${item.payment_type ?? '—'}`}
      itemBadge={(item) => ({ label: item.status ?? '—', tone: statusTone(item.status) })}
      emptyTitle="لا توجد مبيعات"
      noHeader
    />
  );
}
