import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { expensesAPI } from '@/api/expenses';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { AppBottomSheet, DetailScreenLayout } from '@/components/layout';
import {
  AppAmountInput,
  AppBadge,
  AppButton,
  AppDatePicker,
  AppInput,
  AppPicker,
  AppSectionHeader,
  AppText,
} from '@/components/ui';
import { AppBanner, ConfirmDialog, useToast } from '@/components/feedback';
import { MadarSurface, MetricBlock } from '@/components/madar';
import { usePermissions } from '@/hooks/usePermissions';
import { useNetworkStore } from '@/store/networkStore';
import { completeIdempotencyAttempt, idempotencyKeyForAttempt } from '@/utils/idempotencyAttempt';
import { activeExpensePaymentLines, expensePaymentTotals } from '@/utils/expenseFinancials';
import { dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useColors } from '@/hooks/useColors';
import type { Expense, ExpensePaymentLine } from '@/types/expenses';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'ExpenseDetail'>;

function statusPresentation(status?: string): { label: string; tone: 'default' | 'success' | 'warning' | 'danger' | 'info' } {
  switch (status) {
    case 'paid': return { label: 'مدفوع', tone: 'success' };
    case 'partially_paid': return { label: 'مدفوع جزئياً', tone: 'warning' };
    case 'approved': return { label: 'معتمد وغير مدفوع', tone: 'info' };
    case 'draft': return { label: 'مسودة', tone: 'default' };
    case 'cancelled': return { label: 'ملغي', tone: 'danger' };
    default: return { label: 'غير مدفوع', tone: 'warning' };
  }
}

function paymentAccountName(line: ExpensePaymentLine): string {
  return line.financial_account?.name
    ?? line.financialAccount?.name
    ?? line.vault?.name
    ?? 'حساب مالي';
}

