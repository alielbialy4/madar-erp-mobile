import type { KitchenRoutingCategoryRow, KitchenRoutingProductRow } from '@/api/kitchenRouting';

type ProductRef = { id: number; name: string; category_id?: number | null };

/** Pure product→kitchen route resolution (shared by resolver + POS cart stamps). */
export function resolveRoutingForProduct(
  product: ProductRef,
  categories: KitchenRoutingCategoryRow[],
  products: KitchenRoutingProductRow[],
): {
  type: 'screen' | 'printer' | 'none';
  printerId: string | null;
  stationId: string | null;
} {
  const row = products.find((p) => p.id === product.id);
  const category = categories.find((c) => c.id === product.category_id);

  const productType = row?.kitchen_routing_type;
  if (productType === 'screen' || productType === 'printer' || productType === 'none') {
    return {
      type: productType,
      printerId: productType === 'printer' ? row?.kitchen_printer_id ?? null : null,
      stationId: productType === 'screen' ? row?.kitchen_station_id ?? null : null,
    };
  }

  const catType = category?.kitchen_routing_type;
  if (catType === 'screen' || catType === 'printer' || catType === 'none') {
    return {
      type: catType,
      printerId: catType === 'printer' ? category?.kitchen_printer_id ?? null : null,
      stationId: catType === 'screen' ? category?.kitchen_station_id ?? null : null,
    };
  }

  return { type: 'none', printerId: null, stationId: null };
}
