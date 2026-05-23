import { get, post } from './client';

export type SupplierPaymentRow = Record<string, unknown> & {
  id?: string | number;
  amount?: number | string | null;
  payment_method?: string | null;
  payment_type?: string | null;
  supplier?: { name?: string | null } | null;
  purchase?: { id?: number | string; invoice_number?: string | null } | null;
  vault?: { name?: string | null } | null;
  creator?: { name?: string | null } | null;
  payment_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  notes?: string | null;
};

export type SupplierPaymentPayload = {
  supplier_id: number;
  purchase_id?: number | null;
  vault_id: string;
  amount: number | string;
  payment_date: string;
  payment_method?: string;
  reference_no?: string;
  notes?: string;
};

export type CreditAllocationPayload = {
  supplier_id: number;
  purchase_id: number;
  amount: number | string;
  allocated_at?: string;
  notes?: string;
};

export type MixedSupplierBalanceSettlementPayload = {
  supplier_id?: number;
  purchase_id?: number;
  balance_settlement_amount?: number | string;
  vault_payment_amount?: number | string;
  amount?: number | string;
  vault_id?: string;
  payment_method?: string;
  settled_at?: string;
  notes?: string;
};

export const supplierPaymentsAPI = {
  getAll: (params?: Record<string, unknown>) => get<SupplierPaymentRow[]>('/supplier-payments', params),
  create: (data: SupplierPaymentPayload) => post('/supplier-payments', data),
  allocateCredit: (data: CreditAllocationPayload) => post('/supplier-payments/allocate-credit', data),
  getAvailableCredit: (supplierId: number, params?: { branch_id?: string }) =>
    get<Record<string, unknown>>('/supplier-payments/available-credit', { supplier_id: supplierId, ...params }),
  getSettleableBalance: (supplierId: number, params?: { branch_id?: string; purchase_id?: number }) =>
    get<Record<string, unknown>>('/supplier-payments/settleable-balance', { supplier_id: supplierId, ...params }),
  applyPurchaseCredit: (
    purchaseId: number,
    data: Omit<CreditAllocationPayload, 'supplier_id' | 'purchase_id'>,
  ) => post(`/purchases/${purchaseId}/apply-supplier-credit`, data),
  settleBalance: (data: MixedSupplierBalanceSettlementPayload) =>
    post('/supplier-payments/settle-balance', data),
  applyPurchaseBalanceSettlement: (purchaseId: number, data: MixedSupplierBalanceSettlementPayload) =>
    post(`/purchases/${purchaseId}/settle-supplier-balance`, data),
};
