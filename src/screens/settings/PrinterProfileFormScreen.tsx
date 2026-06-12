import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { FormScreenLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import { AppInlineAlert, useToast } from '@/components/feedback';
import { AppButton, AppChip, AppInput, AppSelect, AppText as Text } from '@/components/ui';
import {
  CODE_PAGE_PRESET_OPTIONS,
  connectionOptionsForPlatform,
  ENCODING_OPTIONS,
  normalizeFormEncoding,
  PAPER_WIDTH_OPTIONS,
  PRINTER_ROLE_OPTIONS,
  PRINTER_ROLE_PRIMARY,
} from '@/constants/printerFormOptions';
import { getConnectionCapability, recommendedConnectionForPlatform } from '@/services/printing/printerCapabilities';
import { getPrinterProfile, upsertPrinterProfile } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { testReceiptCapture } from '@/services/printing/receiptCaptureTest';
import { CLONE_CODE_PAGE_TABLE, EPSON_CODE_PAGE_TABLE } from '@/services/printing/codePageTables';
import { useBranchStore } from '@/store/branchStore';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { isViewShotAvailable, VIEW_SHOT_UNAVAILABLE_MESSAGE } from '@/utils/viewShotAvailability';
import type {
  CodePagePreset,
  EscPosEncoding,
  PaperWidth,
  PrinterConnectionType,
  PrinterProfile,
  PrinterRole,
} from '@/types/printing';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';

type Props = NativeStackScreenProps<MoreStackParamList, 'PrinterProfileForm'>;

export function PrinterProfileFormScreen({ navigation, route }: Props) {
  const c = useColors();
  const toast = useToast();
  const id = route.params?.id;
  const branchId =
    route.params?.branchId ?? useBranchStore.getState().activeBranch?.id ?? null;
  const presetRole = route.params?.presetRole;

  const [name, setName] = useState('');
  const [role, setRole] = useState<PrinterRole>(presetRole ?? 'cashier');
  const [connectionType, setConnectionType] = useState<PrinterConnectionType>(
    recommendedConnectionForPlatform(),
  );
  const [paperWidth, setPaperWidth] = useState<PaperWidth>('80mm');
  const [ip, setIp] = useState('');
  const [port, setPort] = useState('9100');
  const [bluetoothAddress, setBluetoothAddress] = useState('');
  const [encoding, setEncoding] = useState<EscPosEncoding>('utf8_image');
  const [codePagePreset, setCodePagePreset] = useState<CodePagePreset>('generic_clone');
  const [cp864Table, setCp864Table] = useState('');
  const [w1256Table, setW1256Table] = useState('');
  const [charsPerLine, setCharsPerLine] = useState('48');
  const [cutPaper, setCutPaper] = useState(true);
  const [enabled, setEnabled] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);

  const connectionOptions = useMemo(() => connectionOptionsForPlatform(), []);
  const cap = getConnectionCapability(connectionType);
  const viewShotReady = isViewShotAvailable();

  useEffect(() => {
    if (!id) return;
    void getPrinterProfile(id).then((p) => {
      if (!p) return;
      setName(p.name);
      setRole(p.role);
      setConnectionType(p.connection_type);
      setPaperWidth(p.paper_width);
      setIp(p.ip ?? '');
      setPort(String(p.port));
      setBluetoothAddress(p.bluetoothAddress ?? '');
      setEncoding(normalizeFormEncoding(p.encoding));
      setCodePagePreset(p.code_page_preset ?? 'generic_clone');
      setCp864Table(p.code_page_table?.cp864 != null ? String(p.code_page_table.cp864) : '');
      setW1256Table(p.code_page_table?.windows1256 != null ? String(p.code_page_table.windows1256) : '');
      setCharsPerLine(String(p.characters_per_line));
      setCutPaper(p.cut_paper);
      setEnabled(p.enabled);
    });
  }, [id]);

  const buildProfile = (): Partial<PrinterProfile> & { name: string; role: PrinterRole } => ({
    id,
    name: name.trim() || PRINTER_ROLE_OPTIONS.find((o) => o.value === role)?.label?.split(' ')[0] || 'طابعة',
    role,
    connection_type: connectionType,
    paper_width: paperWidth,
    branch_id: branchId,
    ip: ip.trim() || undefined,
    port: parseInt(port, 10) || 9100,
    bluetoothAddress: bluetoothAddress.trim() || undefined,
    encoding,
    code_page_preset: codePagePreset,
    code_page_table:
      cp864Table.trim() || w1256Table.trim()
        ? {
            ...(cp864Table.trim() ? { cp864: parseInt(cp864Table, 10) } : {}),
            ...(w1256Table.trim() ? { windows1256: parseInt(w1256Table, 10) } : {}),
          }
        : undefined,
    characters_per_line: parseInt(charsPerLine, 10) || (paperWidth === '58mm' ? 32 : 48),
    cut_paper: cutPaper,
    enabled,
    mode: encoding === 'utf8_image' ? 'escpos_image' : 'escpos_text',
  });

  const save = async () => {
    if (!branchId) {
      toast.error('يجب اختيار فرع');
      return;
    }
    if (connectionType === 'network_tcp' && !ip.trim()) {
      toast.error('أدخل عنوان IP للطابعة');
      return;
    }
    setBusy(true);
    try {
      await upsertPrinterProfile(buildProfile(), branchId);
      toast.success('تم حفظ الطابعة');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'تعذر الحفظ';
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  const applyRecommendedArabic = () => {
    setEncoding('utf8_image');
    setCodePagePreset('generic_clone');
    setCp864Table(String(CLONE_CODE_PAGE_TABLE.cp864));
    setW1256Table(String(CLONE_CODE_PAGE_TABLE.windows1256));
    toast.show('تم تطبيق الإعدادات الموصى بها — احفظ الطابعة', 'info');
  };

  const testCaptureOnly = async () => {
    if (!branchId) return;
    setTesting(true);
    try {
      const profile = await upsertPrinterProfile(buildProfile(), branchId);
      const result = await testReceiptCapture(profile);
      if (result.ok) toast.success(result.message);
      else toast.error(result.message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشلت العملية');
    } finally {
      setTesting(false);
    }
  };

  const testPrint = async (action: 'connection' | 'page') => {
    if (!branchId) return;
    setTesting(true);
    try {
      const profile = await upsertPrinterProfile(buildProfile(), branchId);
      if (action === 'connection') await printEngine.testConnection(profile);
      else await printEngine.printTestPage(profile);
      toast.success(action === 'connection' ? 'تم الاتصال' : 'تم إرسال أمر الطباعة');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشلت العملية');
    } finally {
      setTesting(false);
    }
  };

  return (
    <FormScreenLayout
      title={id ? 'تعديل طابعة' : 'طابعة جديدة'}
      subtitle={branchId ? `فرع: ${branchId}` : undefined}
      onBack={navigation.goBack}
      onSave={() => void save()}
      saveLoading={busy}
    >
      <FormSection title="نوع الطابعة" icon="category" subtitle="حدد استخدام هذه الطابعة">
        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
          {PRINTER_ROLE_PRIMARY.map((r) => (
            <AppChip
              key={r}
              label={PRINTER_ROLE_OPTIONS.find((o) => o.value === r)?.label?.split(' (')[0] ?? r}
              active={role === r}
              onPress={() => setRole(r)}
            />
          ))}
        </View>
        <AppSelect
          label="دور إضافي"
          value={role}
          options={PRINTER_ROLE_OPTIONS}
          onChange={(v) => setRole(v as PrinterRole)}
        />
      </FormSection>

      <FormSection title="وضع الطباعة" icon="receipt-long" subtitle="صورة (Kotlin native) أو نص سريع">
        <AppSelect
          label="مسار الطباعة"
          value={encoding}
          options={ENCODING_OPTIONS}
          onChange={(v) => setEncoding(v as EscPosEncoding)}
        />
        <Text style={{ color: c.textMuted, fontSize: 13 }}>
          {encoding === 'utf8_image'
            ? 'TCP: capture + Kotlin native. Bluetooth: printPic.'
            : 'Windows-1256 مباشرة — بدون التقاط صورة.'}
        </Text>
        {encoding === 'windows1256' ? (
          <AppSelect
            label="جدول code page (ESC t)"
            value={codePagePreset}
            options={CODE_PAGE_PRESET_OPTIONS}
            onChange={(v) => setCodePagePreset(v as CodePagePreset)}
          />
        ) : null}
      </FormSection>

      <FormSection title="الاتصال" icon="settings-ethernet">
        <AppSelect
          label="نوع الاتصال"
          value={connectionType}
          options={connectionOptions}
          onChange={(v) => setConnectionType(v as PrinterConnectionType)}
        />
        {!cap.supported && cap.reasonAr ? (
          <Text style={{ color: c.warning, fontSize: 13 }}>{cap.reasonAr}</Text>
        ) : null}
        <AppInput label="اسم الطابعة" value={name} onChangeText={setName} placeholder="مثال: كاشير 1" />
        <AppSelect
          label="عرض الورق"
          value={paperWidth}
          options={PAPER_WIDTH_OPTIONS}
          onChange={(v) => setPaperWidth(v as PaperWidth)}
        />
        <SwitchRow label="مفعّلة" value={enabled} onValueChange={setEnabled} />
        <SwitchRow label="قص الورق بعد الطباعة" value={cutPaper} onValueChange={setCutPaper} />
      </FormSection>

      {connectionType === 'network_tcp' ? (
        <FormSection title="شبكة Ethernet" icon="lan">
          <AppInput label="عنوان IP" value={ip} onChangeText={setIp} placeholder="192.168.1.100" />
          <AppInput label="المنفذ" value={port} onChangeText={setPort} keyboardType="numeric" />
        </FormSection>
      ) : null}

      {connectionType === 'bluetooth_android' ? (
        <FormSection title="بلوتوث" icon="bluetooth">
          <AppInput
            label="عنوان MAC"
            value={bluetoothAddress}
            onChangeText={setBluetoothAddress}
            placeholder="AA:BB:CC:DD:EE:FF"
          />
        </FormSection>
      ) : null}

      {connectionType === 'airprint_ios' ? (
        <FormSection title="AirPrint" icon="print">
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            قد تظهر نافذة الطباعة — ليست طباعة صامتة تلقائية.
          </Text>
        </FormSection>
      ) : null}

      {!viewShotReady ? (
        <AppInlineAlert tone="warning" message={VIEW_SHOT_UNAVAILABLE_MESSAGE} />
      ) : null}
      <FormSection title="اختبار" icon="print">
        <View style={{ ...flexRow, gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <AppButton
              title="اختبار اتصال"
              variant="outline"
              onPress={() => void testPrint('connection')}
              loading={testing}
            />
          </View>
          <View style={{ flex: 1 }}>
            <AppButton
              title="طباعة تجريبية"
              variant="outline"
              onPress={() => void testPrint('page')}
              loading={testing}
            />
          </View>
        </View>
      </FormSection>

      <AppButton
        title={showAdvanced ? 'إخفاء الإعدادات المتقدمة' : 'إعدادات متقدمة'}
        variant="secondary"
        onPress={() => setShowAdvanced((v) => !v)}
      />

      {showAdvanced ? (
        <FormSection title="ESC/POS متقدم" icon="tune">
          <AppButton
            title="تطبيق صورة (موصى به للعربي)"
            variant="secondary"
            onPress={applyRecommendedArabic}
          />
          <AppInput
            label="جدول Windows-1256 يدوي (0–50)"
            value={w1256Table}
            onChangeText={setW1256Table}
            keyboardType="numeric"
            placeholder={String(
              codePagePreset === 'epson'
                ? EPSON_CODE_PAGE_TABLE.windows1256
                : CLONE_CODE_PAGE_TABLE.windows1256,
            )}
          />
          <AppInput
            label="أحرف في السطر"
            value={charsPerLine}
            onChangeText={setCharsPerLine}
            keyboardType="numeric"
          />
          {encoding === 'utf8_image' ? (
            <AppButton
              title="اختبار التقاط صورة (بدون طباعة)"
              variant="outline"
              onPress={() => void testCaptureOnly()}
              loading={testing}
            />
          ) : null}
        </FormSection>
      ) : null}
    </FormScreenLayout>
  );
}
