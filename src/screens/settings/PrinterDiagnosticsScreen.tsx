import React, { useCallback, useState } from 'react';
import { ScrollView, View , Platform } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppInlineAlert } from '@/components/feedback';
import { AppBadge, AppButton, AppListItem, AppSectionHeader, AppText as Text } from '@/components/ui';
import { MadarSection, MadarSurface } from '@/components/madar';
import { getPrinterProfiles, getPrinterProfilesStrict } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import {
  emptyTiming,
  getPrintDiagnostics,
  type PrintDiagnosticState,
  type PrintTimingSnapshot,
} from '@/services/printing/printDiagnostics';
import {
  describeNativeModuleStatus,
  isNativeThermalPrintAvailable,
  ThermalPrinter,
} from '@/services/printing/androidNativeThermalPrinter';
import { testTcpConnection } from '@/services/printing/networkTcpPrinter';
import { testReceiptCapture } from '@/services/printing/receiptCaptureTest';
import { usePrintStore } from '@/store/printStore';
import { useBranchStore } from '@/store/branchStore';
import type { PrinterProfile } from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { isViewShotAvailable, VIEW_SHOT_UNAVAILABLE_MESSAGE } from '@/utils/viewShotAvailability';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterDiagnostics'>;

const PRINT_PATH_LABELS: Record<string, string> = {
  native_android: 'Kotlin native',
  fast_text: 'نص سريع (Windows-1256)',
};

const PATH_LABELS: Record<string, string> = {
  raster: 'صورة (GS v 0)',
  text_cp864_clone: 'نص CP864 + Clone (22)',
  text_windows1256: 'نص Windows-1256',
  text_cp864_epson: 'نص CP864 + Epson (37)',
};

function ms(v: number | null | undefined): string {
  return v == null ? '—' : `${v}ms`;
}

function bytes(v: number | null | undefined): string {
  return v == null ? '—' : `${v} B`;
}

function TimingRow({ label, value, muted }: { label: string; value: string; muted: string }) {
  return (
    <Text style={{ ...textStart, color: muted }}>
      {label}: {value}
    </Text>
  );
}

function TimingBreakdown({ timing, muted }: { timing: PrintTimingSnapshot; muted: string }) {
  return (
    <>
      <TimingRow label="إجمالي الطباعة" value={ms(timing.total_print_ms)} muted={muted} />
      <TimingRow label="بوابات التقاط" value={ms(timing.capture_gates_ms)} muted={muted} />
      <TimingRow label="view-shot" value={ms(timing.view_shot_ms)} muted={muted} />
      <TimingRow label="التقاط (كلي)" value={ms(timing.capture_total_ms)} muted={muted} />
      <TimingRow label="فك PNG" value={ms(timing.png_decode_ms)} muted={muted} />
      <TimingRow label="تحويل mono" value={ms(timing.mono_convert_ms)} muted={muted} />
      <TimingRow label="قص الفراغ" value={ms(timing.mono_crop_ms)} muted={muted} />
      <TimingRow label="بناء GS v 0" value={ms(timing.gs_v0_build_ms)} muted={muted} />
      <TimingRow label="raster (كلي)" value={ms(timing.raster_ms)} muted={muted} />
      <TimingRow label="TCP اتصال" value={ms(timing.tcp_connect_ms)} muted={muted} />
      <TimingRow label="TCP إرسال" value={ms(timing.tcp_write_ms)} muted={muted} />
      <TimingRow label="TCP settle" value={ms(timing.tcp_settle_ms)} muted={muted} />
      <TimingRow label="dispatch (بناء)" value={ms(timing.dispatch_ms)} muted={muted} />
      <TimingRow label="TCP (قديم/كلي)" value={ms(timing.tcp_ms)} muted={muted} />
      <TimingRow label="flush تشخيص" value={ms(timing.diagnostics_flush_ms)} muted={muted} />
      <TimingRow label="حجم الإرسال" value={bytes(timing.raster_payload_bytes)} muted={muted} />
      <TimingRow label="ارتفاع الإيصال" value={timing.receipt_height_px == null ? '—' : `${timing.receipt_height_px}px`} muted={muted} />
      <TimingRow label="مسار المعالجة" value={PRINT_PATH_LABELS[timing.print_path ?? ''] ?? timing.print_path ?? '—'} muted={muted} />
      <TimingRow
        label="سبب فشل native"
        value={timing.native_fallback_reason ?? '—'}
        muted={muted}
      />
      <TimingRow label="native decode" value={ms(timing.native_decode_ms)} muted={muted} />
      <TimingRow label="native bitmap" value={ms(timing.native_bitmap_ms)} muted={muted} />
      <TimingRow label="native raster" value={ms(timing.native_raster_ms)} muted={muted} />
      <TimingRow label="native connect" value={ms(timing.native_connect_ms)} muted={muted} />
      <TimingRow label="native transfer" value={ms(timing.native_transfer_ms)} muted={muted} />
      <TimingRow label="native total" value={ms(timing.native_total_ms)} muted={muted} />
      <TimingRow label="محاولات التقاط" value={timing.capture_attempts == null ? '—' : String(timing.capture_attempts)} muted={muted} />
      <TimingRow label="فشل حبر" value={timing.ink_fail_count == null ? '—' : String(timing.ink_fail_count)} muted={muted} />
      <TimingRow label="تخزين" value={ms(timing.storage_ms)} muted={muted} />
      <TimingRow label="مطبخ API" value={ms(timing.kitchen_api_ms)} muted={muted} />
      <TimingRow
        label="وضع الإيصال"
        value={timing.receipt_print_mode ?? '—'}
        muted={muted}
      />
      <TimingRow
        label="طباعة مباشرة"
        value={timing.direct_checkout == null ? '—' : timing.direct_checkout ? 'نعم' : 'لا'}
        muted={muted}
      />
    </>
  );
}

