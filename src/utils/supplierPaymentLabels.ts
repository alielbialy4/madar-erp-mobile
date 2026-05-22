export type SupplierPaymentRow = {
  id?: string | number;
  payment_date?: string | null;
  payment_type?: string | null;
  payment_method?: string | null;
  amount?: number | string | null;
  notes?: string | null;
  reference_no?: string | null;
  purchase_id?: number | null;
  purchase?: { id?: number; invoice_number?: string | null } | null;
  vault?: { id?: string; name?: string | null } | null;
};

function resolvePurchaseId(payment: SupplierPaymentRow): number | null {
  const fromNested = payment.purchase?.id;
  if (fromNested != null) return Number(fromNested);
  if (payment.purchase_id != null) return Number(payment.purchase_id);
  return null;
}

export function supplierVoucherTypeLabel(payment: SupplierPaymentRow): string {
  const type = payment.payment_type ?? 'payment';
  if (type === 'credit_allocation') return 'استخدام رصيد دائن';
  if (type === 'balance_settlement') return 'تسوية رصيد المورد';
  if (type === 'payment' && resolvePurchaseId(payment) == null) return 'دفعة مورد على الحساب';
  return 'دفع من الخزنة';
}

export function supplierStatementMovementLabel(type: string | undefined): string {
  if (type === 'purchase') return 'فاتورة شراء';
  if (type === 'purchase_return') return 'مرتجع شراء';
  if (type === 'supplier_balance_settlement') return 'تسوية رصيد المورد';
  if (type === 'supplier_credit_allocation') return 'استخدام رصيد دائن';
  if (type === 'supplier_purchase_payment') return 'دفع من الخزنة';
  if (type === 'supplier_on_account_payment') return 'دفعة مورد على الحساب';
  if (type === 'purchase_payment') return 'دفعة شراء قديمة';
  return type || '—';
}

export function statementPaymentTypeLabel(payment: SupplierPaymentRow): string {
  if (payment.payment_type === 'balance_settlement') return 'تسوية رصيد المورد';
  if (payment.payment_type === 'credit_allocation') return 'استخدام رصيد دائن';
  if (payment.purchase_id || payment.purchase?.id) return 'دفع من الخزنة';
  return 'دفعة مورد على الحساب';
}
