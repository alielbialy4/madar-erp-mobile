import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppButton, AppInput, AppSelect, AppText } from '@/components/ui';
import type { ReportDefinition, ReportFilters } from '@/reports/types';
import { defaultReportFilters } from '@/hooks/useReport';
import { useReportFilterOptions } from '@/hooks/useReportFilterOptions';
import { useBranchStore } from '@/store/branchStore';
import { spacing } from '@/constants/spacing';
import { ReportDateRangePicker } from './ReportDateRangePicker';
import { ReportBranchFilter } from './ReportBranchFilter';

const STATUS_OPTIONS_DEFAULT = [
  { value: '', label: 'الكل' },
  { value: 'pending', label: 'قيد الانتظار' },
  { value: 'completed', label: 'مكتمل' },
  { value: 'cancelled', label: 'ملغى' },
  { value: 'active', label: 'نشط' },
  { value: 'overdue', label: 'متأخر' },
];

const STATUS_OPTIONS_BY_REPORT: Record<string, { value: string; label: string }[]> = {
  'inventory-stock-counts': [
    { value: '', label: 'الكل' },
    { value: 'draft', label: 'مسودة' },
    { value: 'posted', label: 'مرحّل' },
    { value: 'cancelled', label: 'ملغي' },
  ],
  'inventory-stock-transfers': [
    { value: '', label: 'الكل' },
    { value: 'in_transit', label: 'في الطريق' },
    { value: 'completed', label: 'مكتمل' },
    { value: 'cancelled', label: 'ملغي' },
  ],
  'suppliers-requisitions': [
    { value: '', label: 'الكل' },
    { value: 'submitted', label: 'مقدم' },
    { value: 'approved', label: 'معتمد' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'fulfilled', label: 'منجز' },
  ],
  'dining-reservations': [
    { value: '', label: 'الكل' },
    { value: 'confirmed', label: 'مؤكدة' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'completed', label: 'منجزة' },
    { value: 'cancelled', label: 'ملغاة' },
  ],
  'operations-offline-sync': [
    { value: '', label: 'الكل' },
    { value: 'success', label: 'ناجح' },
    { value: 'pending', label: 'قيد الانتظار' },
    { value: 'failed', label: 'فشل' },
  ],
};

function getStatusOptions(reportId: string): { value: string; label: string }[] {
  return STATUS_OPTIONS_BY_REPORT[reportId] ?? STATUS_OPTIONS_DEFAULT;
}

const PAYMENT_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'cash', label: 'نقدي' },
  { value: 'card', label: 'بطاقة' },
  { value: 'wallet', label: 'محفظة' },
  { value: 'credit', label: 'آجل' },
];

const STOCK_ADJUSTMENT_TYPE_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'addition', label: 'إضافة' },
  { value: 'subtraction', label: 'خصم' },
];

const MOVEMENT_TYPE_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'transfer', label: 'تحويل' },
  { value: 'adjustment', label: 'تسوية' },
  { value: 'all', label: 'الكل (موحّد)' },
];

const WALLET_TYPE_OPTIONS = [
  { value: '', label: 'الكل' },
  { value: 'deposit', label: 'إيداع' },
  { value: 'withdrawal', label: 'سحب' },
  { value: 'sale_payment', label: 'دفع بيع' },
  { value: 'refund', label: 'استرداد' },
  { value: 'adjustment', label: 'تسوية' },
];

const PER_PAGE_OPTIONS = ['25', '50', '100'];

type Props = {
  visible: boolean;
  definition: ReportDefinition;
  filters: ReportFilters;
  onClose: () => void;
  onApply: (filters: ReportFilters) => void;
};

