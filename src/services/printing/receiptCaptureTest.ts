import { capturePrint } from './printCaptureRegistry';
import { ensureCaptureMono } from './captureAssets';
import { monoHasInk } from './escposRaster';
import { recordCaptureFailure, recordCaptureSuccess } from './printDiagnostics';
import type { PrinterProfile } from '@/types/printing';

export type ReceiptCaptureTestResult = {
  ok: boolean;
  message: string;
};

export async function testReceiptCapture(profile: PrinterProfile): Promise<ReceiptCaptureTestResult> {
  const payload = {
    date: new Date().toLocaleString('ar-EG-u-nu-latn'),
    items: [
      { name: 'منتج تجريبي', quantity: 1, unit_price: 50 },
      { name: 'اختبار التقاط صورة', quantity: 1, unit_price: 25 },
    ],
    subtotal: 75,
    discount: 0,
    tax: 0,
    total: 75,
    paid: 75,
    payment_type: 'cash',
    branch_name: 'اختبار التقاط',
  };

  try {
    const captured = await capturePrint({ kind: 'receipt', payload, profile });
    if (!captured.pngUri?.trim()) {
      const message = 'فشل التقاط PNG — مكوّن التقاط غير جاهز';
      await recordCaptureFailure(profile.id, profile.name, message);
      return { ok: false, message };
    }
    const mono = await ensureCaptureMono(captured, profile.paper_width);
    if (!monoHasInk(mono)) {
      const message = 'PNG فارغ — لن يعمل utf8_image على هذا الجهاز';
      await recordCaptureFailure(profile.id, profile.name, message);
      return { ok: false, message };
    }
    await recordCaptureSuccess(profile.id, profile.name);
    return { ok: true, message: 'التقاط ناجح — الصورة فيها حبر' };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشل التقاط الإيصال';
    await recordCaptureFailure(profile.id, profile.name, message);
    return { ok: false, message };
  }
}
