export type SalesListFilterState = {
  status: string;
  payment_type: string;
  order_type: string;
  from_date: string;
  to_date: string;
};

export const EMPTY_SALES_LIST_FILTERS: SalesListFilterState = {
  status: '',
  payment_type: '',
  order_type: '',
  from_date: '',
  to_date: '',
};

/** Build GET /sales query params (web Sales list parity core filters). */
export function buildSalesListParams(
  search: string,
  filters: SalesListFilterState,
): Record<string, unknown> {
  const params: Record<string, unknown> = {};
  const q = search.trim();
  if (q) params.search = q;
  if (filters.status) params.status = filters.status;
  if (filters.payment_type) params.payment_type = filters.payment_type;
  if (filters.order_type) params.order_type = filters.order_type;
  if (filters.from_date) params.from_date = filters.from_date;
  if (filters.to_date) params.to_date = filters.to_date;
  return params;
}

export function countSalesListFilters(filters: SalesListFilterState): number {
  return Object.values(filters).filter((value) => String(value ?? '').trim() !== '').length;
}
