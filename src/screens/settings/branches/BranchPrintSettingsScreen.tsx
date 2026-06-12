import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { branchesManageAPI } from '@/api/branchesManage';
import { FormScreenLayout } from '@/components/layout';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import { ImagePickerField } from '@/components/forms/ImagePickerField';
import { AppErrorState, AppInlineAlert, AppLoadingState, useToast } from '@/components/feedback';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { usePosStore } from '@/store/posStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { resolveReceiptProfile, saveBranchPrintBinding } from '@/services/printing/branchPrintBinding';
import { getPrinterProfilesStrict } from '@/services/printing/printerProfiles';
import { printEngine } from '@/services/printing/printEngine';
import { normalizeBranchPrintSettings } from '@/utils/branchPrintSettings';
import {
  buildBranchSettingsPayload,
  defaultBranchSettingsForm,
  isPrintFontSizeInRange,
  parseBranchSettingsObject,
  PRINT_FONT_SIZE_MAX,
  PRINT_FONT_SIZE_MIN,
  type BranchSettingsForm,
} from '@/utils/branchSettings';
import { isLogoScaleInRange, LOGO_SCALE_MAX, LOGO_SCALE_MIN } from '@/utils/printLogoSize';
import type { BranchManageRow } from '@/types/branches';
import type { PickedImage } from '@/types/api';
import type { PrinterProfile } from '@/types/printing';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';

type Props = NativeStackScreenProps<MoreStackParamList, 'BranchPrintSettings'>;

const RECEIPT_PRINT_MODE_OPTIONS: SelectOption[] = [
  {
    label: 'صورة عالية الجودة (عربي واضح)',
    value: 'quality_image',
  },
  {
    label: 'نص سريع (Windows-1256)',
    value: 'fast_text',
  },
];

const PRINT_SETTING_KEYS = [
  'receipt_print_mode',
  'auto_print_receipt',
  'enable_kitchen_print',
  'use_server_kitchen_print_queue',
  'receipt_show_print_sequence',
  'print_sequence_max',
  'print_shift_close_report',
  'receipt_show_invoice_number',
  'receipt_show_invoice_barcode',
  'receipt_show_product_category',
  'receipt_show_branch_name',
  'customer_printer_name',
  'customer_printer_profile_id',
  'receipt_header',
  'customer_receipt_footer_message',
  'customer_receipt_developer_footer',
  'receipt_address',
  'receipt_phone',
  'receipt_email',
  'receipt_return_policy',
  'customer_receipt_font_size',
  'kitchen_ticket_font_size',
  'shift_close_font_size',
  'customer_receipt_logo_scale',
  'receipt_footer',
] as const;

function settingsFingerprint(form: BranchSettingsForm): string {
  return JSON.stringify(
    PRINT_SETTING_KEYS.map((key) => [key, form[key]]),
  );
}

