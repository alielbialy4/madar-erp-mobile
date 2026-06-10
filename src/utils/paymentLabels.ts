import type { ComponentProps } from 'react';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppBadge } from '@/components/ui/AppBadge';

type BadgeTone = NonNullable<ComponentProps<typeof AppBadge>['tone']>;
type IconName = keyof typeof MaterialIcons.glyphMap;

const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  visa: 'فيزا',
  credit: 'آجل',
  wallet: 'محفظة',
  electronic_wallet: 'محفظة إلكترونية',
  vodafone_cash: 'فودافون كاش',
  instapay: 'إنستاباي',
  split: 'دفع مقسم',
  gift_card: 'بطاقة هدايا',
  layaway: 'تقسيط',
  test: 'اختبار',
  bank: 'تحويل بنكي',
  bank_transfer: 'تحويل بنكي',
};

const PAYMENT_ICONS: Record<string, IconName> = {
  cash: 'payments',
  card: 'credit-card',
  visa: 'credit-card',
  credit: 'schedule',
  wallet: 'account-balance-wallet',
  electronic_wallet: 'account-balance-wallet',
  vodafone_cash: 'account-balance-wallet',
  instapay: 'bolt',
  split: 'call-split',
  gift_card: 'card-giftcard',
  layaway: 'shopping-cart',
  bank: 'account-balance',
  bank_transfer: 'account-balance',
};

function normalizePaymentKey(type: string): string {
  return type.trim().toLowerCase().replace(/-/g, '_');
}

export function paymentTypeLabel(type: string | null | undefined): string {
  if (!type?.trim()) return '—';
  const key = normalizePaymentKey(type);
  return PAYMENT_LABELS[key] ?? type;
}

export function paymentTypeIcon(type: string | null | undefined): IconName {
  if (!type?.trim()) return 'payment';
  const key = normalizePaymentKey(type);
  return PAYMENT_ICONS[key] ?? 'payment';
}

export function paymentTypeBadgeTone(type: string | null | undefined): BadgeTone {
  if (!type?.trim()) return 'neutral';
  const key = normalizePaymentKey(type);
  if (key === 'cash') return 'success';
  if (['credit', 'layaway'].includes(key)) return 'warning';
  if (['split', 'gift_card'].includes(key)) return 'info';
  if (['card', 'visa', 'instapay', 'electronic_wallet', 'vodafone_cash', 'wallet', 'bank', 'bank_transfer'].includes(key)) {
    return 'info';
  }
  return 'default';
}
