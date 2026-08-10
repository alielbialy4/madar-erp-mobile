export type ParsedStockCountQuantity =
  | { ok: true; value: number }
  | { ok: false; value: 0; error: string };

export function parseStockCountQuantity(raw: string | number): ParsedStockCountQuantity {
  const value = String(raw ?? '').trim();
  if (!value) return { ok: false, value: 0, error: 'أدخل الكمية المعدودة.' };
  if (!/^\d+$/.test(value)) {
    return { ok: false, value: 0, error: 'الكمية يجب أن تكون عددًا صحيحًا غير سالب.' };
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > 2147483647) {
    return { ok: false, value: 0, error: 'الكمية أكبر من الحد المسموح.' };
  }
  return { ok: true, value: parsed };
}
