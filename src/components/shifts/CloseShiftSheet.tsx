import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppChip, AppInput, AppText } from '@/components/ui';
import { shiftsAPI } from '@/api/shifts';
import { printShiftSummaryForShift } from '@/services/printing/shiftSummaryPrint';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import type { ActiveShiftExtended, ClosePreview } from '@/types/shifts';
type Props = {
  visible: boolean;
  shift: ActiveShiftExtended | null;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CloseShiftSheet({ visible, shift, isAdmin, onClose, onSuccess }: Props) {
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [openNextShift, setOpenNextShift] = useState(false);
  const [nextStartingCash, setNextStartingCash] = useState('');
  const [preview, setPreview] = useState<ClosePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closedShiftId, setClosedShiftId] = useState<string | null>(null);
  const [printFailed, setPrintFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !shift?.id) {
      setPreview(null);
      setActualCash('');
      setNotes('');
      setOpenNextShift(false);
      setNextStartingCash('');
      setClosedShiftId(null);
      setPrintFailed(false);
      setErrorMsg(null);
      return;
    }
    if (!isAdmin) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    shiftsAPI
      .previewClose(shift.id)
      .then((res) => {
        const data = extractData<ClosePreview>(res);
        if (!cancelled) setPreview(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setPreview(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, shift?.id, isAdmin]);

  const handleClose = async () => {
    if (!shift?.id) return;
    const amount = Number(actualCash);
    if (!Number.isFinite(amount) || amount < 0) {
      setErrorMsg('أدخل النقدية الفعلية بشكل صحيح');
      return;
    }
    const vaultIdForNext = shift.vault_id;
    if (openNextShift && !vaultIdForNext) {
      setErrorMsg('لا يمكن فتح وردية تالية بدون خزنة');
      return;
    }
    let nextStart = 0;
    if (openNextShift) {
      nextStart = nextStartingCash.trim() === '' ? 0 : Number(nextStartingCash);
      if (!Number.isFinite(nextStart) || nextStart < 0) {
        setErrorMsg('مبلغ افتتاح الوردية التالية غير صالح');
        return;
      }
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await shiftsAPI.close(shift.id, {
        actual_cash: amount,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      });

      const printRes = await printShiftSummaryForShift(shift.id);
      const failedPrint = !printRes.ok;
      if (failedPrint) {
        setPrintFailed(true);
        setClosedShiftId(shift.id);
        Alert.alert('تم الإغلاق', printRes.message || 'تم إغلاق الوردية، لكن فشلت الطباعة');
      } else {
        Alert.alert('تم', 'تم إغلاق الوردية وطباعة التقرير');
      }

      if (openNextShift && vaultIdForNext) {
        try {
          await shiftsAPI.open({ vault_id: vaultIdForNext, starting_cash: nextStart });
          Alert.alert('تم', 'تم فتح وردية جديدة');
        } catch (err) {
          Alert.alert('تنبيه', normalizeApiError(err).message || 'فشل فتح الوردية التالية');
        }
      }

      onSuccess();
      if (!failedPrint) onClose();
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReprint = async () => {
    if (!closedShiftId) return;
    setSubmitting(true);
    try {
      const res = await printShiftSummaryForShift(closedShiftId);
      if (res.ok) {
        Alert.alert('تم', res.message);
        onSuccess();
        onClose();
      } else {
        Alert.alert('خطأ', res.message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="إغلاق الوردية">
      <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
        {shift?.vault?.name ? (
          <AppText style={textStart}>
            الخزنة: <AppText style={{ fontWeight: '800' }}>{shift.vault.name}</AppText>
          </AppText>
        ) : null}

        {isAdmin && loadingPreview ? <AppText style={textStart}>جاري حساب النقد المتوقع…</AppText> : null}
        {isAdmin && preview && !loadingPreview ? (
          <View style={{ gap: spacing.sm, padding: spacing.md, borderRadius: 12, backgroundColor: '#eff6ff' }}>
            <View style={{ ...flexRow, justifyContent: 'space-between' }}>
              <AppText style={textStart}>نقدية الافتتاح</AppText>
              <AppText style={{ fontWeight: '800' }}>{money(preview.starting_cash)}</AppText>
            </View>
            <View style={{ ...flexRow, justifyContent: 'space-between' }}>
              <AppText style={textStart}>النقد المتوقع</AppText>
              <AppText style={{ fontWeight: '800' }}>{money(preview.expected_cash)}</AppText>
            </View>
          </View>
        ) : null}

        {!isAdmin ? (
          <AppText style={{ ...textStart, opacity: 0.75 }}>أدخل النقدية الفعلية في الدرج دون عرض الرصيد المتوقع.</AppText>
        ) : null}

        {!closedShiftId ? (
          <>
            <AppInput
              label="النقدية الفعلية"
              keyboardType="decimal-pad"
              value={actualCash}
              onChangeText={setActualCash}
              placeholder="0.00"
            />
            <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
            <View style={{ gap: spacing.sm }}>
              <AppText style={{ ...textStart, fontWeight: '700' }}>فتح وردية تالية بعد الإغلاق</AppText>
              <View style={{ ...flexRow, gap: spacing.sm }}>
                <AppChip label="لا" active={!openNextShift} onPress={() => setOpenNextShift(false)} />
                <AppChip
                  label="نعم"
                  active={openNextShift}
                  onPress={shift?.vault_id ? () => setOpenNextShift(true) : undefined}
                />
              </View>
              {openNextShift ? (
                <AppInput
                  label="نقدية افتتاح الوردية التالية"
                  keyboardType="decimal-pad"
                  value={nextStartingCash}
                  onChangeText={setNextStartingCash}
                  placeholder="0.00"
                />
              ) : null}
            </View>
          </>
        ) : null}

        {closedShiftId && printFailed ? (
          <View style={{ gap: spacing.sm }}>
            <AppText style={{ ...textStart, color: '#b45309', fontWeight: '700' }}>
              تم إغلاق الوردية، لكن فشلت الطباعة
            </AppText>
            <AppButton title="طباعة تقرير الوردية" variant="secondary" loading={submitting} onPress={() => void handleReprint()} />
          </View>
        ) : null}

        {errorMsg ? <AppText style={{ ...textStart, color: '#dc2626', fontWeight: '700' }}>{errorMsg}</AppText> : null}

        {!closedShiftId ? (
          <AppButton title="إغلاق الوردية" variant="danger" loading={submitting} onPress={() => void handleClose()} />
        ) : (
          <AppButton title="إغلاق" variant="secondary" onPress={onClose} />
        )}
      </View>
    </AppBottomSheet>
  );
}
