export const DELIVERY_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  assigned: 'تم التعيين',
  picked_up: 'تم الاستلام',
  in_transit: 'في الطريق',
  delivered: 'تم التوصيل',
  failed: 'فشل التوصيل',
  returned: 'مرتجع',
  cancelled: 'ملغى',
};

export const DELIVERY_NEXT_STATUS: Record<string, { value: string; label: string }[]> = {
  pending: [{ value: 'assigned', label: 'تعيين سائق' }],
  assigned: [{ value: 'picked_up', label: 'تم الاستلام' }],
  picked_up: [{ value: 'in_transit', label: 'في الطريق' }],
  in_transit: [
    { value: 'delivered', label: 'تم التوصيل' },
    { value: 'failed', label: 'فشل التوصيل' },
  ],
  failed: [{ value: 'returned', label: 'مرتجع' }],
  returned: [{ value: 'pending', label: 'إعادة جدولة' }],
};

export function deliveryStatusLabel(status?: string): string {
  if (!status) return '—';
  return DELIVERY_STATUS_LABELS[status] ?? status;
}

export function deliveryStatusTone(status?: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'delivered' || status === 'completed') return 'success';
  if (['pending', 'assigned', 'picked_up', 'in_transit'].includes(status ?? '')) return 'warning';
  if (['failed', 'cancelled'].includes(status ?? '')) return 'danger';
  return 'default';
}
