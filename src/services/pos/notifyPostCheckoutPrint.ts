import type { PostCheckoutPrintResult } from '@/services/pos/posCheckoutPrint';
import { getPrintDiagnostics } from '@/services/printing/printDiagnostics';

export type PrintToast = {
  show: (
    message: string,
    tone: 'success' | 'error' | 'warning' | 'info',
    action?: { label: string; onPress: () => void },
  ) => void;
};

export async function notifyPostCheckoutPrint(
  result: PostCheckoutPrintResult | null | undefined,
  toast: PrintToast,
  onOpenPrintQueue?: () => void,
): Promise<void> {
  if (!result) return;

  const queueAction =
    onOpenPrintQueue != null
      ? { label: 'قائمة الانتظار', onPress: onOpenPrintQueue }
      : undefined;

  const { receipt, kitchen } = result;
  const diagnostics = await getPrintDiagnostics();
  const usedTextFallback =
    receipt.outcome === 'printed' &&
    diagnostics.last_print_path != null &&
    diagnostics.last_print_path !== 'raster';

  if (receipt.outcome === 'printed') {
    if (usedTextFallback) {
      const captureHint = diagnostics.capture_failed_reason
        ? ` سبب فشل الصورة: ${diagnostics.capture_failed_reason}.`
        : '';
      toast.show(
        `تمت الطباعة بنص بديل (${diagnostics.last_print_path ?? 'نص'}) — إن ظهرت رموز غريبة (± ä) فعّل «UTF-8 صورة» من إعدادات الطابعة.${captureHint}`,
        'warning',
      );
    } else {
      toast.show('تم إرسال الإيصال للطابعة (صورة)', 'success');
    }
  } else if (receipt.outcome === 'skipped' && receipt.message) {
    const isAutoPrintOff = receipt.message.includes('معطّلة') || receipt.message.includes('معطلة');
    const isNoPrinter = receipt.message.includes('لم تُحدَّد') || receipt.message.includes('طابعة');
    const hint = isAutoPrintOff
      ? 'فعّل «طباعة إيصال تلقائياً بعد البيع» من إعدادات الطباعة للفرع.'
      : isNoPrinter
        ? 'اختر طابعة كاشير واحفظ إعدادات الطباعة للفرع.'
        : undefined;
    toast.show(hint ? `${receipt.message} ${hint}` : receipt.message, isAutoPrintOff ? 'warning' : 'info');
  } else if (receipt.outcome === 'failed') {
    toast.show(receipt.message ?? 'فشلت طباعة الإيصال', 'warning', queueAction);
  } else if (receipt.outcome === 'queued') {
    toast.show(receipt.message ?? 'الإيصال في قائمة انتظار الطباعة', 'info', queueAction);
  }

  if (kitchen.message && kitchen.outcome !== 'printed') {
    const tone =
      kitchen.outcome === 'failed' ? 'warning' : kitchen.warnings.length > 0 ? 'warning' : 'info';
    toast.show(kitchen.message, tone, kitchen.outcome === 'failed' ? queueAction : undefined);
  } else if (kitchen.warnings.length > 0) {
    toast.show(kitchen.warnings[0], 'warning');
  }
}
