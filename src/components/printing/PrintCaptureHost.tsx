import { designColors } from '@/constants/colors';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { KitchenPrintContent } from '@/components/printing/KitchenPrintContent';
import { ReceiptCaptureLiteProvider } from '@/components/printing/receiptCaptureLite';
import { ReceiptPrintContent } from '@/components/printing/ReceiptPrintContent';
import { ShiftClosePrintContent } from '@/components/printing/ShiftClosePrintContent';
import { clearUriMonoCache } from '@/services/printing/captureAssets';
import { registerPrintCapture, type PrintCaptureResult } from '@/services/printing/printCaptureRegistry';
import { clearMonoCache } from '@/services/printing/escposRaster';
import {
  recordCaptureFailureSync,
  recordCaptureSuccessSync,
  recordPrintTimingSync,
} from '@/services/printing/printDiagnostics';
import { withCaptureTimeout } from '@/services/printing/printCaptureTimeout';
import type {
  PrintCaptureJob,
  PrinterProfile,
  ReceiptPrintPayload,
  PaperWidth,
} from '@/types/printing';
import { assertViewShotAvailable } from '@/utils/viewShotAvailability';

type InternalJob = PrintCaptureJob & {
  resolve: (result: PrintCaptureResult) => void;
  reject: (err: Error) => void;
};

/** Thermal width in px — must match escposRaster.dotsForPaper (scale-1 capture grid). */
const CAPTURE_WIDTH_PX: Record<PaperWidth, number> = {
  '80mm': 576,
  '58mm': 384,
};

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

function thermalCaptureWidth(paperWidth: PaperWidth): number {
  return CAPTURE_WIDTH_PX[paperWidth];
}

function captureHeightPx(paperWidth: PaperWidth, layout: { width: number; height: number }): number {
  const targetW = thermalCaptureWidth(paperWidth);
  if (layout.height <= 0) return 1;
  if (layout.width <= 0 || Math.abs(layout.width - targetW) < 2) {
    return Math.max(1, Math.round(layout.height));
  }
  return Math.max(1, Math.round(layout.height * (targetW / layout.width)));
}

/** Lock output to thermal pixel grid — avoids Retina 2×/3× oversampling on Android. */
function buildCaptureOptions(
  paperWidth: PaperWidth,
  layout: { width: number; height: number },
): Parameters<typeof captureRef>[1] {
  return {
    format: 'png',
    result: 'tmpfile',
    width: thermalCaptureWidth(paperWidth),
    height: captureHeightPx(paperWidth, layout),
  };
}

function CaptureContent({ job }: { job: PrintCaptureJob }) {
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
 * tmpfile capture + instant onLayout trigger — no base64 bridge or JS mono on hot path.
 */
export function PrintCaptureHost() {
  const shotRef = useRef<View>(null);
  const layoutSizeRef = useRef({ width: CAPTURE_WIDTH_PX['80mm'], height: 1 });
  const [renderJob, setRenderJob] = useState<PrintCaptureJob | null>(null);
  const capturingRef = useRef(false);
  const activeJobRef = useRef<InternalJob | null>(null);
  const pendingQueueRef = useRef<InternalJob[]>([]);
  const layoutReadyForJobRef = useRef(false);

  const dequeueNextJobRef = useRef<() => void>(() => {});

  const runCapture = useCallback(async (next: InternalJob) => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    clearMonoCache();
    clearUriMonoCache();
    const captureStartedAt = Date.now();

    try {
      assertViewShotAvailable();
      const captureGatesMs = Date.now() - captureStartedAt;
      const viewShotStartedAt = Date.now();
      const uri = await withCaptureTimeout(
        captureRef(shotRef, buildCaptureOptions(next.profile.paper_width, layoutSizeRef.current)),
      );
      recordPrintTimingSync({ view_shot_ms: Date.now() - viewShotStartedAt });

      if (!uri?.trim()) {
        throw new Error('فشل التقاط الصورة');
      }

      recordCaptureSuccessSync(next.profile.id, next.profile.name);
      recordPrintTimingSync({
        capture_total_ms: Date.now() - captureStartedAt,
        capture_gates_ms: captureGatesMs,
        capture_attempts: 1,
        ink_fail_count: 0,
      });
      next.resolve({ pngUri: uri });
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'فشل التقاط الطباعة';
      recordCaptureFailureSync(next.profile.id, next.profile.name, reason);
      recordPrintTimingSync({
        capture_total_ms: Date.now() - captureStartedAt,
        capture_gates_ms: 0,
        capture_attempts: 1,
        ink_fail_count: 0,
      });
      next.reject(err instanceof Error ? err : new Error(reason));
    } finally {
      capturingRef.current = false;
      activeJobRef.current = null;
      setRenderJob(null);
      queueMicrotask(() => dequeueNextJobRef.current());
    }
  }, []);

  const dequeueNextJob = useCallback(() => {
    if (capturingRef.current || activeJobRef.current) return;
    const next = pendingQueueRef.current.shift();
    if (!next) return;
    activeJobRef.current = next;
    layoutReadyForJobRef.current = false;
    layoutSizeRef.current = {
      width: thermalCaptureWidth(next.profile.paper_width),
      height: 1,
    };
    const { resolve: _r, reject: _j, ...captureOnly } = next;
    setRenderJob(captureOnly);
  }, []);

  useEffect(() => {
    dequeueNextJobRef.current = dequeueNextJob;
  }, [dequeueNextJob]);

  const onLayoutReady = useCallback(
    (event: LayoutChangeEvent) => {
      const active = activeJobRef.current;
      if (!active || capturingRef.current) return;
      layoutSizeRef.current = {
        width: event.nativeEvent.layout.width,
        height: Math.max(1, event.nativeEvent.layout.height),
      };
      layoutReadyForJobRef.current = true;
      void runCapture(active);
    },
    [runCapture],
  );

  useEffect(() => {
    if (!renderJob || !activeJobRef.current || capturingRef.current) return;
    const frame = requestAnimationFrame(() => {
      if (!activeJobRef.current || capturingRef.current || layoutReadyForJobRef.current) return;
      void runCapture(activeJobRef.current);
    });
    return () => cancelAnimationFrame(frame);
  }, [renderJob, runCapture]);

  useEffect(() => {
    registerPrintCapture((captureJob) => {
      return new Promise<PrintCaptureResult>((resolve, reject) => {
        pendingQueueRef.current.push({ ...captureJob, resolve, reject });
        dequeueNextJob();
      });
    });
    return () => registerPrintCapture(null);
  }, [dequeueNextJob]);

  const displayJob: PrintCaptureJob =
    renderJob ??
    ({ kind: 'receipt', payload: PLACEHOLDER_RECEIPT, profile: PLACEHOLDER_PROFILE } as PrintCaptureJob);

  const captureWidthPx = thermalCaptureWidth(displayJob.profile.paper_width);

  return (
    <View
      style={{ position: 'absolute', top: 0, left: -12000, width: captureWidthPx, opacity: 0.01 }}
      pointerEvents="none"
      collapsable={false}
    >
      <ReceiptCaptureLiteProvider>
        <View
          ref={shotRef}
          collapsable={false}
          onLayout={onLayoutReady}
          style={{
            width: captureWidthPx,
            maxWidth: captureWidthPx,
            minWidth: captureWidthPx,
            backgroundColor: designColors.white,
            overflow: 'hidden',
          }}
        >
          <CaptureContent job={displayJob} />
        </View>
      </ReceiptCaptureLiteProvider>
    </View>
  );
}

/** @deprecated Use PrintCaptureHost */
export const ReceiptPrintCaptureHost = PrintCaptureHost;
