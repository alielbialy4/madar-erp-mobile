import React from 'react';
import { refundsAPI } from '@/api/refunds';
import { ListScreenTemplate } from '@/components/layout';
import { statusTone } from '@/utils/statusTone';
import { dateText, money } from '@/utils/format';

export function RefundsScreen() {
  return (
    <ListScreenTemplate<Record<string, unknown>>
      title="المرتجعات"
      subtitle="لإنشاء مرتجع جزئي، افتح تفاصيل البيع من قائمة المبيعات ثم اختر «مرتجع جزئي»."
      moduleIcon="refunds"
      loader={refundsAPI.getAll}
      itemTitle={(item) => `مرتجع ${item.invoice_number ?? item.id}`}
      itemSubtitle={(item) => dateText(String(item.created_at ?? ''))}
      itemMeta={(item) => String(item.reason ?? 'بدون سبب')}
      itemMetric={(item) => money(item.amount ?? item.total ?? 0)}
      itemBadge={(item) => ({ label: String(item.status ?? 'مسجل'), tone: statusTone(item.status) })}
      emptyTitle="لا توجد مرتجعات"
    />
  );
}
