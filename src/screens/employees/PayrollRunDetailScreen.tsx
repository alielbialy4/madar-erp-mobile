import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import {
  hrAPI,
  type PayrollRun,
  type Payslip,
} from '@/api/hr';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, ConfirmDialog, useToast } from '@/components/feedback';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppInput, AppSelect, AppText as Text } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { FinancialRow, MadarSection } from '@/components/madar';
import {
  completeIdempotencyAttempt,
  idempotencyKeyForAttempt,
  resolveIdempotencyAttemptAfterError,
} from '@/utils/idempotencyAttempt';
import { useAuthStore } from '@/store/authStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';

const money = (value: unknown) =>
  Number(value ?? 0).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusLabel = (status: string) =>
  ({ draft: 'مسودة', approved: 'معتمد', partially_paid: 'مدفوع جزئياً', paid: 'مدفوع', cancelled: 'ملغي' })[status] ??
  status;

const statusTone = (status: string): 'success' | 'warning' | 'info' | 'danger' | 'neutral' => {
  if (status === 'paid') return 'success';
  if (status === 'approved') return 'info';
  if (status === 'cancelled') return 'danger';
  if (status === 'draft' || status === 'partially_paid') return 'warning';
  return 'neutral';
};

type Params = { id: string };

export function PayrollRunDetailScreen({ route, navigation }: { route: { params: Params }; navigation: any }) {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const canManage = hasPermission(user, 'manage_payroll');
  const runId = route.params.id;

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'cancel' | 'regenerate' | null>(null);

  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [accountId, setAccountId] = useState('');
  const [paymentPayslipId, setPaymentPayslipId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const paymentIdempotencyRef = useRef<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await hrAPI.payroll.get(runId);
      const detail = res.data;
      setRun(detail ?? null);
      const rows = detail?.payslips ?? [];
      setPayslips(rows);
      const firstPayable = rows.find((row) => Number(row.net) > Number(row.amount_paid ?? 0));
      setPaymentPayslipId(firstPayable ? String(firstPayable.id) : '');
      setPaymentAmount(
        firstPayable ? String(Math.max(0, Number(firstPayable.net) - Number(firstPayable.amount_paid ?? 0))) : '',
      );
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    financialAccountsAPI
      .paymentSources({ operation: 'payroll', branch_id: run?.branch?.id ?? undefined, include_unavailable: true })
      .then((res) => {
        if (cancelled) return;
        const sources = extractArray<PaymentSource>(res);
        setPaymentSources(sources);
        setAccountId((prev) => prev || sources[0]?.id || '');
      })
      .catch(() => {
        /* payment source loading is optional */
      });
    return () => {
      cancelled = true;
    };
  }, [run?.branch?.id]);

  const payablePayslips = useMemo(
    () => payslips.filter((p) => Number(p.net) > Number(p.amount_paid ?? 0)),
    [payslips],
  );

  const payslipOptions = useMemo<SelectOption[]>(
    () =>
      payablePayslips.map((p) => ({
        label: `${p.user?.name ?? `#${p.id}`} — متبقي ${money(Number(p.net) - Number(p.amount_paid ?? 0))}`,
        value: String(p.id),
      })),
    [payablePayslips],
  );

  const accountOptions = useMemo<SelectOption[]>(
    () => paymentSources.map((source) => ({ label: source.name, value: String(source.id) })),
    [paymentSources],
  );

  const act = async (action: 'approve' | 'cancel' | 'regenerate') => {
    setConfirmAction(null);
    setBusy(true);
    setError(null);
    try {
      if (action === 'approve') await hrAPI.payroll.approve(runId);
      else if (action === 'cancel') await hrAPI.payroll.cancel(runId);
      else await hrAPI.payroll.regenerate(runId);
      toast.success('تم تنفيذ الإجراء بنجاح');
      await load();
    } catch (err) {
      const message = normalizeApiError(err).message;
      setError(message);
      toast.error(message);
    } finally {
      setBusy(false);
    }
  };

  const paySelectedPayslip = async () => {
    if (!paymentPayslipId || !accountId || Number(paymentAmount) <= 0) return;
    setBusy(true);
    setError(null);
    const idempotencyKey = idempotencyKeyForAttempt(paymentIdempotencyRef);
    try {
      await hrAPI.payroll.pay(runId, {
        payments: [
          {
            payslip_id: Number(paymentPayslipId),
            financial_account_id: accountId,
            amount: paymentAmount,
            branch_id: run?.branch?.id ?? undefined,
            idempotency_key: `payroll:${runId}:${paymentPayslipId}:${idempotencyKey}`,
          },
        ],
      });
      completeIdempotencyAttempt(paymentIdempotencyRef);
      toast.success('تم صرف الدفعة بنجاح');
      await load();
    } catch (err) {
      const normalized = normalizeApiError(err);
      resolveIdempotencyAttemptAfterError(paymentIdempotencyRef, { status: normalized.status ?? null, message: normalized.message });
      setError(normalized.message);
      toast.error(normalized.message);
    } finally {
      setBusy(false);
    }
  };

  const confirmTitle =
    confirmAction === 'approve' ? 'اعتماد المسير' : confirmAction === 'cancel' ? 'إلغاء المسير' : 'إعادة التوليد';
  const confirmMessage =
    confirmAction === 'approve'
      ? 'سيتم اعتماد المسير وصبح جاهزاً للصرف.'
      : confirmAction === 'cancel'
        ? 'سيتم إلغاء المسير بالكامل ولا يمكن الصرف منه.'
        : 'سيتم إعادة حساب القسائم من الحضور والتسويات الحالية.';

  return (
    <ListScreenLayout title="تفاصيل مسير الرواتب" subtitle={run ? `${run.year}-${String(run.month).padStart(2, '0')}` : ''}>
      {error ? <AppBanner tone="danger" message={error} /> : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {run ? (
          <View style={styles.badgeRow}>
            <AppBadge label={statusLabel(run.status)} tone={statusTone(run.status)} />
            {run.branch?.name ? <AppBadge label={run.branch.name} tone="outline" /> : null}
            <AppBadge label={`الصافي: ${money(run.total_net)}`} tone="default" />
          </View>
        ) : null}

        {canManage && run && run.status !== 'cancelled' && run.status !== 'paid' ? (
          <MadarSection title="إجراءات المسير">
            <View style={styles.actionsRow}>
              {run.status === 'draft' ? (
                <AppButton title="اعتماد" onPress={() => setConfirmAction('approve')} disabled={busy} />
              ) : null}
              <AppButton title="إعادة توليد" variant="outline" onPress={() => setConfirmAction('regenerate')} disabled={busy} />
              <AppButton title="إلغاء المسير" variant="danger" onPress={() => setConfirmAction('cancel')} disabled={busy} />
            </View>
          </MadarSection>
        ) : null}

        {canManage && run && payablePayslips.length > 0 ? (
          <MadarSection title="صرف قسيمة">
            <View style={{ gap: spacing.sm }}>
              <AppSelect
                label="القسيمة"
                value={paymentPayslipId}
                options={payslipOptions}
                onChange={(value) => {
                  setPaymentPayslipId(value);
                  const row = payablePayslips.find((p) => String(p.id) === value);
                  setPaymentAmount(row ? String(Math.max(0, Number(row.net) - Number(row.amount_paid ?? 0))) : '');
                }}
                required
              />
              <AppSelect label="الدفع من" value={accountId} options={accountOptions} onChange={setAccountId} required />
              <AppInput
                label="المبلغ"
                value={paymentAmount}
                onChangeText={setPaymentAmount}
                keyboardType="decimal-pad"
                required
              />
              <AppButton
                title="صرف"
                onPress={() => void paySelectedPayslip()}
                disabled={busy || !accountId || !paymentPayslipId || Number(paymentAmount) <= 0}
                loading={busy}
              />
            </View>
          </MadarSection>
        ) : null}

        <MadarSection title={`القسائم (${payslips.length})`}>
          {payslips.length === 0 && !loading ? <Text style={styles.empty}>لا توجد قسائم في هذا المسير.</Text> : null}
          <View style={{ gap: spacing.xs }}>
            {payslips.map((p) => {
              const remaining = Math.max(0, Number(p.net) - Number(p.amount_paid ?? 0));
              return (
                <FinancialRow
                  key={p.id}
                  primary={p.user?.name ?? `#${p.id}`}
                  secondary={`أساسي ${money(p.base_salary)} · عمولة ${money(p.commission_amount)} · حوافز ${money(p.incentives_total)} · خصومات ${money(Number(p.penalties_total) + Number(p.absence_deductions) + Number(p.late_deductions))}`}
                  meta={`مدفوع ${money(p.amount_paid ?? 0)} · متبقٍ ${money(remaining)}`}
                  amount={Number(p.net ?? 0)}
                  currency="ج.م"
                  amountTone={remaining === 0 ? 'positive' : 'default'}
                  status={
                    <AppBadge
                      label={remaining === 0 ? 'مسدد' : remaining < Number(p.net) ? 'جزئي' : 'غير مسدد'}
                      tone={remaining === 0 ? 'success' : 'warning'}
                    />
                  }
                />
              );
            })}
          </View>
        </MadarSection>

        <AppButton title="عودة" variant="outline" onPress={() => navigation.goBack()} />
      </ScrollView>

      <ConfirmDialog
        visible={Boolean(confirmAction)}
        title={confirmTitle}
        message={confirmMessage}
        confirmLabel={confirmAction === 'cancel' ? 'إلغاء المسير' : 'تأكيد'}
        variant={confirmAction === 'cancel' ? 'danger' : 'primary'}
        loading={busy}
        onCancel={() => setConfirmAction(null)}
        onConfirm={() => void act(confirmAction!)}
      />
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  actionsRow: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  empty: { textAlign: 'center', paddingVertical: spacing.md },
});
