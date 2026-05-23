import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBottomSheet } from '@/components/layout';
import { AppBadge, AppButton } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppLoadingState } from '@/components/feedback';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { diningAPI } from '@/api/dining';
import type { CartLine } from '@/store/posStore';
import type { Customer, DiningTable, SalePayload } from '@/types/api';
import { normalizeApiError } from '@/utils/errors';
import { numberText, money } from '@/utils/format';
import { tableStatusColor, tableStatusLabel, tableStatusTone } from '@/utils/diningTableStatus';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

type TableRow = DiningTable & {
  current_order?: { id?: number; total?: number | string; items?: unknown[] } | null;
  dining_hall?: { name?: string | null } | null;
};

type TableSelection = {
  id: string;
  name?: string | null;
  number?: string | null;
  hallName?: string | null;
  activeOrderId?: number | string | null;
};

type Props = {
  visible: boolean;
  branchId?: string | null;
  isOnline: boolean;
  cart: CartLine[];
  total: number;
  customer: Customer | null;
  selectedTableId?: string | null;
  onClose: () => void;
  onSelectTable: (table: TableSelection) => void;
  onLinked: (table: TableSelection) => void;
  onOpenTable: (table: { id: string; name?: string }) => void;
};

function saleItemsFromCart(cart: CartLine[]): SalePayload['items'] {
  return cart.map((line) => ({
    product_id: line.product_id,
    quantity: line.quantity,
    unit_price: line.unit_price,
    discount: line.discount,
    unit_id: line.unit_id ?? null,
    variant_id: line.variant_id ?? null,
    selected_options: line.selected_options?.map((group) => ({
      product_option_group_id: group.product_option_group_id,
      option_ids: group.options.map((option) => option.product_option_id),
    })),
  }));
}

