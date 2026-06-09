import { get, put } from './client';
import { extractData } from '@/utils/data';

export type KitchenRoutingType = 'screen' | 'printer' | 'none';

export type KitchenRoutingStation = {
  id: string;
  name: string;
  color: string | null;
  is_active: boolean;
};

export type KitchenRoutingPrinterRef = {
  id: string;
  name: string;
  printer_name: string;
  is_active: boolean;
};

export type KitchenRoutingCategoryRow = {
  id: number;
  name: string;
  name_ar: string | null;
  kitchen_routing_type: KitchenRoutingType | null;
  kitchen_station_id: string | null;
  kitchen_printer_id: string | null;
};

export type KitchenRoutingProductRow = {
  id: number;
  name: string;
  category_id: number | null;
  kitchen_routing_type: KitchenRoutingType | null;
  kitchen_station_id: string | null;
  kitchen_printer_id: string | null;
};

export type KitchenRoutingPaginated<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
  per_page: number;
};

export type KitchenRoutingSummary = {
  has_screen_routing: boolean;
  has_printer_routing: boolean;
  has_any_routing: boolean;
  categories_screen: number;
  categories_printer: number;
  products_screen: number;
  products_printer: number;
  products_inherit_screen: number;
  products_inherit_printer: number;
};

export type KitchenRoutingSnapshot = {
  branch: { id: string; name: string };
  stations: KitchenRoutingStation[];
  printers: KitchenRoutingPrinterRef[];
  categories: KitchenRoutingCategoryRow[];
  products: KitchenRoutingPaginated<KitchenRoutingProductRow>;
  routing_summary?: KitchenRoutingSummary;
};

export type UpdateRoutingPayload = {
  branch_id?: string;
  routing_type: KitchenRoutingType | 'inherit';
  kitchen_station_id?: string | null;
  kitchen_printer_id?: string | null;
};

export const kitchenRoutingAPI = {
  async branchSnapshot(
    branchId: string,
    params?: { q?: string; per_page?: number; page?: number },
  ): Promise<KitchenRoutingSnapshot> {
    const res = await get<KitchenRoutingSnapshot>(`/branches/${branchId}/kitchen-routing`, params, {
      'X-Branch-Id': branchId,
    });
    return extractData(res) as KitchenRoutingSnapshot;
  },

  updateCategoryRouting(branchId: string, categoryId: number, payload: UpdateRoutingPayload) {
    return put(`/kitchen-routing/categories/${categoryId}`, { ...payload, branch_id: branchId }, {
      'X-Branch-Id': branchId,
    });
  },

  updateProductRouting(branchId: string, productId: number, payload: UpdateRoutingPayload) {
    return put(`/kitchen-routing/products/${productId}`, { ...payload, branch_id: branchId }, {
      'X-Branch-Id': branchId,
    });
  },

  bulkUpdateCategoryRouting(branchId: string, categoryIds: number[], payload: UpdateRoutingPayload) {
    return put(
      '/kitchen-routing/categories/bulk',
      { ...payload, branch_id: branchId, category_ids: categoryIds },
      { 'X-Branch-Id': branchId },
    );
  },

  bulkUpdateProductRouting(branchId: string, productIds: number[], payload: UpdateRoutingPayload) {
    return put(
      '/kitchen-routing/products/bulk',
      { ...payload, branch_id: branchId, product_ids: productIds },
      { 'X-Branch-Id': branchId },
    );
  },
};
