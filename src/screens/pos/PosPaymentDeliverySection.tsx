import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { PosOrderTypeSegment, PosSheetSection, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { PosCustomerPickerTrigger } from './PosCustomerPickerTrigger';
import { customersAPI } from '@/api/customers';
import type { Customer, CustomerAddress } from '@/types/api';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

export type PosCustomerLookupRow = {
  id: number;
  name: string;
  phone: string;
  orders_count?: number;
  addresses?: CustomerAddress[];
  latest_delivery_address?: {
    address_text?: string;
    delivery_phone?: string | null;
    delivery_zone_id?: string | null;
    customer_address_id?: string | null;
  } | null;
  latest_order?: { invoice_number?: string | null } | null;
};

export type PosCustomerLookupData = {
  exists: boolean;
  exact_match: boolean;
  customers: PosCustomerLookupRow[];
  duplicate_phone_warning: string | null;
};

const MANUAL_ADDRESS = '__manual__';

type Props = {
  active: boolean;
  isOnline: boolean;
  branchId?: string | null;
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer | null) => void;
  onCustomerCreated: (customer: Customer) => void;
  needsDelivery: boolean;
  deliveryZones: { id: string; name: string; delivery_fee: number | string }[];
  deliveryZoneId: string;
  onDeliveryZoneChange: (id: string) => void;
  deliveryAddress: string;
  onDeliveryAddressChange: (v: string) => void;
  deliveryPhone: string;
  onDeliveryPhoneChange: (v: string) => void;
  deliveryFee: number;
  customerOnly?: boolean;
  needsDeliveryValue: boolean;
  onNeedsDeliveryChange: (v: boolean) => void;
};

function addressLine(addr: CustomerAddress): string {
  return [addr.address_line_1, addr.area, addr.city].filter(Boolean).join('، ') || addr.label || '';
}

function InputRow({ children }: { children: React.ReactNode }) {
  return <View style={{ ...flexRow, gap: spacing.sm, alignItems: 'flex-start' }}>{children}</View>;
}

function InputCol({ children, flex = 1 }: { children: React.ReactNode; flex?: number }) {
  return <View style={{ flex, minWidth: 0 }}>{children}</View>;
}

