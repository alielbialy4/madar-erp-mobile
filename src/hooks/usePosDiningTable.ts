import { useCallback, useRef, useState } from 'react';
import { diningAPI } from '@/api/dining';
import type { Coupon, Customer } from '@/types/api';
import {
  getTableCartsRecord,
  removeTableCartEntry,
  setTableCartsRecord,
  type TableCartSnapshot,
} from '@/services/pos/tableCarts';
import {
  markTableLocallyAvailable,
  markTableLocallyOccupied,
} from '@/services/pos/locallyOccupiedTables';
import type { CartLine } from '@/store/posStore';
import {
  diningTableDisplayName,
  saleToCartLines,
  type PosDiningTableSelection,
} from '@/utils/posDining';
import { extractData } from '@/utils/data';

type AppliedCoupon = { coupon: Coupon; discount: number } | null;

type Args = {
  online: boolean;
  lines: CartLine[];
  cartDiscount: number;
  selectedCustomer: Customer | null;
  appliedCoupon: AppliedCoupon;
  clearCartContext: () => void;
  restoreCart: (snapshot: {
    lines: CartLine[];
    cartDiscount: number;
    customer: Customer | null;
    appliedCoupon: AppliedCoupon;
  }) => void;
  onLocallyOccupiedChange?: (ids: string[]) => void;
};

