import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { textStart, flexRow } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { customersAPI } from '@/api/customers';
import { walletAPI, type WalletTransaction } from '@/api/wallet';
import { vaultsAPI } from '@/api/vaults';
import { shiftsAPI } from '@/api/shifts';
import { useBranchStore } from '@/store/branchStore';
import { AppBadge, AppButton, AppCard, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppErrorState, ConfirmDialog } from '@/components/feedback';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import type { Customer } from '@/types/api';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type RefreshAction = () => void;

type WalletAction = 'deposit' | 'withdraw';

function paymentEntryLabel(entryType?: string | null) {
  switch (entryType) {
    case 'debt_collection': return 'تحصيل دين';
    case 'manual_debt': return 'زيادة دين يدوية';
    case 'debt_increase': return 'مدين';
    case 'balance_credit': return 'إضافة رصيد';
    default: return entryType || 'أخرى';
  }
}

function walletTypeLabel(type?: string | null) {
  switch (type) {
    case 'deposit': return 'إيداع';
    case 'withdrawal':
    case 'withdraw': return 'سحب';
    case 'sale_payment': return 'دفع فاتورة';
    case 'refund': return 'استرداد';
    case 'adjustment': return 'تسوية';
    default: return type || 'عملية';
  }
}

export function CustomerDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const [editOpen, setEditOpen] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', credit_limit: '' });
  const [walletOpen, setWalletOpen] = useState(false);
  const [walletLoading, setWalletLoading] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
  const [walletAction, setWalletAction] = useState<WalletAction>('deposit');
  const [walletAmount, setWalletAmount] = useState('');
  const [walletDescription, setWalletDescription] = useState('');
  const [walletConfirmOpen, setWalletConfirmOpen] = useState(false);
  const [walletSubmitting, setWalletSubmitting] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtNotes, setDebtNotes] = useState('');
  const [debtVaultId, setDebtVaultId] = useState('');
  const [debtVaults, setDebtVaults] = useState<{ id: string; name: string }[]>([]);
  const [debtSubmitting, setDebtSubmitting] = useState(false);
  const [debtError, setDebtError] = useState<string | null>(null);
  const [debtTarget, setDebtTarget] = useState<string>('auto');
  const [debtCreditSales, setDebtCreditSales] = useState<Array<{ id: number; invoice_number?: string | null; remaining: number }>>([]);
  const [debtLayawayCount, setDebtLayawayCount] = useState(0);
  const [debtConfirmOpen, setDebtConfirmOpen] = useState(false);
  const [paymentRows, setPaymentRows] = useState<Array<{
    id: number;
    amount: number;
    entry_type: string;
    notes?: string | null;
    invoice_number?: string | null;
    vault_name?: string | null;
    payment_date?: string | null;
    created_at?: string | null;
  }>>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const refreshRef = useRef<RefreshAction | null>(null);
  const rawId = route.params?.id;
  const id = Number(rawId ?? 0);
  const hasValidId = rawId !== undefined && rawId !== null && rawId !== '' && !Number.isNaN(id);
  const styles = useMemo(() => createStyles(), []);

  const openEdit = useCallback((item: Customer, refresh: RefreshAction) => {
    refreshRef.current = refresh;
    setEditError(null);
    setEditForm({
      name: item.name ?? '',
      phone: item.phone ?? item.primary_phone ?? '',
      email: item.email ?? '',
      credit_limit: item.credit_limit != null && item.credit_limit !== '' ? String(item.credit_limit) : '',
    });
    setEditOpen(true);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editForm.name.trim() || !editForm.phone.trim()) {
      setEditError('اسم العميل ورقم الهاتف مطلوبان.');
      return;
    }
    setEditSaving(true);
    setEditError(null);
    try {
      const creditParsed = editForm.credit_limit.trim() === '' ? null : Number(editForm.credit_limit);
      if (editForm.credit_limit.trim() !== '' && (!Number.isFinite(creditParsed) || (creditParsed as number) < 0)) {
        setEditError('حد ائتمان غير صالح.');
        return;
      }
      await customersAPI.update(id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
        credit_limit: creditParsed,
      });
      setEditOpen(false);
      refreshRef.current?.();
    } catch (err) {
      setEditError(normalizeApiError(err).message);
    } finally {
      setEditSaving(false);
    }
  }, [editForm.credit_limit, editForm.email, editForm.name, editForm.phone, id]);

  const loadWallet = useCallback(async () => {
    setWalletLoading(true);
    setWalletError(null);
    try {
      const [balanceResponse, transactionsResponse] = await Promise.all([
        walletAPI.getBalance(id),
        walletAPI.transactions(id, { per_page: 50 }),
      ]);
      const balanceData = extractData(balanceResponse);
      setWalletBalance(Number(balanceData?.wallet_balance ?? 0));
      const txData = extractData(transactionsResponse);
      const nested = txData as unknown as { data?: WalletTransaction[] };
      setWalletTransactions(Array.isArray(txData) ? txData : Array.isArray(nested?.data) ? nested.data : []);
    } catch (err) {
      setWalletError(normalizeApiError(err).message);
    } finally {
      setWalletLoading(false);
    }
  }, [id]);

  const openWallet = useCallback((refresh: RefreshAction) => {
    refreshRef.current = refresh;
    setWalletOpen(true);
    void loadWallet();
  }, [loadWallet]);

  const loadPayments = useCallback(async () => {
    if (!hasValidId) return;
    setPaymentsLoading(true);
    try {
      const response = await customersAPI.getPaymentHistory(id);
      const rows = extractData(response) ?? response;
      setPaymentRows(Array.isArray(rows) ? rows : []);
    } catch {
      setPaymentRows([]);
    } finally {
      setPaymentsLoading(false);
    }
  }, [hasValidId, id]);

  useEffect(() => {
    if (hasValidId) void loadPayments();
  }, [hasValidId, loadPayments]);

  const openDebtCollection = useCallback(async (item: Customer, refresh: RefreshAction) => {
    refreshRef.current = refresh;
    setDebtError(null);
    setDebtAmount(String(item.debt ?? 0));
    setDebtNotes('');
    setDebtTarget('auto');
    setDebtOpen(true);
    try {
      const openDebts = await customersAPI.getOpenDebts(item.id);
      const data = extractData(openDebts) ?? openDebts;
      setDebtCreditSales((data as { credit_sales?: typeof debtCreditSales }).credit_sales ?? []);
      setDebtLayawayCount((data as { layaway_plans?: unknown[] }).layaway_plans?.length ?? 0);
    } catch {
      setDebtCreditSales([]);
      setDebtLayawayCount(0);
    }
    if (!activeBranch?.id) return;
    try {
      const response = await vaultsAPI.list({ active_only: true, branch_id: activeBranch.id });
      const rows = (response.data ?? []) as { id: string; name: string }[];
      setDebtVaults(rows);
      if (rows[0]?.id) setDebtVaultId(rows[0].id);
    } catch {
      setDebtVaults([]);
    }
  }, [activeBranch?.id]);

  const submitDebtCollection = useCallback(async () => {
    const parsed = Number(debtAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setDebtError('أدخل مبلغاً صحيحاً أكبر من صفر.');
      return;
    }
    setDebtSubmitting(true);
    setDebtError(null);
    try {
      const saleId = debtTarget !== 'auto' ? Number(debtTarget) : null;
      await customersAPI.recordDebtPayment(id, {
        amount: parsed,
        payment_method: 'cash',
        vault_id: debtVaultId || null,
        sale_id: saleId && !Number.isNaN(saleId) ? saleId : null,
        notes: debtNotes.trim() || undefined,
      });
      setDebtConfirmOpen(false);
      setDebtOpen(false);
      setDebtAmount('');
      setDebtNotes('');
      refreshRef.current?.();
      void loadPayments();
    } catch (err) {
      setDebtError(normalizeApiError(err).message);
    } finally {
      setDebtSubmitting(false);
    }
  }, [debtAmount, debtNotes, debtTarget, debtVaultId, id, loadPayments]);

  const submitWalletAction = useCallback(async () => {
    const parsed = Number(walletAmount);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setWalletError('أدخل مبلغاً صحيحاً أكبر من صفر.');
      return;
    }
    setWalletSubmitting(true);
    setWalletError(null);
    try {
      if (!activeBranch?.id) {
        throw new Error('اختر فرعاً قبل تنفيذ عملية محفظة.');
      }
      const shiftResponse = await shiftsAPI.current(activeBranch.id);
      if (!shiftResponse.data) {
        throw new Error('يجب فتح وردية قبل تنفيذ إيداع أو سحب من محفظة العميل.');
      }
      const payload = { amount: parsed, description: walletDescription.trim() || undefined };
      if (walletAction === 'deposit') await walletAPI.deposit(id, payload);
      else await walletAPI.withdraw(id, payload);
      setWalletConfirmOpen(false);
      setWalletAmount('');
      setWalletDescription('');
      await loadWallet();
      refreshRef.current?.();
    } catch (err) {
      setWalletError(normalizeApiError(err).message);
    } finally {
      setWalletSubmitting(false);
    }
  }, [activeBranch?.id, id, loadWallet, walletAction, walletAmount, walletDescription]);

  if (!hasValidId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف العميل مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }

  return (
    <>
      <DetailScreen<Customer & Record<string, unknown>>
        title={route.params?.name || 'تفاصيل العميل'}
        onBack={navigation.goBack}
        loader={() => customersAPI.getById(id)}
        fields={[
          { label: 'الاسم', value: (item) => item.name },
          { label: 'الهاتف', value: (item) => item.phone ?? item.primary_phone, ltr: true },
          { label: 'البريد', value: (item) => item.email, ltr: true },
          { label: 'رصيد المحفظة', value: (item) => money(item.wallet_balance ?? item.balance ?? 0) },
          { label: 'الدين', value: (item) => money(item.debt ?? 0) },
          { label: 'حد الائتمان', value: (item) => item.credit_limit != null && item.credit_limit !== '' ? money(item.credit_limit) : '—' },
          { label: 'النقاط', value: (item) => String(item.points_balance ?? 0) },
        ]}
      >
        {(item, actions) => (
          <>
            <AppCard>
              <AppSectionHeader title="إجراءات العميل" />
              <View style={styles.actions}>
                <AppButton title="تعديل" variant="secondary" onPress={() => openEdit(item, actions.refresh)} />
                <AppButton title="المحفظة" onPress={() => openWallet(actions.refresh)} />
                <AppButton
                  title="تحصيل دين"
                  variant="outline"
                  disabled={!(Number(item.debt) > 0)}
                  onPress={() => void openDebtCollection(item, actions.refresh)}
                />
              </View>
            </AppCard>
            <AppCard>
              <AppSectionHeader title="العناوين" />
              {(item.addresses ?? []).length === 0 ? <Text style={{ ...textStart }}>لا توجد عناوين</Text> : item.addresses?.map((address) => (
                <Text key={address.id} style={{ ...textStart }}>
                  {address.label ? `${address.label}: ` : ''}{address.address_line_1 ?? ''} {address.area ?? ''} {address.city ?? ''}
                </Text>
              ))}
            </AppCard>
            <AppCard>
              <AppSectionHeader title="سجل الديون والرصيد" />
              {paymentsLoading ? <Text style={styles.note}>جاري التحميل...</Text> : null}
              {!paymentsLoading && paymentRows.length === 0 ? <Text style={styles.note}>لا توجد حركات مسجلة.</Text> : null}
              {!paymentsLoading && paymentRows.slice(0, 25).map((row) => (
                <AppListItem
                  key={String(row.id)}
                  title={paymentEntryLabel(row.entry_type)}
                  subtitle={dateText(row.payment_date ?? row.created_at)}
                  meta={`${money(row.amount)}${row.invoice_number ? ` • ${row.invoice_number}` : ''}${row.vault_name ? ` • ${row.vault_name}` : ''}`}
                />
              ))}
            </AppCard>
          </>
        )}
      </DetailScreen>

      <AppBottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title="تعديل العميل">
        <View style={{ gap: spacing.md }}>
          <AppInput label="الاسم" value={editForm.name} onChangeText={(value) => setEditForm((f) => ({ ...f, name: value }))} />
          <AppInput label="الهاتف" value={editForm.phone} onChangeText={(value) => setEditForm((f) => ({ ...f, phone: value }))} keyboardType="phone-pad" />
          <AppInput label="البريد" value={editForm.email} onChangeText={(value) => setEditForm((f) => ({ ...f, email: value }))} keyboardType="email-address" />
          <AppInput label="حد الائتمان" value={editForm.credit_limit} onChangeText={(value) => setEditForm((f) => ({ ...f, credit_limit: value }))} keyboardType="decimal-pad" placeholder="اختياري" />
          {editError ? <AppErrorState message={editError} /> : null}
          <AppButton title="حفظ التعديل" onPress={() => void saveEdit()} loading={editSaving} />
        </View>
      </AppBottomSheet>

      <AppBottomSheet visible={walletOpen} onClose={() => setWalletOpen(false)} title="محفظة العميل">
        <View style={{ gap: spacing.md }}>
          <AppCard variant="flat" elevated={false}>
            <AppSectionHeader title="رصيد المحفظة" />
            <Text style={styles.walletBalance}>{money(walletBalance)}</Text>
          </AppCard>
          {walletError ? <AppErrorState message={walletError} onRetry={() => void loadWallet()} /> : null}
          <View style={styles.actions}>
            <AppButton title="إيداع" variant={walletAction === 'deposit' ? 'primary' : 'outline'} onPress={() => setWalletAction('deposit')} />
            <AppButton title="سحب" variant={walletAction === 'withdraw' ? 'danger' : 'outline'} onPress={() => setWalletAction('withdraw')} />
          </View>
          <AppInput label="المبلغ" value={walletAmount} onChangeText={setWalletAmount} keyboardType="decimal-pad" />
          <AppInput label="الوصف" value={walletDescription} onChangeText={setWalletDescription} />
          <AppButton
            title={walletAction === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
            variant={walletAction === 'deposit' ? 'primary' : 'danger'}
            onPress={() => setWalletConfirmOpen(true)}
            disabled={!Number(walletAmount) || Number(walletAmount) <= 0 || walletLoading}
          />
          <AppCard>
            <AppSectionHeader title="آخر عمليات المحفظة" />
            {walletTransactions.length === 0 ? <Text style={styles.note}>{walletLoading ? 'جاري التحميل...' : 'لا توجد عمليات'}</Text> : walletTransactions.map((tx) => (
              <AppListItem
                key={String(tx.id)}
                title={walletTypeLabel(tx.type)}
                subtitle={dateText(tx.created_at)}
                meta={`${money(tx.amount ?? 0)} • الرصيد بعد: ${money(tx.balance_after ?? 0)}`}
                badge={<AppBadge label={walletTypeLabel(tx.type)} tone={tx.type === 'deposit' || tx.type === 'refund' ? 'success' : 'warning'} />}
              />
            ))}
          </AppCard>
        </View>
      </AppBottomSheet>

      <AppBottomSheet visible={debtOpen} onClose={() => setDebtOpen(false)} title="تحصيل دين العميل">
        <View style={{ gap: spacing.md }}>
          <AppInput label="المبلغ" value={debtAmount} onChangeText={setDebtAmount} keyboardType="decimal-pad" />
          {(debtLayawayCount > 0 || debtCreditSales.length > 0) ? (
            <Text style={styles.note}>يُوزَّع المبلغ أولاً على خطط التقسيط النشطة ثم فواتير الآجل المفتوحة.</Text>
          ) : null}
          <View style={styles.actions}>
            <AppButton title="توزيع تلقائي" size="sm" variant={debtTarget === 'auto' ? 'primary' : 'outline'} onPress={() => setDebtTarget('auto')} />
            {debtCreditSales.map((sale) => (
              <AppButton
                key={sale.id}
                title={`${sale.invoice_number || `#${sale.id}`} (${money(sale.remaining)})`}
                size="sm"
                variant={debtTarget === String(sale.id) ? 'primary' : 'outline'}
                onPress={() => setDebtTarget(String(sale.id))}
              />
            ))}
          </View>
          {debtVaults.length > 0 ? (
            <View style={styles.actions}>
              {debtVaults.map((vault) => (
                <AppButton
                  key={vault.id}
                  title={vault.name}
                  size="sm"
                  variant={debtVaultId === vault.id ? 'primary' : 'outline'}
                  onPress={() => setDebtVaultId(vault.id)}
                />
              ))}
            </View>
          ) : null}
          <AppInput label="ملاحظات" value={debtNotes} onChangeText={setDebtNotes} />
          {debtError ? <AppErrorState message={debtError} /> : null}
          <AppButton title="تأكيد التحصيل" onPress={() => setDebtConfirmOpen(true)} disabled={!Number(debtAmount) || Number(debtAmount) <= 0} />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={debtConfirmOpen}
        title="تأكيد تحصيل الدين"
        message={`سيتم تحصيل ${money(debtAmount)} وتسجيلها في الخزينة المحددة.`}
        confirmLabel="تحصيل"
        loading={debtSubmitting}
        variant="primary"
        onConfirm={() => void submitDebtCollection()}
        onCancel={() => setDebtConfirmOpen(false)}
      />

      <ConfirmDialog
        visible={walletConfirmOpen}
        title={walletAction === 'deposit' ? 'تأكيد إيداع المحفظة' : 'تأكيد سحب المحفظة'}
        message={`${walletAction === 'deposit' ? 'سيتم إيداع' : 'سيتم سحب'} ${money(walletAmount)}. يتطلب ذلك وردية مفتوحة في الفرع الحالي.`}
        confirmLabel="تأكيد"
        loading={walletSubmitting}
        variant={walletAction === 'withdraw' ? 'danger' : 'primary'}
        onConfirm={() => void submitWalletAction()}
        onCancel={() => setWalletConfirmOpen(false)}
      />
    </>
  );
}

function createStyles() {
  return StyleSheet.create({
    actions: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
    note: { ...textStart, fontSize: typography.small, fontFamily: fonts.medium },
    walletBalance: { ...textStart, fontSize: typography.h1, fontFamily: fonts.extraBold, fontWeight: '900' },
  });
}