export function PosPaymentDeliverySection({
  active,
  isOnline,
  branchId,
  customers,
  selectedCustomer,
  onSelectCustomer,
  onCustomerCreated,
  needsDelivery,
  deliveryZones,
  deliveryZoneId,
  onDeliveryZoneChange,
  deliveryAddress,
  onDeliveryAddressChange,
  deliveryPhone,
  onDeliveryPhoneChange,
  deliveryFee,
  customerOnly = false,
  needsDeliveryValue,
  onNeedsDeliveryChange,
}: Props) {
  const c = useColors();
  const s = usePosSheetStyles();

  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupData, setLookupData] = useState<PosCustomerLookupData | null>(null);
  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [savedAddressId, setSavedAddressId] = useState(MANUAL_ADDRESS);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newZoneId, setNewZoneId] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const lookupDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const savedAddressOptions = useMemo(
    () => [
      { value: MANUAL_ADDRESS, label: 'عنوان يدوي' },
      ...savedAddresses.map((addr) => ({
        value: String(addr.id),
        label: addr.label?.trim() || addressLine(addr) || 'عنوان محفوظ',
      })),
    ],
    [savedAddresses],
  );

  const runLookup = useCallback(
    async (phone: string) => {
      const trimmed = phone.trim();
      if (!trimmed || !isOnline) {
        setLookupData(null);
        return;
      }
      setLookupLoading(true);
      try {
        const res = await customersAPI.lookupForPos(trimmed);
        const data = extractData<PosCustomerLookupData>(res as never);
        setLookupData(data ?? null);
      } catch {
        setLookupData(null);
      } finally {
        setLookupLoading(false);
      }
    },
    [isOnline],
  );

  useEffect(() => {
    if (!active || !needsDelivery || !isOnline) {
      if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
      return;
    }
    const q = lookupPhone.trim();
    if (q.length < 3) {
      setLookupData(null);
      return;
    }
    if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
    lookupDebounceRef.current = setTimeout(() => void runLookup(q), 400);
    return () => {
      if (lookupDebounceRef.current) clearTimeout(lookupDebounceRef.current);
    };
  }, [active, needsDelivery, isOnline, lookupPhone, runLookup]);

  useEffect(() => {
    if (!active || !needsDelivery || !selectedCustomer?.id || !isOnline) {
      setSavedAddresses([]);
      setSavedAddressId(MANUAL_ADDRESS);
      return;
    }
    let cancelled = false;
    setAddressesLoading(true);
    void customersAPI
      .getAddresses(selectedCustomer.id)
      .then((res) => {
        if (cancelled) return;
        const list = extractData<CustomerAddress[]>(res as never) ?? [];
        setSavedAddresses(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setSavedAddresses([]);
      })
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [active, needsDelivery, selectedCustomer?.id, isOnline]);

  useEffect(() => {
    if (!needsDelivery || !selectedCustomer?.phone) return;
    if (!deliveryPhone.trim()) {
      onDeliveryPhoneChange(String(selectedCustomer.phone).trim());
    }
  }, [needsDelivery, selectedCustomer?.id, selectedCustomer?.phone]);

  const applyLookupCustomer = (row: PosCustomerLookupRow) => {
    const customer: Customer = {
      id: row.id,
      name: row.name,
      phone: row.phone,
    };
    onSelectCustomer(customer);
    setLookupPhone(row.phone);
    onDeliveryPhoneChange(row.phone);
    setShowNewCustomer(false);
    if (row.latest_delivery_address?.address_text) {
      onDeliveryAddressChange(row.latest_delivery_address.address_text);
      if (row.latest_delivery_address.delivery_zone_id) {
        onDeliveryZoneChange(String(row.latest_delivery_address.delivery_zone_id));
      }
    }
  };

  const handleQuickCreate = async () => {
    const name = newName.trim();
    const phone = newPhone.trim();
    if (!name || !phone) {
      setCreateError('الاسم والهاتف مطلوبان');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      const payload: Parameters<typeof customersAPI.quickCreateForPos>[0] = {
        name,
        phone,
        branch_id: branchId ?? undefined,
      };
      if (newAddress.trim()) {
        payload.address = {
          address_line_1: newAddress.trim(),
          delivery_zone_id: newZoneId || undefined,
        };
      }
      const response = await customersAPI.quickCreateForPos(payload);
      const data = extractData<Customer | { customer?: Customer }>(response as never);
      const customer = data && typeof data === 'object' && 'customer' in data ? data.customer : (data as Customer);
      if (!customer?.id) throw new Error('تعذر إنشاء العميل');
      onCustomerCreated(customer);
      onSelectCustomer(customer);
      onDeliveryPhoneChange(phone);
      if (newAddress.trim()) onDeliveryAddressChange(newAddress.trim());
      if (newZoneId) onDeliveryZoneChange(newZoneId);
      setShowNewCustomer(false);
      setNewName('');
      setNewPhone('');
      setNewAddress('');
      setNewZoneId('');
    } catch (err) {
      setCreateError(normalizeApiError(err).message);
    } finally {
      setCreating(false);
    }
  };

  const openQuickAdd = () => {
    setShowNewCustomer(true);
    if (!needsDeliveryValue) onNeedsDeliveryChange(true);
  };

  const deliveryPanelContent = (
    <View
      style={{
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.xxl,
        borderWidth: 1.5,
        borderColor: c.primarySoftBorder,
        backgroundColor: c.primarySoftMuted,
      }}
    >
      {!isOnline ? (
        <Text style={s.errorText}>التوصيل مع البحث عن العميل يحتاج اتصالاً بالخادم.</Text>
      ) : (
        <View style={{ gap: spacing.sm }}>
          <View style={{ ...flexRow, alignItems: 'center', gap: spacing.xs }}>
            <MaterialIcons name="search" size={18} color={c.primary} />
            <Text style={{ ...textStart, fontSize: typography.small, fontFamily: fonts.bold, color: c.primary }}>
              بحث برقم الهاتف
            </Text>
          </View>
          <InputRow>
            <InputCol flex={2}>
              <AppInput
                label="هاتف العميل"
                value={lookupPhone}
                onChangeText={setLookupPhone}
                placeholder="01xxxxxxxxx"
                keyboardType="phone-pad"
              />
            </InputCol>
            <InputCol>
              <View style={{ paddingTop: 22 }}>
                <AppButton
                  title="بحث"
                  variant="secondary"
                  size="default"
                  fullWidth
                  loading={lookupLoading}
                  disabled={lookupPhone.trim().length < 3}
                  onPress={() => void runLookup(lookupPhone)}
                />
              </View>
            </InputCol>
          </InputRow>

          {lookupLoading ? (
            <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xs }}>
              <ActivityIndicator size="small" color={c.primary} />
              <Text style={{ fontSize: typography.tiny, color: c.textMuted, fontFamily: fonts.medium }}>جاري البحث...</Text>
            </View>
          ) : null}

          {lookupData?.duplicate_phone_warning ? (
            <Text style={{ ...textStart, fontSize: typography.tiny, color: c.warning, fontFamily: fonts.medium }}>
              {lookupData.duplicate_phone_warning}
            </Text>
          ) : null}

          {lookupData?.exists && lookupData.customers.length > 0 ? (
            <View style={{ gap: spacing.xs }}>
              <Text style={{ ...textStart, fontSize: typography.tiny, color: c.success, fontFamily: fonts.bold }}>
                {lookupData.exact_match ? 'عميل مسجّل' : 'تطابق محتمل'}
              </Text>
              {lookupData.customers.map((row) => (
                <View
                  key={row.id}
                  style={{
                    borderWidth: selectedCustomer?.id === row.id ? 2 : 1,
                    borderColor: selectedCustomer?.id === row.id ? c.primary : c.borderSubtle,
                    borderRadius: radius.xl,
                    padding: spacing.md,
                    gap: spacing.xs,
                    backgroundColor: selectedCustomer?.id === row.id ? c.surface : c.surfaceMuted,
                  }}
                >
                  <View style={{ ...flexRow, justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: typography.body, color: c.text }}>{row.name}</Text>
                    <AppButton
                      title={selectedCustomer?.id === row.id ? 'محدد' : 'اختيار'}
                      size="sm"
                      variant={selectedCustomer?.id === row.id ? 'primary' : 'outline'}
                      onPress={() => applyLookupCustomer(row)}
                    />
                  </View>
                  <Text style={{ fontSize: typography.small, color: c.textMuted }}>{row.phone}</Text>
                  {row.latest_delivery_address?.address_text ? (
                    <View style={{ gap: 4 }}>
                      <Text style={{ fontSize: typography.tiny, color: c.textMuted }} numberOfLines={2}>
                        آخر عنوان: {row.latest_delivery_address.address_text}
                      </Text>
                      <Pressable onPress={() => applyLookupCustomer(row)}>
                        <Text style={{ fontSize: typography.tiny, color: c.primary, fontFamily: fonts.bold }}>
                          استخدام هذا العنوان
                        </Text>
                      </Pressable>
                    </View>
                  ) : null}
                </View>
              ))}
            </View>
          ) : null}

          {lookupData && !lookupData.exists && lookupPhone.trim().length >= 3 && !lookupLoading ? (
            <View style={{ gap: spacing.sm }}>
              <Text style={{ ...textStart, fontSize: typography.small, color: c.textMuted }}>
                الرقم غير مسجّل — يمكنك إضافة عميل جديد.
              </Text>
              {!showNewCustomer ? (
                <AppButton
                  title="إضافة عميل جديد"
                  variant="outline"
                  onPress={() => {
                    setShowNewCustomer(true);
                    setNewPhone(lookupPhone.trim());
                  }}
                />
              ) : null}
            </View>
          ) : null}

          {!showNewCustomer && !lookupData ? (
            <AppButton title="إضافة عميل سريع" variant="outline" onPress={openQuickAdd} />
          ) : null}

          {showNewCustomer ? (
            <View
              style={{
                gap: spacing.sm,
                padding: spacing.md,
                borderWidth: 1,
                borderStyle: 'dashed',
                borderColor: c.primarySoftBorder,
                borderRadius: radius.xl,
                backgroundColor: c.surface,
              }}
            >
              <Text style={{ fontFamily: fonts.bold, fontSize: typography.body, color: c.primary }}>عميل جديد</Text>
              <AppInput label="الاسم *" value={newName} onChangeText={setNewName} placeholder="اسم العميل" />
              <AppInput
                label="الهاتف *"
                value={newPhone}
                onChangeText={setNewPhone}
                placeholder="01xxxxxxxxx"
                keyboardType="phone-pad"
              />
              {deliveryZones.length > 0 ? (
                <AppSelect
                  label="منطقة التوصيل"
                  value={newZoneId}
                  options={[{ value: '', label: 'بدون منطقة' }, ...deliveryZones.map((z) => ({ value: String(z.id), label: z.name }))]}
                  onChange={setNewZoneId}
                />
              ) : null}
              <AppInput
                label="عنوان التوصيل (اختياري)"
                value={newAddress}
                onChangeText={setNewAddress}
                placeholder="العنوان الكامل"
              />
              {createError ? <Text style={s.errorText}>{createError}</Text> : null}
              <View style={{ ...flexRow, gap: spacing.sm }}>
                <AppButton
                  title="حفظ واختيار"
                  loading={creating}
                  onPress={() => void handleQuickCreate()}
                  style={{ flex: 1 }}
                />
                <AppButton title="إلغاء" variant="ghost" onPress={() => setShowNewCustomer(false)} />
              </View>
            </View>
          ) : null}
        </View>
      )}

      {selectedCustomer && isOnline && savedAddresses.length > 0 ? (
        <AppSelect
          label="عنوان محفوظ"
          value={savedAddressId}
          options={savedAddressOptions}
          onChange={(v) => {
            setSavedAddressId(v);
            if (v === MANUAL_ADDRESS) return;
            const row = savedAddresses.find((a) => String(a.id) === v);
            if (row) onDeliveryAddressChange(addressLine(row));
          }}
        />
      ) : addressesLoading ? (
        <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm }}>
          <ActivityIndicator size="small" color={c.primary} />
          <Text style={{ fontSize: typography.tiny, color: c.textMuted }}>جاري تحميل العناوين...</Text>
        </View>
      ) : null}

      {deliveryZones.length > 0 ? (
        <View style={{ gap: spacing.xs }}>
          <Text style={{ ...textStart, fontSize: typography.tiny, fontFamily: fonts.bold, color: c.textCaption }}>
            منطقة التوصيل
          </Text>
          {deliveryZones.map((zone) => {
            const selected = deliveryZoneId === String(zone.id);
            return (
              <Pressable
                key={zone.id}
                onPress={() => onDeliveryZoneChange(String(zone.id))}
                style={{
                  minHeight: 48,
                  borderRadius: radius.xl,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? c.primary : c.borderSubtle,
                  backgroundColor: selected ? c.surface : c.surfaceMuted,
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.sm,
                  ...flexRow,
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <Text style={{ fontFamily: fonts.bold, fontSize: typography.body, color: selected ? c.primary : c.text }}>
                  {zone.name}
                </Text>
                <Text style={{ fontFamily: fonts.bold, fontSize: typography.small, color: c.textMuted }}>
                  {money(Number(zone.delivery_fee ?? 0))}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : (
        <Text style={{ fontSize: typography.tiny, color: c.textMuted }}>لا توجد مناطق توصيل نشطة في الكاتالوج.</Text>
      )}

      <AppInput
        label="عنوان التوصيل *"
        value={deliveryAddress}
        onChangeText={(v) => {
          setSavedAddressId(MANUAL_ADDRESS);
          onDeliveryAddressChange(v);
        }}
        placeholder="العنوان الكامل"
      />
      <AppInput
        label="هاتف التوصيل *"
        value={deliveryPhone}
        onChangeText={onDeliveryPhoneChange}
        placeholder="01xxxxxxxxx"
        keyboardType="phone-pad"
      />

      {deliveryFee > 0 ? (
        <Text style={{ ...textStart, fontSize: typography.small, color: c.primary, fontFamily: fonts.bold }}>
          رسوم التوصيل: {money(deliveryFee)}
        </Text>
      ) : null}

      {!selectedCustomer ? (
        <View style={s.warningBanner}>
          <MaterialIcons name="info-outline" size={18} color={c.warning} />
          <Text style={s.warningText}>اختر عميلاً أو أضف عميلاً جديداً قبل إتمام التوصيل.</Text>
        </View>
      ) : !deliveryAddress.trim() ? (
        <View style={s.warningBanner}>
          <Text style={s.warningText}>أدخل عنوان التوصيل.</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <>
      {!customerOnly ? (
        <PosOrderTypeSegment needsDelivery={needsDeliveryValue} onChange={onNeedsDeliveryChange} />
      ) : null}

      <PosSheetSection label="العميل">
        <PosCustomerPickerTrigger
          customers={customers}
          selectedCustomer={selectedCustomer}
          onSelectCustomer={onSelectCustomer}
          onQuickAdd={openQuickAdd}
        />
      </PosSheetSection>

      {needsDelivery ? (
        <PosSheetSection label="بيانات التوصيل">{deliveryPanelContent}</PosSheetSection>
      ) : null}
    </>
  );
}
