import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { layawayAPI, type LayawayInstallment, type LayawayPlan } from '@/api/layaway';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { useBranchStore } from '@/store/branchStore';
import { AppBottomSheet } from '@/components/layout';
import { ListScreenLayout } from '@/components/layout/ListScreenLayout';
import { AppBadge, AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { MadarSurface } from '@/components/madar';
import { AppEmptyState, ConfirmDialog, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import { useColors } from '@/hooks/useColors';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { asText, dateText, money } from '@/utils/format';
import { completeIdempotencyAttempt, idempotencyKeyForAttempt, resolveIdempotencyAttemptAfterError } from '@/utils/idempotencyAttempt';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { statusTone } from '@/utils/statusTone';
import { hapticSuccess } from '@/utils/haptics';
import { RegisterDrawerSessionPicker } from '@/components/pos/RegisterDrawerSessionPicker';
import type { EligibleRegisterMoneySession } from '@/api/posRegisters';
import { isCashDrawerPaymentSource, registerMoneyContextFromSession } from '@/services/storage/registerSessionContext';

function amount(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

function remaining(plan: LayawayPlan): number {
  return Math.max(0, amount(plan.total_amount) - amount(plan.paid_amount));
}

function installmentRemaining(row: LayawayInstallment): number {
  return Math.max(0, amount(row.amount) - amount(row.paid_amount));
}

type PaymentTarget =
  | { type: 'plan'; plan: LayawayPlan }
  | { type: 'installment'; plan: LayawayPlan; installment: LayawayInstallment };

export function LayawayScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const toast = useToast();
  const styles = useMemo(() => createStyles(c), [c]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<LayawayPlan & Record<string, unknown>>(
    layawayAPI.list,
    { per_page: 50 },
  );
  const [detailsPlan, setDetailsPlan] = useState<LayawayPlan | null>(null);
  const [installments, setInstallments] = useState<LayawayInstallment[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [paymentTarget, setPaymentTarget] = useState<PaymentTarget | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [paymentAccountId, setPaymentAccountId] = useState('');
  const [drawerSessionId, setDrawerSessionId] = useState('');
  const [drawerSession, setDrawerSession] = useState<EligibleRegisterMoneySession | null>(null);
  const [drawerSessionCount, setDrawerSessionCount] = useState(0);
  const [cancelPlan, setCancelPlan] = useState<LayawayPlan | null>(null);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const paymentIdempotencyKeyRef = useRef<string | null>(null);
  const activeBranch = useBranchStore((s) => s.activeBranch);

  useEffect(() => {
    if (!activeBranch?.id) return;
    setPaymentAccountId('');
    financialAccountsAPI.paymentSources({ operation: 'layaway_collection', branch_id: activeBranch.id, include_unavailable: true })
      .then((response) => {
        setPaymentSources((response.data ?? []).filter((source) => source.is_available !== false));
        const rows = (response.data ?? []).filter((source) => source.is_available !== false);
        if (rows[0]?.id) setPaymentAccountId(String(rows.find((source) => source.is_default)?.id ?? rows[0].id));
      })
      .catch(() => {
        setPaymentSources([]);
        setPaymentAccountId('');
      });
  }, [activeBranch?.id]);

  const openDetails = useCallback(async (plan: LayawayPlan) => {
    setDetailsPlan(plan);
    setInstallments([]);
    setDetailsError(null);
    setDetailsLoading(true);
    try {
      const response = await layawayAPI.installments(plan.id);
      setInstallments(extractData(response) ?? []);
    } catch (err) {
      setDetailsError(normalizeApiError(err).message);
    } finally {
      setDetailsLoading(false);
    }
  }, []);

  const startPlanPayment = useCallback((plan: LayawayPlan) => {
    setPaymentTarget({ type: 'plan', plan });
    setPayAmount(remaining(plan).toFixed(2));
  }, []);

  const startInstallmentPayment = useCallback((plan: LayawayPlan, installment: LayawayInstallment) => {
    setPaymentTarget({ type: 'installment', plan, installment });
    setPayAmount(installmentRemaining(installment).toFixed(2));
  }, []);

  const submitCancel = useCallback(async () => {
    if (!cancelPlan) return;
    setCancelSubmitting(true);
    try {
      await layawayAPI.cancel(cancelPlan.id);
      setCancelConfirmOpen(false);
      setCancelPlan(null);
      void hapticSuccess();
      toast.success('تم إلغاء خطة التقسيط');
      await refresh();
    } catch (err) {
      setDetailsError(normalizeApiError(err).message);
    } finally {
      setCancelSubmitting(false);
    }
  }, [cancelPlan, refresh, toast]);

  const submitPayment = useCallback(async () => {
    if (!paymentTarget) return;
    const parsed = Number(payAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setSubmitting(true);
    try {
      const paymentSource = paymentSources.find((source) => String(source.id) === paymentAccountId);
      if (isCashDrawerPaymentSource(paymentSource) && drawerSessionCount > 0 && !drawerSessionId) {
        setDetailsError('اختر درجاً مفتوحاً.');
        return;
      }
      const idempotencyKey = idempotencyKeyForAttempt(paymentIdempotencyKeyRef);
      const sessionFields = isCashDrawerPaymentSource(paymentSource)
        ? await registerMoneyContextFromSession(drawerSession)
        : await (await import('@/services/storage/registerSessionContext')).registerMoneyContextFields();
      if (paymentTarget.type === 'plan') {
        await layawayAPI.addPayment(paymentTarget.plan.id, {
          amount: parsed,
          payment_method: paymentSource?.payment_method ?? 'cash',
          financial_account_id: paymentAccountId || null,
          vault_id: paymentSource?.payment_method === 'cash' ? paymentSource.linked_vault_id ?? null : null,
          idempotency_key: idempotencyKey,
          ...sessionFields,
        });
      } else {
        await layawayAPI.payInstallment(paymentTarget.plan.id, paymentTarget.installment.id, {
          amount: parsed,
          payment_method: paymentSource?.payment_method ?? 'cash',
          financial_account_id: paymentAccountId || null,
          vault_id: paymentSource?.payment_method === 'cash' ? paymentSource.linked_vault_id ?? null : null,
          idempotency_key: idempotencyKey,
          ...sessionFields,
        });
      }
      completeIdempotencyAttempt(paymentIdempotencyKeyRef);
      setPaymentConfirmOpen(false);
      const planToReload = paymentTarget.plan;
      setPaymentTarget(null);
      setPayAmount('');
      void hapticSuccess();
      toast.success('تم تسجيل الدفعة');
      await refresh();
      if (detailsPlan?.id === planToReload.id) await openDetails(planToReload);
    } catch (err) {
      const normalized = normalizeApiError(err);
      resolveIdempotencyAttemptAfterError(paymentIdempotencyKeyRef, normalized);
      setDetailsError(normalized.message);
    } finally {
      setSubmitting(false);
    }
  }, [detailsPlan?.id, drawerSession, drawerSessionCount, drawerSessionId, openDetails, payAmount, paymentAccountId, paymentSources, paymentTarget, refresh, toast]);

  const nextDue = useMemo(() => {
    return installments
      .filter((row) => row.status !== 'paid' && row.status !== 'cancelled')
      .sort((a, b) => Number(a.installment_no) - Number(b.installment_no))[0];
  }, [installments]);

  return (
    <>
    <ListScreenLayout
      title="خطط التقسيط"
      subtitle="جدولة الأقساط وتحصيل الدفعات"
      onBack={navigation.goBack}
      onRefresh={refresh}
      refreshing={refreshing}
      hero={{
        eyebrow: 'المبيعات',
        title: 'خطط التقسيط',
        subtitle: 'جدولة الأقساط وتحصيل الدفعات',
        stats: [{ label: 'خطط', value: items.length }],
        compact: true,
      }}
    >
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد خطط تقسيط"
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const canPay = item.status === 'active' && remaining(item) > 0.01;
          return (
            <Pressable onPress={() => void openDetails(item)}>
              <MadarSurface style={styles.card}>
                <View style={styles.cardTop}>
                  <AppBadge label={asText(item.status)} tone={statusTone(item.status)} />
                  <AppText style={styles.customer}>{item.customer?.name ?? `#${item.customer_id ?? item.id}`}</AppText>
                </View>
                <View style={styles.metrics}>
                  <AppText style={styles.metric}>الإجمالي: {money(item.total_amount ?? 0)}</AppText>
                  <AppText style={styles.metric}>المدفوع: {money(item.paid_amount ?? 0)}</AppText>
                  <AppText style={styles.remaining}>المتبقي: {money(remaining(item))}</AppText>
                </View>
                <AppText style={styles.meta}>الاستحقاق القادم: {dateText(item.next_due_date)}</AppText>
                <View style={styles.actions}>
                  <AppButton title="الجدول" size="sm" variant="secondary" onPress={() => void openDetails(item)} />
                  <AppButton title="تسجيل دفعة" size="sm" disabled={!canPay} onPress={() => startPlanPayment(item)} />
                  {item.status === 'active' ? (
                    <AppButton title="إلغاء" size="sm" variant="danger" onPress={() => { setCancelPlan(item); setCancelConfirmOpen(true); }} />
                  ) : null}
                </View>
              </MadarSurface>
            </Pressable>
          );
        }}
      />
    </ListScreenLayout>

      <AppBottomSheet
        visible={Boolean(detailsPlan)}
        onClose={() => { setDetailsPlan(null); setInstallments([]); setDetailsError(null); }}
        title="جدول الأقساط"
      >
        {detailsPlan ? (
          <View style={{ gap: spacing.md }}>
            <MadarSurface>
              <AppText style={styles.customer}>{detailsPlan.customer?.name ?? `#${detailsPlan.customer_id ?? detailsPlan.id}`}</AppText>
              <AppText style={styles.metric}>الإجمالي: {money(detailsPlan.total_amount ?? 0)} • المتبقي: {money(remaining(detailsPlan))}</AppText>
              {nextDue ? <AppText style={styles.remaining}>التالي: {dateText(nextDue.due_date)} بقيمة {money(installmentRemaining(nextDue))}</AppText> : null}
            </MadarSurface>
            {detailsError ? <AppEmptyState title="تعذر تحميل الجدول" message={detailsError} /> : null}
            {detailsLoading ? <AppEmptyState title="جاري تحميل جدول الأقساط..." /> : null}
            {!detailsLoading && installments.length === 0 && !detailsError ? <AppEmptyState title="لا توجد أقساط مسجلة" /> : null}
            {detailsPlan.status === 'active' ? (
              <AppButton
                title="إلغاء الخطة"
                variant="danger"
                onPress={() => { setCancelPlan(detailsPlan); setCancelConfirmOpen(true); }}
              />
            ) : null}
            {installments.map((row) => {
              const canPay = detailsPlan.status === 'active' && row.status !== 'paid' && installmentRemaining(row) > 0.01;
              return (
                <MadarSurface key={row.id} style={styles.installmentCard}>
                  <View style={styles.cardTop}>
                    <AppBadge label={asText(row.status)} tone={row.status === 'paid' ? 'success' : 'warning'} />
                    <AppText style={styles.customer}>القسط #{row.installment_no}</AppText>
                  </View>
                  <AppText style={styles.metric}>تاريخ الاستحقاق: {dateText(row.due_date)}</AppText>
                  <AppText style={styles.metric}>المبلغ: {money(row.amount)} • المدفوع: {money(row.paid_amount ?? 0)}</AppText>
                  <AppButton title="دفع القسط" size="sm" disabled={!canPay} onPress={() => startInstallmentPayment(detailsPlan, row)} />
                </MadarSurface>
              );
            })}
          </View>
        ) : null}
      </AppBottomSheet>

      <AppBottomSheet
        visible={Boolean(paymentTarget)}
        onClose={() => { setPaymentTarget(null); setPayAmount(''); }}
        title={paymentTarget?.type === 'installment' ? 'دفع قسط' : 'تسجيل دفعة'}
      >
        <View style={{ gap: spacing.md }}>
          <AppInput label="المبلغ" value={payAmount} onChangeText={setPayAmount} keyboardType="decimal-pad" />
          {paymentSources.length > 0 ? (
            <>
              <RegisterDrawerSessionPicker
                visible={Boolean(paymentTarget)}
                hideWhenEmpty
                value={drawerSessionId}
                onChange={(sessionId, session) => {
                  setDrawerSessionId(sessionId);
                  setDrawerSession(session);
                  if (session?.drawer?.financial_account_id) {
                    const match = paymentSources.find((source) => String(source.id) === String(session.drawer?.financial_account_id));
                    if (match) setPaymentAccountId(String(match.id));
                  }
                }}
                onAvailabilityChange={({ sessions }) => setDrawerSessionCount(sessions.length)}
              />
              <AppSelect
                label="حساب التحصيل"
                value={paymentAccountId}
                options={paymentSources
                  .filter((source) => {
                    if (!isCashDrawerPaymentSource(source) || drawerSessionCount === 0) return true;
                    return drawerSession?.drawer?.financial_account_id
                      ? String(source.id) === String(drawerSession.drawer.financial_account_id)
                      : false;
                  })
                  .map((source) => ({
                    label: [source.name, source.provider_name, source.masked_identifier].filter(Boolean).join(' · '),
                    value: String(source.id),
                  }))}
                onChange={setPaymentAccountId}
              />
            </>
          ) : (
            <AppText style={styles.meta}>لا يوجد حساب تحصيل متاح لهذا الفرع.</AppText>
          )}
          <AppButton title="متابعة" onPress={() => setPaymentConfirmOpen(true)} disabled={!Number(payAmount) || Number(payAmount) <= 0 || !paymentAccountId} />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={paymentConfirmOpen}
        title="تأكيد دفعة التقسيط"
        message={`سيتم تسجيل دفعة بقيمة ${money(payAmount)}. تأكد من استلام النقد قبل المتابعة.`}
        confirmLabel="تسجيل الدفعة"
        loading={submitting}
        variant="primary"
        onConfirm={() => void submitPayment()}
        onCancel={() => setPaymentConfirmOpen(false)}
      />

      <ConfirmDialog
        visible={cancelConfirmOpen}
        title="إلغاء خطة التقسيط"
        message="سيتم إلغاء الخطة وتخفيض دين العميل بالمتبقي. لا يُسترجع المخزون تلقائياً."
        confirmLabel="إلغاء الخطة"
        loading={cancelSubmitting}
        variant="danger"
        onConfirm={() => void submitCancel()}
        onCancel={() => { setCancelConfirmOpen(false); setCancelPlan(null); }}
      />
    </>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: { gap: spacing.sm },
    cardTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
    customer: { ...textStart, color: c.text, fontSize: typography.body, fontFamily: fonts.bold, fontWeight: '700' },
    metrics: { gap: 4 },
    metric: { ...textStart, color: c.textMuted, fontSize: typography.small },
    remaining: { ...textStart, color: c.success, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700' },
    meta: { ...textStart, color: c.textCaption, fontSize: typography.tiny },
    actions: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
    installmentCard: { gap: spacing.sm, backgroundColor: c.surfaceMuted },
  });
}
