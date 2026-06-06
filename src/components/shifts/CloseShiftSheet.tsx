import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppChip, AppInput, AppSelect, AppText } from '@/components/ui';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { extractArray, extractData } from '@/utils/data';
import { printShiftSummaryForShift } from '@/services/printing/shiftSummaryPrint';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { flexRow, textStart } from '@/constants/layout';
import type { ActiveShiftExtended, ClosePreview, ShiftDetailedSummary } from '@/types/shifts';
import { ShiftClosingAmountBanner } from './ShiftClosingAmountBanner';

function closingPaymentBanners(
  totals: {
    card_payments?: string;
    instapay_payments?: string;
    electronic_wallet_payments?: string;
  } | null,
  expectedCash: string | number | null | undefined,
  showExpected: boolean,
) {
  if (!totals) return null;
  const card = Number(totals.card_payments ?? 0);
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
      {showExpected ? (
        <ShiftClosingAmountBanner label="النقد المتوقع" value={money(expectedCash ?? 0)} variant="cash" />
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
  const [vaultSettlementDirection, setVaultSettlementDirection] = useState<'deposit' | 'withdraw'>('withdraw');
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
      setVaultSettlementDirection('withdraw');
      setDepositAmount('');
      setDepositFollowsActual(false);
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
      setErrorMsg(vaultSettlementDirection === 'withdraw' ? 'مبلغ السحب غير صالح' : 'مبلغ الإيداع غير صالح');
      return;
    }
    const deposit = depositParsed;
    const drawerLedger = Boolean(shift.drawer_ledger_enabled);
    if (drawerLedger && vaultSettlementDirection === 'deposit' && deposit > amount) {
      setErrorMsg('مبلغ الإيداع لا يمكن أن يتجاوز النقد المعدود');
      return;
    }
    if (drawerLedger && deposit > 0 && !depositVaultId) {
      setErrorMsg(vaultSettlementDirection === 'withdraw' ? 'اختر خزنة السحب' : 'اختر خزنة الإيداع');
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
              vault_settlement_direction: vaultSettlementDirection,
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
    <AppBottomSheet visible={visible} onClose={onClose} title="إغلاق الوردية">
      <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
        {(errorMsg || (!canCloseShift && closeBlockerMessage)) ? (
          <View
            style={{
              padding: spacing.md,
              borderRadius: 12,
              backgroundColor: c.shiftAlertBg,
              borderWidth: 1,
              borderColor: c.shiftAlertBorder,
            }}
          >
            <AppText style={{ ...textStart, color: c.shiftAlertFg, fontWeight: '700' }}>
              {errorMsg || closeBlockerMessage}
            </AppText>
          </View>
        ) : null}
        {shift?.vault?.name ? (
          <AppText style={textStart}>
            {shift.drawer_ledger_enabled ? 'خزنة إيداع الإغلاق' : 'الخزنة'}:{' '}
            <AppText style={{ fontWeight: '800' }}>{shift.vault.name}</AppText>
          </AppText>
        ) : null}
        {shift?.drawer_ledger_enabled ? (
          <AppText style={{ ...textStart, opacity: 0.8, fontSize: 12 }}>
            النقد يُعدّ في الدرج؛ الإيداع إلى الخزنة يتم عند الإغلاق.
          </AppText>
        ) : null}

        {isAdmin && loadingPreview ? <AppText style={textStart}>جاري حساب النقد المتوقع…</AppText> : null}
        {(isAdmin || closeTotals) && paymentInfo && !loadingPreview ? (
          <View style={{ gap: spacing.sm, padding: spacing.md, borderRadius: 12, backgroundColor: c.shiftInfoBg }}>
            <View style={{ ...flexRow, justifyContent: 'space-between' }}>
              <AppText style={textStart}>نقدية الافتتاح</AppText>
              <AppText style={{ fontWeight: '800' }}>
                {money(closeTotals ? summary?.shift.starting_cash : preview?.starting_cash ?? 0)}
              </AppText>
            </View>
            {closeTotals ? (
              <>
                <View style={{ ...flexRow, justifyContent: 'space-between' }}>
                  <AppText style={textStart}>مبيعات نقدية (الدرج)</AppText>
                  <AppText style={{ fontWeight: '800' }}>{money(closeTotals.cash_sales)}</AppText>
                </View>
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
              onChangeText={(v) => {
                setActualCash(v);
                if (
                  shift?.drawer_ledger_enabled &&
                  depositFollowsActual &&
                  vaultSettlementDirection === 'deposit'
                ) {
                  setDepositAmount(v);
                }
              }}
              placeholder="0.00"
            />
            {shift?.drawer_ledger_enabled ? (
              <>
                <AppText style={{ ...textStart, fontWeight: '700' }}>التسوية مع الخزنة</AppText>
                <View style={{ ...flexRow, gap: spacing.sm, flexWrap: 'wrap' }}>
                  <AppChip
                    label="إغلاق مع السحب"
                    active={vaultSettlementDirection === 'withdraw'}
                    onPress={() => {
                      setVaultSettlementDirection('withdraw');
                      setDepositFollowsActual(false);
                    }}
                  />
                  <AppChip
                    label="إيداع في الخزنة"
                    active={vaultSettlementDirection === 'deposit'}
                    onPress={() => {
                      setVaultSettlementDirection('deposit');
                      setDepositFollowsActual(true);
                    }}
                  />
                </View>
                <AppInput
                  label={
                    vaultSettlementDirection === 'withdraw'
                      ? 'مبلغ السحب من الخزنة'
                      : 'مبلغ الإيداع إلى الخزنة'
                  }
                  keyboardType="decimal-pad"
                  value={depositAmount}
                  onChangeText={(v) => {
                    setDepositFollowsActual(false);
                    setDepositAmount(v);
                  }}
                  placeholder="0.00"
                />
                <AppSelect
                  label={vaultSettlementDirection === 'withdraw' ? 'خزنة السحب' : 'خزنة الإيداع'}
                  value={depositVaultId}
                  onChange={setDepositVaultId}
                  options={[
                    {
                      value: '',
                      label:
                        vaultSettlementDirection === 'withdraw' ? 'اختر خزنة السحب' : 'اختر خزنة الإيداع',
                    },
                    ...vaults.map((v) => ({
                      value: String(v.id),
                      label: String(v.name ?? v.id),
                    })),
                  ]}
                />
                {vaultSettlementDirection === 'withdraw' ? (
                  <AppText style={{ ...textStart, opacity: 0.75, fontSize: 12 }}>
                    يُسجَّل السحب على هذه الوردية دفعة واحدة دون إيداع ثم سحب منفصل.
                  </AppText>
                ) : null}
              </>
            ) : null}
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
            <AppText style={{ ...textStart, color: c.warning, fontWeight: '700' }}>
              تم إغلاق الوردية، لكن فشلت الطباعة
            </AppText>
            <AppButton title="طباعة تقرير الوردية" variant="secondary" loading={submitting} onPress={() => void handleReprint()} />
          </View>
        ) : null}

        {!closedShiftId ? (
          <AppButton
            title="إغلاق الوردية"
            variant="danger"
            loading={submitting}
            disabled={!canCloseShift}
            onPress={() => void handleClose()}
          />
        ) : (
          <AppButton title="إغلاق" variant="secondary" onPress={onClose} />
        )}
      </View>
    </AppBottomSheet>
  );
}
