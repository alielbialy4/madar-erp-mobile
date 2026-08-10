const INVENTORY_STATUS_LABELS: Record<string, string> = {
  draft: 'مسودة',
  pending: 'قيد المراجعة',
  submitted: 'مُرسَل',
  approved: 'موافق عليه',
  rejected: 'مرفوض',
  completed: 'مكتمل',
  partially_completed: 'مكتمل جزئيًا',
  cancelled: 'ملغى',
  canceled: 'ملغى',
  in_transit: 'قيد النقل',
  posted: 'مُرحّل',
  active: 'نشط',
  inactive: 'غير نشط',
};

export function inventoryStatusLabel(value: unknown, fallback = '—'): string {
  const raw = String(value ?? '').trim();
  if (!raw) return fallback;
  return INVENTORY_STATUS_LABELS[raw.toLowerCase()] ?? raw;
}

export function inventoryDocumentReference(
  row: Record<string, unknown>,
  fallback: string,
): string {
  const explicit = String(row.reference_no ?? row.code ?? row.name ?? '').trim();
  if (explicit) return explicit;

  const id = String(row.id ?? '').trim();
  if (!id) return fallback;

  const compactId = id.includes('-') ? id.slice(0, 8) : id;
  return `${fallback} #${compactId}`;
}
