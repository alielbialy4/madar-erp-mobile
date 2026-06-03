import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { AppSelect } from '@/components/ui';
import { spacing } from '@/constants/spacing';

export type ProductListFilters = {
  category_id?: string | null;
  stock_status?: 'low' | 'out' | null;
  featured?: '0' | '1' | null;
  /** Raw materials list: filter by product_role */
  product_role?: string | null;
  /** Raw materials list: all | low | expiry | inactive */
  raw_status?: 'low' | 'expiry' | 'inactive' | null;
};

type CategoryOption = { id: number; name: string };

type Props = {
  categories: CategoryOption[];
  filters: ProductListFilters;
  onChange: (next: ProductListFilters) => void;
};

export function ListFiltersBar({ categories, filters, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View key="filter-category" style={styles.block}>
          <AppSelect
            label="التصنيف"
            value={filters.category_id ?? null}
            options={[
              { label: 'الكل', value: '' },
              ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
            ]}
            onChange={(category_id) => onChange({ ...filters, category_id: category_id || null })}
          />
        </View>
        <View key="filter-stock" style={styles.block}>
          <AppSelect
            label="المخزون"
            value={filters.stock_status ?? null}
            options={[
              { label: 'الكل', value: '' },
              { label: 'منخفض', value: 'low' },
              { label: 'نفد', value: 'out' },
            ]}
            onChange={(stock_status) =>
              onChange({ ...filters, stock_status: (stock_status || null) as ProductListFilters['stock_status'] })
            }
          />
        </View>
        <View key="filter-featured" style={styles.block}>
          <AppSelect
            label="مميز"
            value={filters.featured ?? null}
            options={[
              { label: 'الكل', value: '' },
              { label: 'مميز', value: '1' },
              { label: 'غير مميز', value: '0' },
            ]}
            onChange={(featured) =>
              onChange({ ...filters, featured: (featured || null) as ProductListFilters['featured'] })
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  scroll: { gap: spacing.md, paddingVertical: spacing.xs },
  block: { minWidth: 160 },
});
