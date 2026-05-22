import { extractArray, extractData, extractPagination } from '@/utils/data';
import type { PaginationMeta } from '@/types/api';

export const REPORT_FALLBACK = {
  unspecified: 'غير محدد',
  deletedProduct: 'منتج محذوف',
  unspecifiedCustomer: 'عميل غير محدد',
  unspecifiedSupplier: 'مورد غير محدد',
  unspecifiedCashier: 'كاشير غير محدد',
  unspecifiedDriver: 'سائق غير محدد',
  unspecifiedWaiter: 'نادل غير محدد',
} as const;

const NAME_KEYS = [
  'name',
  'product_name',
  'customer_name',
  'supplier_name',
  'cashier_name',
  'waiter_name',
  'driver_name',
  'warehouse_name',
  'branch_name',
  'category_name',
  'title',
  'label',
];

export function reportName(value: unknown, fallback: string = REPORT_FALLBACK.unspecified): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function reportAmount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

export function reportRows(payload: unknown, keys: string[]): Record<string, unknown>[] {
  if (!payload) return [];
  const data = extractData<Record<string, unknown>>(payload as never);
  const root = (data ?? payload) as Record<string, unknown>;
  if (!root || typeof root !== 'object') return [];
  for (const key of keys) {
    const candidate = root[key];
    if (Array.isArray(candidate)) return normalizeReportRows(candidate as Record<string, unknown>[]);
  }
  const direct = extractArray<Record<string, unknown>>(payload);
  if (direct.length) return normalizeReportRows(direct);
  if (Array.isArray(root)) return normalizeReportRows(root as Record<string, unknown>[]);
  return [];
}

export function extractArrayFromEnvelope(payload: unknown): Record<string, unknown>[] {
  if (!payload) return [];
  const data = extractData<unknown>(payload as never) ?? (payload as { data?: unknown }).data;
  if (Array.isArray(data)) return normalizeReportRows(data as Record<string, unknown>[]);
  return [];
}

export function reportSummary(payload: unknown): Record<string, unknown> {
  if (!payload) return {};
  const data = extractData<Record<string, unknown>>(payload as never);
  const root = (data ?? payload) as Record<string, unknown>;
  if (!root || typeof root !== 'object') return {};
  if (root.summary && typeof root.summary === 'object') {
    return normalizeMetrics(root.summary as Record<string, unknown>);
  }
  return normalizeMetrics(root);
}

export function reportPagination(payload: unknown): PaginationMeta | undefined {
  return extractPagination(payload);
}

export function normalizeMetrics(summary: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...summary };
  for (const [key, value] of Object.entries(out)) {
    if (value === null || value === undefined) {
      if (key.includes('count') || key.includes('quantity') || key.includes('Plans')) out[key] = 0;
      else if (typeof summary[key] === 'number' || key.includes('total') || key.includes('amount') || key.includes('revenue') || key.includes('debt') || key.includes('balance') || key.includes('discrepancy')) {
        out[key] = 0;
      } else out[key] = value;
    }
  }
  return out;
}

export function normalizeReportRows(rows: Record<string, unknown>[]): Record<string, unknown>[] {
  return rows.map((row) => {
    const next = { ...row };
    for (const key of NAME_KEYS) {
      if (key in next) next[key] = reportName(next[key], fallbackForNameKey(key));
    }
    if ('product_name' in next && !next.product_name) next.product_name = REPORT_FALLBACK.deletedProduct;
    return next;
  });
}

function fallbackForNameKey(key: string): (typeof REPORT_FALLBACK)[keyof typeof REPORT_FALLBACK] {
  if (key.includes('customer')) return REPORT_FALLBACK.unspecifiedCustomer;
  if (key.includes('supplier')) return REPORT_FALLBACK.unspecifiedSupplier;
  if (key.includes('cashier')) return REPORT_FALLBACK.unspecifiedCashier;
  if (key.includes('driver')) return REPORT_FALLBACK.unspecifiedDriver;
  if (key.includes('waiter')) return REPORT_FALLBACK.unspecifiedWaiter;
  return REPORT_FALLBACK.unspecified;
}

export function metricValue(summary: Record<string, unknown>, key: string): unknown {
  const camel = key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());
  if (key in summary && summary[key] !== null && summary[key] !== undefined) return summary[key];
  if (camel in summary && summary[camel] !== null && summary[camel] !== undefined) return summary[camel];
  const nested = summary.summary;
  if (nested && typeof nested === 'object') {
    const n = nested as Record<string, unknown>;
    if (key in n) return n[key] ?? 0;
    if (camel in n) return n[camel] ?? 0;
  }
  return 0;
}

export function pickRowTitle(row: Record<string, unknown>, keys: string[], fallback: string): string {
  for (const key of keys) {
    const v = row[key];
    if (v !== null && v !== undefined && v !== '') return String(v);
  }
  return fallback;
}

export function formatRowField(
  row: Record<string, unknown>,
  field: { key: string; format?: string },
  formatters: { money: (v: unknown) => string; number: (v: unknown) => string; date: (v?: string | null) => string; text: (v: unknown, f?: string) => string },
): string {
  const raw = row[field.key];
  switch (field.format) {
    case 'money':
      return formatters.money(raw);
    case 'number':
      return formatters.number(raw);
    case 'date':
      return formatters.date(raw as string | null | undefined);
    case 'badge':
      return formatters.text(raw, '—');
    default:
      return formatters.text(raw, REPORT_FALLBACK.unspecified);
  }
}
