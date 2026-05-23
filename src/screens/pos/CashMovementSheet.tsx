import React, { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { cashMovementsAPI } from '@/api/cashMovements';
import type { ActiveShift } from '@/types/api';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';

type MovementType = 'cash_in' | 'cash_out';

type Props = {
  visible: boolean;
  shift: ActiveShift | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CashMovementSheet({ visible, shift, onClose, onSuccess }: Props) {
  const s = usePosSheetStyles();
  const [type, setType] = useState<MovementType>('cash_in');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    if (!visible) {
      setType('cash_in');
      setAmount('');
      setReason('');
      setError(null);
      setSaving(false);
      setConfirm(false);
    }
  }, [visible]);

  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [amount]);

  const requestConfirm = () => {
    if (!shift?.id) {
      setError('لا توجد وردية نشطة لتسجيل حركة نقدية.');
      return;
    }
    if (parsedAmount == null) {
      setError('أدخل مبلغاً موجباً.');
      return;
    }
    if (!reason.trim()) {
      setError('سبب الحركة مطلوب.');
      return;
    }
    setError(null);
    setConfirm(true);
  };

  const submit = async () => {
    if (!shift?.id || parsedAmount == null) return;
    setSaving(true);
    setError(null);
    try {
      await cashMovementsAPI.create(String(shift.id), {
        type,
        amount: parsedAmount,
        reason: reason.trim(),
      });
      setConfirm(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppBottomSheet visible={visible} onClose={onClose}>
        <View style={{ gap: spacing.md }}>
          <PosSheetHeader
            title="حركة نقدية"
            subtitle="تسجيل إيداع أو سحب نقدي على الوردية النشطة، بنفس عقد الويب."
          />
          {!shift ? (
            <View style={s.warningBanner}>
              <Text style={s.warningText}>افتح وردية أولاً قبل تسجيل حركة نقدية.</Text>
            </View>
          ) : null}
          {error ? (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
          <AppSelect
            label="النوع"
            value={type}
            onChange={(value) => setType(value as MovementType)}
            options={[
              { label: 'إيداع نقدي', value: 'cash_in' },
              { label: 'سحب نقدي', value: 'cash_out' },
            ]}
          />
          <AppInput
            label="المبلغ"
            required
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <AppInput label="السبب" required value={reason} onChangeText={setReason} placeholder="سبب الحركة" />
          <View style={s.stickyFooter}>
            <AppButton title="تسجيل الحركة" onPress={requestConfirm} disabled={!shift || saving} fullWidth />
            <AppButton title="إلغاء" variant="outline" onPress={onClose} disabled={saving} fullWidth />
          </View>
        </View>
      </AppBottomSheet>
      <ConfirmDialog
        visible={confirm}
        title="تأكيد الحركة النقدية"
        message={`${type === 'cash_in' ? 'إيداع' : 'سحب'} ${money(parsedAmount ?? 0)} على الوردية الحالية؟`}
        confirmLabel="تأكيد"
        variant="primary"
        onConfirm={() => void submit()}
        onCancel={() => setConfirm(false)}
        loading={saving}
      />
    </>
  );
}
