export type SupplierPaymentCreateInput = {
  supplierId: string;
  amount: string;
  paymentDate: string;
  financialAccountId: string;
  linkedVaultId?: string | null;
  paymentMethod?: string | null;
  purchaseId?: string;
  referenceNo?: string;
  notes?: string;
  clientUuid: string;
};

export type SupplierPaymentCreateError =
  | 'missing_supplier'
  | 'invalid_amount'
  | 'missing_account'
  | 'missing_date';

export type SupplierPaymentCreatePayload = {
  client_uuid: string;
  supplier_id: number;
  purchase_id?: number | null;
  financial_account_id: string;
  vault_id?: string;
  amount: number;
  payment_date: string;
  payment_method?: string;
  reference_no?: string;
  notes?: string;
};

/** Build POST /supplier-payments body to match web CreateSupplierPaymentModal. */
export function buildSupplierPaymentCreatePayload(
  input: SupplierPaymentCreateInput,
): { ok: true; payload: SupplierPaymentCreatePayload } | { ok: false; error: SupplierPaymentCreateError } {
  const supplierId = Number(input.supplierId);
  if (!Number.isFinite(supplierId) || supplierId <= 0) {
    return { ok: false, error: 'missing_supplier' };
  }
  const amount = Number(input.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, error: 'invalid_amount' };
  }
  if (!input.financialAccountId.trim()) {
    return { ok: false, error: 'missing_account' };
  }
  if (!input.paymentDate.trim()) {
    return { ok: false, error: 'missing_date' };
  }

  const purchaseId = input.purchaseId?.trim() ? Number(input.purchaseId) : null;
  const payload: SupplierPaymentCreatePayload = {
    client_uuid: input.clientUuid,
    supplier_id: supplierId,
    purchase_id: purchaseId != null && Number.isFinite(purchaseId) ? purchaseId : null,
    financial_account_id: input.financialAccountId.trim(),
    amount,
    payment_date: input.paymentDate.trim(),
  };
  if (input.paymentMethod === 'cash' && input.linkedVaultId) {
    payload.vault_id = String(input.linkedVaultId);
  }
  if (input.paymentMethod) payload.payment_method = input.paymentMethod;
  const ref = input.referenceNo?.trim();
  if (ref) payload.reference_no = ref;
  const notes = input.notes?.trim();
  if (notes) payload.notes = notes;
  return { ok: true, payload };
}

export function buildSupplierPaymentReversePayload(input: {
  reason: string;
  clientUuid: string;
}): { ok: true; payload: { reason: string; client_uuid: string } } | { ok: false; error: 'short_reason' } {
  const reason = input.reason.trim();
  if (reason.length < 3) return { ok: false, error: 'short_reason' };
  return { ok: true, payload: { reason, client_uuid: input.clientUuid } };
}

export function isReversibleSupplierPayment(row: {
  status?: string | null;
  is_reversed?: boolean | null;
  payment_type?: string | null;
}): boolean {
  if (row.is_reversed === true) return false;
  if (String(row.status ?? '') === 'reversed') return false;
  return true;
}
