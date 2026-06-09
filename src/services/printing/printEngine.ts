import type {
  KitchenTicketPayload,
  PrinterProfile,
  PrintJobRecord,
  ReceiptPrintPayload,
  ShiftCloseReportPayload,
} from '@/types/printing';
import { getConnectionCapability } from './printerCapabilities';
import { buildCodePageReferenceEscPos, buildEncodingTestEscPos, buildReceiptTextLines } from './receiptTemplates';
import { buildShiftSummaryTextLines } from './shiftSummaryTemplate';
import { buildKitchenTicketTextLines } from './kitchenTicketTemplates';
import { getPrinterProfile } from './printerProfiles';
import {
  cancelPrintJob,
  enqueuePrintJob,
  getPendingPrintJobs,
  getPrintJobs,
  retryPrintJob,
  setPrintJobStatus,
  updatePrintJob,
} from './printQueue';
import { sendPngBase64OverBluetooth, sendTextLinesOverBluetooth } from './androidBluetoothPrinter';
import { escPosBufferToHtml, escPosToSimpleHtml, printHtmlViaAirPrint } from './iosAirPrintPrinter';
import { sendEscPosOverTcp, testTcpConnection } from './networkTcpPrinter';
import { recordPrintError, recordPrintSuccess } from './printDiagnostics';
import {
  buildArabicTestBuffer,
  buildReceiptBuffer,
  buildTestPageBuffer,
  usesRasterEncoding,
} from './receiptRaster';
import {
  buildDocumentBuffer,
  buildKitchenBuffer,
  buildShiftBuffer,
  captureDocumentPngBase64,
} from './documentRaster';
import type { PrintCaptureJob } from '@/types/printing';

export async function sendRawEscPos(profile: PrinterProfile, buffer: Uint8Array): Promise<void> {
  const cap = getConnectionCapability(profile.connection_type);
  if (!cap.supported) {
    throw new Error(cap.reasonAr ?? 'نوع الاتصال غير مدعوم على هذا الجهاز.');
  }
  if (!profile.enabled) {
    throw new Error('الطابعة معطّلة في الإعدادات.');
  }

  switch (profile.connection_type) {
    case 'network_tcp':
      await sendEscPosOverTcp(profile.ip ?? '', profile.port, buffer);
      return;
    case 'airprint_ios': {
      const html = escPosBufferToHtml(buffer);
      await printHtmlViaAirPrint(html, profile.airprintName ?? profile.name);
      return;
    }
    case 'bluetooth_android':
      throw new Error(
        'فتح الدرج عبر البلوتوث غير مدعوم على هذا الجهاز. اربط طابعة الكاشير عبر الشبكة (TCP) في إعدادات الطباعة.',
      );
    default:
      throw new Error(cap.reasonAr ?? 'نوع الاتصال غير مدعوم.');
  }
}

async function dispatchBuffer(profile: PrinterProfile, buffer: Uint8Array): Promise<void> {
  await sendRawEscPos(profile, buffer);
}

async function dispatchBluetoothText(profile: PrinterProfile, lines: string[]): Promise<void> {
  await sendTextLinesOverBluetooth(profile.bluetoothAddress ?? '', lines, profile);
}

async function dispatchBluetoothRaster(profile: PrinterProfile, base64: string): Promise<void> {
  await sendPngBase64OverBluetooth(profile.bluetoothAddress ?? '', base64, profile);
}

async function dispatchBluetoothDocument(job: PrintCaptureJob): Promise<void> {
  if (usesRasterEncoding(job.profile)) {
    const base64 = await captureDocumentPngBase64(job);
    await dispatchBluetoothRaster(job.profile, base64);
    return;
  }
  if (job.kind === 'kitchen') {
    await dispatchBluetoothText(job.profile, buildKitchenTicketTextLines(job.payload));
    return;
  }
  if (job.kind === 'shift') {
    await dispatchBluetoothText(job.profile, buildShiftSummaryTextLines(job.payload));
    return;
  }
  await dispatchBluetoothText(job.profile, buildReceiptTextLines(job.payload, job.profile));
}

