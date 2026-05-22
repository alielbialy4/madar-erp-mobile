import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppChip, AppSelect, AppText } from '@/components/ui';
import { ReportDateRangePicker } from '@/screens/reports/ReportDateRangePicker';
import { ReportBranchFilter } from '@/screens/reports/ReportBranchFilter';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import type { ShiftFilterUser } from '@/types/shifts';

export type ShiftListFilters = {
  from_date: string;
  to_date: string;
  status: 'all' | 'open' | 'closed';
  branch_id: string;
  user_id: string;
};

type Props = {
  visible: boolean;
  filters: ShiftListFilters;
  filterUsers: ShiftFilterUser[];
  showBranchFilter: boolean;
  onClose: () => void;
  onApply: (filters: ShiftListFilters) => void;
};

const STATUS_OPTIONS: { value: ShiftListFilters['status']; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'open', label: 'مفتوحة' },
  { value: 'closed', label: 'مغلقة' },
];

export function ShiftFilterSheet({ visible, filters, filterUsers, showBranchFilter, onClose, onApply }: Props) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const patch = (partial: Partial<ShiftListFilters>) => setDraft((f) => ({ ...f, ...partial }));

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="تصفية الورديات">
      <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
        <ReportDateRangePicker
          fromDate={draft.from_date}
          toDate={draft.to_date}
          onChangeFrom={(v) => patch({ from_date: v })}
          onChangeTo={(v) => patch({ to_date: v })}
        />

        <View style={{ gap: spacing.sm }}>
          <AppText style={{ ...textStart, fontWeight: '700' }}>الحالة</AppText>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {STATUS_OPTIONS.map((opt) => (
              <AppChip
                key={opt.value}
                label={opt.label}
                active={draft.status === opt.value}
                onPress={() => patch({ status: opt.value })}
              />
            ))}
          </View>
        </View>

        {showBranchFilter ? (
          <ReportBranchFilter branchId={draft.branch_id} onChange={(branch_id) => patch({ branch_id })} />
        ) : null}

        <AppSelect
          label="الكاشير"
          value={draft.user_id || null}
          options={[
            { label: 'جميع الكاشيرات', value: '' },
            ...filterUsers.map((u) => ({ label: u.name, value: String(u.id) })),
          ]}
          onChange={(v) => patch({ user_id: v ?? '' })}
        />

        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <AppButton title="تطبيق" style={{ flex: 1 }} onPress={() => { onApply(draft); onClose(); }} />
          <AppButton
            title="إعادة"
            variant="secondary"
            style={{ flex: 1 }}
            onPress={() => patch({ status: 'all', user_id: '', branch_id: '' })}
          />
        </View>
      </View>
    </AppBottomSheet>
  );
}
