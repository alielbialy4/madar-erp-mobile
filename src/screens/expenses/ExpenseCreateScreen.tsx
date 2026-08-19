import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { expensesAPI } from '@/api/expenses';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { shiftsAPI } from '@/api/shifts';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import {
  AppAmountInput,
  AppButton,
  AppDatePicker,
  AppInput,
  AppPicker,
  AppSelect,
  AppText,
} from '@/components/ui';
import { AppBanner, AppErrorState, ConfirmDialog, useToast } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { usePermissions } from '@/hooks/usePermissions';
import { extractArray } from '@/utils/data';
import { isManualExpenseCategory } from '@/utils/expenseCategories';
import { normalizeApiError } from '@/utils/errors';
import { validateExpenseSplit, type ExpenseSplitDraft } from '@/utils/expenseFinancials';
import { createUuid } from '@/utils/uuid';
import { money } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { ExpenseCategory, ExpenseCreateInput } from '@/types/expenses';
import type { MoreStackParamList } from '@/types/navigation';
import { RegisterDrawerSessionPicker } from '@/components/pos/RegisterDrawerSessionPicker';
import type { EligibleRegisterMoneySession } from '@/api/posRegisters';
import { registerMoneyContextFromSession } from '@/services/storage/registerSessionContext';

type Props = NativeStackScreenProps<MoreStackParamList, 'ExpenseCreate'>;
type PaymentState = 'pending' | 'paid';

function paymentSourceOption(source: PaymentSource) {
  return {
    label: [source.name, source.provider_name, source.masked_identifier].filter(Boolean).join(' · '),
    value: String(source.id),
  };
}

