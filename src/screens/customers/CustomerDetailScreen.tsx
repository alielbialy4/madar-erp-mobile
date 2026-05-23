import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { textStart, flexRow } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { customersAPI } from '@/api/customers';
import { walletAPI, type WalletTransaction } from '@/api/wallet';
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
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '' });
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
      await customersAPI.update(id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        email: editForm.email.trim() || undefined,
      });
      setEditOpen(false);
      refreshRef.current?.();
    } catch (err) {
      setEditError(normalizeApiError(err).message);
    } finally {
      setEditSaving(false);
    }
  }, [editForm.email, editForm.name, editForm.phone, id]);

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
              <AppSectionHeader title="حالة التوافق" />
              <Text style={styles.note}>
                تمت إضافة تعديل العميل ومحفظته. تبقى إدارة أرقام إضافية وعناوين متقدمة/مناطق التوصيل كتفاصيل ويب أوسع لحين شاشة نموذج مخصصة.
              </Text>
            </AppCard>
          </>
        )}
      </DetailScreen>

      <AppBottomSheet visible={editOpen} onClose={() => setEditOpen(false)} title="تعديل العميل">
        <View style={{ gap: spacing.md }}>
          <AppInput label="الاسم" value={editForm.name} onChangeText={(value) => setEditForm((f) => ({ ...f, name: value }))} />
          <AppInput label="الهاتف" value={editForm.phone} onChangeText={(value) => setEditForm((f) => ({ ...f, phone: value }))} keyboardType="phone-pad" />
          <AppInput label="البريد" value={editForm.email} onChangeText={(value) => setEditForm((f) => ({ ...f, email: value }))} keyboardType="email-address" />
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