export function PrinterDiagnosticsScreen({ navigation, route }: Props) {
  const c = useColors();
  const routeBranchId = route.params?.branchId;
  const refreshPrint = usePrintStore((s) => s.refresh);
  const [profiles, setProfiles] = useState<PrinterProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [diag, setDiag] = useState<PrintDiagnosticState>({
    last_error: null,
    last_error_at: null,
    last_success_at: null,
    last_profile_id: null,
    last_profile_name: null,
    last_print_path: null,
    capture_failed_reason: null,
    capture_ok_at: null,
    timing: { ...emptyTiming },
  });
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = React.useRef<ScrollView>(null);

  React.useEffect(() => {
    if (!result) return;
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
  }, [result]);

  const load = useCallback(async () => {
    const branchId = routeBranchId ?? useBranchStore.getState().activeBranch?.id ?? null;
    const list = branchId ? await getPrinterProfilesStrict(branchId) : await getPrinterProfiles(undefined);
    setProfiles(list);
    if (!selectedId && list[0]) setSelectedId(list[0].id);
    setDiag(await getPrintDiagnostics());
    await refreshPrint();
  }, [selectedId, refreshPrint, routeBranchId]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const selected = profiles.find((p) => p.id === selectedId) ?? profiles[0];

  const run = async (action: 'test' | 'page' | 'arabic' | 'capture') => {
    if (!selected) {
      setResult('اختر طابعة أولاً');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      if (action === 'test') await printEngine.testConnection(selected);
      else if (action === 'page') await printEngine.printTestPage(selected);
      else if (action === 'arabic') await printEngine.printArabicTest(selected);
      else {
        const captureResult = await testReceiptCapture(selected);
        setResult(captureResult.message);
        await load();
        return;
      }
      setResult(action === 'test' ? 'تم الاتصال بنجاح' : 'تم إرسال أمر الطباعة');
      await load();
    } catch (err) {
      setResult(err instanceof Error ? err.message : 'فشلت الطباعة، يمكنك إعادة المحاولة');
      await load();
    } finally {
      setBusy(false);
    }
  };

  const viewShotReady = isViewShotAvailable();

  return (
    <AppScreen title="تشخيص الطابعات" scrollRef={scrollRef}>
      {!viewShotReady ? (
        <AppInlineAlert tone="warning" message={VIEW_SHOT_UNAVAILABLE_MESSAGE} />
      ) : null}
      <MadarSurface>
        <AppSectionHeader title="الطابعة" />
        {profiles.map((p) => (
          <AppListItem
            key={p.id}
            title={p.name}
            subtitle={`${p.connection_type} · ${p.encoding} · ${p.ip ?? '—'}:${p.port}`}
            onPress={() => setSelectedId(p.id)}
            badge={selected?.id === p.id ? <AppBadge label="محددة" tone="success" /> : undefined}
          />
        ))}
      </MadarSurface>
      {selected ? (
        <MadarSurface>
          <AppSectionHeader title="إعدادات الملف" />
          <Text style={{ ...textStart, color: c.text }}>الترميز: {selected.encoding}</Text>
          <Text style={{ ...textStart, color: c.textMuted }}>
            code page: {selected.code_page_preset ?? 'generic_clone'}
            {selected.code_page_table?.cp864 != null
              ? ` · CP864=${selected.code_page_table.cp864}`
              : ''}
          </Text>
          <Text style={{ ...textStart, color: c.textMuted }}>عرض الورق: {selected.paper_width}</Text>
        </MadarSurface>
      ) : null}
      <MadarSurface>
        <AppSectionHeader title="آخر حالة" />
        <Text style={{ ...textStart, color: c.text }}>نجاح: {diag.last_success_at ?? '—'}</Text>
        <Text style={{ ...textStart, color: c.text }}>
          مسار الطباعة:{' '}
          {diag.last_print_path
            ? (PATH_LABELS[diag.last_print_path] ?? diag.last_print_path)
            : '—'}
        </Text>
        <Text style={{ ...textStart, color: c.danger }}>خطأ: {diag.last_error ?? '—'}</Text>
        <Text style={{ ...textStart, color: c.warning }}>
          فشل التقاط: {diag.capture_failed_reason ?? '—'}
        </Text>
        <Text style={{ ...textStart, color: c.textMuted }}>
          آخر تقاط ناجح: {diag.capture_ok_at ?? '—'}
        </Text>
        <Text style={{ ...textStart, color: c.textMuted, marginTop: 8 }}>
          آخر قياس ({diag.timing.measured_at ?? '—'}):
        </Text>
        <TimingBreakdown timing={diag.timing} muted={c.textMuted} />
      </MadarSurface>
      <View style={{ gap: 8 }}>
        <AppButton title="اختبار التقاط صورة" onPress={() => run('capture')} loading={busy} disabled={!selected} />
        <AppButton title="اختبار الاتصال" onPress={() => run('test')} loading={busy} disabled={!selected} />
        <AppButton title="صفحة تجريبية" variant="outline" onPress={() => run('page')} loading={busy} disabled={!selected} />
        <AppButton title="اختبار عربي" variant="outline" onPress={() => run('arabic')} loading={busy} disabled={!selected} />
        {__DEV__ ? (
          <>
            {Platform.OS === 'android' ? (
              <AppButton
                title="تشخيص Native (TCP)"
                variant="outline"
                onPress={async () => {
                  if (!selected) {
                    setResult('اختر طابعة أولاً');
                    return;
                  }
                  if (!selected.ip?.trim()) {
                    setResult('الطابعة المحددة بدون عنوان IP — أضف IP من إعدادات الطابعة.');
                    return;
                  }
                  setBusy(true);
                  setResult('جاري تشخيص Native…');
                  try {
                    const port = selected.port ?? 9100;
                    const moduleStatus = describeNativeModuleStatus();
                    const available = await isNativeThermalPrintAvailable();
                    const lines = [
                      moduleStatus,
                      `Native module: ${available ? 'متاح ✓' : 'غير متاح ✗'}`,
                    ];

                    let jsTcpOk = false;
                    try {
                      await testTcpConnection(selected.ip, port);
                      jsTcpOk = true;
                      lines.push(`TCP (JS) ${selected.ip}:${port}: متصل ✓`);
                    } catch (jsErr) {
                      lines.push(
                        `TCP (JS) ${selected.ip}:${port}: فشل ✗ — ${
                          jsErr instanceof Error ? jsErr.message : 'خطأ شبكة'
                        }`,
                      );
                    }

                    if (available) {
                      const diagResult = await ThermalPrinter.diagnosePrinter(selected.ip, port);
                      lines.push(
                        `TCP (Kotlin) ${selected.ip}:${port}: ${diagResult.reachable ? 'متصل ✓' : 'فشل ✗'}`,
                        diagResult.message,
                        `وقت اتصال Kotlin: ${diagResult.connectMs}ms`,
                      );
                    }

                    if (!available) {
                      lines.push(
                        '',
                        '── الحل ──',
                        '1. من الكمبيوتر: npm run build:dev-client',
                        '2. ثبّت الـ APK الجديد (احذف القديم أولاً)',
                        '3. افتح التطبيق من الأيقونة — ليس Expo Go',
                      );
                    } else if (!jsTcpOk) {
                      lines.push(
                        '',
                        '── الشبكة ──',
                        'الطابعة غير reachable من التابلت.',
                        'تحقق: IP صحيح؟ نفس الشبكة (مثلاً 192.168.2.x)؟ الطابعة شغالة؟',
                      );
                    } else {
                      lines.push('', 'Kotlin جاهز ✓ — الطباعة ستستخدم المسار الأصلي.');
                    }

                    setResult(lines.join('\n'));
                  } catch (e) {
                    setResult(e instanceof Error ? e.message : 'فشل التشخيص');
                  } finally {
                    setBusy(false);
                  }
                }}
                loading={busy}
                disabled={!selected?.ip}
              />
            ) : null}
          </>
        ) : null}
        <AppButton
          title="اختبار نص سريع (TCP)"
          variant="outline"
          onPress={async () => {
            if (!selected) return;
            setBusy(true);
            setResult(null);
            try {
              await printEngine.printFastArabicTextTest(selected);
              setResult('تم إرسال نص عربي سريع — راجع الورق.');
              setDiag(await getPrintDiagnostics());
            } catch (e) {
              setResult(e instanceof Error ? e.message : 'فشل الاختبار');
            } finally {
              setBusy(false);
            }
          }}
          loading={busy}
          disabled={!selected || selected.connection_type !== 'network_tcp'}
        />
        <AppButton title="قائمة انتظار الطباعة" variant="secondary" onPress={() => navigation.navigate('PrintQueue')} />
      </View>
      {result ? (
        <MadarSurface>
          <AppSectionHeader title="نتيجة الاختبار" />
          <AppInlineAlert
            tone={result.includes('✗') || result.includes('فشل') || result.includes('غير متاح') ? 'warning' : 'success'}
            message={result}
          />
        </MadarSurface>
      ) : null}
    </AppScreen>
  );
}
