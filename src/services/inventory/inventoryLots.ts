import { inventoryAPI } from '@/api/inventory';
import { extractArray, extractPagination } from '@/utils/data';
import type { InventoryBalance } from '@/types/api';

export type InventoryLotSelection = {
  variant_id: string | null;
  batch_id: string | null;
  variant_sku?: string | null;
  batch_number?: string | null;
  system_quantity?: number;
};

function parseBalanceRow(r: InventoryBalance): InventoryLotSelection & { product_id: number } {
  const raw = r as Record<string, unknown>;
  const productId = Number(r.product_id ?? r.product?.id ?? 0);
  const variantId =
    raw.variant_id != null
      ? String(raw.variant_id)
      : r.variant?.id != null
        ? String(r.variant.id)
        : null;
  const batch = raw.batch as { id?: string; batch_number?: string } | null | undefined;
  const batchId =
    raw.batch_id != null ? String(raw.batch_id) : batch?.id != null ? String(batch.id) : null;
  return {
    product_id: productId,
    variant_id: variantId,
    batch_id: batchId,
    variant_sku: r.variant?.sku ?? null,
    batch_number: batch?.batch_number ?? null,
    system_quantity: Number(r.quantity ?? 0),
  };
}

export async function fetchBalancesForProductInWarehouse(
  warehouseId: string,
  productId: number,
): Promise<InventoryLotSelection[]> {
  const perPage = 100;
  let page = 1;
  const out: InventoryLotSelection[] = [];
  for (;;) {
    const res = await inventoryAPI.balances({
      warehouse_id: warehouseId,
      product_id: productId,
      page,
      per_page: perPage,
    });
    const chunk = extractArray<InventoryBalance>(res);
    for (const row of chunk) {
      const parsed = parseBalanceRow(row);
      out.push({
        variant_id: parsed.variant_id,
        batch_id: parsed.batch_id,
        variant_sku: parsed.variant_sku,
        batch_number: parsed.batch_number,
        system_quantity: parsed.system_quantity,
      });
    }
    const pagination = extractPagination(res);
    const last = pagination?.last_page ?? 1;
    if (page >= last) break;
    page += 1;
  }
  return out;
}

export function formatLotLabel(lot: InventoryLotSelection): string {
  const parts: string[] = [];
  if (lot.variant_sku) parts.push(`متغير: ${lot.variant_sku}`);
  else if (lot.variant_id) parts.push(`متغير #${lot.variant_id.slice(0, 8)}`);
  if (lot.batch_number) parts.push(`دفعة: ${lot.batch_number}`);
  else if (lot.batch_id) parts.push('دفعة');
  else parts.push('بدون دفعة');
  if (lot.system_quantity != null) parts.push(`رصيد: ${lot.system_quantity}`);
  return parts.join(' • ');
}