export function ReportFilterSheet({ visible, definition, filters, onClose, onApply }: Props) {
  const [draft, setDraft] = useState(filters);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);
  const options = useReportFilterOptions(definition.filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const patch = (partial: Partial<ReportFilters>) => setDraft((f) => ({ ...f, ...partial }));

  const apply = () => {
    const next = { ...draft };
    if (definition.filters.includes('branch') && !next.branch_id && viewMode === 'branch' && activeBranch?.id) {
      next.branch_id = activeBranch.id;
    }
    onApply(next);
    onClose();
  };

  const reset = () => {
    const base = defaultReportFilters();
    if (viewMode === 'branch' && activeBranch?.id) base.branch_id = activeBranch.id;
    setDraft(base);
  };

  const optionButtons = (label: string, items: { id: string; label: string }[], selected: string, onSelect: (id: string) => void) => (
    <View style={{ gap: spacing.sm }}>
      <AppText style={{ fontWeight: '600' }}>{label}</AppText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm, flexDirection: 'row' }}>
        <AppButton variant={!selected ? 'primary' : 'secondary'} title="الكل" size="sm" onPress={() => onSelect('')} />
        {items.map((item) => (
          <AppButton
            key={item.id}
            variant={selected === item.id ? 'primary' : 'secondary'}
            title={item.label}
            size="sm"
            onPress={() => onSelect(selected === item.id ? '' : item.id)}
          />
        ))}
      </ScrollView>
    </View>
  );

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
        <AppText style={{ fontWeight: '700', fontSize: 18 }}>تصفية التقرير</AppText>
        {definition.filters.includes('dateRange') ? (
          <ReportDateRangePicker
            fromDate={draft.from_date}
            toDate={draft.to_date}
            onChangeFrom={(v) => patch({ from_date: v })}
            onChangeTo={(v) => patch({ to_date: v })}
          />
        ) : null}
        {definition.filters.includes('branch') ? (
          <ReportBranchFilter branchId={draft.branch_id} onChange={(branch_id) => patch({ branch_id })} />
        ) : null}
        {definition.filters.includes('warehouse') ? optionButtons('المستودع', options.warehouses, draft.warehouse_id, (warehouse_id) => patch({ warehouse_id })) : null}
        {definition.filters.includes('category') ? optionButtons('التصنيف', options.categories, draft.category_id, (category_id) => patch({ category_id })) : null}
        {definition.filters.includes('product') ? (
          <>
            {options.products.length ? optionButtons('المنتج', options.products.slice(0, 24), draft.product_id, (product_id) => patch({ product_id })) : null}
            <AppInput
              label="معرف المنتج"
              value={draft.product_id}
              onChangeText={(product_id) => patch({ product_id })}
              placeholder="رقم المنتج"
              keyboardType="number-pad"
            />
          </>
        ) : null}
        {definition.filters.includes('customer') ? optionButtons('العميل', options.customers.slice(0, 30), draft.customer_id, (customer_id) => patch({ customer_id })) : null}
        {definition.filters.includes('supplier') ? optionButtons('المورد', options.suppliers.slice(0, 30), draft.supplier_id, (supplier_id) => patch({ supplier_id })) : null}
        {definition.filters.includes('cashier') ? optionButtons('الكاشير', options.cashiers, draft.cashier_id, (cashier_id) => patch({ cashier_id })) : null}
        {definition.filters.includes('search') ? (
          <AppInput label="بحث" value={draft.search} onChangeText={(search) => patch({ search })} placeholder="اسم أو باركود" />
        ) : null}
        {definition.filters.includes('couponCode') ? (
          <AppInput label="كود الكوبون" value={draft.coupon_code} onChangeText={(coupon_code) => patch({ coupon_code })} />
        ) : null}
        {definition.filters.includes('status') ? (
          <AppSelect
            label="الحالة"
            value={draft.status}
            options={getStatusOptions(definition.id)}
            onChange={(status) => patch({ status })}
          />
        ) : null}
        {definition.filters.includes('paymentMethod') ? (
          <AppSelect
            label="طريقة الدفع"
            value={draft.payment_method}
            options={PAYMENT_OPTIONS}
            onChange={(payment_method) => patch({ payment_method })}
          />
        ) : null}
        {definition.filters.includes('movementType') ? (
          <AppSelect
            label="نوع الحركة"
            value={draft.type}
            options={MOVEMENT_TYPE_OPTIONS}
            onChange={(type) => patch({ type })}
          />
        ) : null}
        {definition.filters.includes('type') ? (
          <AppSelect
            label="النوع"
            value={draft.type}
            options={definition.id === 'customers-wallet' ? WALLET_TYPE_OPTIONS : STOCK_ADJUSTMENT_TYPE_OPTIONS}
            onChange={(type) => patch({ type })}
          />
        ) : null}
        {definition.filters.includes('expiryOptions') ? (
          <>
            <AppInput
              label="أيام قبل الانتهاء"
              value={String(draft.days_threshold)}
              onChangeText={(v) => patch({ days_threshold: Number(v) || 30 })}
              keyboardType="number-pad"
            />
            <AppButton
              variant={draft.expired_only ? 'primary' : 'secondary'}
              title="منتهي فقط"
              onPress={() => patch({ expired_only: !draft.expired_only, near_expiry_only: false })}
            />
            <AppButton
              variant={draft.near_expiry_only ? 'primary' : 'secondary'}
              title="قريب الانتهاء فقط"
              onPress={() => patch({ near_expiry_only: !draft.near_expiry_only, expired_only: false })}
            />
          </>
        ) : null}
        {definition.filters.includes('perPage') ? (
          <View style={{ gap: spacing.sm }}>
            <AppText>عدد الصفوف في الصفحة</AppText>
            <View style={{ flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' }}>
              {PER_PAGE_OPTIONS.map((n) => (
                <AppButton
                  key={n}
                  variant={String(draft.per_page) === n ? 'primary' : 'secondary'}
                  title={n}
                  size="sm"
                  onPress={() => patch({ per_page: Number(n) })}
                />
              ))}
            </View>
          </View>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <AppButton title="إعادة ضبط" variant="secondary" onPress={reset} style={{ flex: 1 }} />
          <AppButton title="تطبيق" onPress={apply} style={{ flex: 1 }} />
        </View>
      </View>
    </AppBottomSheet>
  );
}
