import React from 'react';
import { vaultsAPI } from '@/api/vaults';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { asText, dateText, money } from '@/utils/format';
import { statusTone } from '@/utils/statusTone';

type VaultTransaction = Record<string, unknown> & {
  id?: string | number;
  type?: string | null;
  amount?: string | number | null;
  description?: string | null;
  reference?: string | null;
  reference_no?: string | null;
  transaction_date?: string | null;
  created_at?: string | null;
  vault?: { name?: string | null } | null;
  user?: { name?: string | null } | null;
  notes?: string | null;
};

function typeLabel(type?: string | null) {
  switch (type) {
    case 'deposit': return 'إيداع';
    case 'withdraw':
    case 'withdrawal': return 'سحب';
    case 'transfer_in': return 'تحويل وارد';
    case 'transfer_out': return 'تحويل صادر';
    case 'sale': return 'بيع';
    case 'expense': return 'مصروف';
    default: return type || 'حركة';
  }
}

export function VaultTransactionDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = String(route.params?.id ?? '');
  return (
    <DetailScreen<VaultTransaction>
      title="تفاصيل حركة الخزنة"
      onBack={navigation.goBack}
      loader={() => vaultsAPI.transactionById(id)}
      badge={(item) => ({ label: typeLabel(item.type), tone: statusTone(item.type) })}
      fields={[
        { label: 'النوع', value: (item) => typeLabel(item.type) },
        { label: 'المبلغ', value: (item) => money(item.amount ?? 0) },
        { label: 'الخزنة', value: (item) => item.vault?.name },
        { label: 'المرجع', value: (item) => asText(item.reference_no ?? item.reference) },
        { label: 'الوصف', value: (item) => item.description },
        { label: 'التاريخ', value: (item) => dateText(item.transaction_date ?? item.created_at) },
        { label: 'المستخدم', value: (item) => item.user?.name },
        { label: 'ملاحظات', value: (item) => item.notes },
      ]}
    />
  );
}
