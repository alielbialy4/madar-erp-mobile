import React from 'react';
import { View } from 'react-native';
import { purchasesAPI } from '@/api/purchases';
import { ListScreenTemplate } from '@/components/layout';
import { statusTone } from '@/utils/statusTone';
import { AppButton } from '@/components/ui';
import { dateText, money } from '@/utils/format';

export function PurchasesScreen({ navigation }: { navigation: any }) {
  return (
    <ListScreenTemplate<Record<string, unknown>>
      title="المشتريات"
      subtitle="فواتير الشراء ومرتجعاتها"
      moduleIcon="purchases"
      loader={purchasesAPI.getAll}
      onItemPress={(item) => navigation.navigate('PurchaseDetail', { id: Number(item.id) })}
      itemTitle={(item) => String(item.invoice_number ?? item.reference_no ?? `شراء ${item.id}`)}
      itemSubtitle={(item) => `${dateText(String(item.purchase_date ?? item.created_at ?? ''))} • ${String((item.supplier as any)?.name ?? item.supplier_name ?? 'مورد')}`}
      itemMeta={(item) => money(item.total ?? item.subtotal ?? 0)}
      itemBadge={(item) => ({ label: String(item.status ?? '—'), tone: statusTone(item.status) })}
      emptyTitle="لا توجد مشتريات"
      emptyCtaLabel="إنشاء شراء"
      onEmptyCta={() => navigation.navigate('CreatePurchase')}
      fab={{ onPress: () => navigation.navigate('CreatePurchase'), label: 'إنشاء شراء' }}
      headerRight={
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <AppButton title="مرتجعات" variant="secondary" onPress={() => navigation.navigate('PurchaseReturnsList')} />
          <AppButton title="إنشاء شراء" onPress={() => navigation.navigate('CreatePurchase')} />
        </View>
      }
    />
  );
}
