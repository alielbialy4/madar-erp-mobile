import React from 'react';
import { ScrollView } from 'react-native';
import { AppChip } from '@/components/ui';
import type { ReportDefinition, ReportFilters } from '@/reports/types';
import { useBranchStore } from '@/store/branchStore';
import { useReportFilterOptions } from '@/hooks/useReportFilterOptions';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  completed: 'مكتمل',
  cancelled: 'ملغي',
  active: 'نشط',
  overdue: 'متأخر',
  draft: 'مسودة',
  posted: 'مرحّل',
  in_transit: 'في الطريق',
  submitted: 'مقدم',
  approved: 'معتمد',
  rejected: 'مرفوض',
  fulfilled: 'منجز',
  confirmed: 'مؤكدة',
  success: 'ناجح',
  failed: 'فشل',
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  wallet: 'محفظة',
  credit: 'آجل',
  bank: 'تحويل بنكي',
  bank_transfer: 'تحويل بنكي',
};

const TYPE_LABELS: Record<string, string> = {
  addition: 'إضافة',
  subtraction: 'خصم',
  deposit: 'إيداع',
  withdrawal: 'سحب',
  sale_payment: 'دفع بيع',
  refund: 'استرداد',
  adjustment: 'تسوية',
};

type Props = {
  definition: ReportDefinition;
  filters: ReportFilters;
};

function labelFor(options: { id: string; label: string }[], id: string): string {
  return options.find((o) => o.id === id)?.label ?? id;
}

export function ReportFilterChips({ definition, filters }: Props) {
  const branches = useBranchStore((s) => s.branches);
  const options = useReportFilterOptions(definition.filters);
  const chips: string[] = [];

  if (definition.filters.includes('dateRange') && filters.from_date && filters.to_date) {
    chips.push(`${filters.from_date} → ${filters.to_date}`);
  }
  if (definition.filters.includes('branch') && filters.branch_id) {
    const name = branches.find((b) => b.id === filters.branch_id)?.name ?? filters.branch_id;
    chips.push(`فرع: ${name}`);
  }
  if (filters.warehouse_id) chips.push(`مستودع: ${labelFor(options.warehouses, filters.warehouse_id)}`);
  if (filters.category_id) chips.push(`تصنيف: ${labelFor(options.categories, filters.category_id)}`);
  if (filters.product_id) chips.push(`منتج: ${labelFor(options.products, filters.product_id) || filters.product_id}`);
  if (filters.customer_id) chips.push(`عميل: ${labelFor(options.customers, filters.customer_id)}`);
  if (filters.supplier_id) chips.push(`مورد: ${labelFor(options.suppliers, filters.supplier_id)}`);
  if (filters.cashier_id) chips.push(`كاشير: ${labelFor(options.cashiers, filters.cashier_id)}`);
  if (filters.search) chips.push(`بحث: ${filters.search}`);
  if (filters.coupon_code) chips.push(`كوبون: ${filters.coupon_code}`);
  if (filters.status) {
    const statusLabel = STATUS_LABELS[filters.status] ?? filters.status;
    chips.push(`حالة: ${statusLabel}`);
  }
  if (filters.payment_method) {
    const pmLabel = PAYMENT_METHOD_LABELS[filters.payment_method] ?? filters.payment_method;
    chips.push(`دفع: ${pmLabel}`);
  }
  if (filters.type) {
    const typeLabel = TYPE_LABELS[filters.type] ?? filters.type;
    chips.push(`نوع: ${typeLabel}`);
  }
  if (filters.expired_only) chips.push('منتهي فقط');
  if (filters.near_expiry_only) chips.push('قريب الانتهاء');
  if (definition.paginated && filters.per_page) chips.push(`${filters.per_page} / صفحة`);

  if (!chips.length) return null;

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ ...flexRow, gap: spacing.sm, paddingVertical: spacing.xs }}>
      {chips.map((label) => (
        <AppChip key={label} label={label} active />
      ))}
    </ScrollView>
  );
}
