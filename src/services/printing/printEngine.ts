import type {
  KitchenTicketPayload,
  PrinterProfile,
  PrintJobRecord,
  ReceiptPrintPayload,
  ShiftSummaryPayload,
} from '@/types/printing';
import { getConnectionCapability } from './printerCapabilities';
import { buildArabicTestEscPos, buildReceiptEscPos, buildTestPageEscPos } from './receiptTemplates';
import { buildShiftSummaryEscPos } from './shiftSummaryTemplate';
import { buildKitchenTicketEscPos } from './kitchenTicketTemplates';
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
import { sendEscPosOverBluetooth } from './androidBluetoothPrinter';
import { escPosToSimpleHtml, printHtmlViaAirPrint } from './iosAirPrintPrinter';
import { sendEscPosOverTcp, testTcpConnection } from './networkTcpPrinter';
import { recordPrintError, recordPrintSuccess } from './printDiagnostics';

async function dispatchBuffer(profile: PrinterProfile, buffer: Uint8Array): Promise<void> {
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
    case 'bluetooth_android':
      await sendEscPosOverBluetooth(profile.bluetoothAddress ?? '', buffer);
      return;
    case 'airprint_ios': {
      const html = escPosToSimpleHtml(['طباعة AirPrint', profile.name, new Date().toLocaleString('ar-EG-u-nu-latn')]);
      await printHtmlViaAirPrint(html, profile.airprintName ?? profile.name);
      return;
    }
    default:
      throw new Error(cap.reasonAr ?? 'نوع الاتصال غير مدعوم.');
  }
}

async function runJob(job: PrintJobRecord): Promise<void> {
  const profile = await getPrinterProfile(job.printer_profile_id);
  if (!profile) {
    await setPrintJobStatus(job.id, 'failed', 'ملف الطابعة غير موجود');
    return;
  }
  await updatePrintJob(job.id, { status: 'printing', attempts: job.attempts + 1 });
  try {
    let buffer: Uint8Array;
    if (job.type === 'receipt' || job.type === 'refund') {
      buffer = buildReceiptEscPos(job.payload_snapshot as ReceiptPrintPayload, profile);
    } else if (job.type === 'kitchen') {
      buffer = buildKitchenTicketEscPos(job.payload_snapshot as KitchenTicketPayload, profile);
    } else if (job.type === 'shift_summary') {
      buffer = buildShiftSummaryEscPos(job.payload_snapshot as ShiftSummaryPayload, profile);
    } else {
      buffer = buildTestPageEscPos(profile);
    }
    await dispatchBuffer(profile, buffer);
    await setPrintJobStatus(job.id, 'printed');
    await recordPrintSuccess(profile.id, profile.name);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'فشلت الطباعة';
    await setPrintJobStatus(job.id, 'failed', message);
    await recordPrintError(profile.id, profile.name, message);
  }
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

  async printKitchenTicket(payload: KitchenTicketPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
    const job = await enqueuePrintJob({
      type: 'kitchen',
      printer_profile_id: profile.id,
      payload_snapshot: payload as unknown as Record<string, unknown>,
    });
    await runJob(job);
    return job;
  },

  async printShiftSummary(payload: ShiftSummaryPayload, profile: PrinterProfile): Promise<PrintJobRecord> {
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
      await sendEscPosOverBluetooth(profile.bluetoothAddress ?? '', buildTestPageEscPos(profile));
      return;
    }
    if (profile.connection_type === 'airprint_ios') {
      await printHtmlViaAirPrint(escPosToSimpleHtml(['اختبار اتصال AirPrint']), profile.name);
      return;
    }
    throw new Error(cap.reasonAr ?? 'غير مدعوم');
  },

  async printTestPage(profile: PrinterProfile): Promise<void> {
    const buffer = buildTestPageEscPos(profile);
    await dispatchBuffer(profile, buffer);
    await recordPrintSuccess(profile.id, profile.name);
  },

  async printArabicTest(profile: PrinterProfile): Promise<void> {
    const buffer = buildArabicTestEscPos(profile);
    await dispatchBuffer(profile, buffer);
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