export function usePosDiningTable({
  online,
  lines,
  cartDiscount,
  selectedCustomer,
  appliedCoupon,
  clearCartContext,
  restoreCart,
  onLocallyOccupiedChange,
}: Args) {
  const [selectedTable, setSelectedTableRaw] = useState<PosDiningTableSelection | null>(null);
  const [switching, setSwitching] = useState(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  const saveCartForCurrentTable = useCallback(async () => {
    if (!selectedTable?.id || linesRef.current.length === 0) return;
    const map = await getTableCartsRecord();
    map[selectedTable.id] = {
      lines: linesRef.current,
      cartDiscount,
      customer: selectedCustomer,
      appliedCoupon,
    };
    await setTableCartsRecord(map);
    const ids = await markTableLocallyOccupied(selectedTable.id);
    onLocallyOccupiedChange?.(ids);
  }, [selectedTable, cartDiscount, selectedCustomer, appliedCoupon, onLocallyOccupiedChange]);

  const removeCartForTable = useCallback(async (tableId: string) => {
    await removeTableCartEntry(tableId);
  }, []);

  const releaseLocalTable = useCallback(async (tableId: string) => {
    await removeTableCartEntry(tableId);
    const ids = await markTableLocallyAvailable(tableId);
    onLocallyOccupiedChange?.(ids);
  }, [onLocallyOccupiedChange]);

  const loadCartForTable = useCallback(async (tableId: string): Promise<TableCartSnapshot | null> => {
    const map = await getTableCartsRecord();
    return map[tableId] ?? null;
  }, []);

  const setDiningTable = useCallback(
    async (table: PosDiningTableSelection | null, options?: { forceRelease?: boolean }) => {
      const skipSavingCurrentTable = options?.forceRelease === true;
      const hadLinesBeforeClear = linesRef.current.length > 0;
      const previousTableId = selectedTable?.id ?? null;

      setSwitching(true);
      try {
        if (previousTableId && previousTableId !== table?.id && !skipSavingCurrentTable) {
          await saveCartForCurrentTable();
        }

        clearCartContext();

        let nextTable = table;

        if (table?.id) {
          const cached = await loadCartForTable(table.id);
          let restored = false;

          if (online) {
            try {
              const response = await diningAPI.getActiveOrder(table.id);
              const sale = extractData<Record<string, unknown>>(response);
              const saleItems = Array.isArray(sale?.items) ? sale.items : [];
              if (saleItems.length > 0) {
                restoreCart({
                  lines: saleToCartLines(sale),
                  cartDiscount: 0,
                  customer: (sale?.customer as Customer | null) ?? null,
                  appliedCoupon: null,
                });
                nextTable = {
                  ...table,
                  activeOrderId: sale?.id as number | string | null,
                  printSequence: (sale?.print_sequence as number | string | null) ?? null,
                  invoiceNumber: sale?.invoice_number != null ? String(sale.invoice_number) : null,
                };
                await removeCartForTable(table.id);
                const ids = await markTableLocallyOccupied(table.id);
                onLocallyOccupiedChange?.(ids);
                restored = true;
              }
            } catch {
              /* ignore — fall back to cache */
            }
          }

          if (!restored && cached && cached.lines.length > 0) {
            restoreCart({
              lines: cached.lines,
              cartDiscount: cached.cartDiscount || 0,
              customer: cached.customer,
              appliedCoupon: cached.appliedCoupon ?? null,
            });
            await removeCartForTable(table.id);
            const ids = await markTableLocallyOccupied(table.id);
            onLocallyOccupiedChange?.(ids);
          }
        } else if (previousTableId) {
          const shouldRelease = skipSavingCurrentTable || !hadLinesBeforeClear;
          if (shouldRelease && online) {
            diningAPI.releaseForPos(previousTableId).catch(() => {});
          }
          if (shouldRelease) {
            const ids = await markTableLocallyAvailable(previousTableId);
            onLocallyOccupiedChange?.(ids);
          }
        }

        setSelectedTableRaw(nextTable);
      } finally {
        setSwitching(false);
      }
    },
    [
      selectedTable,
      saveCartForCurrentTable,
      clearCartContext,
      loadCartForTable,
      online,
      restoreCart,
      removeCartForTable,
      onLocallyOccupiedChange,
    ],
  );

  const updateTableMeta = useCallback((patch: Partial<PosDiningTableSelection>) => {
    setSelectedTableRaw((prev) => (prev ? { ...prev, ...patch } : prev));
  }, []);

  const transferDiningTable = useCallback(
    async (sourceId: string, target: PosDiningTableSelection) => {
      const map = await getTableCartsRecord();
      delete map[sourceId];
      delete map[target.id];
      await setTableCartsRecord(map);
      await markTableLocallyAvailable(sourceId);
      await markTableLocallyOccupied(target.id);

      if (selectedTable?.id === sourceId) {
        let nextTable: PosDiningTableSelection = {
          id: target.id,
          name: target.name,
          number: target.number ?? null,
          hallName: target.hallName ?? null,
        };
        if (online) {
          try {
            const response = await diningAPI.getActiveOrder(target.id);
            const sale = extractData<Record<string, unknown>>(response);
            const saleItems = Array.isArray(sale?.items) ? sale.items : [];
            if (saleItems.length > 0) {
              restoreCart({
                lines: saleToCartLines(sale),
                cartDiscount: 0,
                customer: (sale?.customer as Customer | null) ?? null,
                appliedCoupon: null,
              });
              nextTable = {
                ...nextTable,
                activeOrderId: sale?.id as number | string | null,
                printSequence: (sale?.print_sequence as number | string | null) ?? null,
                invoiceNumber: sale?.invoice_number != null ? String(sale.invoice_number) : null,
              };
              setSelectedTableRaw(nextTable);
              return;
            }
          } catch {
            /* fall through */
          }
        }
        restoreCart({
          lines: linesRef.current,
          cartDiscount,
          customer: selectedCustomer,
          appliedCoupon,
        });
        setSelectedTableRaw({
          ...nextTable,
          activeOrderId: selectedTable.activeOrderId ?? null,
          printSequence: selectedTable.printSequence ?? null,
          invoiceNumber: selectedTable.invoiceNumber ?? null,
        });
      }
    },
    [
      selectedTable,
      online,
      restoreCart,
      cartDiscount,
      selectedCustomer,
      appliedCoupon,
      setSelectedTableRaw,
    ],
  );

  const mergeDiningTable = useCallback(
    async (sourceId: string, target: PosDiningTableSelection) => {
      const sourceLines = selectedTable?.id === sourceId ? linesRef.current : [];
      const map = await getTableCartsRecord();
      const cachedTarget = map[target.id] ?? null;
      delete map[sourceId];
      delete map[target.id];
      await setTableCartsRecord(map);

      let targetLines = cachedTarget?.lines ?? [];
      let nextTarget: PosDiningTableSelection = {
        id: target.id,
        name: target.name,
        number: target.number ?? null,
        hallName: target.hallName ?? null,
      };

      if (online) {
        try {
          const response = await diningAPI.getActiveOrder(target.id);
          const sale = extractData<Record<string, unknown>>(response);
          const saleItems = Array.isArray(sale?.items) ? sale.items : [];
          if (saleItems.length > 0) {
            targetLines = saleToCartLines(sale);
            nextTarget = {
              ...nextTarget,
              activeOrderId: sale?.id as number | string | null,
              printSequence: (sale?.print_sequence as number | string | null) ?? null,
              invoiceNumber: sale?.invoice_number != null ? String(sale.invoice_number) : null,
            };
          }
        } catch {
          /* keep cached */
        }
      }

      if (selectedTable?.id === sourceId) {
        restoreCart({
          lines: [...targetLines, ...sourceLines],
          cartDiscount: cachedTarget?.cartDiscount || 0,
          customer: cachedTarget?.customer ?? null,
          appliedCoupon: cachedTarget?.appliedCoupon ?? null,
        });
        setSelectedTableRaw(nextTarget);
      }

      await markTableLocallyAvailable(sourceId);
      await markTableLocallyOccupied(target.id);
    },
    [selectedTable?.id, online, restoreCart, setSelectedTableRaw],
  );

  const selectedTableName = selectedTable ? diningTableDisplayName(selectedTable) : null;

  return {
    selectedTable,
    selectedTableName,
    switching,
    setDiningTable,
    updateTableMeta,
    saveCartForCurrentTable,
    removeCartForTable,
    releaseLocalTable,
    transferDiningTable,
    mergeDiningTable,
  };
}
