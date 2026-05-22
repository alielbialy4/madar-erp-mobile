import React from 'react';
import { couponsAPI } from '@/api/coupons';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { money } from '@/utils/format';
import type { Coupon } from '@/types/api';

export function CouponsScreen() {
  return (
    <CrudListScreen<Coupon & Record<string, unknown>>
      title="الكوبونات"
      subtitle="إدارة وقراءة الكوبونات"
      loader={couponsAPI.list}
      itemTitle={(item) => `${item.name} (${item.code})`}
      itemSubtitle={(item) => item.type === 'percentage' ? `نسبة ${item.value}%` : `خصم ${money(item.value)}`}
      itemMeta={(item) => item.min_order_amount ? `حد أدنى: ${money(item.min_order_amount)}` : undefined}
      itemBadge={(item) => ({ label: item.is_active === false ? 'غير نشط' : 'نشط', tone: item.is_active === false ? 'warning' : 'success' })}
      emptyTitle="لا توجد كوبونات"
    />
  );
}
