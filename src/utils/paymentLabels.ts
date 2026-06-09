const PAYMENT_LABELS: Record<string, string> = {
  cash: 'نقدي',
  card: 'بطاقة',
  credit: 'آجل',
  wallet: 'محفظة',
  electronic_wallet: 'محفظة إلكترونية',
  instapay: 'إنستاباي',
  split: 'مقسم',
  gift_card: 'بطاقة هدايا',
  layaway: 'تقسيط',
  test: 'اختبار',
};

export function paymentTypeLabel(type: string | null | undefined): string {
  if (!type?.trim()) return '—';
  const key = type.trim().toLowerCase();
  return PAYMENT_LABELS[key] ?? type;
}
