export type CouponFormFields = {
  code: string;
  name: string;
  description: string;
  type: string;
  value: string;
  minOrder: string;
  maxDiscount: string;
  maxUses: string;
  maxUsesPerCustomer: string;
  startsAt: string;
  expiresAt: string;
  branchId: string;
  isActive: boolean;
};

/** Build create/update coupon body to match web CouponForm.toPayload. */
export function buildCouponFormPayload(fields: CouponFormFields): Record<string, unknown> {
  const valueNum = Number(fields.value);
  return {
    code: fields.code.trim().toUpperCase(),
    name: fields.name.trim(),
    description: fields.description.trim() || null,
    type: fields.type,
    value: Number.isFinite(valueNum) ? valueNum : 0,
    min_order_amount: fields.minOrder.trim() ? Number(fields.minOrder) : null,
    max_discount_amount: fields.maxDiscount.trim() ? Number(fields.maxDiscount) : null,
    max_uses: fields.maxUses.trim() ? parseInt(fields.maxUses, 10) : null,
    max_uses_per_customer: fields.maxUsesPerCustomer.trim()
      ? parseInt(fields.maxUsesPerCustomer, 10)
      : null,
    starts_at: fields.startsAt.trim() ? `${fields.startsAt.trim()}T00:00:00` : null,
    expires_at: fields.expiresAt.trim() ? `${fields.expiresAt.trim()}T23:59:59` : null,
    is_active: fields.isActive,
    branch_id: fields.branchId.trim() || null,
  };
}
