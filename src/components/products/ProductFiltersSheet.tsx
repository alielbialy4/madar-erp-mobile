import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { ProductFiltersPanel } from '@/components/products/ProductFiltersPanel';
import { AppButton } from '@/components/ui';
import type { ProductListFilters } from '@/components/lists/ListFiltersBar';
import { EMPTY_PRODUCT_FILTERS } from '@/constants/productsLayout';
import { spacing } from '@/constants/spacing';

type CategoryOption = { id: number; name: string };

type Props = {
  visible: boolean;
  categories: CategoryOption[];
  filters: ProductListFilters;
  resultCount: number;
  rawMaterialMode?: boolean;
  onClose: () => void;
  onApply: (next: ProductListFilters) => void;
};

export function ProductFiltersSheet({
  visible,
  categories,
  filters,
  resultCount,
  rawMaterialMode = false,
  onClose,
  onApply,
}: Props) {
  const [draft, setDraft] = useState<ProductListFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const handleClear = () => {
    const cleared = { ...EMPTY_PRODUCT_FILTERS };
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="تصفية المنتجات">
      <ProductFiltersPanel
        categories={categories}
        filters={draft}
        onChange={setDraft}
        resultCount={resultCount}
        layout="sidebar"
        rawMaterialMode={rawMaterialMode}
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
