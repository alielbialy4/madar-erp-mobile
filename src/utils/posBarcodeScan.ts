import type { Product } from '@/types/api';

/** Web `findProductByScan` — exact barcode / id match for scanner wedges. */
export function findProductByScan(products: Product[], code: string): Product | undefined {
  const trimmed = code.trim();
  if (!trimmed) return undefined;
  const c = trimmed.toLowerCase();
  return products.find((p) => {
    if (p.barcode && String(p.barcode).toLowerCase() === c) return true;
    if (p.barcodes?.some((b) => String(b).toLowerCase() === c)) return true;
    if (String(p.id) === trimmed) return true;
    return false;
  });
}

/** Web POSSearchBar Enter gate for wedge scanners. */
export function looksLikeBarcodeScan(code: string): boolean {
  const trimmed = code.trim();
  return trimmed.length >= 8 && /^\d+$/.test(trimmed);
}
