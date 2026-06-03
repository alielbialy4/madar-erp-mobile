import React, { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { useColors } from '@/hooks/useColors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { spacing } from '@/constants/spacing';
import type { ProductListFilters } from '@/components/lists/ListFiltersBar';
import { Text } from '@/components/ui/AppText';

type CategoryOption = { id: number; name: string };

type Props = {
  categories: CategoryOption[];
  filters: ProductListFilters;
  onChange: (next: ProductListFilters) => void;
  resultCount: number;
  layout?: 'inline' | 'sidebar';
  rawMaterialMode?: boolean;
};

const RAW_ROLE_PILLS: { key: string | null; label: string }[] = [
  { key: null, label: 'كل الخامات' },
  { key: 'raw_material', label: 'خامات' },
  { key: 'packaging_material', label: 'تعبئة' },
  { key: 'semi_finished', label: 'نصف مُصنّع' },
];

const RAW_STATUS_PILLS: { key: ProductListFilters['raw_status'] | 'all'; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'low', label: 'منخفض' },
  { key: 'expiry', label: 'صلاحية/دفعات' },
  { key: 'inactive', label: 'غير نشط' },
];

export function ProductFiltersPanel({ categories, filters, onChange, resultCount, layout = 'inline', rawMaterialMode = false }: Props) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);

  const stockPills: { key: ProductListFilters['stock_status'] | 'all'; label: string }[] = [
    { key: 'all', label: 'كل المخزون' },
    { key: 'low', label: 'منخفض' },
    { key: 'out', label: 'نفد' },
  ];

  const featuredPills: { key: ProductListFilters['featured'] | 'all'; label: string }[] = [
    { key: 'all', label: 'الكل' },
    { key: '1', label: 'مميز' },
    { key: '0', label: 'عادي' },
  ];

  const isSidebar = layout === 'sidebar';

  const categoryBlock = (
    <ScrollView
      horizontal={!isSidebar}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={isSidebar ? { gap: spacing.sm } : cs.filterScroll}
      style={isSidebar ? { maxHeight: 200 } : undefined}
    >
        <Pressable
          onPress={() => onChange({ ...filters, category_id: null })}
          style={[cs.filterPill, !filters.category_id && cs.filterPillActive]}
        >
          <Text style={[cs.filterText, !filters.category_id && cs.filterTextActive]}>كل التصنيفات</Text>
        </Pressable>
        {categories.map((cat) => {
          const active = filters.category_id === String(cat.id);
          return (
            <Pressable
              key={cat.id}
              onPress={() => onChange({ ...filters, category_id: active ? null : String(cat.id) })}
              style={[cs.filterPill, active && cs.filterPillActive]}
            >
              <Text style={[cs.filterText, active && cs.filterTextActive]} numberOfLines={1}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
    </ScrollView>
  );

  return (
    <View style={{ gap: spacing.sm, ...(isSidebar ? { flex: 1 } : {}) }}>
      {rawMaterialMode ? (
        <>
          {isSidebar ? <Text style={[cs.sectionLabel, { fontSize: 14 }]}>نوع الخامة</Text> : null}
          <View style={isSidebar ? { gap: spacing.sm } : ui.chipsWrap}>
            {RAW_ROLE_PILLS.map((p) => {
              const active = (p.key == null && !filters.product_role) || filters.product_role === p.key;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => onChange({ ...filters, product_role: p.key })}
                  style={[cs.filterPill, active && cs.filterPillActive]}
                >
                  <Text style={[cs.filterText, active && cs.filterTextActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
          {isSidebar ? <Text style={[cs.sectionLabel, { fontSize: 14 }]}>الحالة</Text> : null}
          <View style={isSidebar ? { gap: spacing.sm } : ui.chipsWrap}>
            {RAW_STATUS_PILLS.map((p) => {
              const active = (p.key === 'all' && !filters.raw_status) || filters.raw_status === p.key;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => onChange({ ...filters, raw_status: p.key === 'all' ? null : p.key })}
                  style={[cs.filterPill, active && cs.filterPillActive]}
                >
                  <Text style={[cs.filterText, active && cs.filterTextActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </>
      ) : null}
      {!rawMaterialMode && isSidebar ? (
        <Text style={[cs.sectionLabel, { fontSize: 14, marginBottom: spacing.xs }]}>التصنيفات</Text>
      ) : null}
      {!rawMaterialMode ? categoryBlock : null}

      {!rawMaterialMode && isSidebar ? <Text style={[cs.sectionLabel, { fontSize: 14 }]}>المخزون</Text> : null}
      {!rawMaterialMode ? (
      <View style={isSidebar ? { gap: spacing.sm } : ui.chipsWrap}>
        {stockPills.map((p) => {
          const active = (p.key === 'all' && !filters.stock_status) || filters.stock_status === p.key;
          return (
            <Pressable
              key={p.label}
              onPress={() => onChange({ ...filters, stock_status: p.key === 'all' ? null : p.key })}
              style={[cs.filterPill, active && cs.filterPillActive]}
            >
              <Text style={[cs.filterText, active && cs.filterTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
      ) : null}

      {!rawMaterialMode && isSidebar ? <Text style={[cs.sectionLabel, { fontSize: 14 }]}>التمييز</Text> : null}
      {!rawMaterialMode ? (
      <View style={isSidebar ? { gap: spacing.sm } : ui.chipsWrap}>
        {featuredPills.map((p) => {
          const active = (p.key === 'all' && !filters.featured) || filters.featured === p.key;
          return (
            <Pressable
              key={p.label}
              onPress={() => onChange({ ...filters, featured: p.key === 'all' ? null : p.key })}
              style={[cs.filterPill, active && cs.filterPillActive]}
            >
              <Text style={[cs.filterText, active && cs.filterTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>
      ) : null}

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
          {resultCount} {rawMaterialMode ? 'خامة' : 'منتج'}
        </Text>
      </View>
    </View>
  );
}
