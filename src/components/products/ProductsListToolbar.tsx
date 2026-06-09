import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppSearchField, AppChip } from '@/components/ui';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import type { ProductListFilters } from '@/components/lists/ListFiltersBar';
import {
  countActiveProductFilters,
  getActiveProductFilterChips,
} from '@/constants/productsLayout';

type CategoryOption = { id: number; name: string };

type Props = {
  query: string;
  onQueryChange: (value: string) => void;
  filters: ProductListFilters;
  onFiltersChange: (next: ProductListFilters) => void;
  categories: CategoryOption[];
  onOpenFilters?: () => void;
  rawMaterialMode?: boolean;
  canManage?: boolean;
  onAdd?: () => void;
  searchPlaceholder?: string;
};

export function ProductsListToolbar({
  query,
  onQueryChange,
  filters,
  onFiltersChange,
  categories,
  onOpenFilters,
  rawMaterialMode = false,
  canManage,
  onAdd,
  searchPlaceholder = 'بحث بالاسم أو الباركود...',
}: Props) {
  const c = useColors();
  const activeCount = countActiveProductFilters(filters, rawMaterialMode);
  const chips = useMemo(
    () => getActiveProductFilterChips(filters, categories, rawMaterialMode),
    [filters, categories, rawMaterialMode],
  );

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <AppSearchField value={query} onChangeText={onQueryChange} placeholder={searchPlaceholder} compact />
        </View>
        {onOpenFilters ? (
        <Pressable
          onPress={onOpenFilters}
          style={{
            ...flexRow,
            alignItems: 'center',
            gap: spacing.xs,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderRadius: radius.xl,
            borderWidth: 1,
            borderColor: activeCount > 0 ? c.accentBorder : c.borderSubtle,
            backgroundColor: activeCount > 0 ? c.softPrimary : c.surface,
            minHeight: 44,
          }}
          accessibilityRole="button"
          accessibilityLabel="فتح الفلاتر"
        >
          <MaterialIcons name="tune" size={20} color={activeCount > 0 ? c.accent : c.textMuted} />
          {activeCount > 0 ? (
            <View
              style={{
                minWidth: 18,
                height: 18,
                borderRadius: 9,
                backgroundColor: c.accent,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <MaterialIcons name="filter-list" size={12} color={c.primaryForeground} />
            </View>
          ) : null}
        </Pressable>
        ) : null}
        {canManage && onAdd ? (
          <Pressable
            onPress={onAdd}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.xl,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.primary,
            }}
            accessibilityRole="button"
            accessibilityLabel="إضافة منتج"
          >
            <MaterialIcons name="add" size={24} color={c.primaryForeground} />
          </Pressable>
        ) : null}
      </View>
      {chips.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing.sm }}>
          {chips.map((chip) => (
            <AppChip
              key={chip.key}
              label={chip.label}
              active
              onPress={() => onFiltersChange(chip.clear(filters))}
              icon={<MaterialIcons name="close" size={14} color={c.accent} />}
            />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}