async function dispatchJob(profile: PrinterProfile, job: PrintJobRecord): Promise<void> {
  const cap = getConnectionCapability(profile.connection_type);
  if (!cap.supported) throw new Error(cap.reasonAr ?? 'نوع الاتصال غير مدعوم على هذا الجهاز.');
  if (!profile.enabled) throw new Error('الطابعة معطّلة في الإعدادات.');

  if (profile.connection_type === 'bluetooth_android') {
    if (job.type === 'receipt' || job.type === 'refund') {
      await dispatchBluetoothDocument({
        kind: 'receipt',
        payload: job.payload_snapshot as ReceiptPrintPayload,
        profile,
      });
      return;
    }
    if (job.type === 'kitchen') {
      await dispatchBluetoothDocument({
        kind: 'kitchen',
        payload: job.payload_snapshot as KitchenTicketPayload,
        profile,
      });
      return;
    }
    if (job.type === 'shift_summary') {
      await dispatchBluetoothDocument({
        kind: 'shift',
        payload: job.payload_snapshot as ShiftCloseReportPayload,
        profile,
      });
      return;
    }
    const buffer = await buildTestPageBuffer(profile);
    await dispatchBuffer(profile, buffer);
    return;
  }

  let buffer: Uint8Array;
  if (job.type === 'receipt' || job.type === 'refund') {
    buffer = await buildReceiptBuffer(job.payload_snapshot as ReceiptPrintPayload, profile);
  } else if (job.type === 'kitchen') {
    buffer = await buildKitchenBuffer(job.payload_snapshot as KitchenTicketPayload, profile);
  } else if (job.type === 'shift_summary') {
    buffer = await buildShiftBuffer(job.payload_snapshot as ShiftCloseReportPayload, profile);
  } else {
    buffer = await buildTestPageBuffer(profile);
  }
  await dispatchBuffer(profile, buffer);
}

