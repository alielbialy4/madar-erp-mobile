import type { SyncResult } from '@/services/sync/syncEngine';
import { numberText } from '@/utils/format';

export type SyncFeedback = {
  show: (message: string, tone: 'success' | 'error' | 'warning' | 'info') => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

export function notifySyncResult(res: SyncResult, toast: SyncFeedback): void {
  if (res.skipped) {
    const reason = res.errors[0]?.trim();
    toast.show(reason || 'المزامنة جارية بالفعل', 'warning');
    return;
  }

  if (res.pushed > 0 && res.errors.length === 0) {
    toast.success(`تمت مزامنة ${numberText(res.pushed)} طلب بنجاح`);
    return;
  }

  if (res.pushed > 0 && res.errors.length > 0) {
    const firstError = res.errors[0]?.trim();
    toast.show(
      firstError
        ? `تمت مزامنة ${numberText(res.pushed)} طلب جزئياً — ${firstError}`
        : `تمت مزامنة ${numberText(res.pushed)} طلب جزئياً`,
      'warning',
    );
    return;
  }

  if (res.errors.length > 0) {
    toast.show(res.errors[0]?.trim() || 'فشلت المزامنة', 'warning');
    return;
  }

  toast.show('لا توجد طلبات معلقة للمزامنة', 'info');
}
