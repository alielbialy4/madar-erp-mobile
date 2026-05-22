import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { branchesManageAPI, type BranchSettingsPatch } from '@/api/branchesManage';
import { warehousesAPI } from '@/api/inventory';
import { vaultsAPI } from '@/api/vaults';
import { AppScreen } from '@/components/layout';
import { ImagePickerField } from '@/components/forms/ImagePickerField';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppSelect, AppTabs } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import type { SelectOption } from '@/components/ui/AppSelect';
import type { BranchManageRow } from '@/types/branches';
import type { PickedImage } from '@/types/api';
import {
  buildBranchSettingsPayload,
  defaultBranchSettingsForm,
  isPrintFontSizeInRange,
  parseBranchSettingsObject,
  PRINT_FONT_SIZE_MAX,
  PRINT_FONT_SIZE_MIN,
  type BranchSettingsForm,
} from '@/utils/branchSettings';
import { useColors } from '@/hooks/useColors';

const BOOL_OPTS: SelectOption[] = [
  { label: 'نعم', value: '1' },
  { label: 'لا', value: '0' },
];

const STATUS_OPTS: SelectOption[] = [
  { label: 'نشط', value: 'active' },
  { label: 'غير نشط', value: 'inactive' },
];

const SERVICE_TYPE_OPTS: SelectOption[] = [
  { label: 'نسبة مئوية', value: 'percentage' },
  { label: 'مبلغ ثابت', value: 'fixed' },
];

const SERVICE_APPLY_OPTS: SelectOption[] = [
  { label: 'صالة', value: 'dine_in' },
  { label: 'توصيل', value: 'delivery' },
  { label: 'تيك أواي', value: 'takeaway' },
  { label: 'الكل', value: 'all' },
];

type TabId = 'basic' | 'warehouse' | 'tax' | 'printing';

type BasicForm = {
  name: string;
  code: string;
  location: string;
  address: string;
  contact_phone: string;
  contact_email: string;
  status: 'active' | 'inactive';
  is_main: boolean;
};

type WarehouseForm = { warehouse_id: string; vault_id: string };

const TABS = [
  { key: 'basic', label: 'أساسي' },
  { key: 'warehouse', label: 'مخزن/خزينة' },
  { key: 'tax', label: 'ضريبة' },
  { key: 'printing', label: 'طباعة' },
];

