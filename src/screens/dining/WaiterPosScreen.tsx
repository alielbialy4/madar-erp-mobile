import React, { useCallback, useEffect, useState } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { waiterAPI } from '@/api/waiter';
import { kitchenPrintJobsAPI } from '@/api/kitchenPrintJobs';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { ConfirmDialog, AppErrorState, AppLoadingState } from '@/components/feedback';
import { WaiterOrderViewSheet } from '@/components/waiter/WaiterOrderViewSheet';
import { AppText as Text } from '@/components/ui/AppText';
import { WaiterOrderPickerSheet } from '@/components/waiter/WaiterOrderPickerSheet';
import { WaiterTablesGrid, type WaiterTableRow } from '@/components/waiter/WaiterTablesGrid';
import { useWaiterCart } from '@/hooks/useWaiterCart';
import { extractArray } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { waiterLinesToApiItems } from '@/utils/waiterCartApi';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { usePosStore } from '@/store/posStore';

function tableDisplayName(table: WaiterTableRow): string {
  const linked = table.linked_table_sources ?? [];
  if (linked.length === 0) return table.name;
  return [table.name, ...linked.map((l) => l.name)].join(' + ');
}

export function WaiterPosScreen({ navigation }: { navigation: any }) {
  const isFocused = useIsFocused();
  const c = useColors();
  const catalogProducts = usePosStore((s) => s.products);
  const [tables, setTables] = useState<WaiterTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [selected, setSelected] = useState<WaiterTableRow | null>(null);
  const [sheetMode, setSheetMode] = useState<'create' | 'add' | 'view' | null>(null);
  const {
    cart,
    clearCart,
    addProduct,
    updateQuantity,
    removeLine,
    setLineNotes,
  } = useWaiterCart();
  const [activeOrder, setActiveOrder] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);
  const [settleConfirm, setSettleConfirm] = useState(false);
  const [settlePaid, setSettlePaid] = useState('');
  const [settlePaymentType] = useState<'cash' | 'card' | 'credit' | 'layaway'>('cash');

  const pickerOpen = sheetMode === 'create' || sheetMode === 'add';

  const loadTables = useCallback(async (opts?: { silent?: boolean }) => {
    const silent = opts?.silent === true;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await waiterAPI.getTables();
      setTables(extractArray<WaiterTableRow>(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isFocused) return;
    void loadTables();
    const t = setInterval(() => void loadTables({ silent: true }), 30000);
    return () => clearInterval(t);
  }, [loadTables, isFocused]);

  const closePicker = () => {
    setSheetMode(null);
    clearCart();
  };

  const closeView = () => {
    setSheetMode(null);
    setSelected(null);
    setActiveOrder(null);
  };

  const openTable = async (table: WaiterTableRow) => {
    setSelected(table);
    setMessage(null);
    if (table.status === 'available') {
      clearCart();
      setSheetMode('create');
      return;
    }
    if (table.status === 'reserved' || table.status === 'closed') {
      setSheetMode(null);
      setActiveOrder(null);
      setMessage(
        table.status === 'reserved'
          ? 'الطاولة محجوزة — لا يمكن فتح طلب جديد.'
          : 'الطاولة مغلقة.',
      );
      return;
    }
    if (table.status === 'occupied' && table.current_order?.id) {
      setSheetMode('view');
      setActiveOrder(null);
      try {
        const res = await waiterAPI.showOrder(table.current_order.id);
        const order = (res.data as Record<string, unknown>) ?? null;
        setActiveOrder(order);
        setSettlePaid(String(order?.total ?? table.current_order.total ?? 0));
      } catch (err) {
        setMessage(normalizeApiError(err).message);
      }
      return;
    }
    setMessage('الطاولة غير متاحة لطلب جديد.');
  };

  const handleReleasedTable = useCallback((tableId: string) => {
    if (selected?.id === tableId) {
      setSheetMode(null);
      setSelected(null);
      setActiveOrder(null);
    }
  }, [selected?.id]);

  const submitCreate = async () => {
    if (!selected || cart.length === 0) return;
    setBusy(true);
    try {
      const res = await waiterAPI.createOrder({
        table_id: selected.id,
        order_type: 'dine_in',
        items: waiterLinesToApiItems(cart, catalogProducts),
      });
      const saleId = Number((res.data as Record<string, unknown>)?.id);
      if (Number.isFinite(saleId) && saleId > 0) {
        try {
          await kitchenPrintJobsAPI.reprintOrder(saleId);
        } catch {
          // optional
        }
      }
      setMessage('تم إنشاء الطلب وإرساله للمطبخ');
      closePicker();
      setSelected(null);
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
      await waiterAPI.addToOrder(selected.current_order.id, waiterLinesToApiItems(cart, catalogProducts));
      setMessage('تمت إضافة الأصناف');
      clearCart();
      setSheetMode('view');
      const res = await waiterAPI.showOrder(selected.current_order.id);
      setActiveOrder((res.data as Record<string, unknown>) ?? null);
      try {
        await kitchenPrintJobsAPI.reprintOrder(selected.current_order.id);
      } catch {
        // optional
      }
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
      await kitchenPrintJobsAPI.reprintOrder(saleId);
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
        payment_type: settlePaymentType,
        paid: Number(settlePaid || 0),
      });
      setMessage('تم تحصيل الطلب');
      setSettleConfirm(false);
      closeView();
      await loadTables();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen
      title="وضع النادل"
      subtitle="اختر طاولة · اسحب للدمج أو النقل"
      onBack={navigation.goBack}
      refreshing={loading}
      onRefresh={() => void loadTables()}
    >
      {message ? <Text style={{ color: c.info, marginBottom: spacing.sm }}>{message}</Text> : null}
      {error ? <AppErrorState message={error} onRetry={() => void loadTables()} /> : null}
      {!error ? (
        <WaiterTablesGrid
          tables={tables}
          loading={loading}
          selectedTableId={selected?.id ?? null}
          onSelectTable={(table) => void openTable(table)}
          onTablesChanged={() => loadTables()}
          onMessage={setMessage}
          onReleasedTable={handleReleasedTable}
        />
      ) : null}

      <WaiterOrderPickerSheet
        visible={pickerOpen}
        mode={sheetMode === 'add' ? 'add' : 'create'}
        tableName={selected ? tableDisplayName(selected) : ''}
        busy={busy}
        cart={cart}
        onAddProduct={addProduct}
        onUpdateQty={updateQuantity}
        onRemoveLine={removeLine}
        onLineNotesChange={setLineNotes}
        onClose={closePicker}
        onSubmit={() => void (sheetMode === 'create' ? submitCreate() : submitAddItems())}
      />

      <AppBottomSheet visible={sheetMode === 'view'} onClose={closeView} size="wide">
        {sheetMode === 'view' && selected ? (
          !activeOrder ? (
            <AppLoadingState />
          ) : (
            <WaiterOrderViewSheet
              tableName={tableDisplayName(selected)}
              order={activeOrder}
              busy={busy}
              canSettle={!['completed', 'cancelled'].includes(String(activeOrder.status ?? ''))}
              onClose={closeView}
              onStartAdd={() => {
                clearCart();
                setSheetMode('add');
              }}
              onSendKitchen={() => void sendKitchen()}
              onSettle={() => setSettleConfirm(true)}
              onOpenTableOrder={() =>
                navigation.navigate('DiningTableOrder', {
                  tableId: selected.id,
                  tableName: selected.name,
                })
              }
            />
          )
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
