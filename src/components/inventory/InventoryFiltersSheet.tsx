import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { InventoryFiltersPanel } from '@/components/inventory/InventoryFiltersPanel';
import { AppButton } from '@/components/ui';
import { EMPTY_INVENTORY_FILTERS, type InventoryListFilters } from '@/constants/inventoryLayout';
import type { InventoryFilterKey, InventoryListSurface } from '@/components/inventory/inventoryListPresets';
import { spacing } from '@/constants/spacing';

type Props = {
  visible: boolean;
  surface: InventoryListSurface;
  filters: InventoryListFilters;
  resultCount: number;
  supportedFilters: InventoryFilterKey[];
  onClose: () => void;
  onApply: (next: InventoryListFilters) => void;
  lockedWarehouseId?: string;
  title?: string;
};

export function InventoryFiltersSheet({
  visible,
  surface,
  filters,
  resultCount,
  supportedFilters,
  onClose,
  onApply,
  lockedWarehouseId,
  title = 'تصفية',
}: Props) {
  const [draft, setDraft] = useState<InventoryListFilters>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
  }, [visible, filters]);

  const handleClear = () => {
    const cleared = { ...EMPTY_INVENTORY_FILTERS };
    if (lockedWarehouseId) cleared.warehouse_id = lockedWarehouseId;
    setDraft(cleared);
    onApply(cleared);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title={title}>
      <InventoryFiltersPanel
        surface={surface}
        filters={draft}
        onChange={setDraft}
        resultCount={resultCount}
        supportedFilters={supportedFilters}
        layout="sidebar"
        showResultCount
        lockedWarehouseId={lockedWarehouseId}
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
