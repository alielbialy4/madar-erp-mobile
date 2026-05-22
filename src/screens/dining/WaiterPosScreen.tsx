import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { waiterAPI } from '@/api/waiter';
import { kitchenAPI } from '@/api/kitchen';
import { productsAPI } from '@/api/products';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppBadge, AppButton, AppCard, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { tableStatusColor, tableStatusLabel, tableStatusTone } from '@/utils/diningTableStatus';
import { extractArray } from '@/utils/data';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

type WaiterTable = {
  id: string;
  name: string;
  number?: string;
  capacity?: number;
  status: string;
  dining_hall?: { id: string; name: string };
  current_order?: { id: number; total?: number; status?: string } | null;
};

type CartLine = { product_id: number; name: string; quantity: number; notes?: string };

export function WaiterPosScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const [tables, setTables] = useState<WaiterTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<WaiterTable | null>(null);
  const [sheetMode, setSheetMode] = useState<'create' | 'add' | 'view' | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [productQuery, setProductQuery] = useState('');
  const [products, setProducts] = useState<{ id: number; name: string; selling_price: number }[]>([]);
  const [activeOrder, setActiveOrder] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [settleConfirm, setSettleConfirm] = useState(false);
  const [settlePaid, setSettlePaid] = useState('');

  const loadTables = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await waiterAPI.getTables();
      setTables(extractArray<WaiterTable>(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
    const t = setInterval(() => void loadTables(), 30000);
    return () => clearInterval(t);
  }, [loadTables]);

  const grouped = useMemo(() => {
    const map = new Map<string, WaiterTable[]>();
    for (const t of tables) {
      const hall = t.dining_hall?.name ?? 'غير مصنف';
      if (!map.has(hall)) map.set(hall, []);
      map.get(hall)!.push(t);
    }
    return [...map.entries()];
  }, [tables]);

  const loadProducts = async () => {
    try {
      const res = productQuery.trim()
        ? await productsAPI.search(productQuery.trim())
        : await productsAPI.getAll({ per_page: 24 });
      const rows = extractArray<Record<string, unknown>>(res);
      setProducts(
        rows
          .map((p) => ({ id: Number(p.id), name: String(p.name), selling_price: Number(p.selling_price ?? 0) }))
          .filter((p) => Number.isFinite(p.id) && p.name),
      );
    } catch {
      setProducts([]);
    }
  };

  const openTable = async (table: WaiterTable) => {
    setSelected(table);
    setMessage(null);
    if (table.status === 'available') {
      setCart([]);
      setSheetMode('create');
      void loadProducts();
      return;
    }
    if (table.status === 'occupied' && table.current_order?.id) {
      setSheetMode('view');
      setActiveOrder(null);
      try {
        const res = await kitchenAPI.getOrder(table.current_order.id);
        const order = (res.data as Record<string, unknown>) ?? null;
        setActiveOrder(order);
        setSettlePaid(String(order?.total ?? table.current_order.total ?? 0));
      } catch (err) {
        setMessage(normalizeApiError(err).message);
      }
      return;
    }
    setMessage('الطاولة غير متاحة لطلب جديد (محجوزة أو مغلقة).');
  };

  const addToCart = (p: { id: number; name: string }) => {
    setCart((prev) => {
      const idx = prev.findIndex((x) => x.product_id === p.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { product_id: p.id, name: p.name, quantity: 1 }];
    });
  };

  const submitCreate = async () => {
    if (!selected || cart.length === 0) return;
    setBusy(true);
    try {
      await waiterAPI.createOrder({
        table_id: selected.id,
        order_type: 'dine_in',
        items: cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity, notes: i.notes })),
      });
      setMessage('تم إنشاء الطلب وإرساله للمطبخ');
      setSheetMode(null);
      await loadTables();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const submitAddItems = async () => {
    if (!selected?.current_order?.id || cart.length === 0) return;
    setBusy(true);
    try {
      await waiterAPI.addToOrder(
        selected.current_order.id,
        cart.map((i) => ({ product_id: i.product_id, quantity: i.quantity, notes: i.notes })),
      );
      setMessage('تمت إضافة الأصناف');
      setSheetMode('view');
      setCart([]);
      const res = await kitchenAPI.getOrder(selected.current_order.id);
      setActiveOrder((res.data as Record<string, unknown>) ?? null);
      await loadTables();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const sendKitchen = async () => {
    const saleId = Number(activeOrder?.id ?? selected?.current_order?.id);
    if (!saleId) return;
    setBusy(true);
    try {
      await kitchenAPI.reprintOrder(saleId);
      setMessage('تم إرسال/إعادة طباعة تذكرة المطبخ');
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const settle = async () => {
    const orderId = Number(activeOrder?.id ?? selected?.current_order?.id);
    if (!orderId) return;
    setBusy(true);
    try {
      await waiterAPI.settleOrder(orderId, {
        payment_type: 'cash',
        paid: Number(settlePaid || 0),
      });
      setMessage('تم تحصيل الطلب');
      setSettleConfirm(false);
      setSheetMode(null);
      await loadTables();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="وضع النادل" subtitle="اختر طاولة — أضف أصناف — أرسل للمطبخ" onBack={navigation.goBack} refreshing={loading} onRefresh={loadTables}>
      {message ? <Text style={{ color: c.info, marginBottom: spacing.sm }}>{message}</Text> : null}
      {loading && tables.length === 0 ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={loadTables} /> : null}
      {!error
        ? grouped.map(([hall, hallTables]) => (
            <AppCard key={hall} style={{ marginBottom: spacing.md, gap: spacing.sm }}>
              <AppSectionHeader title={hall} />
              <View style={styles.grid}>
                {hallTables.map((table) => (
                  <Pressable
                    key={table.id}
                    onPress={() => void openTable(table)}
                    style={[styles.tile, { borderColor: tableStatusColor(table.status), backgroundColor: c.surface }]}
                  >
                    <Text style={{ fontWeight: '800', color: c.text }}>{table.name}</Text>
                    <AppBadge label={tableStatusLabel(table.status)} tone={tableStatusTone(table.status)} />
                    {table.current_order ? (
                      <Text style={{ fontSize: 11, color: c.accent }}>#{table.current_order.id}</Text>
                    ) : null}
                  </Pressable>
                ))}
              </View>
            </AppCard>
          ))
        : null}

      <AppBottomSheet visible={sheetMode !== null} onClose={() => setSheetMode(null)}>
        {sheetMode === 'create' || sheetMode === 'add' ? (
          <View style={{ gap: spacing.md, maxHeight: 520 }}>
            <AppSectionHeader title={sheetMode === 'create' ? `طلب جديد — ${selected?.name}` : `إضافة أصناف — ${selected?.name}`} />
            <AppInput value={productQuery} onChangeText={setProductQuery} placeholder="بحث عن صنف..." />
            <AppButton title="بحث" variant="secondary" onPress={() => void loadProducts()} />
            <FlatList
              data={products}
              keyExtractor={(p) => String(p.id)}
              style={{ maxHeight: 140 }}
              renderItem={({ item }) => (
                <Pressable onPress={() => addToCart(item)} style={styles.productRow}>
                  <Text style={{ flex: 1, color: c.text }}>{item.name}</Text>
                  <Text style={{ color: c.textMuted }}>{money(item.selling_price)}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<AppEmptyState title="لا أصناف" />}
            />
            <AppSectionHeader title="السلة" />
            {cart.map((line) => (
              <View key={line.product_id} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <AppListItem title={line.name} subtitle={`× ${numberText(line.quantity)}`} />
                </View>
                <AppButton title="+" variant="ghost" onPress={() => addToCart({ id: line.product_id, name: line.name })} />
                <AppButton
                  title="−"
                  variant="ghost"
                  onPress={() =>
                    setCart((prev) =>
                      prev
                        .map((x) => (x.product_id === line.product_id ? { ...x, quantity: Math.max(0, x.quantity - 1) } : x))
                        .filter((x) => x.quantity > 0),
                    )
                  }
                />
              </View>
            ))}
            <AppButton
              title={sheetMode === 'create' ? 'إنشاء وإرسال للمطبخ' : 'إضافة للطلب'}
              onPress={() => void (sheetMode === 'create' ? submitCreate() : submitAddItems())}
              loading={busy}
            />
          </View>
        ) : null}
        {sheetMode === 'view' && selected ? (
          <View style={{ gap: spacing.md }}>
            <AppSectionHeader title={`طاولة ${selected.name}`} />
            {!activeOrder ? <AppLoadingState /> : null}
            {activeOrder ? (
              <>
                {(activeOrder.items as Record<string, unknown>[] | undefined)?.map((it, i) => (
                  <AppListItem
                    key={String(it.id ?? i)}
                    title={String((it.product as Record<string, unknown>)?.name ?? 'صنف')}
                    subtitle={`× ${numberText(it.quantity)}`}
                  />
                ))}
                <Text style={{ fontWeight: '700', color: c.text }}>الإجمالي: {money(activeOrder.total ?? 0)}</Text>
                <AppButton title="إرسال للمطبخ / إعادة طباعة" variant="secondary" onPress={() => void sendKitchen()} loading={busy} />
                <AppButton title="إضافة أصناف" onPress={() => { setCart([]); setSheetMode('add'); void loadProducts(); }} />
                <AppButton title="تسوية لاحقاً من الطاولة" variant="ghost" onPress={() => navigation.navigate('DiningTableOrder', { tableId: selected.id, tableName: selected.name })} />
                <AppButton title="تحصيل نقدي" onPress={() => setSettleConfirm(true)} />
              </>
            ) : null}
          </View>
        ) : null}
      </AppBottomSheet>

      <ConfirmDialog
        visible={settleConfirm}
        title="تأكيد التحصيل"
        message={`تحصيل الطلب بمبلغ ${money(Number(settlePaid || 0))}`}
        confirmLabel="تحصيل"
        onConfirm={() => void settle()}
        onCancel={() => setSettleConfirm(false)}
        loading={busy}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  tile: { width: '30%', minWidth: 96, flexGrow: 1, borderWidth: 2, borderRadius: 10, padding: spacing.sm, alignItems: 'center', gap: 4 },
  productRow: { flexDirection: 'row', paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#e5e7eb' },
});
