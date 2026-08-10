import React from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import type { ReportDefinition, ReportFilters } from '@/reports/types';
import { useBranchStore } from '@/store/branchStore';
import { useReportFilterOptions } from '@/hooks/useReportFilterOptions';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';

const STATUS_LABELS: Record<string, string> = { pending: 'قيد الانتظار', completed: 'مكتمل', cancelled: 'ملغي', active: 'نشط', overdue: 'متأخر', draft: 'مسودة', posted: 'مرحّل', in_transit: 'في الطريق', submitted: 'مقدم', approved: 'معتمد', rejected: 'مرفوض', fulfilled: 'منجز', confirmed: 'مؤكدة', success: 'ناجح', failed: 'فشل' };
const PAYMENT_METHOD_LABELS: Record<string, string> = { cash: 'نقدي', card: 'بطاقة', wallet: 'محفظة', credit: 'آجل', bank: 'تحويل بنكي', bank_transfer: 'تحويل بنكي' };
const TYPE_LABELS: Record<string, string> = { addition: 'إضافة', subtraction: 'خصم', deposit: 'إيداع', withdrawal: 'سحب', sale_payment: 'دفع بيع', refund: 'استرداد', adjustment: 'تسوية' };

function labelFor(options: { id: string; label: string }[], id: string): string {
  return options.find((option) => option.id === id)?.label ?? id;
}

export function ReportFilterChips({ definition, filters }: { definition: ReportDefinition; filters: ReportFilters }) {
  const c = useColors();
  const branches = useBranchStore((state) => state.branches);
  const options = useReportFilterOptions(definition.filters);
  const summaries: { label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [];

  if (definition.filters.includes('dateRange') && filters.from_date && filters.to_date) summaries.push({ label: `من ${filters.from_date} إلى ${filters.to_date}`, icon: 'date-range' });
  if (definition.filters.includes('branch') && filters.branch_id) summaries.push({ label: branches.find((branch) => branch.id === filters.branch_id)?.name ?? filters.branch_id, icon: 'store' });
  if (filters.warehouse_id) summaries.push({ label: labelFor(options.warehouses, filters.warehouse_id), icon: 'warehouse' });
  if (filters.category_id) summaries.push({ label: labelFor(options.categories, filters.category_id), icon: 'category' });
  if (filters.product_id) summaries.push({ label: labelFor(options.products, filters.product_id) || filters.product_id, icon: 'inventory-2' });
  if (filters.customer_id) summaries.push({ label: labelFor(options.customers, filters.customer_id), icon: 'person' });
  if (filters.supplier_id) summaries.push({ label: labelFor(options.suppliers, filters.supplier_id), icon: 'local-shipping' });
  if (filters.cashier_id) summaries.push({ label: labelFor(options.cashiers, filters.cashier_id), icon: 'badge' });
  if (filters.search) summaries.push({ label: filters.search, icon: 'search' });
  if (filters.coupon_code) summaries.push({ label: filters.coupon_code, icon: 'confirmation-number' });
  if (filters.status) summaries.push({ label: STATUS_LABELS[filters.status] ?? filters.status, icon: 'flag' });
  if (filters.payment_method) summaries.push({ label: PAYMENT_METHOD_LABELS[filters.payment_method] ?? filters.payment_method, icon: 'payments' });
  if (filters.type) summaries.push({ label: TYPE_LABELS[filters.type] ?? filters.type, icon: 'tune' });
  if (filters.expired_only) summaries.push({ label: 'منتهي فقط', icon: 'event-busy' });
  if (filters.near_expiry_only) summaries.push({ label: 'قريب الانتهاء', icon: 'schedule' });
  if (definition.paginated && filters.per_page) summaries.push({ label: `${filters.per_page} نتيجة / صفحة`, icon: 'view-list' });
  if (!summaries.length) return null;

  return (
    <View style={styles.wrap}>
      {summaries.map((summary) => (
        <View key={`${summary.icon}-${summary.label}`} style={[styles.item, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}> 
          <MaterialIcons name={summary.icon} size={16} color={c.textMuted} />
          <AppText style={[styles.label, { color: c.text }]} numberOfLines={1}>{summary.label}</AppText>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs, paddingVertical: spacing.xs },
  item: { ...flexRow, minHeight: 38, maxWidth: '100%', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
  label: { ...textStart, flexShrink: 1, fontFamily: fonts.bold, fontSize: typography.caption },
});
