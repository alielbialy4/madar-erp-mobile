import type { AppColors } from '@/constants/colors';

export const TABLE_STATUS_LABELS: Record<string, string> = {
  available: 'متاحة',
  occupied: 'مشغولة',
  reserved: 'محجوزة',
  closed: 'مغلقة',
};

export function tableStatusLabel(status?: string): string {
  if (!status) return '—';
  return TABLE_STATUS_LABELS[status] ?? status;
}

export function tableStatusTone(status?: string): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  if (status === 'available') return 'success';
  if (status === 'occupied') return 'warning';
  if (status === 'reserved') return 'info';
  if (status === 'closed') return 'danger';
  return 'default';
}

export function tableStatusColor(c: AppColors, status?: string): string {
  if (status === 'available') return c.success;
  if (status === 'occupied') return c.danger;
  if (status === 'reserved') return c.warning;
  if (status === 'closed') return c.textMuted;
  return c.textCaption;
}
