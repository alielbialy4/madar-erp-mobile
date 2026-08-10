import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppAmountInput, AppButton, AppSelect } from '@/components/ui';
import { ReportDateRangePicker } from '@/screens/reports/ReportDateRangePicker';
import type { Branch } from '@/types/api';
import type { ExpenseCategory } from '@/types/expenses';
import { spacing } from '@/constants/spacing';

export type ExpenseListFilters = {
  expense_category_id: string;
  branch_id: string;
  from_date: string;
  to_date: string;
  status: string;
  cash_source: string;
  min_amount: string;
  max_amount: string;
};

export const EMPTY_EXPENSE_FILTERS: ExpenseListFilters = {
  expense_category_id: '',
  branch_id: '',
  from_date: '',
  to_date: '',
  status: '',
  cash_source: '',
  min_amount: '',
  max_amount: '',
};

export function countExpenseFilters(filters: ExpenseListFilters): number {
  return Object.values(filters).filter((value) => value !== '').length;
}

type Props = {
  visible: boolean;
  filters: ExpenseListFilters;
  categories: ExpenseCategory[];
  branches: Branch[];
  showBranch: boolean;
  onClose: () => void;
  onApply: (filters: ExpenseListFilters) => void;
};

export function ExpenseFiltersSheet({ visible, filters, categories, branches, showBranch, onClose, onApply }: Props) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [filters, visible]);

  const patch = (next: Partial<ExpenseListFilters>) => setDraft((current) => ({ ...current, ...next }));

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="تصفية المصروفات" size="form">
      <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
        <ReportDateRangePicker
          fromDate={draft.from_date}
          toDate={draft.to_date}
          onChangeFrom={(from_date) => patch({ from_date })}
          onChangeTo={(to_date) => patch({ to_date })}
        />
        {showBranch ? (
          <AppSelect
            label="الفرع"
            value={draft.branch_id}
            options={[
              { label: 'كل الفروع والمصروفات العامة', value: '' },
              ...branches.map((branch) => ({ label: branch.name, value: branch.id })),
            ]}
            onChange={(branch_id) => patch({ branch_id })}
          />
        ) : null}
        <AppSelect
          label="التصنيف"
          value={draft.expense_category_id}
          options={[
            { label: 'كل التصنيفات', value: '' },
            ...categories.map((category) => ({ label: category.name, value: String(category.id) })),
          ]}
          onChange={(expense_category_id) => patch({ expense_category_id })}
        />
        <AppSelect
          label="الحالة المالية"
          value={draft.status}
          options={[
            { label: 'كل الحالات', value: '' },
            { label: 'غير مدفوع', value: 'pending' },
            { label: 'مدفوع جزئياً', value: 'partially_paid' },
            { label: 'مدفوع', value: 'paid' },
            { label: 'ملغي', value: 'cancelled' },
          ]}
          onChange={(status) => patch({ status })}
        />
        <AppSelect
          label="مصدر الصرف"
          value={draft.cash_source}
          options={[
            { label: 'كل المصادر', value: '' },
            { label: 'درج الوردية', value: 'drawer' },
            { label: 'حساب مالي / خزنة', value: 'vault' },
          ]}
          onChange={(cash_source) => patch({ cash_source })}
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppAmountInput
              label="أقل مبلغ"
              value={draft.min_amount}
              onChangeText={(min_amount) => patch({ min_amount })}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppAmountInput
              label="أعلى مبلغ"
              value={draft.max_amount}
              onChangeText={(max_amount) => patch({ max_amount })}
            />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <AppButton
            title="تطبيق الفلاتر"
            style={{ flex: 1 }}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
          <AppButton
            title="مسح"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => setDraft({ ...EMPTY_EXPENSE_FILTERS })}
          />
        </View>
      </View>
    </AppBottomSheet>
  );
}
