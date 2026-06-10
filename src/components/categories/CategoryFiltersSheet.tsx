import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { CategoryFiltersPanel } from '@/components/categories/CategoryFiltersPanel';
import { AppButton } from '@/components/ui';
import { EMPTY_CATEGORY_FILTERS, type CategoryListFilters } from '@/constants/categoriesLayout';
import { spacing } from '@/constants/spacing';

type Props = {
  visible: boolean;
  filters: CategoryListFilters;
  resultCount: number;
  onClose: () => void;
  onApply: (next: CategoryListFilters) => void;
};

export function CategoryFiltersSheet({ visible, filters, resultCount, onClose, onApply }: Props) {
  const [draft, setDraft] = useState<CategoryListFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const handleClear = () => {
    const cleared = { ...EMPTY_CATEGORY_FILTERS };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="تصفية التصنيفات">
      <CategoryFiltersPanel
        filters={draft}
        onChange={setDraft}
        resultCount={resultCount}
        layout="sidebar"
        showResultCount
      />
      <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md }}>
        <AppButton title="مسح الكل" variant="outline" onPress={handleClear} style={{ flex: 1 }} />
        <AppButton
          title="تطبيق"
          onPress={() => {
            onApply(draft);
            onClose();
          }}
          style={{ flex: 1 }}
        />
      </View>
    </AppBottomSheet>
  );
}