export function BranchPrintSettingsScreen({ navigation, route }: Props) {
  const branchId = String(route.params?.id ?? '');
  const c = useColors();
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_branches');
  const loadCatalog = usePosStore((s) => s.loadCatalog);

  const [branchName, setBranchName] = useState('');
  const [settings, setSettings] = useState<BranchSettingsForm>(defaultBranchSettingsForm());
  const [cashierProfiles, setCashierProfiles] = useState<PrinterProfile[]>([]);
  const [logoPick, setLogoPick] = useState<PickedImage | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedFingerprint, setSavedFingerprint] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await branchesManageAPI.get(branchId);
      const b = extractData<BranchManageRow>(res);
      if (!b) throw new Error('الفرع غير موجود');
      setBranchName(b.name);
      const raw =
        b.settings && typeof b.settings === 'object'
          ? (b.settings as Record<string, unknown>)
          : undefined;
      const parsed = parseBranchSettingsObject(raw);
      setSettings(parsed);
      setSavedFingerprint(settingsFingerprint(parsed));
      setLogoPick(null);
      setCashierProfiles(
        (await getPrinterProfilesStrict(branchId)).filter((p) => p.role === 'cashier'),
      );
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const cashierOptions = useMemo<SelectOption[]>(
    () => [
      { label: '— اختر طابعة إيصال —', value: '' },
      ...cashierProfiles.map((p) => ({
        label: `${p.name}${p.ip ? ` · ${p.ip}` : ''}`,
        value: p.id,
      })),
    ],
    [cashierProfiles],
  );

  const selectedProfile = useMemo(
    () => cashierProfiles.find((p) => p.id === settings.customer_printer_profile_id),
    [cashierProfiles, settings.customer_printer_profile_id],
  );

  const isDirty = useMemo(
    () => savedFingerprint !== '' && settingsFingerprint(settings) !== savedFingerprint,
    [savedFingerprint, settings],
  );

  const onPickProfile = (profileId: string) => {
    const profile = cashierProfiles.find((p) => p.id === profileId);
    setSettings((s) => ({
      ...s,
      customer_printer_profile_id: profileId,
      customer_printer_name: profile?.name ?? s.customer_printer_name,
    }));
  };

  const save = async () => {
    if (!canManage) {
      toast.error('ليس لديك صلاحية manage_branches');
      return;
    }
    const sizes = [
      parseInt(settings.customer_receipt_font_size, 10),
      parseInt(settings.kitchen_ticket_font_size, 10),
      parseInt(settings.shift_close_font_size, 10),
    ];
    if (sizes.some((n) => !isPrintFontSizeInRange(n))) {
      toast.error(`حجم الخط يجب أن يكون بين ${PRINT_FONT_SIZE_MIN} و ${PRINT_FONT_SIZE_MAX}`);
      return;
    }
    const logoScale = parseInt(settings.customer_receipt_logo_scale, 10);
    if (!isLogoScaleInRange(logoScale)) {
      toast.error(`حجم اللوجو يجب أن يكون بين ${LOGO_SCALE_MIN} و ${LOGO_SCALE_MAX}٪`);
      return;
    }
    setBusy(true);
    try {
      if (logoPick) {
        const logoRes = await branchesManageAPI.uploadReceiptLogo(branchId, logoPick);
        const url = extractData<{ logo_url?: string }>(logoRes)?.logo_url;
        if (url) setSettings((s) => ({ ...s, receipt_logo_url: url }));
      }
      const profile = selectedProfile;
      if (profile) {
        setSettings((s) => ({ ...s, customer_printer_name: profile.name }));
      }
      await branchesManageAPI.patchSettings(
        branchId,
        buildBranchSettingsPayload(
          {
            ...settings,
            customer_printer_name: profile?.name ?? settings.customer_printer_name,
          },
          [...PRINT_SETTING_KEYS],
        ),
      );
      if (settings.customer_printer_profile_id) {
        await saveBranchPrintBinding(branchId, settings.customer_printer_profile_id);
      }
      setSavedFingerprint(settingsFingerprint(settings));
      await loadCatalog();
      toast.success('تم حفظ إعدادات الطباعة');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  const warnIfUnsaved = () => {
    if (!isDirty) return false;
    toast.show('الإعدادات غير محفوظة — قد يختلف مسار البيع عن الاختبار حتى تحفظ.', 'warning');
    return true;
  };

  const onTestPrint = async (action: 'connection' | 'page') => {
    if (!selectedProfile) {
      toast.error('اختر طابعة إيصال أولاً');
      return;
    }
    warnIfUnsaved();
    setTesting(true);
    try {
      if (action === 'connection') await printEngine.testConnection(selectedProfile);
      else await printEngine.printTestPage(selectedProfile);
      toast.success(action === 'connection' ? 'تم الاتصال' : 'تم إرسال أمر الطباعة');
      if (action === 'page' && !settings.auto_print_receipt) {
        toast.show(
          'الاختبار نجح — لكن البيع لن يطبع حتى تفعّل «طباعة إيصال تلقائياً بعد البيع» وتحفظ.',
          'warning',
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشلت العملية');
    } finally {
      setTesting(false);
    }
  };

  const onTestSaleReceipt = async () => {
    warnIfUnsaved();
    setTesting(true);
    try {
      const catalogSettings = buildBranchSettingsPayload(settings, [...PRINT_SETTING_KEYS]);
      const profile = await resolveReceiptProfile(
        branchId,
        String(catalogSettings.customer_printer_profile_id ?? '') || null,
      );
      if (!profile) {
        toast.error('لم تُحدَّد طابعة إيصال — اختر طابعة واحفظ الإعدادات.');
        return;
      }
      const printSettings = normalizeBranchPrintSettings(catalogSettings as Record<string, unknown>);
      await printEngine.printReceipt(
        {
          branch_name: printSettings.receipt_show_branch_name ? branchName : undefined,
          cashier_name: user?.name,
          customer_name: 'عميل تجريبي',
          date: new Date().toLocaleString('ar-EG-u-nu-latn'),
          server_invoice_number: 'TEST-001',
          print_sequence: 42,
          order_type: 'dine_in',
          table_name: 'طاولة 5',
          items: [
            {
              name: 'منتج تجريبي',
              quantity: 2,
              unit_price: 50,
              line_total: 100,
              category_name: 'مشروبات',
            },
            {
              name: 'اختبار إيصال بيع',
              quantity: 1,
              unit_price: 25,
              line_total: 25,
              options: [{ group_title: 'الحجم', options: [{ name: 'كبير', applied_price: 5 }] }],
            },
          ],
          subtotal: 125,
          discount: 5,
          tax: 0,
          delivery_fee: 0,
          total: 120,
          paid: 150,
          change: 30,
          payment_type: 'نقدي',
          show_subtotal: true,
          coupon_code: 'SAVE10',
          coupon_discount: 5,
          notes: 'ملاحظة تجريبية',
          _printSettings: printSettings,
        },
        profile,
      );
      toast.success('تم إرسال إيصال بيع تجريبي (نفس مسار البيع)');
      if (!settings.auto_print_receipt) {
        toast.show('تذكير: فعّل الطباعة التلقائية بعد البيع واحفظ لتطبع بعد كل عملية.', 'warning');
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'فشلت العملية');
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <FormScreenLayout title="الطباعة والإيصالات" onBack={navigation.goBack}>
        <AppLoadingState message="جاري التحميل…" />
      </FormScreenLayout>
    );
  }

  if (error) {
    return (
      <FormScreenLayout title="الطباعة والإيصالات" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={() => void load()} />
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title="الطباعة والإيصالات"
      subtitle={branchName}
      onBack={navigation.goBack}
      onSave={canManage ? () => void save() : undefined}
      saveLoading={busy}
    >
      <AppInlineAlert
        tone="info"
        message="على الموبايل يُرسل الإيصال لملف الكاشير (IP:9100 أو بلوتوث) — وليس لاسم طابعة ويندوز كما في الفرونت."
      />
      {settings.use_server_kitchen_print_queue ? (
        <AppInlineAlert
          tone="warning"
          message="طابور طباعة السيرفر مفعّل: لن تُطبع تذاكر مطبخ من هذا الجهاز. عطّله لاستخدام طابعات IP المحلية."
        />
      ) : null}
      {!settings.auto_print_receipt ? (
        <AppInlineAlert
          tone="warning"
          message="الطباعة التلقائية بعد البيع معطّلة — اختبار الطابعة قد ينجح لكن البيع لن يطبع حتى تفعّل الخيار أدناه وتحفظ."
        />
      ) : null}
      <AppInlineAlert
        tone="info"
        message="رموز غريبة على الإيصال (± ä ¬)؟ جرّب ترميز «UTF-8 صورة» أو Clone + CP864 من إعدادات الطابعة."
      />
      {selectedProfile && selectedProfile.encoding !== 'utf8_image' ? (
        <AppInlineAlert
          tone="warning"
          message={`طابعة الكاشير على ترميز «${selectedProfile.encoding}» نص — للعربي الموصى به: UTF-8 صورة. عدّل من إعدادات الطابعة.`}
        />
      ) : null}
      {isDirty ? (
        <AppInlineAlert
          tone="info"
          message="لديك تغييرات غير محفوظة — احفظ قبل البيع ليطبّق الإعداد الجديد."
        />
      ) : null}
      <FormSection title="طابعة الإيصال الافتراضية" icon="print">
        {cashierProfiles.length === 0 ? (
          <View style={{ gap: spacing.sm }}>
            <Text style={{ color: c.textMuted }}>لا توجد طابعة كاشير لهذا الفرع.</Text>
            <AppButton
              title="إضافة طابعة كاشير"
              onPress={() =>
                navigation.navigate('PrinterProfileForm', { branchId, presetRole: 'cashier' })
              }
            />
          </View>
        ) : (
          <>
            <AppSelect
              label="طابعة الإيصال"
              value={settings.customer_printer_profile_id || null}
              options={cashierOptions}
              onChange={onPickProfile}
            />
            <View style={{ ...flexRow, gap: spacing.sm }}>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="اختبار اتصال"
                  variant="outline"
                  onPress={() => void onTestPrint('connection')}
                  loading={testing}
                  disabled={!selectedProfile}
                />
              </View>
              <View style={{ flex: 1 }}>
                <AppButton
                  title="طباعة تجريبية"
                  variant="outline"
                  onPress={() => void onTestPrint('page')}
                  loading={testing}
                  disabled={!selectedProfile}
                />
              </View>
            </View>
            <AppButton
              title="اختبار إيصال بيع (مسار POS)"
              variant="outline"
              onPress={() => void onTestSaleReceipt()}
              loading={testing}
              disabled={!selectedProfile}
            />
            <AppButton
              title="إدارة طابعات الفرع"
              variant="secondary"
              onPress={() => navigation.navigate('PrinterProfiles', { branchId })}
            />
          </>
        )}
      </FormSection>

      <FormSection title="سلوك الطباعة" icon="settings">
        <AppSelect
          label="وضع طباعة الإيصال"
          options={RECEIPT_PRINT_MODE_OPTIONS}
          value={settings.receipt_print_mode}
          onChange={(v) =>
            setSettings((s) => ({
              ...s,
              receipt_print_mode: v === 'fast_text' ? 'fast_text' : 'quality_image',
            }))
          }
        />
        <Text style={{ color: c.textMuted, fontSize: 12, ...textStart }}>
          النص السريع ~1 ثانية · الصورة ~3–4 ثوانٍ
        </Text>
        <SwitchRow
          label="طباعة إيصال تلقائياً بعد البيع"
          value={settings.auto_print_receipt}
          onValueChange={(v) => setSettings((s) => ({ ...s, auto_print_receipt: v }))}
        />
        <SwitchRow
          label="طباعة المطبخ"
          value={settings.enable_kitchen_print}
          onValueChange={(v) => setSettings((s) => ({ ...s, enable_kitchen_print: v }))}
        />
        <SwitchRow
          label="طابور طباعة السيرفر"
          hint="يتخطى الطباعة المحلية للمطبخ"
          value={settings.use_server_kitchen_print_queue}
          onValueChange={(v) => setSettings((s) => ({ ...s, use_server_kitchen_print_queue: v }))}
        />
        <SwitchRow
          label="طباعة تقرير إغلاق الوردية"
          value={settings.print_shift_close_report}
          onValueChange={(v) => setSettings((s) => ({ ...s, print_shift_close_report: v }))}
        />
      </FormSection>

      <FormSection title="محتوى الإيصال" icon="receipt-long">
        <SwitchRow
          label="رقم الفاتورة"
          value={settings.receipt_show_invoice_number}
          onValueChange={(v) => setSettings((s) => ({ ...s, receipt_show_invoice_number: v }))}
        />
        <SwitchRow
          label="باركود الفاتورة"
          value={settings.receipt_show_invoice_barcode}
          onValueChange={(v) => setSettings((s) => ({ ...s, receipt_show_invoice_barcode: v }))}
        />
        <SwitchRow
          label="تصنيف المنتج"
          value={settings.receipt_show_product_category}
          onValueChange={(v) => setSettings((s) => ({ ...s, receipt_show_product_category: v }))}
        />
        <SwitchRow
          label="اسم الفرع"
          value={settings.receipt_show_branch_name}
          onValueChange={(v) => setSettings((s) => ({ ...s, receipt_show_branch_name: v }))}
        />
        <SwitchRow
          label="تسلسل الطباعة"
          value={settings.receipt_show_print_sequence}
          onValueChange={(v) => setSettings((s) => ({ ...s, receipt_show_print_sequence: v }))}
        />
        {settings.receipt_show_print_sequence ? (
          <AppInput
            label="أقصى تسلسل (فارغ = بدون)"
            value={settings.print_sequence_max}
            onChangeText={(t) => setSettings((s) => ({ ...s, print_sequence_max: t.replace(/\D/g, '') }))}
            keyboardType="number-pad"
          />
        ) : null}
      </FormSection>

      <FormSection title="أحجام الخط" icon="format-size">
        <AppInput
          label="حجم خط الإيصال"
          value={settings.customer_receipt_font_size}
          onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_font_size: t }))}
          keyboardType="number-pad"
        />
        <AppInput
          label="حجم خط المطبخ"
          value={settings.kitchen_ticket_font_size}
          onChangeText={(t) => setSettings((s) => ({ ...s, kitchen_ticket_font_size: t }))}
          keyboardType="number-pad"
        />
        {settings.print_shift_close_report ? (
          <AppInput
            label="حجم خط إغلاق الوردية"
            value={settings.shift_close_font_size}
            onChangeText={(t) => setSettings((s) => ({ ...s, shift_close_font_size: t }))}
            keyboardType="number-pad"
          />
        ) : null}
      </FormSection>

      <FormSection title="ترويسة وتذييل" icon="article">
        <AppInput
          label="ترويسة الإيصال"
          value={settings.receipt_header}
          onChangeText={(t) => setSettings((s) => ({ ...s, receipt_header: t }))}
          multiline
        />
        <AppInput
          label="رسالة تذييل العميل"
          value={settings.customer_receipt_footer_message}
          onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_footer_message: t }))}
          multiline
        />
        <AppInput
          label="عنوان على الإيصال"
          value={settings.receipt_address}
          onChangeText={(t) => setSettings((s) => ({ ...s, receipt_address: t }))}
        />
        <AppInput
          label="هاتف على الإيصال"
          value={settings.receipt_phone}
          onChangeText={(t) => setSettings((s) => ({ ...s, receipt_phone: t }))}
        />
        <AppInput
          label="سياسة الإرجاع"
          value={settings.receipt_return_policy}
          onChangeText={(t) => setSettings((s) => ({ ...s, receipt_return_policy: t }))}
          multiline
        />
        <AppInput
          label="بريد على الإيصال"
          value={settings.receipt_email}
          onChangeText={(t) => setSettings((s) => ({ ...s, receipt_email: t }))}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <AppInput
          label="تذييل المطور"
          value={settings.customer_receipt_developer_footer}
          onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_developer_footer: t }))}
          multiline
        />
        <AppInput
          label="تذييل إضافي"
          value={settings.receipt_footer}
          onChangeText={(t) => setSettings((s) => ({ ...s, receipt_footer: t }))}
          multiline
        />
        <ImagePickerField
          label="شعار الإيصال"
          remoteUrl={settings.receipt_logo_url}
          value={logoPick}
          onChange={setLogoPick}
        />
        <AppInput
          label="حجم اللوجو على الإيصال (%)"
          value={settings.customer_receipt_logo_scale}
          onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_logo_scale: t.replace(/\D/g, '') }))}
          keyboardType="number-pad"
        />
      </FormSection>
    </FormScreenLayout>
  );
}
