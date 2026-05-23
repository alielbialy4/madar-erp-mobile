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

type Props = {
  visible: boolean;
  branchId?: string | null;
  isOnline: boolean;
  cart: CartLine[];
  total: number;
  customer: Customer | null;
  onClose: () => void;
  onLinked: () => void;
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
  onClose,
  onLinked,
  onOpenTable,
}: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const [tables, setTables] = useState<TableRow[]>([]);
  const [status, setStatus] = useState<'all' | 'available' | 'occupied' | 'reserved' | 'closed'>('all');
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

  const linkCart = async (table: TableRow) => {
    if (!table.id) return;
    if (!isOnline) {
      setMessage('ربط سلة POS بالطاولات يحتاج اتصالاً بالخادم لحجز المخزون ومنع التكرار.');
      return;
    }
    if (cart.length === 0) {
      onClose();
      onOpenTable({ id: table.id, name: table.name ?? table.number ?? undefined });
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
      onLinked();
      onClose();
      onOpenTable({ id: table.id, name: table.name ?? table.number ?? undefined });
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
        {loading ? <AppLoadingState /> : null}
        {!loading && tables.length === 0 ? <AppEmptyState title="لا توجد طاولات" /> : null}
        <View style={{ gap: spacing.sm }}>
          {tables.map((table) => {
            const hasOrder = Boolean(table.current_order);
            const disabled = table.status === 'closed' || !isOnline || busyId !== null;
            return (
              <Pressable
                key={table.id}
                disabled={disabled}
                onPress={() => void linkCart(table)}
                style={{
                  borderWidth: 1,
                  borderColor: tableStatusColor(hasOrder ? 'occupied' : String(table.status ?? 'available')),
                  borderRadius: radius.xxl,
                  padding: spacing.md,
                  backgroundColor: c.surface,
                  opacity: disabled ? 0.55 : 1,
                  gap: spacing.xs,
                }}
              >
                <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={{ ...textStart, color: c.text, fontSize: typography.cardTitle, fontFamily: fonts.bold }}>
                      {table.name || `طاولة ${table.number ?? table.id}`}
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
              </Pressable>
            );
          })}
        </View>
        <AppButton title="تحديث الطاولات" variant="secondary" onPress={() => void load()} loading={loading} fullWidth />
      </View>
    </AppBottomSheet>
  );
}
