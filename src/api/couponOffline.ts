import type { Coupon } from '@/types/api';

export type AppliedCoupon = {
  coupon: Coupon;
  discount: number;
};

export function validateCouponOffline(
  coupons: Coupon[],
  code: string,
  cartTotal: number,
  branchId: string | null,
): AppliedCoupon | null {
  const upper = code.trim().toUpperCase();
  const coupon = coupons.find((c) => c.code.toUpperCase() === upper && c.is_active !== false);
  if (!coupon) return null;

  const now = new Date();
  if (coupon.starts_at && new Date(coupon.starts_at) > now) return null;
  if (coupon.expires_at && new Date(coupon.expires_at) < now) return null;
  if (coupon.max_uses != null && (coupon.used_count ?? 0) >= coupon.max_uses) return null;
  if (coupon.branch_id && branchId && coupon.branch_id !== branchId) return null;
  if (coupon.min_order_amount && cartTotal < coupon.min_order_amount) return null;

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = Math.round(cartTotal * (coupon.value / 100) * 10000) / 10000;
  } else {
    discount = Math.min(coupon.value, cartTotal);
  }
  if (coupon.max_discount_amount) {
    discount = Math.min(discount, coupon.max_discount_amount);
  }
  discount = Math.min(Math.round(discount * 100) / 100, cartTotal);
  if (discount <= 0) return null;

  return { coupon, discount };
}

export async function revalidateAppliedCoupon(
  held: AppliedCoupon,
  opts: {
    cartTotal: number;
    customerId?: number | null;
    branchId: string | null;
    online: boolean;
    coupons: Coupon[];
    validateOnline: (params: {
      code: string;
      cart_total: number;
      customer_id?: number | null;
      branch_id?: string | null;
    }) => Promise<{ status?: string; data?: { coupon?: Coupon; discount?: number } | null; message?: string }>;
  },
): Promise<AppliedCoupon | null> {
  const cartTotal = Math.max(0, opts.cartTotal);

  if (opts.online) {
    try {
      const res = await opts.validateOnline({
        code: held.coupon.code,
        cart_total: cartTotal,
        customer_id: opts.customerId ?? null,
        branch_id: opts.branchId,
      });
      if (res.status === 'success' && res.data?.coupon && Number(res.data.discount ?? 0) > 0) {
        return { coupon: res.data.coupon, discount: Number(res.data.discount) };
      }
    } catch {
      return null;
    }
    return null;
  }

  return validateCouponOffline(opts.coupons, held.coupon.code, cartTotal, opts.branchId);
}
