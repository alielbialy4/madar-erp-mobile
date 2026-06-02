import type { PosCatalog } from '@/types/api';
import type { LegacyPendingOfflineOrder } from '@/types/offline';
import { get } from './client';
import { posAPI } from './pos';

export type PullPosDataParams = {
  products_page?: number;
  products_per_page?: number;
  customers_limit?: number;
};

export type PushOfflineOrderResult = {
  client_uuid: string;
  status: 'created' | 'duplicate' | 'error';
  sale_id?: number;
  invoice_number?: string | null;
  print_sequence?: number | null;
  message?: string;
};

export async function pullFullPosCatalog(
  branchId?: string | null,
  options: { productsPerPage?: number; customersLimit?: number } = {},
): Promise<{ status: string; message?: string; data: PosCatalog }> {
  const productsPerPage = options.productsPerPage ?? 300;
  const customersLimit = options.customersLimit ?? 500;
  const first = await posAPI.pullCatalog(branchId, {
    products_page: 1,
    products_per_page: productsPerPage,
    customers_limit: customersLimit,
  });

  if (first.status !== 'success' || !first.data) {
    return first as { status: string; message?: string; data: PosCatalog };
  }

  const productPages = (first.data as PosCatalog & { pagination?: { products?: { last_page: number } } })
    .pagination?.products;
  if (!productPages || productPages.last_page <= 1) {
    return first as { status: string; message?: string; data: PosCatalog };
  }

  const productsById = new Map<number, PosCatalog['products'][number]>();
  (first.data.products ?? []).forEach((product) => productsById.set(Number(product.id), product));

  for (let page = 2; page <= productPages.last_page; page += 1) {
    const next = await posAPI.pullCatalog(branchId, {
      products_page: page,
      products_per_page: productsPerPage,
      customers_limit: customersLimit,
    });
    (next.data?.products ?? []).forEach((product) => {
      productsById.set(Number(product.id), product);
    });
  }

  return {
    status: first.status ?? 'success',
    message: first.message,
    data: {
      ...first.data,
      products: Array.from(productsById.values()),
    },
  };
}

/** @deprecated Use pullFullPosCatalog — kept for direct single-page pulls. */
export const syncAPI = {
  pullPosData: (branchId?: string | null, params?: PullPosDataParams) =>
    get<PosCatalog>('/sync/pos-data', {
      ...(branchId ? { branch_id: branchId } : {}),
      products_per_page: params?.products_per_page ?? 300,
      customers_limit: params?.customers_limit ?? 500,
      products_page: params?.products_page ?? 1,
    }),
};

export type { LegacyPendingOfflineOrder };
