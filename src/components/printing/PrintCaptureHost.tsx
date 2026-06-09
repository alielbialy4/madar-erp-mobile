import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { KitchenPrintContent } from '@/components/printing/KitchenPrintContent';
import { ReceiptPrintContent } from '@/components/printing/ReceiptPrintContent';
import { ShiftClosePrintContent } from '@/components/printing/ShiftClosePrintContent';
import { resolvePrintLogoUri } from '@/services/printing/printLogoCache';
import { registerPrintCapture } from '@/services/printing/printCaptureRegistry';
import { dotsForPaper, rasterHasInk } from '@/services/printing/escposRaster';
import { recordCaptureFailure } from '@/services/printing/printDiagnostics';
import { withCaptureTimeout } from '@/services/printing/printCaptureTimeout';
import type {
  KitchenTicketPayload,
  PrintCaptureJob,
  PrinterProfile,
  ReceiptPrintPayload,
  ShiftCloseReportPayload,
} from '@/types/printing';
import { waitForFontsReady } from '@/utils/fontReady';
import { assertViewShotAvailable } from '@/utils/viewShotAvailability';

type InternalJob = PrintCaptureJob & {
  resolve: (base64: string) => void;
  reject: (err: Error) => void;
};

const MAX_CAPTURE_ATTEMPTS = 5;
const LAYOUT_SETTLE_MS = [120, 180, 240, 300, 360];

const PLACEHOLDER_RECEIPT: ReceiptPrintPayload = {
  date: ' ',
  items: [{ name: ' ', quantity: 1, unit_price: 0 }],
  subtotal: 0,
  discount: 0,
  tax: 0,
  total: 0,
  paid: 0,
  payment_type: 'idle',
  branch_name: ' ',
};

const PLACEHOLDER_KITCHEN: KitchenTicketPayload = {
  order_label: ' ',
  items: [{ name: ' ', quantity: 1 }],
};

const PLACEHOLDER_SHIFT: ShiftCloseReportPayload = {
  shift_label: ' ',
  sections: [],
};

const PLACEHOLDER_PROFILE: PrinterProfile = {
  id: 'capture-host',
  name: 'capture-host',
  role: 'cashier',
  connection_type: 'network_tcp',
  paper_width: '80mm',
  port: 9100,
  mode: 'escpos_image',
  encoding: 'utf8_image',
  characters_per_line: 48,
  cut_paper: false,
  enabled: true,
};

function waitFrames(count: number): Promise<void> {
  return new Promise((resolve) => {
    let remaining = count;
    const step = () => {
      remaining -= 1;
      if (remaining <= 0) resolve();
      else requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}

function CaptureContent({
  job,
}: {
  job: PrintCaptureJob;
}) {
  const paperWidth = job.profile.paper_width;
  if (job.kind === 'kitchen') {
    return <KitchenPrintContent payload={job.payload} paperWidth={paperWidth} />;
  }
  if (job.kind === 'shift') {
    return <ShiftClosePrintContent payload={job.payload} paperWidth={paperWidth} />;
  }
  return <ReceiptPrintContent payload={job.payload} paperWidth={paperWidth} />;
}

/**
 * Unified off-screen host for raster print capture (receipt, kitchen, shift).
 */
export function PrintCaptureHost() {
  const shotRef = useRef<View>(null);
  const [job, setJob] = useState<InternalJob | null>(null);
  const [preparedJob, setPreparedJob] = useState<PrintCaptureJob | null>(null);
  const capturingRef = useRef(false);
  const layoutReadyRef = useRef(false);

  useEffect(() => {
    capturingRef.current = false;
    layoutReadyRef.current = false;
  }, []);

  const runCapture = useCallback(async (next: InternalJob) => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    try {
      assertViewShotAvailable();
      await waitForFontsReady();
      let lastError: Error | null = null;
      for (let attempt = 0; attempt < MAX_CAPTURE_ATTEMPTS; attempt += 1) {
        await waitFrames(3);
        await new Promise((r) => setTimeout(r, LAYOUT_SETTLE_MS[attempt] ?? 360));
        try {
          const uri = await withCaptureTimeout(
            captureRef(shotRef, {
              format: 'png',
              quality: 1,
              result: 'base64',
            }),
          );
          if (uri && rasterHasInk(uri, next.profile.paper_width)) {
            next.resolve(uri);
            return;
          }
          lastError = new Error(uri ? 'صورة الطباعة فارغة (لا حبر)' : 'فشل التقاط الصورة');
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('فشل التقاط الطباعة');
        }
      }
      const reason = lastError?.message ?? 'فشل التقاط الطباعة';
      await recordCaptureFailure(next.profile.id, next.profile.name, reason);
      next.reject(lastError ?? new Error(reason));
    } finally {
      capturingRef.current = false;
      setJob(null);
      setPreparedJob(null);
      layoutReadyRef.current = false;
    }
  }, []);

  useEffect(() => {
    registerPrintCapture(async (captureJob) => {
      let enriched = captureJob;
      if (captureJob.kind === 'receipt') {
        const logoUri = await resolvePrintLogoUri(
          captureJob.payload.logo_uri ?? captureJob.payload._printSettings?.receipt_logo_url,
        );
        enriched = {
          ...captureJob,
          payload: { ...captureJob.payload, logo_uri: logoUri },
        };
      }
      return new Promise<string>((resolve, reject) => {
        layoutReadyRef.current = false;
        setPreparedJob(enriched);
        setJob({ ...enriched, resolve, reject });
      });
    });
    return () => registerPrintCapture(null);
  }, []);

  const onLayoutReady = useCallback(() => {
    if (!job || capturingRef.current || layoutReadyRef.current) return;
    layoutReadyRef.current = true;
    void runCapture(job);
  }, [job, runCapture]);

  useEffect(() => {
    if (!job || capturingRef.current) return;
    layoutReadyRef.current = false;
    const timer = setTimeout(() => {
      if (!job || capturingRef.current || layoutReadyRef.current) return;
      layoutReadyRef.current = true;
      void runCapture(job);
    }, 150);
    return () => clearTimeout(timer);
  }, [job, runCapture]);

  const renderJob: PrintCaptureJob =
    preparedJob ??
    ({ kind: 'receipt', payload: PLACEHOLDER_RECEIPT, profile: PLACEHOLDER_PROFILE } as PrintCaptureJob);

  const captureWidth = dotsForPaper(renderJob.profile.paper_width);

  return (
    <View style={{ position: 'absolute', top: 0, left: -10000, opacity: 1 }} pointerEvents="none" collapsable={false}>
      <View
        ref={shotRef}
        collapsable={false}
        onLayout={onLayoutReady}
        style={{ width: captureWidth, alignSelf: 'flex-start', overflow: 'hidden' }}
      >
        <CaptureContent job={renderJob} />
      </View>
    </View>
  );
}

/** @deprecated Use PrintCaptureHost */
export const ReceiptPrintCaptureHost = PrintCaptureHost;
