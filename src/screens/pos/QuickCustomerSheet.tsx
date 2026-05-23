import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { customersAPI } from '@/api/customers';
import type { Customer } from '@/types/api';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

type Props = {
  visible: boolean;
  branchId?: string | null;
  onClose: () => void;
  onCreated: (customer: Customer) => void;
};

export function QuickCustomerSheet({ visible, branchId, onClose, onCreated }: Props) {
  const s = usePosSheetStyles();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) {
      setName('');
      setPhone('');
      setError(null);
      setSaving(false);
    }
  }, [visible]);

  const submit = async () => {
    const cleanName = name.trim();
    const cleanPhone = phone.trim();
    if (!cleanName) {
      setError('اسم العميل مطلوب');
      return;
    }
    if (!cleanPhone) {
      setError('رقم الهاتف مطلوب');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await customersAPI.quickCreateForPos({
        name: cleanName,
        phone: cleanPhone,
        branch_id: branchId ?? undefined,
      });
      const data = extractData<Customer | { customer?: Customer }>(response as never);
      const customer = data && 'customer' in data ? data.customer : data as Customer | undefined;
      if (!customer?.id) throw new Error(response.message || 'تعذر إنشاء العميل');
      onCreated(customer as Customer);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: spacing.md }}>
        <PosSheetHeader title="عميل سريع" subtitle="أضف الاسم والهاتف ثم سيتم اختياره في الطلب الحالي مباشرة." />
        {error ? (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        ) : null}
        <AppInput label="الاسم" required value={name} onChangeText={setName} placeholder="اسم العميل" />
        <AppInput
          label="رقم الهاتف"
          required
          value={phone}
          onChangeText={setPhone}
          placeholder="رقم الهاتف"
          keyboardType="phone-pad"
        />
        <View style={s.stickyFooter}>
          <AppButton title={saving ? 'جاري الحفظ...' : 'حفظ واختيار العميل'} loading={saving} onPress={() => void submit()} fullWidth />
          <AppButton title="إلغاء" variant="outline" onPress={onClose} disabled={saving} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
