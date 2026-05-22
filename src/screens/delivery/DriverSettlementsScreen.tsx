import React from 'react';
import { driverSettlementsAPI } from '@/api/driverSettlements';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { asText, dateText, money } from '@/utils/format';

export function DriverSettlementsScreen({ navigation }: { navigation: any }) {
  return (
    <CrudListScreen
      title="تسويات السائقين"
      subtitle="الإنشاء معطّل على الجوال: يتطلب خزنة وطلبات متعددة وتسوية محاسبية — استخدم الويب."
      loader={(p) => driverSettlementsAPI.list(p) as never}
      itemTitle={(row) => `سائق ${asText((row.driver as Record<string, unknown>)?.name, String(row.driver_id ?? ''))}`}
      itemSubtitle={(row) => dateText(asText(row.created_at, ''))}
      itemMeta={(row) => money(row.amount_received ?? 0)}
      emptyTitle="لا تسويات"
    />
  );
}
