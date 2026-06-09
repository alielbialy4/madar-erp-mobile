import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { KitchenPrintContent } from '@/components/printing/KitchenPrintContent';
import { ReceiptPrintContent } from '@/components/printing/ReceiptPrintContent';
import { ShiftClosePrintContent } from '@/components/printing/ShiftClosePrintContent';
import { resolvePrintLogoUri } from '@/services/printing/printLogoCache';
import { registerPrintCapture } from '@/services/printing/printCaptureRegistry';
import {
  cacheMonoForBase64,
  clearMonoCache,
  dotsForPaper,
  monoHasInk,
} from '@/services/printing/escposRaster';
import { recordCaptureFailure, recordCaptureSuccess, recordPrintTiming } from '@/services/printing/printDiagnostics';
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

const MAX_CAPTURE_ATTEMPTS = 3;
const INK_RETRY_MS = [80, 120, 160];
const ASSETS_READY_TIMEOUT_MS = 2_000;
const CAPTURE_QUALITY = 0.9;

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
  onAssetsReady,
}: {
  job: PrintCaptureJob;
  onAssetsReady?: () => void;
}) {
  const paperWidth = job.profile.paper_width;
  if (job.kind === 'kitchen') {
    return <KitchenPrintContent payload={job.payload} paperWidth={paperWidth} />;
  }
  if (job.kind === 'shift') {
    return <ShiftClosePrintContent payload={job.payload} paperWidth={paperWidth} />;
  }
  return (
    <ReceiptPrintContent payload={job.payload} paperWidth={paperWidth} onAssetsReady={onAssetsReady} />
  );
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
  const assetsReadyRef = useRef(false);
  const captureStartedRef = useRef(false);
  const assetsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetCaptureGate = useCallback(() => {
    layoutReadyRef.current = false;
    assetsReadyRef.current = false;
    captureStartedRef.current = false;
    if (assetsTimerRef.current) {
      clearTimeout(assetsTimerRef.current);
      assetsTimerRef.current = null;
    }
  }, []);

  const runCapture = useCallback(async (next: InternalJob) => {
    if (capturingRef.current) return;
    capturingRef.current = true;
    clearMonoCache();
    const captureStartedAt = Date.now();
    let inkFailCount = 0;
    let attempts = 0;

    try {
      assertViewShotAvailable();
      await waitForFontsReady();
      await waitFrames(2);

      let lastError: Error | null = null;
      for (let attempt = 0; attempt < MAX_CAPTURE_ATTEMPTS; attempt += 1) {
        attempts += 1;
        if (attempt > 0) {
          await new Promise((r) => setTimeout(r, INK_RETRY_MS[attempt - 1] ?? 160));
          await waitFrames(1);
        }
        try {
          const uri = await withCaptureTimeout(
            captureRef(shotRef, {
              format: 'png',
              quality: CAPTURE_QUALITY,
              result: 'base64',
            }),
          );
          if (!uri) {
            lastError = new Error('فشل التقاط الصورة');
            inkFailCount += 1;
            continue;
          }
          const mono = cacheMonoForBase64(uri, next.profile.paper_width);
          if (monoHasInk(mono)) {
            await recordCaptureSuccess(next.profile.id, next.profile.name);
            await recordPrintTiming({
              capture_total_ms: Date.now() - captureStartedAt,
              capture_attempts: attempts,
              ink_fail_count: inkFailCount,
              receipt_height_px: mono.height,
            });
            next.resolve(uri);
            return;
          }
          inkFailCount += 1;
          lastError = new Error('صورة الطباعة فارغة (لا حبر)');
        } catch (err) {
          lastError = err instanceof Error ? err : new Error('فشل التقاط الطباعة');
        }
      }

      const reason = lastError?.message ?? 'فشل التقاط الطباعة';
      await recordCaptureFailure(next.profile.id, next.profile.name, reason);
      await recordPrintTiming({
        capture_total_ms: Date.now() - captureStartedAt,
        capture_attempts: attempts,
        ink_fail_count: inkFailCount,
      });
      next.reject(lastError ?? new Error(reason));
    } finally {
      capturingRef.current = false;
      setJob(null);
      setPreparedJob(null);
      resetCaptureGate();
    }
  }, [resetCaptureGate]);

  const tryStartCapture = useCallback(
    (active: InternalJob) => {
      if (capturingRef.current || captureStartedRef.current) return;
      if (!layoutReadyRef.current || !assetsReadyRef.current) return;
      captureStartedRef.current = true;
      void runCapture(active);
    },
    [runCapture],
  );

  const onAssetsReady = useCallback(() => {
    assetsReadyRef.current = true;
    if (job) tryStartCapture(job);
  }, [job, tryStartCapture]);

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
        resetCaptureGate();
        assetsReadyRef.current = captureJob.kind !== 'receipt';
        setPreparedJob(enriched);
        setJob({ ...enriched, resolve, reject });
      });
    });
    return () => registerPrintCapture(null);
  }, [resetCaptureGate]);

  const onLayoutReady = useCallback(() => {
    if (!job || capturingRef.current || layoutReadyRef.current) return;
    layoutReadyRef.current = true;
    tryStartCapture(job);
  }, [job, tryStartCapture]);

  useEffect(() => {
    if (!job || capturingRef.current) return;
    resetCaptureGate();
    layoutReadyRef.current = false;
    assetsReadyRef.current = job.kind !== 'receipt';

    assetsTimerRef.current = setTimeout(() => {
      assetsReadyRef.current = true;
      if (job && layoutReadyRef.current) tryStartCapture(job);
    }, ASSETS_READY_TIMEOUT_MS);

    const layoutTimer = setTimeout(() => {
      if (!job || capturingRef.current || layoutReadyRef.current) return;
      layoutReadyRef.current = true;
      tryStartCapture(job);
    }, 150);

    return () => {
      clearTimeout(layoutTimer);
      if (assetsTimerRef.current) {
        clearTimeout(assetsTimerRef.current);
        assetsTimerRef.current = null;
      }
    };
  }, [job, resetCaptureGate, tryStartCapture]);

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
        <CaptureContent job={renderJob} onAssetsReady={onAssetsReady} />
      </View>
    </View>
  );
}

/** @deprecated Use PrintCaptureHost */
export const ReceiptPrintCaptureHost = PrintCaptureHost;
