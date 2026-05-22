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

export function tableStatusColor(status?: string): string {
  if (status === 'available') return '#16a34a';
  if (status === 'occupied') return '#dc2626';
  if (status === 'reserved') return '#ca8a04';
  if (status === 'closed') return '#6b7280';
  return '#94a3b8';
}
