import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppBadge, AppButton, AppChip, AppInput, AppSelect, AppText } from '@/components/ui';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { extractArray, extractData } from '@/utils/data';
import { printShiftSummaryForShift } from '@/services/printing/shiftSummaryPrint';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import type { ActiveShiftExtended, ClosePreview, ShiftDetailedSummary } from '@/types/shifts';
import { ShiftClosingAmountBanner } from './ShiftClosingAmountBanner';
import { ShiftKpiRow, ShiftSectionCard, ShiftSheetFooter } from './shiftSheetUi';

function closingPaymentBanners(
  totals: {
    card_payments?: string;
    instapay_payments?: string;
    electronic_wallet_payments?: string;
    credit_payments?: string;
    layaway_payments?: string;
    debt_collections?: string;
    layaway_collections?: string;
  } | null,
  expectedCash: string | number | null | undefined,
  showExpected: boolean,
) {
  if (!totals) return null;
  const card = Number(totals.card_payments ?? 0);
  const credit = Number(totals.credit_payments ?? 0);
  const layaway = Number(totals.layaway_payments ?? 0);
  const debtCollections = Number(totals.debt_collections ?? 0);
  const layawayCollections = Number(totals.layaway_collections ?? 0);
  return (
    <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
      {card > 0 ? (
        <View style={{ ...flexRow, justifyContent: 'space-between' }}>
          <AppText style={textStart}>بطاقات</AppText>
          <AppText style={{ fontWeight: '800' }}>{money(card)}</AppText>
        </View>
      ) : null}
      <ShiftClosingAmountBanner label="إنستا باي" value={money(totals.instapay_payments ?? 0)} variant="instapay" />
      <ShiftClosingAmountBanner
        label="محافظ إلكترونية"
        value={money(totals.electronic_wallet_payments ?? 0)}
        variant="ewallet"
      />
      {credit > 0 ? (
        <View style={{ ...flexRow, justifyContent: 'space-between' }}>
          <AppText style={{ ...textStart, opacity: 0.85 }}>مبيعات آجل (إجمالي الفواتير)</AppText>
          <AppText style={{ fontWeight: '800' }}>{money(credit)}</AppText>
        </View>
      ) : null}
      {layaway > 0 ? (
        <View style={{ ...flexRow, justifyContent: 'space-between' }}>
          <AppText style={{ ...textStart, opacity: 0.85 }}>مبيعات تقسيط (إجمالي الفواتير)</AppText>
          <AppText style={{ fontWeight: '800' }}>{money(layaway)}</AppText>
        </View>
      ) : null}
      {debtCollections > 0 ? (
        <View style={{ ...flexRow, justifyContent: 'space-between' }}>
          <AppText style={textStart}>تحصيل ديون عملاء</AppText>
          <AppText style={{ fontWeight: '800' }}>{money(debtCollections)}</AppText>
        </View>
      ) : null}
      {layawayCollections > 0 ? (
        <View style={{ ...flexRow, justifyContent: 'space-between' }}>
          <AppText style={textStart}>تحصيل أقساط تقسيط</AppText>
          <AppText style={{ fontWeight: '800' }}>{money(layawayCollections)}</AppText>
        </View>
      ) : null}
      {showExpected ? (
        <ShiftClosingAmountBanner label="النقد المتوقع" value={money(expectedCash ?? 0)} variant="cash" />
      ) : null}
      {(credit > 0 || layaway > 0 || debtCollections > 0 || layawayCollections > 0) ? (
        <AppText style={{ ...textStart, opacity: 0.75, fontSize: 12 }}>
          إجمالي الفاتورة عند البيع — التحصيل اللاحق يظهر أعلاه
        </AppText>
      ) : null}
    </View>
  );
}
type Props = {
  visible: boolean;
  shift: ActiveShiftExtended | null;
  isAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CloseShiftSheet({ visible, shift, isAdmin, onClose, onSuccess }: Props) {
  const c = useColors();
  const [actualCash, setActualCash] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositFollowsActual, setDepositFollowsActual] = useState(true);
  const [depositVaultId, setDepositVaultId] = useState<string | null>(null);
  const [vaults, setVaults] = useState<Record<string, unknown>[]>([]);
  const [notes, setNotes] = useState('');
  const [openNextShift, setOpenNextShift] = useState(false);
  const [nextStartingCash, setNextStartingCash] = useState('');
  const [preview, setPreview] = useState<ClosePreview | null>(null);
  const [summary, setSummary] = useState<ShiftDetailedSummary | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [closedShiftId, setClosedShiftId] = useState<string | null>(null);
  const [printFailed, setPrintFailed] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !shift?.id) {
      setPreview(null);
      setSummary(null);
      setActualCash('');
      setDepositAmount('');
      setDepositFollowsActual(true);
      setDepositVaultId(null);
      setVaults([]);
      setNotes('');
      setOpenNextShift(false);
      setNextStartingCash('');
      setClosedShiftId(null);
      setPrintFailed(false);
      setErrorMsg(null);
      return;
    }
    let cancelled = false;
    setLoadingPreview(true);
    const summaryParams = shift.branch_id ? { branch_id: shift.branch_id } : undefined;
    const tasks: Promise<void>[] = [
      shiftsAPI
        .getSummary(shift.id, summaryParams)
        .then((res) => {
          const data = extractData<ShiftDetailedSummary>(res);
          if (!cancelled) setSummary(data ?? null);
        })
        .catch(() => {
          if (!cancelled) setSummary(null);
        }),
    ];
    if (isAdmin) {
      tasks.push(
        shiftsAPI
          .previewClose(shift.id)
          .then((res) => {
            const data = extractData<ClosePreview>(res);
            if (!cancelled) setPreview(data ?? null);
          })
          .catch(() => {
            if (!cancelled) setPreview(null);
          }),
      );
    } else {
      setPreview(null);
    }
    Promise.all(tasks).finally(() => {
      if (!cancelled) setLoadingPreview(false);
    });
    return () => {
      cancelled = true;
    };
  }, [visible, shift?.id, shift?.branch_id, isAdmin]);

  useEffect(() => {
    if (!visible || !shift?.drawer_ledger_enabled) return;
    vaultsAPI
      .list({ active_only: true })
      .then((res) => {
        const list = extractArray<Record<string, unknown>>(res);
        setVaults(list);
        const preferred = shift.vault_id ? String(shift.vault_id) : null;
        setDepositVaultId((prev) => {
          if (prev && list.some((v) => String(v.id) === prev)) return prev;
          if (preferred && list.some((v) => String(v.id) === preferred)) return preferred;
          return list[0]?.id ? String(list[0].id) : null;
        });
      })
      .catch(() => setVaults([]));
  }, [visible, shift?.drawer_ledger_enabled, shift?.vault_id]);

  const closeTotals = summary?.totals;
  const paymentInfo = closeTotals ?? preview;
  const closeBlockers = summary?.close_blockers?.length
    ? summary.close_blockers
    : preview?.close_blockers?.length
      ? preview.close_blockers
      : [];
  const canCloseShift = summary?.can_close ?? preview?.can_close ?? closeBlockers.length === 0;
  const closeBlockerMessage = closeBlockers.map((b) => b.message).join(' ');
  const expectedCashNum = Number(closeTotals?.expected_cash ?? preview?.expected_cash ?? NaN);
  const countedCashNum = actualCash.trim() === '' ? null : Number(actualCash.replace(',', '.'));
  const liveDifference =
    countedCashNum != null && Number.isFinite(countedCashNum) && Number.isFinite(expectedCashNum)
      ? countedCashNum - expectedCashNum
      : null;
  const expectedIsNegative = Number.isFinite(expectedCashNum) && expectedCashNum < 0;
  const needsCloseReasonUi =
    expectedIsNegative || (liveDifference != null && liveDifference !== 0);

  const parseNonNegativeMoney = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return 0;
    const n = Number(trimmed.replace(',', '.'));
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  };

  const handleClose = async () => {
    if (!shift?.id) return;
    if (!canCloseShift) {
      setErrorMsg(closeBlockerMessage || 'لا يمكن إغلاق الوردية حالياً');
      return;
    }
    const amount = parseNonNegativeMoney(actualCash);
    if (amount === null) {
      setErrorMsg('أدخل النقدية الفعلية بشكل صحيح');
      return;
    }
    const drawerLedger = Boolean(shift.drawer_ledger_enabled);
    const expectedRaw = closeTotals?.expected_cash ?? preview?.expected_cash ?? null;
    const expectedNum = expectedRaw == null ? null : Number(expectedRaw);
    const variance =
      expectedNum != null && Number.isFinite(expectedNum) ? amount - expectedNum : null;
    const needsReason =
      (expectedNum != null && Number.isFinite(expectedNum) && expectedNum < 0) ||
      (variance != null && variance !== 0);
    if (needsReason && !notes.trim()) {
      setErrorMsg('أدخل سبب الفرق أو الرصيد المتوقع السالب قبل الإغلاق');
      return;
    }
    const vaultIdForNext = shift.vault_id;
    if (openNextShift && !vaultIdForNext) {
      setErrorMsg('لا يمكن فتح وردية تالية بدون خزنة');
      return;
    }
    let nextStart = 0;
    if (openNextShift) {
      const parsedNext = parseNonNegativeMoney(nextStartingCash);
      if (parsedNext === null) {
        setErrorMsg('مبلغ افتتاح الوردية التالية غير صالح');
        return;
      }
      nextStart = parsedNext;
    }

    const depositParsed = parseNonNegativeMoney(depositAmount);
    if (depositParsed === null) {
      setErrorMsg('مبلغ الإيداع غير صالح');
      return;
    }
    const deposit = depositParsed;
    if (drawerLedger && deposit > amount) {
      setErrorMsg('مبلغ الإيداع لا يمكن أن يتجاوز النقد المعدود');
      return;
    }
    if (drawerLedger && deposit > 0 && !depositVaultId) {
      setErrorMsg('اختر خزنة الإيداع');
      return;
    }

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await shiftsAPI.close(shift.id, {
        actual_cash: amount,
        ...(drawerLedger
          ? {
              deposit_amount: deposit,
              vault_settlement_direction: 'deposit',
              ...(deposit > 0 && depositVaultId ? { deposit_vault_id: depositVaultId } : {}),
            }
          : {}),
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
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="إغلاق الوردية"
      subtitle="أدخل النقد الفعلي وأكمل إغلاق الوردية"
      size="fullscreen"
    >
      <View style={styles.content}>
        {shift?.shift_no != null ? (
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            <AppBadge label={`وردية #${shift.shift_no}`} tone="info" />
            {shift.vault?.name ? <AppBadge label={shift.vault.name} tone="neutral" /> : null}
          </View>
        ) : null}
        {(errorMsg || (!canCloseShift && closeBlockerMessage)) ? (
          <View style={[styles.alertBox, { backgroundColor: c.shiftAlertBg, borderColor: c.shiftAlertBorder }]}>
            <AppText style={{ ...textStart, color: c.shiftAlertFg, fontWeight: '700' }}>
              {errorMsg || closeBlockerMessage}
            </AppText>
          </View>
        ) : null}
        {expectedIsNegative ? (
          <View style={[styles.hintBox, { backgroundColor: c.softInfo, borderColor: c.softInfoBorder }]}>
            <AppText style={{ ...textStart, color: c.info, fontSize: 13, fontWeight: '700' }}>
              الرصيد المتوقع للدرج سالب. أغلق بجرد فعلي (≥ 0) مع سبب إلزامي — الإيداع فقط بدون سحب من الخزنة.
            </AppText>
          </View>
        ) : null}
        {isAdmin && liveDifference != null && liveDifference !== 0 ? (
          <View style={[styles.hintBox, { backgroundColor: c.softInfo, borderColor: c.softInfoBorder }]}>
            <AppText style={{ ...textStart, fontWeight: '800' }}>
              {liveDifference < 0 ? 'عجز (Shortage)' : 'زيادة (Surplus)'}: {money(liveDifference)}
            </AppText>
          </View>
        ) : null}

        {isAdmin && loadingPreview ? (
          <AppText style={{ ...textStart, color: c.textMuted }}>جاري حساب النقد المتوقع…</AppText>
        ) : null}
        {(isAdmin || closeTotals) && paymentInfo && !loadingPreview ? (
          <ShiftSectionCard title="ملخص الإغلاق" icon="account-balance-wallet">
            {shift?.drawer_ledger_enabled ? (
              <AppText style={{ ...textStart, opacity: 0.8, fontSize: 12, marginBottom: spacing.xs }}>
                النقد يُعدّ في الدرج؛ الإيداع إلى الخزنة يتم عند الإغلاق.
              </AppText>
            ) : null}
            <ShiftKpiRow
              label="نقدية الافتتاح"
              value={money(closeTotals ? summary?.shift.starting_cash : preview?.starting_cash ?? 0)}
            />
            {closeTotals ? (
              <>
                <ShiftKpiRow label="مبيعات نقدية (الدرج)" value={money(closeTotals.cash_sales)} tone="success" />
                {closingPaymentBanners(
                  closeTotals,
                  closeTotals?.expected_cash ?? preview?.expected_cash,
                  isAdmin,
                )}
              </>
            ) : (
              closingPaymentBanners(preview, preview?.expected_cash, isAdmin)
            )}
            {isAdmin ? (
              <AppText style={{ ...textStart, opacity: 0.75, fontSize: 12 }}>
                نقد الدرج فقط — لا يشمل البطاقات أو المحافظ الإلكترونية أو إنستاباي
              </AppText>
            ) : null}
          </ShiftSectionCard>
        ) : null}

        {!isAdmin ? (
          <View style={[styles.hintBox, { backgroundColor: c.softInfo, borderColor: c.softInfoBorder }]}>
            <AppText style={{ ...textStart, color: c.info, fontSize: 13 }}>
              أدخل النقدية الفعلية في الدرج دون عرض الرصيد المتوقع.
            </AppText>
          </View>
        ) : null}

        {!closedShiftId ? (
          <ShiftSectionCard title="بيانات الإغلاق" icon="edit-note">
            <AppInput
              label="النقدية الفعلية"
              keyboardType="decimal-pad"
              value={actualCash}
              onChangeText={(v) => {
                setActualCash(v);
                if (shift?.drawer_ledger_enabled && depositFollowsActual) {
                  setDepositAmount(v);
                }
              }}
              placeholder="0.00"
            />
            {shift?.drawer_ledger_enabled ? (
              <>
                <AppText style={{ ...textStart, fontWeight: '700', marginTop: spacing.sm }}>
                  إيداع النقد المعدود إلى الخزنة
                </AppText>
                <AppText style={{ ...textStart, opacity: 0.75, fontSize: 12 }}>
                  إغلاق الوردية يتم بإيداع فقط (نمط Till) — السحب من الخزنة غير متاح عند الإغلاق.
                </AppText>
                <AppInput
                  label="مبلغ الإيداع إلى الخزنة"
                  keyboardType="decimal-pad"
                  value={depositAmount}
                  onChangeText={(v) => {
                    setDepositFollowsActual(false);
                    setDepositAmount(v);
                  }}
                  placeholder="0.00"
                />
                <AppSelect
                  label="خزنة الإيداع"
                  value={depositVaultId}
                  onChange={setDepositVaultId}
                  options={[
                    { value: '', label: 'اختر خزنة الإيداع' },
                    ...vaults.map((v) => ({
                      value: String(v.id),
                      label: String(v.name ?? v.id),
                    })),
                  ]}
                />
              </>
            ) : null}
            <AppInput
              label={needsCloseReasonUi ? 'ملاحظات (مطلوبة)' : 'ملاحظات'}
              value={notes}
              onChangeText={setNotes}
              multiline
              placeholder={needsCloseReasonUi ? 'سبب العجز/الزيادة أو الرصيد السالب' : undefined}
            />
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
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
          </ShiftSectionCard>
        ) : null}

        {closedShiftId && printFailed ? (
          <ShiftSectionCard title="طباعة التقرير" icon="print">
            <AppText style={{ ...textStart, color: c.warning, fontWeight: '700' }}>
              تم إغلاق الوردية، لكن فشلت الطباعة
            </AppText>
            <AppButton title="طباعة تقرير الوردية" variant="secondary" loading={submitting} onPress={() => void handleReprint()} />
          </ShiftSectionCard>
        ) : null}

        <ShiftSheetFooter>
          {!closedShiftId ? (
            <AppButton
              title="إغلاق الوردية"
              variant="danger"
              loading={submitting}
              disabled={!canCloseShift}
              style={{ flex: 1 }}
              onPress={() => void handleClose()}
            />
          ) : (
            <AppButton title="إغلاق" variant="secondary" style={{ flex: 1 }} onPress={onClose} />
          )}
        </ShiftSheetFooter>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.md },
  alertBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  hintBox: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
});
