import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { financialAccountsAPI, type FinancialAccountTransactionPage } from '@/api/financialAccounts';
import type { FinancialAccount, FinancialAccountTransaction } from '@/types/api';
import type { MoreStackParamList } from '@/types/navigation';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import {
  AppAmountInput,
  AppBadge,
  AppButton,
  AppInput,
  AppPicker,
  AppSectionHeader,
  AppText,
} from '@/components/ui';
import { AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { completeIdempotencyAttempt, idempotencyKeyForAttempt } from '@/utils/idempotencyAttempt';
import { dateText, money, numberText } from '@/utils/format';
import { radius, spacing } from '@/constants/spacing';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { getProductLayoutTier, productContentMaxWidth } from '@/constants/productLayout';

type Props = NativeStackScreenProps<MoreStackParamList, 'FinancialAccountDetail'>;
type Action = 'deposit' | 'withdraw' | 'transfer';

const VIEW_PERMISSIONS = ['view_account_transactions', 'view_account_balances', 'manage_financial_accounts', 'manage_treasuries', 'access_admin_routes'];
const DEPOSIT_PERMISSIONS = ['create_external_deposit', 'create_deposit', 'record_capital_contribution', 'record_loan_movement', 'manage_financial_accounts', 'manage_treasuries', 'access_admin_routes'];
const WITHDRAW_PERMISSIONS = ['create_external_withdrawal', 'create_withdrawal', 'record_owner_drawing', 'record_loan_movement', 'manage_financial_accounts', 'manage_treasuries', 'access_admin_routes'];
const TRANSFER_PERMISSIONS = ['create_transfer', 'manage_financial_accounts', 'manage_treasuries', 'access_admin_routes'];

function transactionAmount(row: FinancialAccountTransaction): string {
  const amount = money(row.amount ?? 0);
  return row.direction === 'out' ? `− ${amount}` : `+ ${amount}`;
}

function CapabilityCell({ label, enabled }: { label: string; enabled?: boolean }) {
  const c = useColors();
  return (
    <View style={{ ...flexRow, flex: 1, minWidth: '30%', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.xs }}>
      <MaterialIcons name={enabled ? 'check-circle' : 'remove-circle-outline'} size={16} color={enabled ? c.success : c.textCaption} />
      <AppText style={{ ...textStart, color: enabled ? c.text : c.textCaption, fontSize: typography.caption, fontFamily: fonts.medium }}>
        {label}
      </AppText>
    </View>
  );
}

function FinancialTransactionRow({ row }: { row: FinancialAccountTransaction }) {
  const c = useColors();
  const outgoing = row.direction === 'out';
  const amountColor = outgoing ? c.danger : row.direction === 'in' ? c.success : c.text;
  return (
    <View
      style={{
        ...flexRow,
        minHeight: 76,
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: c.border,
        backgroundColor: c.surface,
      }}
      accessibilityLabel={`${row.transaction_type ?? row.type ?? 'حركة مالية'}، ${transactionAmount(row)}`}
    >
      <View style={{ width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: outgoing ? c.softDanger : c.softSuccess }}>
        <MaterialIcons name={outgoing ? 'south-west' : 'north-east'} size={17} color={amountColor} />
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <AppText style={{ ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small }} numberOfLines={1}>
          {row.transaction_type ?? row.type ?? 'حركة مالية'}
        </AppText>
        <AppText style={{ ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption }} numberOfLines={1}>
          {[row.branch?.name, row.note, row.reference].filter(Boolean).join(' · ') || 'بدون تفاصيل إضافية'}
        </AppText>
        <AppText style={{ ...textStart, color: c.textCaption, fontFamily: fonts.regular, fontSize: typography.micro }} numberOfLines={1}>
          {dateText(row.occurred_at)}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 2, flexShrink: 0 }}>
        <AppText style={{ ...textLtr, color: amountColor, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.body }}>
          {transactionAmount(row)}
        </AppText>
        {row.balance_after != null ? (
          <AppText style={{ ...textLtr, color: c.textCaption, fontFamily: fonts.medium, fontSize: typography.micro }}>
            رصيد {numberText(row.balance_after)}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

export function FinancialAccountDetailScreen({ route, navigation }: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const maxWidth = productContentMaxWidth(getProductLayoutTier(width));
  const user = useAuthStore((state) => state.user);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const [account, setAccount] = useState<FinancialAccount | null>(null);
  const [transactions, setTransactions] = useState<FinancialAccountTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transactionsError, setTransactionsError] = useState<string | null>(null);
  const [identifier, setIdentifier] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const [amount, setAmount] = useState('');
  const [reference, setReference] = useState('');
  const [targetAccountId, setTargetAccountId] = useState<string | null>(null);
  const [transferAccounts, setTransferAccounts] = useState<FinancialAccount[]>([]);
  const [transferLoading, setTransferLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const actionIdempotencyKeyRef = useRef<string | null>(null);

  const branchId = viewMode === 'branch' ? activeBranch?.id : undefined;
  const canView = hasPermission(user, VIEW_PERMISSIONS);
  const canDeposit = hasPermission(user, DEPOSIT_PERMISSIONS);
  const canWithdraw = hasPermission(user, WITHDRAW_PERMISSIONS);
  const canTransfer = hasPermission(user, TRANSFER_PERMISSIONS);

  const loadAccount = useCallback(async () => {
    setError(null);
    try {
      const response = await financialAccountsAPI.get(String(route.params.id));
      setAccount(extractData<FinancialAccount>(response) ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [route.params.id]);

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    setTransactionsError(null);
    try {
      const response = await financialAccountsAPI.transactions(String(route.params.id), {
        per_page: 50,
        ...(branchId ? { branch_id: branchId } : {}),
      });
      const page = extractData<FinancialAccountTransactionPage>(response);
      setTransactions(page?.data ?? []);
    } catch (err) {
      setTransactionsError(normalizeApiError(err).message);
    } finally {
      setTransactionsLoading(false);
    }
  }, [branchId, route.params.id]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadAccount(), loadTransactions()]);
    setRefreshing(false);
  }, [loadAccount, loadTransactions]);

  useEffect(() => {
    void loadAccount();
    void loadTransactions();
  }, [loadAccount, loadTransactions]);

  const openAction = async (nextAction: Action) => {
    setActionError(null);
    setAmount('');
    setReference('');
    setTargetAccountId(null);
    completeIdempotencyAttempt(actionIdempotencyKeyRef);
    setAction(nextAction);
    if (nextAction !== 'transfer') return;
    if (!branchId) {
      setActionError('اختر فرعاً نشطاً قبل تنفيذ التحويل.');
      return;
    }
    setTransferLoading(true);
    try {
      const response = await financialAccountsAPI.available({ branch_id: branchId, capability: 'transfers' });
      const rows = extractData<FinancialAccount[]>(response) ?? [];
      setTransferAccounts(rows.filter((row) => String(row.id) !== String(route.params.id)));
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    } finally {
      setTransferLoading(false);
    }
  };

  const submitAction = async () => {
    const numericAmount = Number(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      setActionError('أدخل مبلغاً صحيحاً أكبر من صفر.');
      return;
    }
    if ((action === 'deposit' || action === 'withdraw') && !branchId && !user?.can_use_global_view) {
      setActionError('الحركة المالية تتطلب فرعاً نشطاً أو صلاحية العرض العام.');
      return;
    }
    if (action === 'transfer' && (!branchId || !targetAccountId)) {
      setActionError('اختر الحساب المستلم والفرع قبل التحويل.');
      return;
    }

    setActionLoading(true);
    setActionError(null);
    try {
      const idempotencyKey = idempotencyKeyForAttempt(actionIdempotencyKeyRef);
      if (action === 'deposit' || action === 'withdraw') {
        const payload = {
          amount: numericAmount,
          ...(branchId ? { branch_id: branchId } : {}),
          ...(reference.trim() ? { reference: reference.trim(), notes: reference.trim() } : {}),
          idempotency_key: idempotencyKey,
        };
        if (action === 'deposit') await financialAccountsAPI.deposit(String(route.params.id), payload);
        else await financialAccountsAPI.withdraw(String(route.params.id), payload);
      } else if (targetAccountId && branchId) {
        await financialAccountsAPI.transfer({
          from_financial_account_id: String(route.params.id),
          to_financial_account_id: targetAccountId,
          branch_id: branchId,
          amount: numericAmount,
          ...(reference.trim() ? { reference: reference.trim() } : {}),
          idempotency_key: idempotencyKey,
        });
      }
      setAction(null);
      setConfirmVisible(false);
      completeIdempotencyAttempt(actionIdempotencyKeyRef);
      await refreshAll();
    } catch (err) {
      setActionError(normalizeApiError(err).message);
    } finally {
      setActionLoading(false);
    }
  };

  const reveal = async () => {
    try {
      const response = await financialAccountsAPI.revealIdentifier(String(route.params.id));
      setIdentifier(extractData<{ identifier_value?: string | null }>(response)?.identifier_value ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  const transferOptions = useMemo(
    () => transferAccounts.map((row) => ({ label: `${row.name}${row.masked_identifier ? ` · ${row.masked_identifier}` : ''}`, value: String(row.id) })),
    [transferAccounts],
  );

  if (!canView) {
    return (
      <AppScreen title="الحساب المالي" onBack={navigation.goBack}>
        <AppErrorState message="لا تملك صلاحية عرض هذا الحساب أو حركاته." />
      </AppScreen>
    );
  }

  if (loading && !account) {
    return <AppScreen title="الحساب المالي" onBack={navigation.goBack}><AppLoadingState /></AppScreen>;
  }

  if (error && !account) {
    return <AppScreen title="الحساب المالي" onBack={navigation.goBack}><AppErrorState message={error} onRetry={() => void loadAccount()} /></AppScreen>;
  }

  const active = account?.is_active !== false;
  const actionTitle = action === 'deposit' ? 'إيداع' : action === 'withdraw' ? 'سحب' : 'تحويل';

  return (
    <AppScreen title={account?.name ?? route.params.name ?? 'الحساب المالي'} onBack={navigation.goBack} onRefresh={() => void refreshAll()} refreshing={refreshing}>
      <View style={{ width: '100%', maxWidth, alignSelf: 'center', padding: spacing.lg, gap: spacing.xl }}>
        {error ? <AppErrorState message={error} onRetry={() => void loadAccount()} /> : null}
        {account ? (
          <>
            <View style={{ gap: spacing.md, paddingBottom: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
              <View style={{ ...flexRow, justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm }}>
                <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm, flex: 1 }}>
                  <View style={{ width: 40, height: 40, borderRadius: radius.md, backgroundColor: c.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialIcons name="account-balance-wallet" size={20} color={c.textMuted} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <AppText style={{ ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body }} numberOfLines={1}>
                      {account.provider_name ?? 'حساب مالي'}
                    </AppText>
                    <AppText style={{ ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.caption }} numberOfLines={1}>
                      {account.payment_method} · {account.masked_identifier ?? 'معرف محمي'}
                    </AppText>
                  </View>
                </View>
                <AppBadge label={active ? 'نشط' : 'متوقف'} tone={active ? 'success' : 'danger'} />
              </View>
              <View style={{ gap: 2 }}>
                <AppText style={{ ...textStart, color: c.textCaption, fontFamily: fonts.medium, fontSize: typography.caption }}>الرصيد الحالي</AppText>
                <AppText style={{ ...textLtr, color: c.text, fontFamily: fonts.extraBold, fontWeight: '900', fontSize: width >= 600 ? 36 : 30, lineHeight: width >= 600 ? 44 : 38 }}>
                  {account.balance == null ? 'غير متاح' : money(account.balance, account.currency ?? 'ج.م')}
                </AppText>
              </View>
              {identifier ? (
                <View style={{ padding: spacing.sm, borderRadius: radius.md, backgroundColor: c.softWarning }}>
                  <AppText style={{ ...textLtr, color: c.warning, fontFamily: fonts.bold }}>{identifier}</AppText>
                </View>
              ) : null}
              {hasPermission(user, ['view_sensitive_account_identifiers', 'manage_treasuries', 'access_admin_routes']) && account.masked_identifier && !identifier ? (
                <AppButton title="كشف المعرف بإذن" variant="outline" size="sm" onPress={() => void reveal()} />
              ) : null}
            </View>

            {active ? (
              <View style={{ gap: spacing.sm }}>
                <AppSectionHeader title="إجراء جديد" />
                <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
                  {canDeposit && account.allow_deposits !== false ? <AppButton title="إيداع" onPress={() => void openAction('deposit')} style={{ flex: 1, minWidth: 100 }} /> : null}
                  {canWithdraw && account.allow_withdrawals !== false ? <AppButton title="سحب" variant="secondary" onPress={() => void openAction('withdraw')} style={{ flex: 1, minWidth: 100 }} /> : null}
                  {canTransfer && account.allow_transfers !== false ? <AppButton title="تحويل" variant="outline" onPress={() => void openAction('transfer')} style={{ flex: 1, minWidth: 100 }} /> : null}
                </View>
              </View>
            ) : <AppErrorState message="هذا الحساب متوقف؛ الحركات الجديدة معطلة." />}

            <View style={{ gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border, backgroundColor: c.surface }}>
              <AppSectionHeader title="نطاق الحساب وقدراته" />
              <View style={{ ...flexRow, justifyContent: 'space-between', gap: spacing.md, paddingBottom: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border }}>
                <AppText style={{ ...textStart, color: c.textMuted, fontFamily: fonts.medium, fontSize: typography.small }}>نطاق الفروع</AppText>
                <AppText style={{ ...textStart, color: c.text, fontFamily: fonts.bold, fontSize: typography.small }}>
                  {account.branch_scope === 'all_branches' ? 'كل الفروع' : account.branch_scope === 'selected_branches' ? `${account.branch_links?.length ?? 0} فروع محددة` : 'غير محدد'}
                </AppText>
              </View>
              <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
                <CapabilityCell label="مبيعات" enabled={account.allow_sales} />
                <CapabilityCell label="مرتجعات" enabled={account.allow_refunds} />
                <CapabilityCell label="مصروفات" enabled={account.allow_expenses} />
                <CapabilityCell label="إيداع" enabled={account.allow_deposits} />
                <CapabilityCell label="سحب" enabled={account.allow_withdrawals} />
                <CapabilityCell label="تحويل" enabled={account.allow_transfers} />
              </View>
              {account.reconciliation ? (
                <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm, padding: spacing.sm, borderRadius: radius.md, backgroundColor: c.softWarning }}>
                  <MaterialIcons name="warning-amber" size={18} color={c.warning} />
                  <AppText style={{ ...textStart, flex: 1, color: c.warning, fontFamily: fonts.bold, fontSize: typography.caption }}>راجع حالة المطابقة قبل تنفيذ حركة جديدة.</AppText>
                </View>
              ) : null}
            </View>

            {transactionsError ? <AppErrorState message={transactionsError} onRetry={() => void loadTransactions()} /> : null}
            {transactionsLoading && transactions.length === 0 ? <AppLoadingState variant="skeleton" skeletonRows={4} /> : null}
            <View style={{ gap: spacing.sm }}>
              <AppSectionHeader title={`دفتر الحركة (${transactions.length})`} />
              {!transactionsLoading && transactions.length === 0 ? <AppText style={{ ...textStart, color: c.textMuted }}>لا توجد حركات في نطاق الفرع الحالي.</AppText> : null}
              {transactions.length ? (
                <View style={{ overflow: 'hidden', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: c.border }}>
                  {transactions.map((row) => <FinancialTransactionRow key={String(row.id)} row={row} />)}
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </View>

      <AppBottomSheet visible={Boolean(action)} onClose={() => {
        if (!actionLoading) {
          setAction(null);
          setConfirmVisible(false);
          completeIdempotencyAttempt(actionIdempotencyKeyRef);
        }
      }} title={actionTitle} size="form">
        <View style={{ gap: spacing.md }}>
          {action === 'transfer' ? (
            transferLoading ? <AppLoadingState message="جاري تحميل الحسابات المتاحة…" /> : (
              <AppPicker label="الحساب المستلم" value={targetAccountId} options={transferOptions} onChange={setTargetAccountId} required />
            )
          ) : null}
          <AppAmountInput label="المبلغ" value={amount} onChangeText={setAmount} required />
          <AppInput label="المرجع / الملاحظات" value={reference} onChangeText={setReference} multiline />
          {actionError ? <AppText style={{ ...textStart, color: c.danger, fontWeight: '800' }}>{actionError}</AppText> : null}
          <AppButton title={`مراجعة ${actionTitle}`} onPress={() => setConfirmVisible(true)} loading={actionLoading} disabled={transferLoading || !amount || (action === 'transfer' && !targetAccountId)} />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title={`تأكيد ${actionTitle}`}
        message={`${actionTitle} ${money(Number(amount) || 0)}${reference.trim() ? ` · ${reference.trim()}` : ''}`}
        confirmLabel="تأكيد وتنفيذ"
        onConfirm={() => void submitAction()}
        onCancel={() => { if (!actionLoading) setConfirmVisible(false); }}
        loading={actionLoading}
      />
    </AppScreen>
  );
}
