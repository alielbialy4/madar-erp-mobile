import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { useColors } from '@/hooks/useColors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { spacing } from '@/constants/spacing';
import type { CategoryListFilters, CategoryStatusFilter } from '@/constants/categoriesLayout';
import { Text } from '@/components/ui/AppText';

type Props = {
  filters: CategoryListFilters;
  onChange: (next: CategoryListFilters) => void;
  resultCount: number;
  layout?: 'inline' | 'sidebar';
  showResultCount?: boolean;
};

const STATUS_PILLS: { key: CategoryStatusFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'inactive', label: 'غير نشط' },
];

export function CategoryFiltersPanel({
  filters,
  onChange,
  resultCount,
  layout = 'inline',
  showResultCount = true,
}: Props) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const isSidebar = layout === 'sidebar';

  return (
    <View style={{ gap: spacing.sm, ...(isSidebar ? { flex: 1 } : {}) }}>
      {isSidebar ? <Text style={[cs.sectionLabel, { fontSize: 14 }]}>الحالة</Text> : null}
      <View style={isSidebar ? { gap: spacing.sm } : ui.chipsWrap}>
        {STATUS_PILLS.map((p) => {
          const active = filters.status === p.key;
          return (
            <Pressable
              key={p.key}
              onPress={() => onChange({ ...filters, status: p.key })}
              style={[cs.filterPill, active && cs.filterPillActive]}
            >
              <Text style={[cs.filterText, active && cs.filterTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {showResultCount ? (
        <View
          style={{
            marginTop: spacing.sm,
            padding: spacing.md,
            borderRadius: 12,
            backgroundColor: c.softPrimary,
            borderWidth: 1,
            borderColor: c.primarySoftBorder,
          }}
        >
          <Text style={[cs.sectionLabel, { color: c.primary, textAlign: 'center' }]}>
            {resultCount} تصنيف
          </Text>
        </View>
      ) : null}
    </View>
  );
}
