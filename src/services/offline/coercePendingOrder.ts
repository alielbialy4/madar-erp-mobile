import type { SalePayload } from '@/types/api';
import type { OfflinePosOrderRecord } from '@/types/offline';

type LineItem = SalePayload['items'][number];

function parseJsonIfString(value: unknown): unknown {
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function normalizeLineItem(raw: unknown): LineItem | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Record<string, unknown>;
  const product_id = Number(r.product_id);
  const quantity = Number(r.quantity);
  const unit_price = Number(r.unit_price ?? r.price);
  if (!Number.isFinite(product_id) || product_id <= 0) return null;
  if (!Number.isFinite(quantity) || quantity <= 0) return null;
  if (!Number.isFinite(unit_price)) return null;

  const discount = Number(r.discount ?? 0);
  const unit_id = r.unit_id != null ? Number(r.unit_id) : null;
  const variant_id =
    r.variant_id != null && String(r.variant_id).trim() !== '' ? String(r.variant_id) : null;

  return {
    product_id,
    quantity,
    unit_id: unit_id != null && Number.isFinite(unit_id) ? unit_id : null,
    unit_price,
    discount: Number.isFinite(discount) ? discount : 0,
    variant_id,
    selected_options: Array.isArray(r.selected_options) ? (r.selected_options as LineItem['selected_options']) : undefined,
  };
}

function extractRawLineArrays(rec: Record<string, unknown>): unknown[] {
  const keys = ['items', 'lines', 'cart_items', 'order_items', 'sale_items', 'line_items'] as const;
  for (const key of keys) {
    let v = rec[key];
    v = parseJsonIfString(v);
    if (Array.isArray(v) && v.length > 0) return v;
    if (v != null && typeof v === 'object' && !Array.isArray(v)) {
      const vals = Object.values(v as Record<string, unknown>);
      if (vals.length > 0 && vals.every((x) => x != null && typeof x === 'object')) {
        return vals;
      }
    }
  }
  return [];
}

/**
 * Prepares a stored order for sync; returns null when no valid line items exist.
 */
export function coercePendingOrderForSync(raw: OfflinePosOrderRecord): OfflinePosOrderRecord | null {
  if (!raw?.client_uuid) return null;

  const rec = raw as unknown as Record<string, unknown>;
  const fromPayload = raw.payload && typeof raw.payload === 'object' ? (raw.payload as Record<string, unknown>) : {};
  const rawLines = extractRawLineArrays({ ...fromPayload, ...rec, items: raw.items });
  let items = rawLines.map(normalizeLineItem).filter((x): x is LineItem => x != null);

  if (items.length === 0 && Array.isArray(raw.items)) {
    items = raw.items.map(normalizeLineItem).filter((x): x is LineItem => x != null);
  }

  if (items.length === 0) return null;

  return {
    ...raw,
    items,
    payload: { ...raw.payload, items },
  };
}