export function ExpenseCreateScreen({ navigation }: Props) {
  const c = useColors();
  const toast = useToast();
  const { can } = usePermissions();
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const branches = useBranchStore((state) => state.branches);
  const viewMode = useBranchStore((state) => state.viewMode);
  const isOnline = useNetworkStore((state) => state.isOnline);
  const canCreate = can(['pay_expense', 'process_sales', 'manage_expenses', 'access_admin_routes']);
  const [branchId, setBranchId] = useState(viewMode === 'branch' ? activeBranch?.id ?? '' : '');
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [reference, setReference] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentState, setPaymentState] = useState<PaymentState>('paid');
  const [cashSource, setCashSource] = useState<'drawer' | 'vault'>('vault');
  const [drawerAvailable, setDrawerAvailable] = useState(false);
  const [shiftMode, setShiftMode] = useState<'legacy_shared_drawer' | 'multi_register' | null>(null);
  const [shiftLoading, setShiftLoading] = useState(false);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [primaryAccountId, setPrimaryAccountId] = useState<string | null>(null);
  const [additionalLines, setAdditionalLines] = useState<ExpenseSplitDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [drawerSessionId, setDrawerSessionId] = useState('');
  const [drawerSession, setDrawerSession] = useState<EligibleRegisterMoneySession | null>(null);
  const [drawerBlocked, setDrawerBlocked] = useState(false);
  const clientUuidRef = useRef<string | null>(null);
  const submitLockRef = useRef(false);
  const needsRegisterSession = shiftMode === 'multi_register';

  useEffect(() => {
    setCategoriesLoading(true);
    expensesAPI.getCategories({
      is_active: true,
      for_manual: true,
      ...(branchId ? { branch_id: branchId } : {}),
    })
      .then((response) => {
        const rows = extractArray<ExpenseCategory>(response).filter(
          (category) => category.is_active !== false && isManualExpenseCategory(category),
        );
        setCategories(rows);
        setCategoryId((current) => current && rows.some((category) => String(category.id) === current) ? current : null);
      })
      .catch((reason) => setError(normalizeApiError(reason).message))
      .finally(() => setCategoriesLoading(false));
  }, [branchId]);

  useEffect(() => {
    setDrawerAvailable(false);
    setShiftMode(null);
    setCashSource('vault');
    if (viewMode !== 'branch' || !branchId) return;
    setShiftLoading(true);
    shiftsAPI.current(branchId)
      .then((response) => {
        const available = Boolean(response.data?.drawer_ledger_enabled);
        setDrawerAvailable(available);
        setShiftMode(response.data?.mode ?? 'legacy_shared_drawer');
        if (available) setCashSource('drawer');
      })
      .catch(() => {
        setDrawerAvailable(false);
        setShiftMode(null);
      })
      .finally(() => setShiftLoading(false));
  }, [branchId, viewMode]);

  useEffect(() => {
    setPaymentSources([]);
    setPrimaryAccountId(null);
    setAdditionalLines([]);
    setSourceError(null);
    if (paymentState !== 'paid' || cashSource !== 'vault') return;
    setSourcesLoading(true);
    financialAccountsAPI.paymentSources({
      operation: 'expense',
      ...(branchId ? { branch_id: branchId } : {}),
      include_unavailable: true,
    })
      .then((response) => {
        const rows = response.data ?? [];
        const available = rows.filter((source) => source.is_available !== false);
        setPaymentSources(rows);
        setPrimaryAccountId(String(available.find((source) => source.is_default)?.id ?? available[0]?.id ?? '') || null);
      })
      .catch((reason) => setSourceError(normalizeApiError(reason).message))
      .finally(() => setSourcesLoading(false));
  }, [branchId, cashSource, paymentState]);

  const availableSources = useMemo(
    () => paymentSources.filter((source) => source.is_available !== false),
    [paymentSources],
  );
  const unavailableCount = paymentSources.length - availableSources.length;
  const splitValidation = useMemo(
    () => validateExpenseSplit(amount, primaryAccountId, additionalLines),
    [additionalLines, amount, primaryAccountId],
  );
  const selectedPrimary = availableSources.find((source) => String(source.id) === primaryAccountId);

  const changeBranch = (nextBranchId: string | null) => {
    setBranchId(nextBranchId ?? '');
    setCategoryId(null);
    setPrimaryAccountId(null);
    setAdditionalLines([]);
  };

  const updateAdditionalLine = (index: number, patch: Partial<ExpenseSplitDraft>) => {
    setAdditionalLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
  };

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) return;
    setError(null);
    const numericAmount = Number(amount);
    if (!categoryId) { setError('اختر تصنيف المصروف.'); return; }
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) { setError('أدخل مبلغاً صحيحاً أكبر من صفر.'); return; }
    if (!isOnline) {
      setError('تسجيل المصروف المالي يحتاج اتصالاً مباشراً حالياً؛ لن نخزّن حركة مالية غير مؤكدة على الجهاز.');
      return;
    }
    if (paymentState === 'paid' && cashSource === 'drawer' && needsRegisterSession && drawerBlocked) {
      setError('اختر درجاً مفتوحاً قبل الصرف من النقدية.');
      return;
    }
    if (paymentState === 'paid' && cashSource === 'drawer' && !drawerAvailable) {
      setError('الصرف من الدرج يتطلب وردية مفتوحة تستخدم دفتر الدرج.');
      return;
    }
    if (paymentState === 'paid' && cashSource === 'vault' && !splitValidation.ok) {
      setError(splitValidation.error);
      return;
    }

    submitLockRef.current = true;
    setSubmitting(true);
    if (!clientUuidRef.current) clientUuidRef.current = createUuid();
    try {
      const clientUuid = clientUuidRef.current;
      const payload: ExpenseCreateInput = {
        client_uuid: clientUuid,
        expense_category_id: Number(categoryId),
        ...(branchId ? { branch_id: branchId } : {}),
        amount: numericAmount,
        expense_date: expenseDate,
        cash_source: paymentState === 'paid' ? cashSource : 'vault',
        status: paymentState,
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(notes.trim() ? { notes: notes.trim() } : {}),
        ...(reference.trim() ? { reference_number: reference.trim() } : {}),
        ...(paymentState === 'paid' && cashSource === 'drawer' && needsRegisterSession
          ? await registerMoneyContextFromSession(drawerSession)
          : {}),
      };

      if (paymentState === 'paid' && cashSource === 'vault' && splitValidation.ok && primaryAccountId) {
        payload.payment_lines = [
          { financial_account_id: primaryAccountId, amount: splitValidation.primaryAmount.toFixed(4) },
          ...additionalLines.map((line) => ({
            financial_account_id: line.financial_account_id,
            amount: Number(line.amount).toFixed(4),
          })),
        ].map((line, index) => ({
          ...line,
          paid_at: `${expenseDate} 00:00:00`,
          idempotency_key: `expense:${clientUuid}:line:${index + 1}`,
        }));
      }

      const response = await expensesAPI.create(payload);
      const createdId = response.data?.id;
      clientUuidRef.current = null;
      toast.success(paymentState === 'paid' ? 'تم تسجيل المصروف وحركات الدفع' : 'تم تسجيل المصروف كمبلغ مستحق');
      if (createdId) navigation.replace('ExpenseDetail', { id: createdId });
      else navigation.goBack();
    } catch (reason) {
      const message = normalizeApiError(reason).message;
      setError(message);
      toast.error(message);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
      setConfirmVisible(false);
    }
  };

  if (!canCreate) {
    return (
      <FormScreenLayout title="مصروف جديد" onBack={navigation.goBack}>
        <AppErrorState message="لا تملك صلاحية تسجيل المصروفات." />
      </FormScreenLayout>
    );
  }

  const confirmPaymentCopy = paymentState === 'pending'
    ? 'سيُسجل المبلغ كمصروف مستحق بلا حركة نقدية الآن.'
    : cashSource === 'drawer'
      ? 'سيُخصم المبلغ من درج الوردية المفتوحة.'
      : `سيُوزع الدفع على ${additionalLines.length + 1} حساب مالي.`;

  return (
    <FormScreenLayout
      title="مصروف جديد"
      subtitle="افصل الالتزام عن الدفع وحدد مصدر الحركة بدقة"
      onBack={navigation.goBack}
      heroTitle={categoryId ? categories.find((category) => String(category.id) === categoryId)?.name : 'مصروف تشغيلي'}
      heroSubtitle={paymentState === 'paid' ? 'تسجيل المصروف والدفع معاً' : 'تسجيل التزام للدفع لاحقاً'}
      heroAmount={money(Number(amount) || 0)}
      footer={(
        <AppButton
          title={paymentState === 'paid' ? `مراجعة وتسجيل — ${money(Number(amount) || 0)}` : `تسجيل كمستحق — ${money(Number(amount) || 0)}`}
          onPress={() => setConfirmVisible(true)}
          loading={submitting}
          disabled={!isOnline || !categoryId || !amount || (paymentState === 'paid' && cashSource === 'vault' && !splitValidation.ok) || (paymentState === 'paid' && cashSource === 'drawer' && needsRegisterSession && drawerBlocked)}
          fullWidth
        />
      )}
    >
      {!isOnline ? (
        <AppBanner
          tone="warning"
          message="أنت غير متصل. تم تعطيل تسجيل المصروف لتجنب تكرار أو تأخير حركة مالية دون تأكيد من الخادم."
        />
      ) : null}
      {error ? <AppBanner tone="danger" message={error} onDismiss={() => setError(null)} /> : null}

      <FormSection title="الاستحقاق" subtitle="هذه البيانات تصف المصروف نفسه، لا حركة الدفع" icon="receipt-long">
        {globalView ? (
          <AppPicker
            label="نطاق المصروف"
            value={branchId || null}
            options={[
              { label: 'مصروف عام بلا فرع', value: '' },
              ...branches.map((branch) => ({ label: branch.name, value: branch.id })),
            ]}
            onChange={changeBranch}
          />
        ) : null}
        <AppPicker
          label="التصنيف"
          value={categoryId}
          options={categories.map((category) => ({ label: category.name, value: String(category.id) }))}
          onChange={setCategoryId}
          placeholder={categoriesLoading ? 'جاري تحميل التصنيفات...' : 'اختر التصنيف'}
          required
        />
        {!categoriesLoading && categories.length === 0 ? (
          <AppBanner tone="warning" message="لا توجد تصنيفات نشطة في هذا النطاق. أنشئ تصنيفاً أو غيّر الفرع." />
        ) : null}
        <AppAmountInput label="مبلغ المصروف" value={amount} onChangeText={setAmount} required />
        <AppDatePicker label="تاريخ المصروف" value={expenseDate} onChange={setExpenseDate} />
        <AppInput label="الوصف" value={description} onChangeText={setDescription} placeholder="ما سبب هذا المصروف؟" multiline />
        <AppInput label="رقم المرجع" value={reference} onChangeText={setReference} placeholder="فاتورة أو إيصال أو مرجع خارجي" />
        <AppInput label="ملاحظات داخلية" value={notes} onChangeText={setNotes} multiline />
      </FormSection>

      <FormSection title="حالة الدفع" subtitle="المصروف المستحق لا ينشئ حركة مالية حتى يتم دفعه" icon="account-balance-wallet">
        <AppSelect
          value={paymentState}
          options={[
            { label: 'دفع الآن', value: 'paid' },
            { label: 'تسجيل كمستحق', value: 'pending' },
          ]}
          onChange={(value) => setPaymentState(value as PaymentState)}
          variant="solid"
        />
        {paymentState === 'pending' ? (
          <AppBanner tone="info" message="سيظهر المبلغ كمتبقي بالكامل، ويمكن دفعه جزئياً أو كاملاً من شاشة التفاصيل." />
        ) : (
          <>
            <AppSelect
              label="مصدر الصرف"
              value={cashSource}
              options={[
                ...(drawerAvailable ? [{ label: 'درج الوردية', value: 'drawer' }] : []),
                { label: 'حساب مالي / خزنة', value: 'vault' },
              ]}
              onChange={(value) => setCashSource(value as 'drawer' | 'vault')}
            />
            {shiftLoading ? <AppBanner tone="info" message="جاري التحقق من الوردية ودفتر الدرج..." /> : null}
            {cashSource === 'drawer' ? (
              needsRegisterSession ? (
              <>
                <RegisterDrawerSessionPicker
                  visible
                  required
                  value={drawerSessionId}
                  onChange={(id, session) => {
                    setDrawerSessionId(id);
                    setDrawerSession(session);
                  }}
                  onAvailabilityChange={({ requiredBlocked }) => {
                    setDrawerBlocked(requiredBlocked);
                  }}
                />
                <AppBanner
                  tone="warning"
                  message="سيُسجل الصرف على الجلسة المختارة ويؤثر مباشرة في النقد المتوقع عند الإغلاق."
                />
              </>
              ) : (
                <AppBanner
                  tone="info"
                  message="وردية مفتوحة على الدرج المشترك. سيتم الصرف من درج الوردية دون جلسة كاشير منفصلة."
                />
              )
            ) : (
              <>
                <AppPicker
                  label="الحساب الأساسي"
                  value={primaryAccountId}
                  options={availableSources.map(paymentSourceOption)}
                  onChange={(value) => {
                    setPrimaryAccountId(value);
                    const source = availableSources.find((row) => String(row.id) === value);
                    if (globalView && !branchId && source?.branch_id) setBranchId(source.branch_id);
                  }}
                  placeholder={sourcesLoading ? 'جاري تحميل الحسابات...' : 'اختر حساب الدفع'}
                  required
                />
                {selectedPrimary && splitValidation.ok ? (
                  <View style={[styles.allocationSummary, { borderColor: c.borderSubtle, backgroundColor: c.surfaceMuted }]}>
                    <View style={styles.allocationCopy}>
                      <AppText style={[styles.allocationTitle, { color: c.text }]}>{selectedPrimary.name}</AppText>
                      <AppText style={[styles.allocationMeta, { color: c.textMuted }]}>الحساب الأساسي يأخذ المتبقي تلقائياً</AppText>
                    </View>
                    <AppText style={[styles.allocationAmount, { color: c.text }]}>{money(splitValidation.primaryAmount)}</AppText>
                  </View>
                ) : null}
                {sourceError ? <AppBanner tone="danger" message={sourceError} /> : null}
                {!sourcesLoading && availableSources.length === 0 ? (
                  <AppBanner tone="warning" message="لا توجد حسابات مفعلة تسمح بدفع المصروفات في هذا النطاق." />
                ) : null}
                {unavailableCount > 0 ? (
                  <AppBanner tone="info" message={`${unavailableCount} حساب غير متاح تم استبعاده حسب صلاحية الحساب ونطاق الفرع.`} />
                ) : null}

                {additionalLines.map((line, index) => {
                  const usedIds = new Set([primaryAccountId, ...additionalLines.filter((_, rowIndex) => rowIndex !== index).map((row) => row.financial_account_id)]);
                  return (
                    <View key={`split-${index}`} style={[styles.splitRow, { borderColor: c.borderSubtle }]}>
                      <View style={styles.splitHeading}>
                        <AppText style={[styles.splitTitle, { color: c.text }]}>دفعة إضافية {index + 1}</AppText>
                        <AppButton
                          title="إزالة"
                          variant="dangerGhost"
                          size="sm"
                          onPress={() => setAdditionalLines((current) => current.filter((_, rowIndex) => rowIndex !== index))}
                        />
                      </View>
                      <AppPicker
                        label="الحساب"
                        value={line.financial_account_id || null}
                        options={availableSources.filter((source) => !usedIds.has(String(source.id))).map(paymentSourceOption)}
                        onChange={(financial_account_id) => updateAdditionalLine(index, { financial_account_id: financial_account_id ?? '' })}
                      />
                      <AppAmountInput
                        label="قيمة الدفعة"
                        value={String(line.amount)}
                        onChangeText={(lineAmount) => updateAdditionalLine(index, { amount: lineAmount })}
                      />
                    </View>
                  );
                })}

                <AppButton
                  title="تقسيم على حساب آخر"
                  variant="secondary"
                  icon={<MaterialIcons name="add" size={18} color={c.text} />}
                  disabled={!primaryAccountId || additionalLines.length >= Math.max(0, availableSources.length - 1)}
                  onPress={() => setAdditionalLines((current) => [...current, { financial_account_id: '', amount: '' }])}
                />
                {!splitValidation.ok && amount ? <AppBanner tone="danger" message={splitValidation.error} /> : null}
              </>
            )}
          </>
        )}
      </FormSection>

      <ConfirmDialog
        visible={confirmVisible}
        title={paymentState === 'paid' ? 'تأكيد المصروف والدفع' : 'تأكيد المصروف المستحق'}
        message={`المبلغ ${money(Number(amount) || 0)}. ${confirmPaymentCopy}`}
        confirmLabel="تأكيد وتسجيل"
        variant={paymentState === 'paid' ? 'danger' : 'primary'}
        loading={submitting}
        onConfirm={() => void handleSubmit()}
        onCancel={() => { if (!submitting) setConfirmVisible(false); }}
      />
    </FormScreenLayout>
  );
}

const styles = StyleSheet.create({
  allocationSummary: {
    ...flexRow,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  allocationCopy: { flex: 1, gap: 2 },
  allocationTitle: { ...textStart, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
  allocationMeta: { ...textStart, fontFamily: fonts.regular, fontSize: typography.tiny },
  allocationAmount: { fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.body },
  splitRow: { gap: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.md },
  splitHeading: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  splitTitle: { ...textStart, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
});
