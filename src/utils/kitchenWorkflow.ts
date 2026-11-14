/** Mirror web `kitchenWorkflowStatus` for lane/bulk filtering. */
export function kitchenWorkflowStatus(order: {
  kitchen_status?: string | null;
  status?: string | null;
}): string {
  const raw = String(order.kitchen_status ?? order.status ?? 'pending').toLowerCase();
  if (raw === 'completed') return 'served';
  if (['pending', 'preparing', 'ready', 'served'].includes(raw)) return raw;
  return 'pending';
}
