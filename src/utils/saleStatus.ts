import type { ComponentProps } from 'react';
import type { AppBadge } from '@/components/ui/AppBadge';

type BadgeTone = NonNullable<ComponentProps<typeof AppBadge>['tone']>;

const SALE_STATUS_LABELS: Record<string, string> = {
  completed: 'مكتملة',
  complete: 'مكتملة',
  pending: 'معلقة',
  refunded: 'مرجعة',
  partially_refunded: 'مرجعة جزئياً',
  partial: 'جزئية',
  cancelled: 'ملغاة',
  canceled: 'ملغاة',
  served: 'مقدّمة',
  preparing: 'قيد التحضير',
  ready: 'جاهزة',
  void: 'ملغاة',
  voided: 'ملغاة',
  failed: 'فاشلة',
  draft: 'مسودة',
  open: 'مفتوحة',
  closed: 'مغلقة',
  paid: 'مدفوعة',
  unpaid: 'غير مدفوعة',
  credit: 'آجل',
};

function normalizeStatusKey(status: string): string {
  return status.trim().toLowerCase().replace(/-/g, '_');
}

export function saleStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) return '—';
  const key = normalizeStatusKey(status);
  return SALE_STATUS_LABELS[key] ?? status;
}

export function saleStatusBadgeTone(status: string | null | undefined): BadgeTone {
  if (!status?.trim()) return 'neutral';
  const key = normalizeStatusKey(status);
  if (['completed', 'complete', 'paid', 'delivered', 'posted'].includes(key)) return 'success';
  if (['pending', 'partially_refunded', 'partial', 'served', 'preparing', 'ready', 'draft', 'processing'].includes(key)) {
    return 'warning';
  }
  if (['cancelled', 'canceled', 'failed', 'void', 'voided', 'unpaid'].includes(key)) return 'danger';
  if (['refunded'].includes(key)) return 'neutral';
  return 'default';
}

export function shiftStatusLabel(status: string | null | undefined): string {
  if (!status?.trim()) return '—';
  const key = normalizeStatusKey(status);
  if (key === 'open') return 'مفتوحة';
  if (key === 'closed') return 'مغلقة';
  return saleStatusLabel(status);
}

export function shiftStatusBadgeTone(status: string | null | undefined): BadgeTone {
  if (!status?.trim()) return 'neutral';
  const key = normalizeStatusKey(status);
  if (key === 'open') return 'success';
  if (key === 'closed') return 'neutral';
  return saleStatusBadgeTone(status);
}
