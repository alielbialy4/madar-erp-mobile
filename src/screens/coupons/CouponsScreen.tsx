import React from 'react';
import { View } from 'react-native';
import { couponsAPI } from '@/api/coupons';
import { ListScreenTemplate } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { money } from '@/utils/format';
import type { Coupon } from '@/types/api';

export function CouponsScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, ['manage_coupons', 'manage_settings']);

  return (
    <ListScreenTemplate<Coupon & Record<string, unknown>>
      title="الكوبونات"
      subtitle="التحقق في POS يتطلب شبكة؛ سياسة الفرع من إعدادات الفرع"
      moduleIcon="coupons"
      loader={couponsAPI.list}
      onItemPress={(item) => navigation.navigate('CouponForm', { id: String(item.id) })}
      itemTitle={(item) => `${item.name} (${item.code})`}
      itemSubtitle={(item) => (item.type === 'percentage' ? `نسبة ${item.value}%` : `خصم ${money(item.value)}`)}
      itemMeta={(item) => (item.min_order_amount ? `حد أدنى: ${money(item.min_order_amount)}` : item.branch_id ? `فرع: ${item.branch_id}` : undefined)}
      itemBadge={(item) => ({ label: item.is_active === false ? 'غير نشط' : 'نشط', tone: item.is_active === false ? 'warning' : 'success' })}
      emptyTitle="لا كوبونات"
      emptyCtaLabel="كوبون جديد"
      onEmptyCta={canManage ? () => navigation.navigate('CouponForm', {}) : undefined}
      fab={canManage ? { onPress: () => navigation.navigate('CouponForm', {}), label: 'كوبون جديد' } : undefined}
      headerRight={
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {canManage ? <AppButton title="جديد" onPress={() => navigation.navigate('CouponForm', {})} /> : null}
          <AppButton title="تقرير" variant="secondary" onPress={() => navigation.navigate('ReportViewer', { reportId: 'marketing-coupons' })} />
        </View>
      }
    />
  );
}
