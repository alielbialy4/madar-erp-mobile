export type ReceiptPrintPath =
  | 'raster'
  | 'text_cp864_clone'
  | 'text_windows1256'
  | 'text_cp864_epson'
  | null;

export type ReceiptPrintModeDiagnostic = 'quality_image' | 'fast_text' | null;

export type PrintTimingSnapshot = {
  measured_at: string | null;
  capture_total_ms: number | null;
  capture_gates_ms: number | null;
  view_shot_ms: number | null;
  capture_attempts: number | null;
  ink_fail_count: number | null;
  png_decode_ms: number | null;
  mono_convert_ms: number | null;
  mono_crop_ms: number | null;
  gs_v0_build_ms: number | null;
  raster_ms: number | null;
  /** Legacy: buffer build + send (capture+raster+tcp combined). */
  tcp_ms: number | null;
  dispatch_ms: number | null;
  tcp_connect_ms: number | null;
  tcp_write_ms: number | null;
  tcp_settle_ms: number | null;
  storage_ms: number | null;
  diagnostics_flush_ms: number | null;
  kitchen_api_ms: number | null;
  receipt_height_px: number | null;
  raster_payload_bytes: number | null;
  total_print_ms: number | null;
  receipt_print_mode: ReceiptPrintModeDiagnostic;
  direct_checkout: boolean | null;
  native_decode_ms: number | null;
  native_bitmap_ms: number | null;
  native_raster_ms: number | null;
  native_connect_ms: number | null;
  native_transfer_ms: number | null;
  native_settle_ms: number | null;
  native_total_ms: number | null;
  print_path: 'native_android' | 'fast_text' | null;
  native_fallback_reason: string | null;
};

export const emptyTiming: PrintTimingSnapshot = {
  measured_at: null,
  capture_total_ms: null,
  capture_gates_ms: null,
  view_shot_ms: null,
  capture_attempts: null,
  ink_fail_count: null,
  png_decode_ms: null,
  mono_convert_ms: null,
  mono_crop_ms: null,
  gs_v0_build_ms: null,
  raster_ms: null,
  tcp_ms: null,
  dispatch_ms: null,
  tcp_connect_ms: null,
  tcp_write_ms: null,
  tcp_settle_ms: null,
  storage_ms: null,
  diagnostics_flush_ms: null,
  kitchen_api_ms: null,
  receipt_height_px: null,
  raster_payload_bytes: null,
  total_print_ms: null,
  receipt_print_mode: null,
  direct_checkout: null,
  native_decode_ms: null,
  native_bitmap_ms: null,
  native_raster_ms: null,
  native_connect_ms: null,
  native_transfer_ms: null,
  native_settle_ms: null,
  native_total_ms: null,
  print_path: null,
  native_fallback_reason: null,
};

export function mergePrintTiming(
  current: PrintTimingSnapshot,
  pending: Partial<PrintTimingSnapshot>,
): PrintTimingSnapshot {
  return {
    ...emptyTiming,
    ...current,
    ...pending,
    measured_at: pending.measured_at ?? new Date().toISOString(),
  };
}
