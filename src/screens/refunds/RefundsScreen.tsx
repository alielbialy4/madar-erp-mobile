import React from 'react';
import { refundsAPI } from '@/api/refunds';
import { CrudListScreen, statusTone } from '@/screens/shared/CrudListScreen';
import { dateText, money } from '@/utils/format';

export function RefundsScreen() {
  return (
    <CrudListScreen<Record<string, unknown>>
      title="المرتجعات"
      subtitle="لإنشاء مرتجع جزئي، افتح تفاصيل البيع من قائمة المبيعات ثم اختر «مرتجع جزئي»."
      loader={refundsAPI.getAll}
      itemTitle={(item) => `مرتجع ${item.invoice_number ?? item.id}`}
      itemSubtitle={(item) => dateText(String(item.created_at ?? ''))}
      itemMeta={(item) => `${money(item.amount ?? item.total ?? 0)} • ${item.reason ?? 'بدون سبب'}`}
      itemBadge={(item) => ({ label: String(item.status ?? 'مسجل'), tone: statusTone(item.status) })}
      emptyTitle="لا توجد مرتجعات"
    />
  );
}
