export function todayLocalDateString(): string {
  return dateToLocalDateString(new Date());
}

export function dateToLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function dateDaysAgoLocal(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return dateToLocalDateString(d);
}
