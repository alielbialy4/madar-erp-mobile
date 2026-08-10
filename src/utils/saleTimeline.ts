export type SaleTimelineEvent = Record<string, unknown>;

export function saleTimelineEvents(value: unknown): SaleTimelineEvent[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  const events = (value as { events?: unknown }).events;
  return Array.isArray(events) ? events.filter((event): event is SaleTimelineEvent => Boolean(event) && typeof event === 'object') : [];
}