async function runJob(job: PrintJobRecord): Promise<void> {
  const profile = await getPrinterProfile(job.printer_profile_id);
  if (!profile) {
    await setPrintJobStatus(job.id, 'failed', 'ملف الطابعة غير موجود');
    return;
  }
  await updatePrintJob(job.id, { status: 'printing', attempts: job.attempts + 1 });
  try {
    await dispatchJob(profile, job);
    await setPrintJobStatus(job.id, 'printed');
    await recordPrintSuccess(profile.id, profile.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشلت الطباعة';
    await setPrintJobStatus(job.id, 'failed', message);
    await recordPrintError(profile.id, profile.name, message);
  }
}

async function dispatchDirect(profile: PrinterProfile, buffer: Uint8Array): Promise<void> {
  if (profile.connection_type === 'bluetooth_android') {
    throw new Error('استخدم مسار النص أو الصورة للبلوتوث — البايتات الخام غير مدعومة.');
  }
  await dispatchBuffer(profile, buffer);
}

export const printEngine = {
  async print(job: PrintJobRecord): Promise<void> {
    await runJob(job);
  },

  async printReceipt(payload: ReceiptPrintPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'receipt',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
      local_order_id: payload.local_order_id ?? null,
    });
    await runJob(job);
    return job;
  },

  async printRefundReceipt(payload: ReceiptPrintPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'refund',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
      local_order_id: payload.local_order_id ?? null,
    });
    await runJob(job);
    return job;
  },

  async printKitchenTicket(payload: KitchenTicketPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'kitchen',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
    });
    await runJob(job);
    return job;
  },

  async printShiftSummary(payload: ShiftCloseReportPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'shift_summary',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
    });
    await runJob(job);
    return job;
  },

  async testConnection(profile: PrinterProfile): Promise<void> {
    const cap = getConnectionCapability(profile.connection_type);
    if (!cap.supported) throw new Error(cap.reasonAr ?? 'غير مدعوم');
    if (profile.connection_type === 'network_tcp') {
      await testTcpConnection(profile.ip ?? '', profile.port);
      return;
    }
    if (profile.connection_type === 'bluetooth_android') {
      const { isBluetoothDeviceReachable } = await import('./androidBluetoothPrinter');
      const ok = await isBluetoothDeviceReachable(profile.bluetoothAddress ?? '');
      if (!ok) throw new Error('الطابعة غير متاحة عبر البلوتوث — تأكد من الاقتران وتشغيلها');
      return;
    }
    if (profile.connection_type === 'airprint_ios') {
      await printHtmlViaAirPrint(escPosToSimpleHtml(['اختبار اتصال AirPrint']), profile.name);
      return;
    }
    throw new Error(cap.reasonAr ?? 'غير مدعوم');
  },

  async printTestPage(profile: PrinterProfile): Promise<void> {
    if (profile.connection_type === 'bluetooth_android' && usesRasterEncoding(profile)) {
      const base64 = await captureDocumentPngBase64({
        kind: 'receipt',
        profile,
        payload: {
          date: new Date().toLocaleString('ar-EG-u-nu-latn'),
          items: [{ name: 'اختبار الطباعة', quantity: 1, unit_price: 0 }],
          subtotal: 0,
          discount: 0,
          tax: 0,
          total: 0,
          paid: 0,
          payment_type: 'test',
          branch_name: 'MADAR POS TEST',
        },
      });
      await dispatchBluetoothRaster(profile, base64);
    } else if (profile.connection_type === 'bluetooth_android') {
      await dispatchBluetoothText(profile, [
        'MADAR POS TEST',
        'اختبار الطباعة العربية',
        `Profile: ${profile.name}`,
        new Date().toLocaleString('ar-EG-u-nu-latn'),
      ]);
    } else {
      const buffer = await buildTestPageBuffer(profile);
      await dispatchBuffer(profile, buffer);
    }
    await recordPrintSuccess(profile.id, profile.name);
  },

  async printArabicTest(profile: PrinterProfile): Promise<void> {
    if (profile.connection_type === 'bluetooth_android' && usesRasterEncoding(profile)) {
      const base64 = await captureDocumentPngBase64({
        kind: 'receipt',
        profile,
        payload: {
          date: new Date().toLocaleString('ar-EG-u-nu-latn'),
          items: [
            { name: 'منتج تجريبي', quantity: 1, unit_price: 123.45 },
            { name: 'اختبار الطباعة العربية', quantity: 2, unit_price: 10 },
          ],
          subtotal: 143.45,
          discount: 0,
          tax: 0,
          total: 143.45,
          paid: 143.45,
          payment_type: 'test',
          branch_name: 'اختبار عربي',
        },
      });
      await dispatchBluetoothRaster(profile, base64);
    } else if (profile.connection_type === 'bluetooth_android') {
      await dispatchBluetoothText(profile, [
        'فاتورة بيع',
        'منتج تجريبي',
        'الإجمالي 123.45 ج.م',
        'اختبار الطباعة العربية',
      ]);
    } else {
      const buffer = await buildArabicTestBuffer(profile);
      await dispatchBuffer(profile, buffer);
    }
    await recordPrintSuccess(profile.id, profile.name);
  },

  async printCodePageReference(profile: PrinterProfile): Promise<void> {
    const buffer = buildCodePageReferenceEscPos(profile);
    if (profile.connection_type === 'bluetooth_android') {
      throw new Error('طباعة جداول code page متاحة عبر TCP فقط.');
    }
    await dispatchBuffer(profile, buffer);
    await recordPrintSuccess(profile.id, profile.name);
  },

  async printEncodingTests(profile: PrinterProfile): Promise<void> {
    const samples = ['windows1256', 'cp864', 'utf8', 'utf8_image'] as const;
    for (const sample of samples) {
      const sampleProfile: PrinterProfile = {
        ...profile,
        encoding: sample,
        mode: sample === 'utf8_image' ? 'escpos_image' : 'escpos_text',
      };
      if (sample === 'utf8_image') {
        const testPayload: ReceiptPrintPayload = {
          date: new Date().toLocaleString('ar-EG-u-nu-latn'),
          items: [{ name: 'UTF-8 صورة', quantity: 1, unit_price: 1 }],
          subtotal: 1,
          discount: 0,
          tax: 0,
          total: 1,
          paid: 1,
          payment_type: 'test',
          branch_name: 'اختبار الترميز: صورة',
        };
        if (profile.connection_type === 'bluetooth_android') {
          const base64 = await captureDocumentPngBase64({
            kind: 'receipt',
            payload: testPayload,
            profile: sampleProfile,
          });
          await dispatchBluetoothRaster(sampleProfile, base64);
        } else {
          const buffer = await buildDocumentBuffer({
            kind: 'receipt',
            payload: testPayload,
            profile: sampleProfile,
          });
          await dispatchBuffer(sampleProfile, buffer);
        }
        continue;
      }
      if (profile.connection_type === 'bluetooth_android') {
        await dispatchBluetoothText(sampleProfile, [
          `Encoding: ${sample}`,
          'اختبار الطباعة العربية',
          'فاتورة بيع 123.45',
        ]);
      } else {
        const buffer = buildEncodingTestEscPos(sampleProfile, sample);
        await dispatchDirect(sampleProfile, buffer);
      }
    }
    await recordPrintSuccess(profile.id, profile.name);
  },

  async processPendingQueue(): Promise<{ processed: number; failed: number }> {
    const pending = await getPendingPrintJobs();
    let processed = 0;
    let failed = 0;
    for (const job of pending) {
      await runJob(job);
      const updated = (await getPrintJobs()).find((j) => j.id === job.id);
      if (updated?.status === 'printed') processed += 1;
      else failed += 1;
    }
    return { processed, failed };
  },

  retryPrintJob,
  cancelPrintJob,
};

export type { PrintJobRecord };
