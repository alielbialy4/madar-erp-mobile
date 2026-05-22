export function money(value: unknown, currency = 'ج.م'): string {
  const numberValue = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  if (!Number.isFinite(numberValue)) return `0 ${currency}`;
  return `${numberValue.toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: 2 })} ${currency}`;
}

export function numberText(value: unknown): string {
  const numberValue = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  if (!Number.isFinite(numberValue)) return '0';
  return numberValue.toLocaleString('ar-EG-u-nu-latn');
}

export function dateText(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString('ar-EG-u-nu-latn', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function asText(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined || value === '') return fallback;
  return String(value);
}

export function initials(name?: string | null): string {
  const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'م';
  return parts.slice(0, 2).map((part) => part[0]).join('');
}
