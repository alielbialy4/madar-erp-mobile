import type { AppColors } from '@/constants/colors';

export type StatusKey = 'pending' | 'active' | 'completed' | 'cancelled' | 'draft' | 'warning' | 'danger' | 'info' | 'success';

export type StatusStyle = {
  bg: string;
  border: string;
  fg: string;
};

export function getStatusStyle(c: AppColors, status: StatusKey): StatusStyle {
  switch (status) {
    case 'pending':
      return { bg: c.softWarning, border: c.softWarningBorder, fg: c.warning };
    case 'active':
      return { bg: c.softInfo, border: c.softInfoBorder, fg: c.info };
    case 'completed':
    case 'success':
      return { bg: c.softSuccess, border: c.softSuccessBorder, fg: c.success };
    case 'cancelled':
    case 'danger':
      return { bg: c.softDanger, border: c.softDangerBorder, fg: c.danger };
    case 'draft':
      return { bg: c.softNeutral, border: c.softNeutralBorder, fg: c.textMuted };
    case 'warning':
      return { bg: c.softWarning, border: c.softWarningBorder, fg: c.warning };
    case 'info':
      return { bg: c.softInfo, border: c.softInfoBorder, fg: c.info };
    default:
      return { bg: c.surfaceMuted, border: c.borderSubtle, fg: c.textMuted };
  }
}

/** Kitchen / waiter order status mapping */
export function getOrderStatusStyle(c: AppColors, status: string): StatusStyle {
  switch (status) {
    case 'pending':
      return getStatusStyle(c, 'pending');
    case 'preparing':
      return getStatusStyle(c, 'info');
    case 'ready':
    case 'served':
      return getStatusStyle(c, 'success');
    case 'completed':
      return getStatusStyle(c, 'draft');
    case 'cancelled':
      return getStatusStyle(c, 'cancelled');
    default:
      return getStatusStyle(c, 'draft');
  }
}

/** Shift closing payment method banner colors */
export function getPaymentMethodStyle(c: AppColors, method: 'cash' | 'instapay' | 'ewallet' | 'visa' | 'instapayBrand'): StatusStyle {
  switch (method) {
    case 'cash':
      return { bg: c.paymentCashBg, border: c.paymentCashBorder, fg: c.paymentCashFg };
    case 'instapay':
    case 'instapayBrand':
      return { bg: c.paymentInstapayBg, border: c.paymentInstapayBorder, fg: c.paymentInstapayFg };
    case 'ewallet':
      return { bg: c.paymentEwalletBg, border: c.paymentEwalletBorder, fg: c.paymentEwalletFg };
    case 'visa':
      return { bg: c.paymentVisaBg, border: c.paymentVisaBorder, fg: c.paymentVisaFg };
    default:
      return getStatusStyle(c, 'info');
  }
}