export function PosTablesSheet({
  visible,
  branchId,
  isOnline,
  cart,
  total,
  customer,
  selectedTableId,
  onClose,
  onSelectTable,
  onLinked,
  onOpenTable,
}: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [status, setStatus] = useState<'all' | 'available' | 'occupied' | 'reserved' | 'closed'>('all');
  const [hallFilter, setHallFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!branchId || !visible) return;
    setLoading(true);
    setMessage(null);
    try {
      const response = await diningAPI.listTablesForBranch(branchId, status === 'all' ? undefined : status);
      const data = response.data as { tables?: TableRow[] } | TableRow[];
      setTables(Array.isArray(data) ? data : data.tables ?? []);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
      setTables([]);
    } finally {
      setLoading(false);
    }
  }, [branchId, status, visible]);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => ({
    all: tables.length,
    available: tables.filter((t) => t.status === 'available').length,
    occupied: tables.filter((t) => t.status === 'occupied' || t.current_order).length,
    reserved: tables.filter((t) => t.status === 'reserved').length,
    closed: tables.filter((t) => t.status === 'closed').length,
  }), [tables]);

  const halls = useMemo(() => {
    const names = new Set<string>();
    for (const table of tables) names.add(table.dining_hall?.name || 'غير مصنفة');
    return ['all', ...Array.from(names)];
  }, [tables]);

  const visibleTables = useMemo(
    () => tables.filter((table) => hallFilter === 'all' || (table.dining_hall?.name || 'غير مصنفة') === hallFilter),
    [hallFilter, tables],
  );

  const selectionFromTable = (table: TableRow): TableSelection => ({
    id: String(table.id),
    name: table.name ?? null,
    number: table.number != null ? String(table.number) : null,
    hallName: table.dining_hall?.name ?? null,
    activeOrderId: table.current_order?.id ?? null,
  });

  const tableName = (table: TableRow) => table.name || `طاولة ${table.number ?? table.id}`;

  const selectTableContext = (table: TableRow) => {
    onSelectTable(selectionFromTable(table));
    onClose();
  };

  const linkCart = async (table: TableRow) => {
    if (!table.id) return;
    if (!isOnline) {
      setMessage('ربط سلة POS بالطاولات يحتاج اتصالاً بالخادم لحجز المخزون ومنع التكرار.');
      return;
    }
    if (cart.length === 0) {
      onSelectTable(selectionFromTable(table));
      onClose();
      onOpenTable({ id: String(table.id), name: tableName(table) });
      return;
    }
    setBusyId(table.id);
    setMessage(null);
    try {
      await diningAPI.syncOrderDraft(table.id, {
        items: saleItemsFromCart(cart),
        total,
        customer_id: customer?.id ?? null,
      });
      onLinked(selectionFromTable(table));
      onClose();
      onOpenTable({ id: String(table.id), name: tableName(table) });
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: spacing.md }}>
        <PosSheetHeader
          title="طاولات POS"
          subtitle={cart.length ? `سيتم ربط السلة الحالية (${money(total)}) بالطاولة المحددة.` : 'اختر طاولة لفتح طلبها أو متابعة التحصيل.'}
        />
        {selectedTableId ? (
          <View style={s.walletBanner}>
            <MaterialIcons name="table-restaurant" size={18} color={c.info} />
            <Text style={s.walletText}>طاولة محددة حالياً داخل POS.</Text>
          </View>
        ) : null}
        {!isOnline ? (
          <View style={s.warningBanner}>
            <Text style={s.warningText}>
              وضع الطاولات غير متاح بدون اتصال: يجب حفظ طلب الطاولة على الخادم لحجز المخزون ومنع تكرار الطلب.
            </Text>
          </View>
        ) : null}
        {message ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{message}</Text>
          </View>
        ) : null}
        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
          {(['all', 'available', 'occupied', 'reserved', 'closed'] as const).map((key) => (
            <AppButton
              key={key}
              title={`${key === 'all' ? 'الكل' : tableStatusLabel(key)} (${numberText(counts[key])})`}
              size="sm"
              variant={status === key ? 'primary' : 'outline'}
              onPress={() => setStatus(key)}
            />
          ))}
        </View>
        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
          {halls.map((hall) => (
            <AppButton
              key={hall}
              title={hall === 'all' ? 'كل الصالات' : hall}
              size="sm"
              variant={hallFilter === hall ? 'primary' : 'outline'}
              onPress={() => setHallFilter(hall)}
            />
          ))}
        </View>
        {loading ? <AppLoadingState /> : null}
        {!loading && visibleTables.length === 0 ? <AppEmptyState title="لا توجد طاولات" /> : null}
        <View style={{ gap: spacing.sm }}>
          {visibleTables.map((table) => {
            const hasOrder = Boolean(table.current_order);
            const isSelected = selectedTableId != null && String(selectedTableId) === String(table.id);
            const disabled = table.status === 'closed' || busyId !== null;
            return (
              <Pressable
                key={table.id}
                disabled={disabled}
                onPress={() => selectTableContext(table)}
                style={{
                  borderWidth: 1,
                  borderColor: isSelected ? c.accent : tableStatusColor(hasOrder ? 'occupied' : String(table.status ?? 'available')),
                  borderRadius: radius.sm,
                  padding: spacing.md,
                  backgroundColor: c.surface,
                  opacity: disabled ? 0.55 : 1,
                  gap: spacing.xs,
                }}
              >
                <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ ...textStart, color: c.text, fontSize: typography.cardTitle, fontFamily: fonts.bold }}>
                      {tableName(table)}
                    </Text>
                    <Text style={{ ...textStart, color: c.textMuted, fontSize: typography.tiny }}>
                      {table.dining_hall?.name ?? 'غير مصنفة'} • {numberText(table.capacity ?? 0)} مقاعد
                    </Text>
                  </View>
                  <AppBadge
                    label={tableStatusLabel(hasOrder ? 'occupied' : String(table.status ?? 'available'))}
                    tone={tableStatusTone(hasOrder ? 'occupied' : String(table.status ?? 'available'))}
                  />
                  <MaterialIcons name="chevron-left" size={22} color={c.textMuted} />
                </View>
                {hasOrder ? (
                  <Text style={{ ...textStart, color: c.accent, fontSize: typography.tiny, fontFamily: fonts.bold }}>
                    طلب قائم #{table.current_order?.id ?? '—'} • {money(table.current_order?.total ?? 0)}
                  </Text>
                ) : null}
                {!isOnline ? (
                  <Text style={{ ...textStart, color: c.warning, fontSize: typography.tiny, fontFamily: fonts.bold }}>
                    ربط سلة POS بالطاولات يحتاج اتصالاً بالخادم لحفظ حالة الطاولة ومنع التكرار.
                  </Text>
                ) : null}
                <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
                  <AppButton
                    title={cart.length ? 'ربط السلة وفتح الطلب' : 'اختيار وفتح الطلب'}
                    size="sm"
                    onPress={() => void linkCart(table)}
                    disabled={table.status === 'closed' || !isOnline || busyId !== null}
                    loading={busyId === table.id}
                  />
                  <AppButton
                    title="اختيار فقط"
                    size="sm"
                    variant={isSelected ? 'success' : 'outline'}
                    onPress={() => selectTableContext(table)}
                    disabled={table.status === 'closed'}
                  />
                  {hasOrder ? (
                    <AppButton
                      title="فتح الطلب/التسوية"
                      size="sm"
                      variant="secondary"
                      onPress={() => {
                        onClose();
                        onOpenTable({ id: String(table.id), name: tableName(table) });
                      }}
                    />
                  ) : null}
                </View>
              </Pressable>
            );
          })}
        </View>
        <AppButton title="تحديث الطاولات" variant="secondary" onPress={() => void load()} loading={loading} fullWidth />
      </View>
    </AppBottomSheet>
  );
}
