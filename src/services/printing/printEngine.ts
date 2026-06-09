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
import {
  recordPrintError,
  recordPrintErrorSync,
  recordPrintSuccess,
  recordPrintSuccessSync,
  recordPrintTiming,
  recordPrintTimingSync,
  recordReceiptPrintPath,
  recordReceiptPrintPathSync,
  resetPendingPrintDiagnostics,
  scheduleFlushPrintDiagnostics,
} from './printDiagnostics';
import { printArabicTextFast } from './arabicFastTextPrint';
import {
  effectiveKitchenProfileForCheckout,
  effectiveReceiptProfile,
  type ReceiptPrintMode,
} from './resolvePrintPath';
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
  captureDocument,
} from './documentRaster';
import { monoToPngBase64, type MonoRaster } from './escposRaster';
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

async function dispatchBluetoothRaster(
  profile: PrinterProfile,
  mono: MonoRaster,
  pngBase64Fallback: string,
): Promise<void> {
  const base64 =
    mono.width > 0 && mono.height > 0 ? monoToPngBase64(mono) : pngBase64Fallback;
  await sendPngBase64OverBluetooth(profile.bluetoothAddress ?? '', base64, profile);
}

async function dispatchBluetoothDocument(job: PrintCaptureJob): Promise<void> {
  if (usesRasterEncoding(job.profile)) {
    const captured = await captureDocument(job);
    await dispatchBluetoothRaster(job.profile, captured.mono, captured.pngBase64);
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

async function runJob(job: PrintJobRecord): Promise<PrintJobRecord> {
  const storageStartedAt = Date.now();
  const profile = await getPrinterProfile(job.printer_profile_id);
  if (!profile) {
    const failed = await setPrintJobStatus(job.id, 'failed', 'ملف الطابعة غير موجود');
    await recordPrintTiming({ storage_ms: Date.now() - storageStartedAt });
    return failed ?? { ...job, status: 'failed', error_message: 'ملف الطابعة غير موجود' };
  }
  const activeJob =
    (await updatePrintJob(job.id, { status: 'printing', attempts: job.attempts + 1 })) ??
    ({ ...job, status: 'printing' as const, attempts: job.attempts + 1, printing_at: new Date().toISOString() });
  try {
    const dispatchStartedAt = Date.now();
    await dispatchJob(profile, activeJob);
    await recordPrintTiming({ tcp_ms: Date.now() - dispatchStartedAt });
    const printed = await setPrintJobStatus(job.id, 'printed');
    await recordPrintSuccess(profile.id, profile.name);
    await recordPrintTiming({ storage_ms: Date.now() - storageStartedAt });
    return printed ?? { ...activeJob, status: 'printed', printed_at: new Date().toISOString() };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشلت الطباعة';
    const failed = await setPrintJobStatus(job.id, 'failed', message);
    await recordPrintError(profile.id, profile.name, message);
    await recordPrintTiming({ storage_ms: Date.now() - storageStartedAt });
    return failed ?? { ...activeJob, status: 'failed', error_message: message };
  }
}

async function dispatchDirect(profile: PrinterProfile, buffer: Uint8Array): Promise<void> {
  if (profile.connection_type === 'bluetooth_android') {
    throw new Error('استخدم مسار النص أو الصورة للبلوتوث — البايتات الخام غير مدعومة.');
  }
  await dispatchBuffer(profile, buffer);
}

function syntheticCheckoutJob(
  type: PrintJobRecord['type'],
  profile: PrinterProfile,
  payload: Record<string, unknown>,
  status: PrintJobRecord['status'],
  errorMessage?: string,
): PrintJobRecord {
  const now = new Date().toISOString();
  return {
    id: `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    status,
    printer_profile_id: profile.id,
    payload_snapshot: payload,
    created_at: now,
    printed_at: status === 'printed' ? now : undefined,
    attempts: 1,
    error_message: errorMessage,
    local_order_id: (payload.local_order_id as string | null | undefined) ?? null,
  };
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
    return runJob(job);
  },

  async printReceiptCheckout(
    payload: ReceiptPrintPayload,
    profile: PrinterProfile,
    mode: ReceiptPrintMode,
  ): Promise<PrintJobRecord> {
    const effectiveProfile = effectiveReceiptProfile(profile, mode);
    const snapshot = payload as unknown as Record<string, unknown>;
    resetPendingPrintDiagnostics();
    const totalStartedAt = Date.now();
    try {
      const buildStartedAt = Date.now();
      const buffer = await buildReceiptBuffer(payload, effectiveProfile);
      const buildMs = Date.now() - buildStartedAt;
      await dispatchDirect(effectiveProfile, buffer);
      const totalMs = Date.now() - totalStartedAt;
      recordPrintTimingSync({
        dispatch_ms: buildMs,
        tcp_ms: totalMs,
        storage_ms: 0,
        receipt_print_mode: mode,
        direct_checkout: true,
        total_print_ms: totalMs,
        raster_payload_bytes: buffer.length,
      });
      if (mode === 'fast_text') {
        recordReceiptPrintPathSync(profile.id, profile.name, 'text_windows1256', null);
      }
      recordPrintSuccessSync(profile.id, profile.name);
      scheduleFlushPrintDiagnostics();
      return syntheticCheckoutJob('receipt', profile, snapshot, 'printed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشلت الطباعة';
      recordPrintErrorSync(profile.id, profile.name, message);
      recordPrintTimingSync({
        receipt_print_mode: mode,
        direct_checkout: true,
        total_print_ms: Date.now() - totalStartedAt,
      });
      scheduleFlushPrintDiagnostics();
      return syntheticCheckoutJob('receipt', profile, snapshot, 'failed', message);
    }
  },

  async printRefundReceipt(payload: ReceiptPrintPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'refund',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
      local_order_id: payload.local_order_id ?? null,
    });
    return runJob(job);
  },

  async printKitchenTicket(payload: KitchenTicketPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'kitchen',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
    });
    return runJob(job);
  },

  async printKitchenTicketCheckout(
    payload: KitchenTicketPayload,
    profile: PrinterProfile,
  ): Promise<PrintJobRecord> {
    const effectiveProfile = effectiveKitchenProfileForCheckout(profile);
    const snapshot = payload as unknown as Record<string, unknown>;
    try {
      const dispatchStartedAt = Date.now();
      const buffer = await buildKitchenBuffer(payload, effectiveProfile);
      await dispatchDirect(effectiveProfile, buffer);
      await recordPrintTiming({
        tcp_ms: Date.now() - dispatchStartedAt,
        storage_ms: 0,
        direct_checkout: true,
      });
      await recordReceiptPrintPath(profile.id, profile.name, 'text_windows1256', null);
      await recordPrintSuccess(profile.id, profile.name);
      return syntheticCheckoutJob('kitchen', profile, snapshot, 'printed');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشلت الطباعة';
      await recordPrintError(profile.id, profile.name, message);
      await recordPrintTiming({ direct_checkout: true });
      return syntheticCheckoutJob('kitchen', profile, snapshot, 'failed', message);
    }
  },

  async printShiftSummary(payload: ShiftCloseReportPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'shift_summary',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
    });
    return runJob(job);
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
      const captured = await captureDocument({
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
      await dispatchBluetoothRaster(profile, captured.mono, captured.pngBase64);
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
      const captured = await captureDocument({
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
      await dispatchBluetoothRaster(profile, captured.mono, captured.pngBase64);
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

  /** Instant Arabic text over TCP — Windows-1256 + CP17 (fast_text pipeline). */
  async printFastArabicTextTest(profile: PrinterProfile): Promise<void> {
    if (profile.connection_type !== 'network_tcp') {
      throw new Error('اختبار النص السريع متاح عبر TCP فقط.');
    }
    const encoding = profile.encoding === 'cp864' ? 'cp864' : 'windows1256';
    await printArabicTextFast(
      profile.ip ?? '',
      profile.port,
      [
        'اختبار الطباعة العربية السريعة',
        'فاتورة بيع',
        'منتج تجريبي',
        'الإجمالي: 123.45 ج.م',
        'شكراً لزيارتكم',
      ].join('\n'),
      { encoding, paperWidth: profile.paper_width, align: 'right' },
    );
    await recordReceiptPrintPath(profile.id, profile.name, 'text_windows1256', null);
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
          const captured = await captureDocument({
            kind: 'receipt',
            payload: testPayload,
            profile: sampleProfile,
          });
          await dispatchBluetoothRaster(sampleProfile, captured.mono, captured.pngBase64);
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