export function ExpenseDetailScreen({ route, navigation }: Props) {
  const c = useColors();
  const embedded = Boolean((route.params as { embedded?: boolean } | undefined)?.embedded);
  const toast = useToast();
  const { can } = usePermissions();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const [payOpen, setPayOpen] = useState(false);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [payAccountId, setPayAccountId] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [payReference, setPayReference] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [paySubmitting, setPaySubmitting] = useState(false);
  const [payConfirm, setPayConfirm] = useState(false);
  const [paymentExpense, setPaymentExpense] = useState<Expense | null>(null);
  const [reverseLine, setReverseLine] = useState<ExpensePaymentLine | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseError, setReverseError] = useState<string | null>(null);
  const [reverseSubmitting, setReverseSubmitting] = useState(false);
  const [reverseConfirm, setReverseConfirm] = useState(false);
  const [cancelExpense, setCancelExpense] = useState<Expense | null>(null);
  const [cancelSubmitting, setCancelSubmitting] = useState(false);
  const paymentAttemptRef = useRef<string | null>(null);
  const refreshRef = useRef<(() => void) | null>(null);
  const id = Number(route.params.id);

  const canPay = can(['pay_expense', 'manage_expenses', 'access_admin_routes']);
  const canCancel = can(['manage_expenses', 'access_admin_routes']);

  const loader = useCallback(
    () => expensesAPI.getById(id),
    [id],
  );

  const closePayment = () => {
    if (paySubmitting) return;
    setPayOpen(false);
    setPayConfirm(false);
    setPaymentExpense(null);
    setPayError(null);
    completeIdempotencyAttempt(paymentAttemptRef);
  };

  const openPayment = async (expense: Expense, refresh: () => void) => {
    const totals = expensePaymentTotals(expense);
    refreshRef.current = refresh;
    setPaymentExpense(expense);
    setPayAmount(totals.remaining.toFixed(2));
    setPaidAt(new Date().toISOString().slice(0, 10));
    setPayReference('');
    setPayAccountId(null);
    setPayError(null);
    setPaymentSources([]);
    completeIdempotencyAttempt(paymentAttemptRef);
    setPayOpen(true);
    setSourcesLoading(true);
    try {
      const response = await financialAccountsAPI.paymentSources({
        operation: 'expense',
        ...(expense.branch_id ? { branch_id: expense.branch_id } : {}),
        amount: totals.remaining,
        include_unavailable: true,
      });
      const available = (response.data ?? []).filter((source) => source.is_available !== false);
      setPaymentSources(available);
      setPayAccountId(String(available.find((source) => source.is_default)?.id ?? available[0]?.id ?? '') || null);
    } catch (reason) {
      setPayError(normalizeApiError(reason).message);
    } finally {
      setSourcesLoading(false);
    }
  };

  const submitPayment = async () => {
    if (!paymentExpense) return;
    const amount = Number(payAmount);
    const totals = expensePaymentTotals(paymentExpense);
    if (!isOnline) { setPayError('الدفع يحتاج اتصالاً مباشراً بالخادم.'); return; }
    if (!payAccountId) { setPayError('اختر حساب الدفع.'); return; }
    if (!Number.isFinite(amount) || amount <= 0) { setPayError('أدخل قيمة دفع صحيحة أكبر من صفر.'); return; }
    if (amount > totals.remaining + 0.00005) { setPayError('قيمة الدفع تتجاوز المبلغ المتبقي.'); return; }

    setPaySubmitting(true);
    setPayError(null);
    try {
      await expensesAPI.pay(paymentExpense.id, {
        financial_account_id: payAccountId,
        amount: amount.toFixed(4),
        paid_at: `${paidAt} 00:00:00`,
        ...(payReference.trim() ? { reference: payReference.trim() } : {}),
        idempotency_key: `expense:${paymentExpense.id}:payment:${idempotencyKeyForAttempt(paymentAttemptRef)}`,
        ...(await (await import('@/services/storage/registerSessionContext')).registerMoneyContextFields()),
      });
      toast.success(amount + 0.00005 >= totals.remaining ? 'تم سداد المصروف بالكامل' : 'تم تسجيل الدفعة الجزئية');
      completeIdempotencyAttempt(paymentAttemptRef);
      setPayOpen(false);
      setPayConfirm(false);
      setPaymentExpense(null);
      setPayError(null);
      refreshRef.current?.();
    } catch (reason) {
      const message = normalizeApiError(reason).message;
      setPayError(message);
      toast.error(message);
    } finally {
      setPaySubmitting(false);
      setPayConfirm(false);
    }
  };

  const openReverse = (line: ExpensePaymentLine, refresh: () => void) => {
    refreshRef.current = refresh;
    setReverseLine(line);
    setReverseReason('');
    setReverseError(null);
    setReverseConfirm(false);
  };

  const submitReverse = async () => {
    if (!reverseLine) return;
    if (!isOnline) { setReverseError('عكس الدفعة يحتاج اتصالاً مباشراً بالخادم.'); return; }
    if (reverseReason.trim().length < 3) { setReverseError('اكتب سبباً واضحاً من 3 أحرف على الأقل.'); return; }
    setReverseSubmitting(true);
    setReverseError(null);
    try {
      await expensesAPI.reversePayment(id, reverseLine.id, reverseReason.trim());
      toast.success('تم عكس الدفعة وإعادة احتساب المتبقي');
      setReverseLine(null);
      setReverseConfirm(false);
      refreshRef.current?.();
    } catch (reason) {
      const message = normalizeApiError(reason).message;
      setReverseError(message);
      toast.error(message);
    } finally {
      setReverseSubmitting(false);
    }
  };

  const submitCancel = async () => {
    if (!cancelExpense) return;
    if (!isOnline) {
      toast.error('إلغاء المصروف يحتاج اتصالاً مباشراً بالخادم.');
      setCancelExpense(null);
      return;
    }
    setCancelSubmitting(true);
    try {
      await expensesAPI.cancel(cancelExpense.id);
      toast.success('تم إلغاء المصروف وعكس دفعاته');
      setCancelExpense(null);
      refreshRef.current?.();
    } catch (reason) {
      toast.error(normalizeApiError(reason).message);
    } finally {
      setCancelSubmitting(false);
    }
  };

  const paymentOptions = useMemo(
    () => paymentSources.map((source) => ({
      label: [source.name, source.provider_name, source.masked_identifier].filter(Boolean).join(' · '),
      value: String(source.id),
    })),
    [paymentSources],
  );

  return (
    <>
      <DetailScreenLayout<Expense>
        title={`المصروف #${id}`}
        loader={loader}
        onBack={navigation.goBack}
        embedded={embedded}
        heroTitle={(expense) => expense.category?.name ?? `مصروف #${expense.id}`}
        heroAmount={(expense) => money(expense.amount)}
        badge={(expense) => statusPresentation(expense.status)}
        actions={(expense, refresh) => {
          const totals = expensePaymentTotals(expense);
          refreshRef.current = refresh;
          return (
            <>
              {canPay && expense.status !== 'cancelled' && totals.remaining > 0 ? (
                <AppButton title="تسجيل دفعة" onPress={() => void openPayment(expense, refresh)} />
              ) : null}
              {canCancel && expense.status !== 'cancelled' ? (
                <AppButton title="إلغاء المصروف" variant="dangerGhost" onPress={() => { refreshRef.current = refresh; setCancelExpense(expense); }} />
              ) : null}
            </>
          );
        }}
        sections={[
          {
            title: 'الوضع المالي',
            fields: [
              { label: 'قيمة المصروف', value: (expense) => money(expense.amount), ltr: true },
              { label: 'المدفوع', value: (expense) => money(expensePaymentTotals(expense).paid), ltr: true },
              { label: 'المتبقي', value: (expense) => money(expensePaymentTotals(expense).remaining), ltr: true },
              { label: 'مصدر التسجيل', value: (expense) => expense.cash_source === 'drawer' ? 'درج الوردية' : 'حساب مالي / خزنة' },
            ],
          },
          {
            title: 'السياق التشغيلي',
            fields: [
              { label: 'تاريخ الاستحقاق', value: (expense) => dateText(expense.expense_date ?? '') },
              { label: 'الفرع', value: (expense) => expense.branch?.name ?? 'مصروف عام' },
              { label: 'الوردية', value: (expense) => expense.shift?.shift_no ? `وردية #${expense.shift.shift_no}` : expense.shift_id ?? 'لا يرتبط بورديّة' },
              { label: 'سجله', value: (expense) => expense.user?.name ?? '—' },
            ],
          },
          {
            title: 'البيان والمراجعة',
            fields: [
              { label: 'الوصف', value: (expense) => expense.description?.trim() || '—' },
              { label: 'المرجع', value: (expense) => expense.reference_number?.trim() || '—' },
              { label: 'الملاحظات', value: (expense) => expense.notes?.trim() || '—' },
              { label: 'آخر تحديث', value: (expense) => dateText(expense.updated_at ?? expense.created_at ?? '') },
            ],
          },
        ]}
      >
        {(expense, { refresh }) => {
          const lines = expense.payment_lines ?? expense.paymentLines ?? [];
          const activeLines = activeExpensePaymentLines(expense);
          const totals = expensePaymentTotals(expense);
          return (
            <View style={{ gap: spacing.lg }}>
              {expense.status === 'cancelled' ? (
                <AppBanner tone="danger" message="هذا المصروف ملغي. الخادم عكس حركات الدفع المرتبطة به ولا يسمح بدفعات جديدة." />
              ) : totals.remaining > 0 ? (
                <AppBanner tone="warning" message={`المتبقي ${money(totals.remaining)}. تقارير التدفق النقدي تعتمد تاريخ كل دفعة، لا تاريخ استحقاق المصروف.`} />
              ) : (
                <AppBanner tone="success" message="تم سداد قيمة المصروف بالكامل." />
              )}

              <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
                <MetricBlock label="قيمة المصروف" value={expense.amount} currency="ج.م" level="B" style={{ flex: 1, minWidth: '30%' }} />
                <MetricBlock label="المدفوع" value={totals.paid} currency="ج.م" level="B" tone="positive" style={{ flex: 1, minWidth: '30%' }} />
                <MetricBlock
                  label="المتبقي"
                  value={totals.remaining}
                  currency="ج.م"
                  level="B"
                  tone={totals.remaining > 0 ? 'negative' : 'neutral'}
                  style={{ flex: 1, minWidth: '30%' }}
                />
              </View>

              <MadarSurface padded={false}>
                <View style={styles.cardHeader}>
                  <AppSectionHeader title={`سجل الدفعات (${lines.length})`} />
                </View>
                {lines.length === 0 ? (
                  <AppText style={[styles.emptyText, { color: c.textMuted }]}>لا توجد حركات دفع حتى الآن.</AppText>
                ) : lines.map((line) => {
                  const reversed = line.status === 'reversed';
                  return (
                    <View key={line.id} style={[styles.paymentRow, { borderTopColor: c.borderSubtle }]}>
                      <View style={[styles.paymentIcon, { backgroundColor: c.surface, borderWidth: StyleSheet.hairlineWidth, borderColor: reversed ? c.danger : c.success }]}>
                        <MaterialIcons name={reversed ? 'undo' : 'south-west'} size={18} color={reversed ? c.danger : c.success} />
                      </View>
                      <View style={styles.paymentCopy}>
                        <View style={styles.paymentHeading}>
                          <AppText style={[styles.paymentTitle, { color: c.text }]}>{paymentAccountName(line)}</AppText>
                          <AppBadge label={reversed ? 'معكوسة' : 'مرحّلة'} tone={reversed ? 'danger' : 'success'} />
                        </View>
                        <AppText style={[styles.paymentMeta, { color: c.textMuted }]}>
                          {[dateText(line.paid_at ?? ''), line.reference, line.payer?.name].filter(Boolean).join(' · ') || 'بدون مرجع'}
                        </AppText>
                        {reversed && line.reversal_reason ? (
                          <AppText style={[styles.reversalReason, { color: c.danger }]}>سبب العكس: {line.reversal_reason}</AppText>
                        ) : null}
                      </View>
                      <View style={styles.paymentTrailing}>
                        <AppText style={[styles.paymentAmount, { color: reversed ? c.textMuted : c.text }]}>{money(line.amount)}</AppText>
                        {!reversed && canPay && expense.status !== 'cancelled' ? (
                          <AppButton title="عكس" size="sm" variant="dangerGhost" onPress={() => openReverse(line, refresh)} />
                        ) : null}
                      </View>
                    </View>
                  );
                })}
                {activeLines.length > 1 ? (
                  <AppText style={[styles.historyFootnote, { color: c.textCaption }]}>تم توزيع المصروف على {activeLines.length} حسابات مالية.</AppText>
                ) : null}
              </MadarSurface>
            </View>
          );
        }}
      </DetailScreenLayout>

      <AppBottomSheet visible={payOpen} onClose={closePayment} title="دفع المصروف" subtitle="تاريخ الدفع مستقل عن تاريخ استحقاق المصروف" size="form">
        <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
          {paymentExpense ? (() => {
            const totals = expensePaymentTotals(paymentExpense);
            return (
              <View style={[styles.paymentSummary, { borderColor: c.borderSubtle }]}>
                <View style={styles.summaryCell}>
                  <AppText style={[styles.summaryLabel, { color: c.textMuted }]}>الإجمالي</AppText>
                  <AppText style={[styles.summaryValue, { color: c.text }]}>{money(totals.total)}</AppText>
                </View>
                <View style={styles.summaryCell}>
                  <AppText style={[styles.summaryLabel, { color: c.textMuted }]}>المدفوع</AppText>
                  <AppText style={[styles.summaryValue, { color: c.success }]}>{money(totals.paid)}</AppText>
                </View>
                <View style={styles.summaryCell}>
                  <AppText style={[styles.summaryLabel, { color: c.textMuted }]}>المتبقي</AppText>
                  <AppText style={[styles.summaryValue, { color: c.danger }]}>{money(totals.remaining)}</AppText>
                </View>
              </View>
            );
          })() : null}
          {!isOnline ? <AppBanner tone="warning" message="لا يمكن ترحيل دفعة مالية أثناء عدم الاتصال." /> : null}
          <AppAmountInput label="قيمة الدفعة" value={payAmount} onChangeText={setPayAmount} required />
          <AppDatePicker label="تاريخ الدفع" value={paidAt} onChange={setPaidAt} />
          <AppPicker
            label="حساب الدفع"
            value={payAccountId}
            options={paymentOptions}
            onChange={setPayAccountId}
            placeholder={sourcesLoading ? 'جاري تحميل الحسابات...' : 'اختر حساب الدفع'}
            required
          />
          {!sourcesLoading && paymentOptions.length === 0 ? <AppBanner tone="warning" message="لا توجد حسابات متاحة لدفع هذا المصروف." /> : null}
          <AppInput label="مرجع الدفعة" value={payReference} onChangeText={setPayReference} placeholder="رقم العملية أو ملاحظة" />
          {payError ? <AppBanner tone="danger" message={payError} /> : null}
          <AppButton
            title="مراجعة الدفعة"
            onPress={() => setPayConfirm(true)}
            disabled={!isOnline || !payAccountId || !payAmount || sourcesLoading}
            loading={paySubmitting}
            fullWidth
          />
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={Boolean(reverseLine)}
        onClose={() => { if (!reverseSubmitting) { setReverseLine(null); setReverseConfirm(false); } }}
        title="عكس دفعة"
        subtitle={reverseLine ? `${paymentAccountName(reverseLine)} · ${money(reverseLine.amount)}` : undefined}
        size="form"
      >
        <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
          <AppBanner tone="danger" message="العكس ينشئ حركة مالية مقابلة ويعيد فتح قيمة الدفعة ضمن المتبقي على المصروف." />
          <AppInput label="سبب العكس" value={reverseReason} onChangeText={setReverseReason} multiline required />
          {reverseError ? <AppBanner tone="danger" message={reverseError} /> : null}
          <AppButton
            title="مراجعة العكس"
            variant="danger"
            disabled={!isOnline || reverseReason.trim().length < 3}
            loading={reverseSubmitting}
            onPress={() => setReverseConfirm(true)}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={payConfirm}
        title="تأكيد الدفعة"
        message={`سيتم ترحيل ${money(Number(payAmount) || 0)} بتاريخ ${dateText(paidAt)} على الحساب المحدد.`}
        confirmLabel="ترحيل الدفعة"
        variant="primary"
        loading={paySubmitting}
        onConfirm={() => void submitPayment()}
        onCancel={() => { if (!paySubmitting) setPayConfirm(false); }}
      />
      <ConfirmDialog
        visible={reverseConfirm}
        title="تأكيد عكس الدفعة"
        message={`سيتم عكس ${money(reverseLine?.amount ?? 0)} وإعادة احتساب حالة المصروف. السبب: ${reverseReason.trim()}`}
        confirmLabel="عكس الدفعة"
        variant="danger"
        loading={reverseSubmitting}
        onConfirm={() => void submitReverse()}
        onCancel={() => { if (!reverseSubmitting) setReverseConfirm(false); }}
      />
      <ConfirmDialog
        visible={Boolean(cancelExpense)}
        title="إلغاء المصروف بالكامل"
        message={`سيُلغي الخادم المصروف #${cancelExpense?.id ?? ''} ويعكس كل دفعاته وحركات درج الوردية المرتبطة به. لا يمكن التراجع من الهاتف.`}
        confirmLabel="إلغاء وعكس الحركات"
        variant="danger"
        loading={cancelSubmitting}
        onConfirm={() => void submitCancel()}
        onCancel={() => { if (!cancelSubmitting) setCancelExpense(null); }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  cardHeader: { paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  emptyText: { ...textStart, paddingHorizontal: spacing.md, paddingBottom: spacing.lg, fontSize: typography.small },
  paymentRow: {
    ...flexRow,
    alignItems: 'flex-start',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
  },
  paymentIcon: { width: 36, height: 36, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  paymentCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  paymentHeading: { ...flexRow, alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  paymentTitle: { ...textStart, flex: 1, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
  paymentMeta: { ...textStart, fontFamily: fonts.regular, fontSize: typography.tiny },
  reversalReason: { ...textStart, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.tiny },
  paymentTrailing: { alignItems: 'flex-end', gap: spacing.xs },
  paymentAmount: { ...textLtr, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.body },
  historyFootnote: { ...textStart, paddingHorizontal: spacing.md, paddingBottom: spacing.md, fontSize: typography.tiny },
  paymentSummary: { ...flexRow, borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, overflow: 'hidden' },
  summaryCell: { flex: 1, alignItems: 'center', gap: spacing.xs, padding: spacing.md },
  summaryLabel: { fontFamily: fonts.medium, fontSize: typography.tiny },
  summaryValue: { ...textLtr, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.body },
});
