import React from 'react';
import { purchasesAPI } from '@/api/purchases';
import { CrudListScreen, statusTone } from '@/screens/shared/CrudListScreen';
import { AppButton } from '@/components/ui';
import { dateText, money } from '@/utils/format';

export function PurchasesScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen<Record<string, unknown>>
      title="المشتريات"
      subtitle="فواتير الشراء ومرتجعاتها"
      loader={purchasesAPI.getAll}
      onItemPress={(item) => navigation.navigate('PurchaseDetail', { id: Number(item.id) })}
      itemTitle={(item) => String(item.invoice_number ?? item.reference_no ?? `شراء ${item.id}`)}
      itemSubtitle={(item) => `${dateText(String(item.purchase_date ?? item.created_at ?? ''))} • ${String((item.supplier as any)?.name ?? item.supplier_name ?? 'مورد')}`}
      itemMeta={(item) => money(item.total ?? item.subtotal ?? 0)}
      itemBadge={(item) => ({ label: String(item.status ?? '—'), tone: statusTone(item.status) })}
      emptyTitle="لا توجد مشتريات"
      headerRight={<AppButton title="إنشاء شراء" onPress={() => navigation.navigate('CreatePurchase')} />}
    />
  );
}
