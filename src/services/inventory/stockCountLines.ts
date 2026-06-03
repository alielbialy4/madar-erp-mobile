import { inventoryAPI } from '@/api/inventory';
import { extractArray, extractPagination } from '@/utils/data';
import type { InventoryBalance } from '@/types/api';

export type StockCountLineDraft = {
  key: string;
  product_id: number;
  variant_id: string | null;
  batch_id: string | null;
  product_name: string;
  system_quantity: number;
  counted_quantity: string;
  variant_sku?: string | null;
  batch_number?: string | null;
};

export function stockCountLineKey(productId: number, variantId: string | null, batchId: string | null): string {
  return `${productId}|${variantId ?? ''}|${batchId ?? ''}`;
}

export async function fetchAllBalancesForWarehouse(warehouseId: string): Promise<InventoryBalance[]> {
  const perPage = 100;
  let page = 1;
  const out: InventoryBalance[] = [];
  for (;;) {
    const res = await inventoryAPI.balances({ warehouse_id: warehouseId, page, per_page: perPage });
    const chunk = extractArray<InventoryBalance>(res);
    out.push(...chunk);
    const pagination = extractPagination(res);
    const last = pagination?.last_page ?? 1;
    if (page >= last) break;
    page += 1;
  }
  return out;
}

export function balancesToStockCountLines(rows: InventoryBalance[]): StockCountLineDraft[] {
  return rows.map((r) => {
    const productId = Number(r.product_id ?? r.product?.id ?? 0);
    const variantId = (r as Record<string, unknown>).variant_id != null
      ? String((r as Record<string, unknown>).variant_id)
      : r.variant?.id != null
        ? String(r.variant.id)
        : null;
    const batch = (r as Record<string, unknown>).batch as { id?: string; batch_number?: string } | null | undefined;
    const batchId = (r as Record<string, unknown>).batch_id != null
      ? String((r as Record<string, unknown>).batch_id)
      : batch?.id != null
        ? String(batch.id)
        : null;
    const qty = Number(r.quantity ?? 0);
    return {
      key: stockCountLineKey(productId, variantId, batchId),
      product_id: productId,
      variant_id: variantId,
      batch_id: batchId,
      product_name: r.product?.name ?? `منتج #${productId}`,
      system_quantity: qty,
      counted_quantity: String(qty),
      variant_sku: r.variant?.sku ?? null,
      batch_number: batch?.batch_number ?? null,
    };
  });
}

export function mergeStockCountLines(existing: StockCountLineDraft[], incoming: StockCountLineDraft[]): StockCountLineDraft[] {
  const map = new Map<string, StockCountLineDraft>();
  for (const line of existing) map.set(line.key, line);
  for (const line of incoming) {
    if (!map.has(line.key)) map.set(line.key, line);
  }
  return Array.from(map.values());
}
