import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { useColors } from '@/hooks/useColors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { AppSelect, AppDateRangePicker } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { warehousesAPI } from '@/api/inventory';
import { extractArray } from '@/utils/data';
import { spacing } from '@/constants/spacing';
import type { InventoryListFilters, WarehouseStatusFilter } from '@/constants/inventoryLayout';
import type { InventoryFilterKey, InventoryListSurface } from '@/components/inventory/inventoryListPresets';
import { useInventoryScope } from '@/hooks/useInventoryScope';
import { Text } from '@/components/ui/AppText';

type Props = {
  surface: InventoryListSurface;
  filters: InventoryListFilters;
  onChange: (next: InventoryListFilters) => void;
  resultCount: number;
  supportedFilters: InventoryFilterKey[];
  layout?: 'inline' | 'sidebar';
  showResultCount?: boolean;
  lockedWarehouseId?: string;
};

const WAREHOUSE_STATUS_PILLS: { key: WarehouseStatusFilter; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'active', label: 'نشط' },
  { key: 'inactive', label: 'غير نشط' },
];

const DOC_STATUS_OPTIONS: SelectOption[] = [
  { label: 'كل الحالات', value: '' },
  { label: 'مسودة', value: 'draft' },
  { label: 'معلّق', value: 'pending' },
  { label: 'مكتمل', value: 'completed' },
  { label: 'ملغى', value: 'cancelled' },
  { label: 'قيد النقل', value: 'in_transit' },
  { label: 'مُرحّل', value: 'posted' },
];

const MOVEMENT_TYPES: SelectOption[] = [
  { label: 'كل الأنواع', value: '' },
  { label: 'بيع', value: 'sale' },
  { label: 'مرتجع', value: 'refund' },
  { label: 'شراء', value: 'purchase' },
  { label: 'تحويل', value: 'transfer' },
  { label: 'تسوية', value: 'adjustment' },
  { label: 'جرد', value: 'stock_count' },
];

const DIRECTION_OPTIONS: SelectOption[] = [
  { label: 'كل الاتجاهات', value: '' },
  { label: 'إدخال', value: 'in' },
  { label: 'إخراج', value: 'out' },
];

const STOCK_STATUS_OPTIONS: SelectOption[] = [
  { label: 'كل الحالات', value: '' },
  { label: 'متوفر', value: 'in' },
  { label: 'منخفض', value: 'low' },
  { label: 'نفد', value: 'out' },
];

export function InventoryFiltersPanel({
  surface,
  filters,
  onChange,
  resultCount,
  supportedFilters,
  layout = 'inline',
  showResultCount = true,
  lockedWarehouseId,
}: Props) {
  const c = useColors();
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const { isGlobalView, effectiveBranchId } = useInventoryScope();
  const isSidebar = layout === 'sidebar';
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);

  const has = (key: InventoryFilterKey) => supportedFilters.includes(key);
  const supportsWarehouse = supportedFilters.includes('warehouse_id');

  useEffect(() => {
    if (!supportsWarehouse) return;
    const params: Record<string, unknown> = { per_page: 100, status: 'active' };
    if (!isGlobalView && effectiveBranchId) params.branch_id = effectiveBranchId;
    void warehousesAPI.list(params).then((res) => {
      const list = extractArray<Record<string, unknown>>(res);
      setWarehouses([
        { label: 'كل المخازن', value: '' },
        ...list.map((w) => ({ label: String(w.name), value: String(w.id) })),
      ]);
    });
  }, [isGlobalView, effectiveBranchId, supportsWarehouse]);

  const warehouseValue = lockedWarehouseId ?? filters.warehouse_id ?? '';

  return (
    <View style={{ gap: spacing.md, ...(isSidebar ? { flex: 1 } : {}) }}>
      {has('status') && surface === 'warehouses' ? (
        <View style={{ gap: spacing.sm }}>
          {isSidebar ? <Text style={[cs.sectionLabel, { fontSize: 14 }]}>الحالة</Text> : null}
          <View style={isSidebar ? { gap: spacing.sm } : ui.chipsWrap}>
            {WAREHOUSE_STATUS_PILLS.map((p) => {
              const active = (filters.status ?? 'all') === p.key;
              return (
                <Pressable
                  key={p.key}
                  onPress={() => onChange({ ...filters, status: p.key === 'all' ? null : p.key })}
                  style={[cs.filterPill, active && cs.filterPillActive]}
                >
                  <Text style={[cs.filterText, active && cs.filterTextActive]}>{p.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      ) : null}

      {has('status') && surface !== 'warehouses' ? (
        <AppSelect
          label="الحالة"
          value={filters.status ?? ''}
          options={DOC_STATUS_OPTIONS}
          onChange={(v) => onChange({ ...filters, status: v || null })}
        />
      ) : null}

      {has('warehouse_id') && warehouses.length > 0 ? (
        <AppSelect
          label="المخزن"
          value={warehouseValue || null}
          options={warehouses}
          onChange={(v) => {
            if (lockedWarehouseId) return;
            onChange({ ...filters, warehouse_id: v || null });
          }}
        />
      ) : null}

      {has('movement_type') ? (
        <AppSelect
          label="نوع الحركة"
          value={filters.movement_type ?? ''}
          options={MOVEMENT_TYPES}
          onChange={(v) => onChange({ ...filters, movement_type: v || null })}
        />
      ) : null}

      {has('direction') ? (
        <AppSelect
          label="الاتجاه"
          value={filters.direction ?? ''}
          options={DIRECTION_OPTIONS}
          onChange={(v) => onChange({ ...filters, direction: v || null })}
        />
      ) : null}

      {has('low_stock_only') ? (
        <Pressable
          onPress={() => onChange({ ...filters, low_stock_only: !filters.low_stock_only })}
          style={[cs.filterPill, filters.low_stock_only && cs.filterPillActive]}
        >
          <Text style={[cs.filterText, filters.low_stock_only && cs.filterTextActive]}>مخزون منخفض فقط</Text>
        </Pressable>
      ) : null}

      {has('near_expiry_only') ? (
        <Pressable
          onPress={() => onChange({ ...filters, near_expiry_only: !filters.near_expiry_only, expired_only: false })}
          style={[cs.filterPill, filters.near_expiry_only && cs.filterPillActive]}
        >
          <Text style={[cs.filterText, filters.near_expiry_only && cs.filterTextActive]}>قريب الانتهاء</Text>
        </Pressable>
      ) : null}

      {has('expired_only') ? (
        <Pressable
          onPress={() => onChange({ ...filters, expired_only: !filters.expired_only, near_expiry_only: false })}
          style={[cs.filterPill, filters.expired_only && cs.filterPillActive]}
        >
          <Text style={[cs.filterText, filters.expired_only && cs.filterTextActive]}>منتهي الصلاحية</Text>
        </Pressable>
      ) : null}

      {has('stock_status') ? (
        <AppSelect
          label="حالة المخزون"
          value={filters.stock_status ?? ''}
          options={STOCK_STATUS_OPTIONS}
          onChange={(v) => onChange({ ...filters, stock_status: v || null })}
        />
      ) : null}

      {has('date_from') || has('date_to') ? (
        <AppDateRangePicker
          title="الفترة"
          fromDate={filters.date_from ?? ''}
          toDate={filters.date_to ?? ''}
          onChangeFrom={(v) => onChange({ ...filters, date_from: v || null })}
          onChangeTo={(v) => onChange({ ...filters, date_to: v || null })}
        />
      ) : null}

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
            {resultCount} نتيجة
          </Text>
        </View>
      ) : null}
    </View>
  );
}