export function BranchSettingsScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = String(route.params?.id ?? '');
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_branches');

  const [activeTab, setActiveTab] = useState<TabId>('basic');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [basic, setBasic] = useState<BasicForm>({
    name: '', code: '', location: '', address: '', contact_phone: '', contact_email: '', status: 'active', is_main: false,
  });
  const [warehouse, setWarehouse] = useState<WarehouseForm>({ warehouse_id: '', vault_id: '' });
  const [settings, setSettings] = useState<BranchSettingsForm>(defaultBranchSettingsForm());
  const [logoPick, setLogoPick] = useState<PickedImage | null>(null);
  const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);
  const [vaultOptions, setVaultOptions] = useState<SelectOption[]>([]);

  const loadOptions = useCallback(async () => {
    try {
      const [whRes, vaultRes] = await Promise.all([
        warehousesAPI.list({ status: 'active', per_page: 100 } as never),
        vaultsAPI.list({ active_only: false, per_page: 100 } as never),
      ]);
      const warehouses = extractArray<{ id: string; name: string; branch?: { name: string } | null }>(whRes);
      setWarehouseOptions(warehouses.map((w) => ({ label: w.name, value: String(w.id) })));
      const vaults = extractArray<{ id: string; name: string }>(vaultRes);
      setVaultOptions(vaults.map((v) => ({ label: v.name, value: String(v.id) })));
    } catch {
      setWarehouseOptions([]);
      setVaultOptions([]);
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await branchesManageAPI.get(id);
      const b = extractData<BranchManageRow>(res);
      if (!b) throw new Error('الفرع غير موجود');
      const raw = b.settings && typeof b.settings === 'object' ? (b.settings as Record<string, unknown>) : undefined;
      setSettings(parseBranchSettingsObject(raw));
      setBasic({
        name: b.name,
        code: b.code,
        location: b.location ?? '',
        address: b.address ?? '',
        contact_phone: b.contact_info?.phone ?? b.phone ?? '',
        contact_email: b.contact_info?.email ?? b.email ?? '',
        status: b.status === 'inactive' ? 'inactive' : 'active',
        is_main: Boolean(b.is_main),
      });
      setWarehouse({
        warehouse_id: String(b.warehouse_id ?? b.default_warehouse_id ?? b.default_warehouse?.id ?? ''),
        vault_id: String(b.vault_id ?? b.default_vault_id ?? b.default_vault?.id ?? ''),
      });
      setLogoPick(null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadOptions();
    void load();
  }, [load, loadOptions]);

  const setBool = (key: keyof BranchSettingsForm, v: string) => {
    setSettings((s) => ({ ...s, [key]: v === '1' }));
  };

  const patchSettings = async (payload: BranchSettingsPatch, uploadLogo?: boolean) => {
    if (!canManage) return;
    setBusy(true);
    setMessage(null);
    try {
      if (uploadLogo && logoPick) {
        const logoRes = await branchesManageAPI.uploadReceiptLogo(id, logoPick);
        const url = extractData<{ logo_url?: string }>(logoRes)?.logo_url;
        if (url) setSettings((s) => ({ ...s, receipt_logo_url: url }));
        setLogoPick(null);
      }
      await branchesManageAPI.patchSettings(id, payload);
      setMessage('تم حفظ الإعدادات');
      await load();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const saveBasic = async () => {
    if (!basic.name.trim() || !basic.code.trim()) {
      setError('الاسم والكود مطلوبان');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await branchesManageAPI.update(id, {
        name: basic.name.trim(),
        code: basic.code.trim(),
        location: basic.location.trim() || null,
        address: basic.address.trim() || null,
        contact_phone: basic.contact_phone.trim() || null,
        contact_email: basic.contact_email.trim() || null,
        status: basic.status,
        is_main: basic.is_main,
      });
      setMessage('تم حفظ البيانات الأساسية');
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const saveWarehouse = async () => {
    if (!warehouse.warehouse_id || !warehouse.vault_id) {
      setError('المخزن والخزينة مطلوبان');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await branchesManageAPI.update(id, {
        warehouse_id: warehouse.warehouse_id,
        vault_id: warehouse.vault_id,
      });
      setMessage('تم حفظ المخزن والخزينة');
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const saveTax = () =>
    void patchSettings(
      buildBranchSettingsPayload(settings, [
        'tax_enabled', 'tax_rate', 'tax_name', 'tax_inclusive',
        'service_charge_enabled', 'service_charge_type', 'service_charge_value',
        'service_charge_apply_to', 'service_charge_label',
        'allow_pos_discount', 'allow_pos_coupon',
      ]),
    );

  const savePrinting = () => {
    const customerSize = parseInt(settings.customer_receipt_font_size, 10);
    const kitchenSize = parseInt(settings.kitchen_ticket_font_size, 10);
    if (!isPrintFontSizeInRange(customerSize) || !isPrintFontSizeInRange(kitchenSize)) {
      setError(`حجم الخط يجب أن يكون بين ${PRINT_FONT_SIZE_MIN} و ${PRINT_FONT_SIZE_MAX}`);
      return;
    }
    void patchSettings(
      buildBranchSettingsPayload(settings, [
        'auto_print_receipt', 'enable_kitchen_print', 'use_server_kitchen_print_queue',
        'receipt_show_print_sequence', 'print_sequence_max', 'print_shift_close_report',
        'receipt_show_invoice_number', 'receipt_show_invoice_barcode', 'receipt_show_product_category',
        'receipt_show_branch_name', 'customer_printer_name', 'receipt_header',
        'customer_receipt_footer_message', 'customer_receipt_developer_footer',
        'receipt_address', 'receipt_phone', 'receipt_email', 'receipt_return_policy',
        'customer_receipt_font_size', 'kitchen_ticket_font_size', 'receipt_footer',
      ]),
      true,
    );
  };

  const tabContent = useMemo(() => {
    if (!canManage) {
      return <Text style={{ color: c.textMuted }}>قراءة فقط — يتطلب manage_branches</Text>;
    }
    switch (activeTab) {
      case 'basic':
        return (
          <View style={{ gap: spacing.md }}>
            <AppInput label="الاسم *" value={basic.name} onChangeText={(t) => setBasic((b) => ({ ...b, name: t }))} />
            <AppInput label="الكود" value={basic.code} editable={false} />
            <AppInput label="الموقع" value={basic.location} onChangeText={(t) => setBasic((b) => ({ ...b, location: t }))} />
            <AppInput label="العنوان" value={basic.address} onChangeText={(t) => setBasic((b) => ({ ...b, address: t }))} />
            <AppInput label="هاتف" value={basic.contact_phone} onChangeText={(t) => setBasic((b) => ({ ...b, contact_phone: t }))} keyboardType="phone-pad" />
            <AppInput label="بريد" value={basic.contact_email} onChangeText={(t) => setBasic((b) => ({ ...b, contact_email: t }))} autoCapitalize="none" />
            <AppSelect label="الحالة" value={basic.status} options={STATUS_OPTS} onChange={(v) => setBasic((b) => ({ ...b, status: v as 'active' | 'inactive' }))} />
            <AppSelect label="فرع رئيسي" value={basic.is_main ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBasic((b) => ({ ...b, is_main: v === '1' }))} />
            <AppButton title="حفظ القسم" onPress={() => void saveBasic()} loading={busy} />
          </View>
        );
      case 'warehouse':
        return (
          <View style={{ gap: spacing.md }}>
            <AppSelect label="المخزن *" value={warehouse.warehouse_id || null} options={[{ label: '—', value: '' }, ...warehouseOptions]} onChange={(v) => setWarehouse((w) => ({ ...w, warehouse_id: v }))} />
            <AppSelect label="الخزينة *" value={warehouse.vault_id || null} options={[{ label: '—', value: '' }, ...vaultOptions]} onChange={(v) => setWarehouse((w) => ({ ...w, vault_id: v }))} />
            <AppButton title="حفظ القسم" onPress={() => void saveWarehouse()} loading={busy} />
          </View>
        );
      case 'tax':
        return (
          <View style={{ gap: spacing.md }}>
            <AppSelect label="تفعيل الضريبة" value={settings.tax_enabled ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('tax_enabled', v)} />
            <AppInput label="نسبة الضريبة %" value={settings.tax_rate} onChangeText={(t) => setSettings((s) => ({ ...s, tax_rate: t }))} keyboardType="decimal-pad" />
            <AppInput label="اسم الضريبة" value={settings.tax_name} onChangeText={(t) => setSettings((s) => ({ ...s, tax_name: t }))} />
            <AppSelect label="شامل الضريبة" value={settings.tax_inclusive ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('tax_inclusive', v)} />
            <AppSelect label="رسوم الخدمة" value={settings.service_charge_enabled ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('service_charge_enabled', v)} />
            <AppSelect label="نوع الرسوم" value={settings.service_charge_type} options={SERVICE_TYPE_OPTS} onChange={(v) => setSettings((s) => ({ ...s, service_charge_type: v as 'percentage' | 'fixed' }))} />
            <AppInput label="قيمة الرسوم" value={settings.service_charge_value} onChangeText={(t) => setSettings((s) => ({ ...s, service_charge_value: t }))} keyboardType="decimal-pad" />
            <AppSelect label="تطبيق الرسوم على" value={settings.service_charge_apply_to} options={SERVICE_APPLY_OPTS} onChange={(v) => setSettings((s) => ({ ...s, service_charge_apply_to: v as BranchSettingsForm['service_charge_apply_to'] }))} />
            <AppInput label="تسمية الرسوم" value={settings.service_charge_label} onChangeText={(t) => setSettings((s) => ({ ...s, service_charge_label: t }))} />
            <AppSelect label="خصم يدوي POS" value={settings.allow_pos_discount ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('allow_pos_discount', v)} />
            <AppSelect label="كوبونات POS" value={settings.allow_pos_coupon ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('allow_pos_coupon', v)} />
            <AppButton title="حفظ القسم" onPress={saveTax} loading={busy} />
          </View>
        );
      case 'printing':
        return (
          <View style={{ gap: spacing.md }}>
            <AppSelect label="طباعة إيصال تلقائي" value={settings.auto_print_receipt ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('auto_print_receipt', v)} />
            <AppSelect label="طباعة مطبخ" value={settings.enable_kitchen_print ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('enable_kitchen_print', v)} />
            <AppSelect label="طابور طباعة السيرفر" value={settings.use_server_kitchen_print_queue ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('use_server_kitchen_print_queue', v)} />
            <AppSelect label="تقرير إغلاق الوردية" value={settings.print_shift_close_report ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('print_shift_close_report', v)} />
            <AppSelect label="رقم الفاتورة على الإيصال" value={settings.receipt_show_invoice_number ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('receipt_show_invoice_number', v)} />
            <AppSelect label="باركود الفاتورة" value={settings.receipt_show_invoice_barcode ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('receipt_show_invoice_barcode', v)} />
            <AppSelect label="تصنيف المنتج" value={settings.receipt_show_product_category ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('receipt_show_product_category', v)} />
            <AppSelect label="تسلسل الطباعة" value={settings.receipt_show_print_sequence ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('receipt_show_print_sequence', v)} />
            <AppSelect label="اسم الفرع على الإيصال" value={settings.receipt_show_branch_name ? '1' : '0'} options={BOOL_OPTS} onChange={(v) => setBool('receipt_show_branch_name', v)} />
            <AppInput label="اسم طابعة العميل" value={settings.customer_printer_name} onChangeText={(t) => setSettings((s) => ({ ...s, customer_printer_name: t }))} />
            <AppInput label="أقصى تسلسل (فارغ = بدون)" value={settings.print_sequence_max} onChangeText={(t) => setSettings((s) => ({ ...s, print_sequence_max: t.replace(/\D/g, '') }))} keyboardType="number-pad" />
            <AppInput label="حجم خط الإيصال" value={settings.customer_receipt_font_size} onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_font_size: t }))} keyboardType="number-pad" />
            <AppInput label="حجم خط المطبخ" value={settings.kitchen_ticket_font_size} onChangeText={(t) => setSettings((s) => ({ ...s, kitchen_ticket_font_size: t }))} keyboardType="number-pad" />
            <AppInput label="ترويسة الإيصال" value={settings.receipt_header} onChangeText={(t) => setSettings((s) => ({ ...s, receipt_header: t }))} multiline />
            <AppInput label="رسالة تذييل العميل" value={settings.customer_receipt_footer_message} onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_footer_message: t }))} multiline />
            <AppInput label="تذييل المطور" value={settings.customer_receipt_developer_footer} onChangeText={(t) => setSettings((s) => ({ ...s, customer_receipt_developer_footer: t }))} />
            <AppInput label="عنوان على الإيصال" value={settings.receipt_address} onChangeText={(t) => setSettings((s) => ({ ...s, receipt_address: t }))} />
            <AppInput label="هاتف على الإيصال" value={settings.receipt_phone} onChangeText={(t) => setSettings((s) => ({ ...s, receipt_phone: t }))} />
            <AppInput label="بريد على الإيصال" value={settings.receipt_email} onChangeText={(t) => setSettings((s) => ({ ...s, receipt_email: t }))} />
            <AppInput label="سياسة الإرجاع" value={settings.receipt_return_policy} onChangeText={(t) => setSettings((s) => ({ ...s, receipt_return_policy: t }))} multiline />
            <ImagePickerField label="شعار الإيصال" remoteUrl={settings.receipt_logo_url} value={logoPick} onChange={setLogoPick} />
            <Text style={{ fontSize: 12, color: c.textMuted }}>
              إدارة طابعات المطبخ والتوجيه (Kitchen printers / routing) متاحة على الويب وسطح المكتب.
            </Text>
            <AppButton title="حفظ القسم" onPress={savePrinting} loading={busy} />
          </View>
        );
      default:
        return null;
    }
  }, [activeTab, basic, warehouse, settings, logoPick, canManage, busy, c, warehouseOptions, vaultOptions]);

  const onTabChange = (next: string) => {
    const key = next as TabId;
    if (key === activeTab) return;
    setActiveTab(key);
  };

  return (
    <AppScreen title="إعدادات الفرع" onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
      {message ? <Text style={{ color: c.info }}>{message}</Text> : null}
      <AppCard>
        <AppTabs tabs={TABS} activeKey={activeTab} onChange={onTabChange} />
        <View style={{ marginTop: spacing.md }}>{tabContent}</View>
      </AppCard>
    </AppScreen>
  );
}
