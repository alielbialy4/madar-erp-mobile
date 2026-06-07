export function statusTone(status?: unknown): 'default' | 'success' | 'warning' | 'danger' | 'info' {
  const value = String(status ?? '').toLowerCase();
  if (['success', 'completed', 'paid', 'active', 'ready', 'available', 'closed'].includes(value)) return 'success';
  if (['pending', 'open', 'preparing', 'reserved'].includes(value)) return 'warning';
  if (['cancelled', 'failed', 'void', 'inactive', 'closed_by_system'].includes(value)) return 'danger';
  if (['card', 'cash', 'served'].includes(value)) return 'info';
  return 'default';
}
