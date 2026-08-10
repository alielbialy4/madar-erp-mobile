import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, View } from 'react-native';import { suppliersAPI } from '@/api/suppliers';
import { supplierPaymentsAPI } from '@/api/supplierPayments';
import { purchasesAPI } from '@/api/purchases';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppInput, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
import { MadarSection, MadarSurface, MetricBlock, QuickActionBar } from '@/components/madar';
import { AppErrorState, AppLoadingState, ConfirmDialog, useToast } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money, dateText, asText } from '@/utils/format';
import { getCurrentBalanceInterpretation } from '@/utils/supplierBalanceLabels';
import { supplierVoucherTypeLabel } from '@/utils/supplierPaymentLabels';
import { parsePositiveMoneyInput, purchaseRemainingAmount } from '@/utils/supplierPurchaseFinancials';
import { FormError } from '@/components/forms';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { statusTone } from '@/utils/statusTone';

type SheetMode = 'vault' | 'purchase_pay' | 'credit' | 'balance' | null;

export function SupplierReportScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawId = route.params?.id;
  if (!rawId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف المورد مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <SupplierReport id={Number(rawId)} name={route.params?.name} navigation={navigation} />;
}

function SupplierReport({ id, name, navigation }: { id: number; name?: string; navigation: any }) {
  const toast = useToast();
  const user = useAuthStore((s) => s.user);
  const canPay = hasPermission(user, 'manage_supplier_payments');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [supplier, setSupplier] = useState<Record<string, unknown> | null>(null);
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null);
  const [purchases, setPurchases] = useState<Record<string, unknown>[]>([]);
  const [payments, setPayments] = useState<Record<string, unknown>[]>([]);

  const [sheetMode, setSheetMode] = useState<SheetMode>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Record<string, unknown> | null>(null);
  const [amount, setAmount] = useState('');
  const [paymentAccountId, setPaymentAccountId] = useState<string | null>(null);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [availableCredit, setAvailableCredit] = useState(0);
  const [settleableBalance, setSettleableBalance] = useState(0);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suppliersAPI.report(id, { per_page: 50, payments_per_page: 50 });
      const data = (extractData(res) ?? res) as Record<string, unknown>;
      setSupplier((data.supplier as Record<string, unknown>) ?? null);
      setSummary((data.summary as Record<string, unknown>) ?? null);
      setPurchases(Array.isArray(data.purchases) ? (data.purchases as Record<string, unknown>[]) : []);
      setPayments(Array.isArray(data.payments) ? (data.payments as Record<string, unknown>[]) : []);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const currentBalance = Number(summary?.current_balance ?? summary?.total_balance ?? 0);

  const openSheet = async (mode: SheetMode, purchase?: Record<string, unknown>) => {
    setSheetMode(mode);
    setSelectedPurchase(purchase ?? null);
    setSheetError(null);
    setNotes('');
    const remaining = purchase ? purchaseRemainingAmount(purchase) : null;
    setAmount(remaining && remaining > 0 ? String(remaining.toFixed(2)) : '');
    setPaymentAccountId(null);
    setPaymentSources([]);

    if (mode === 'vault' || mode === 'purchase_pay') {
      try {
        const branchId = purchase?.branch_id ? String(purchase.branch_id) : undefined;
        const response = await financialAccountsAPI.paymentSources({
          operation: mode === 'purchase_pay' ? 'purchase_payment' : 'supplier_payment',
          ...(branchId ? { branch_id: branchId } : {}),
          include_unavailable: true,
        });
        const rows = (response.data ?? []).filter((source) => source.is_available !== false);
        setPaymentSources(rows);
        if (rows[0]?.id) setPaymentAccountId(String(rows.find((source) => source.is_default)?.id ?? rows[0].id));
      } catch {
        setPaymentSources([]);
      }
    }

    if (mode === 'credit' || mode === 'balance') {
      try {
        const branchId = purchase?.branch_id ? String(purchase.branch_id) : undefined;
        if (mode === 'credit') {
          const res = await supplierPaymentsAPI.getAvailableCredit(id, branchId ? { branch_id: branchId } : undefined);
          const row = extractData(res) as Record<string, unknown> | undefined;
          setAvailableCredit(Number(row?.available_credit ?? 0));
        } else {
          const res = await supplierPaymentsAPI.getSettleableBalance(id, {
            ...(branchId ? { branch_id: branchId } : {}),
            ...(purchase?.id ? { purchase_id: Number(purchase.id) } : {}),
          });
          const row = extractData(res) as Record<string, unknown> | undefined;
          setSettleableBalance(Number(row?.settleable_balance ?? row?.amount ?? currentBalance));
        }
      } catch {
        setAvailableCredit(Number(summary?.available_credit ?? 0));
        setSettleableBalance(Math.max(0, currentBalance));
      }
    }
  };

  const submitSheet = async () => {
    const num = parsePositiveMoneyInput(amount);
    if (num == null) {
      setSheetError('أدخل مبلغاً موجباً صحيحاً');
      return;
    }
    setSubmitting(true);
    setSheetError(null);
    try {
      if (sheetMode === 'vault' || sheetMode === 'purchase_pay') {
        if (!paymentAccountId) {
          setSheetError('اختر حساب الدفع');
          setSubmitting(false);
          return;
        }
        const paymentSource = paymentSources.find((source) => String(source.id) === paymentAccountId);
        if (sheetMode === 'vault') {
          await supplierPaymentsAPI.create({
            supplier_id: id,
            purchase_id: selectedPurchase?.id ? Number(selectedPurchase.id) : null,
            financial_account_id: paymentAccountId,
            vault_id: paymentSource?.payment_method === 'cash' ? paymentSource.linked_vault_id ?? undefined : undefined,
            amount: num,
            payment_date: new Date().toISOString().split('T')[0],
            notes: notes || undefined,
          });
        } else if (selectedPurchase?.id) {
          await purchasesAPI.addPayment(Number(selectedPurchase.id), {
            amount: num,
            payment_date: new Date().toISOString().split('T')[0],
            notes: notes || undefined,
            financial_account_id: paymentAccountId,
            vault_id: paymentSource?.payment_method === 'cash' ? paymentSource.linked_vault_id ?? undefined : undefined,
          });
        }
      } else if (sheetMode === 'credit' && selectedPurchase?.id) {
        await supplierPaymentsAPI.applyPurchaseCredit(Number(selectedPurchase.id), {
          amount: num,
          allocated_at: new Date().toISOString().split('T')[0],
          notes: notes || undefined,
        });
      } else if (sheetMode === 'balance' && selectedPurchase?.id) {
        await supplierPaymentsAPI.applyPurchaseBalanceSettlement(Number(selectedPurchase.id), {
          supplier_id: id,
          purchase_id: Number(selectedPurchase.id),
          balance_settlement_amount: num,
          settled_at: new Date().toISOString().split('T')[0],
          notes: notes || undefined,
        });
      }
      setSheetMode(null);
      setConfirmOpen(false);
      toast.success('تمت العملية بنجاح');
      await loadReport();
    } catch (err) {
      setSheetError(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const balanceInfo = getCurrentBalanceInterpretation(
    currentBalance,
    summary?.current_balance_interpretation as never,
  );

  const sheetTitle = useMemo(() => {
    if (sheetMode === 'vault') return selectedPurchase ? 'دفع من الخزنة — فاتورة' : 'دفع من الخزنة';
    if (sheetMode === 'purchase_pay') return 'سداد فاتورة شراء';
    if (sheetMode === 'credit') return 'استخدام رصيد دائن';
    if (sheetMode === 'balance') return 'تسوية رصيد المورد';
    return '';
  }, [sheetMode, selectedPurchase]);

  if (loading && !supplier) {
    return (
      <AppScreen title="تقرير المورد" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }

  if (error && !supplier) {
    return (
      <AppScreen title="تقرير المورد" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={() => void loadReport()} />
      </AppScreen>
    );
  }

  return (
    <AppScreen
      title="تقرير المورد"
      subtitle={asText(supplier?.name ?? name, 'مورد')}
      onBack={navigation.goBack}
      onRefresh={() => void loadReport()}
      refreshing={loading}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.md }}>
          <MetricBlock label="إجمالي المشتريات" value={money(summary?.total_purchases ?? 0)} level="B" style={{ flex: 1, minWidth: 140 }} />
          <MetricBlock label="سندات الصرف" value={money(summary?.total_payments ?? 0)} level="B" tone="positive" style={{ flex: 1, minWidth: 140 }} />
          <MetricBlock label="التسويات" value={money(summary?.total_credit_allocations ?? 0)} level="B" tone="info" style={{ flex: 1, minWidth: 140 }} />
          <MetricBlock label="الرصيد الحالي" value={money(currentBalance)} hint={balanceInfo.label_ar} level="A" style={{ flex: 1, minWidth: 140 }} />
          <MetricBlock label="رصيد دائن متاح" value={money(summary?.available_credit ?? 0)} level="B" tone="info" style={{ flex: 1, minWidth: 140 }} />
          <MetricBlock label="عدد الفواتير" value={String(summary?.purchases_count ?? 0)} level="C" style={{ flex: 1, minWidth: 140 }} />
        </View>

        {canPay ? (
          <QuickActionBar
            actions={[
              { id: 'vault', label: 'دفع من الخزنة', icon: 'account-balance-wallet', onPress: () => void openSheet('vault'), tone: 'accent' },
              {
                id: 'statement',
                label: 'كشف حساب',
                icon: 'document',
                onPress: () => navigation.navigate('SupplierStatement', { id, name: supplier?.name ?? name }),
              },
            ]}
          />
        ) : null}

        <MadarSection title="فواتير الشراء">
          <MadarSurface padded={false}>
          {purchases.length === 0 ? (
            <AppListItem title="لا توجد فواتير شراء" showChevron={false} />
          ) : purchases.map((purchase, index) => {
            const balance = purchaseRemainingAmount(purchase);
            const branchCredit = Number(purchase.supplier_available_credit ?? summary?.available_credit ?? 0);
            const canSettleBalance = balance > 0 && currentBalance > 0.0001;
            const canSettleCredit = balance > 0 && branchCredit > 0.0001;
            return (
              <View key={String(purchase.id ?? index)} style={{ gap: spacing.xs, marginBottom: spacing.md }}>
                <AppListItem
                  title={String(purchase.invoice_number ?? '—')}
                  subtitle={dateText(String(purchase.purchase_date ?? ''))}
                  meta={`إجمالي ${money(purchase.total ?? 0)} • متبقي ${money(balance)}`}
                  badge={
                    <AppBadge
                      label={purchase.status === 'completed' ? 'مدفوعة' : 'غير مدفوعة'}
                      tone={statusTone(purchase.status === 'completed' ? 'paid' : 'unpaid')}
                    />
                  }
                  showChevron={false}
                />
                <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.xs, paddingHorizontal: spacing.lg }}>
                  <AppButton title="تعديل" size="sm" variant="secondary" onPress={() => navigation.navigate('EditPurchase', { id: purchase.id })} />
                  {balance > 0 && canPay ? (
                    <>
                      <AppButton title="دفع" size="sm" onPress={() => void openSheet('vault', purchase)} />
                      {canSettleBalance ? (
                        <AppButton title="تسوية رصيد" size="sm" variant="outline" onPress={() => void openSheet('balance', purchase)} />
                      ) : null}
                      {canSettleCredit ? (
                        <AppButton title="رصيد دائن" size="sm" variant="outline" onPress={() => void openSheet('credit', purchase)} />
                      ) : null}
                    </>
                  ) : null}
                </View>
              </View>
            );
          })}
          </MadarSurface>
        </MadarSection>

        <MadarSection title="سجل المدفوعات">
          <MadarSurface padded={false}>
          {payments.length === 0 ? (
            <AppListItem title="لا توجد مدفوعات مسجلة" showChevron={false} />
          ) : payments.map((payment, index) => (
            <AppListItem
              key={String(payment.id ?? index)}
              title={supplierVoucherTypeLabel(payment)}
              subtitle={dateText(String(payment.payment_date ?? ''))}
              meta={money(payment.amount ?? 0)}
              badge={
                <AppBadge
                  label={String((payment.vault as Record<string, unknown> | undefined)?.name ?? 'بدون خزنة')}
                  tone="default"
                />
              }
              showChevron={false}
            />
          ))}
          </MadarSurface>
        </MadarSection>
      </ScrollView>

      <AppBottomSheet visible={!!sheetMode} onClose={() => setSheetMode(null)}>
        <View style={{ gap: spacing.md }}>
          <AppSectionHeader title={sheetTitle} />
          {selectedPurchase ? (
            <AppInput label="الفاتورة" value={String(selectedPurchase.invoice_number ?? '')} editable={false} />
          ) : null}
          {sheetMode === 'credit' ? (
            <AppInput label="الرصيد الدائن المتاح" value={money(availableCredit)} editable={false} />
          ) : null}
          {sheetMode === 'balance' ? (
            <AppInput label="الرصيد القابل للتسوية" value={money(settleableBalance)} editable={false} />
          ) : null}
          <AppInput label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" required />
          {(sheetMode === 'vault' || sheetMode === 'purchase_pay') ? (
            <AppSelect
              label="حساب الدفع"
              value={paymentAccountId}
              options={paymentSources.map((source) => ({
                label: [source.name, source.provider_name, source.masked_identifier].filter(Boolean).join(' · '),
                value: String(source.id),
              }))}
              onChange={setPaymentAccountId}
            />
          ) : null}
          <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline numberOfLines={3} />
          <FormError message={sheetError} />
          <AppButton title="تأكيد" onPress={() => setConfirmOpen(true)} loading={submitting} />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmOpen}
        title="تأكيد العملية"
        message={`تنفيذ «${sheetTitle}» بمبلغ ${money(Number(amount) || 0)}؟`}
        confirmLabel="تأكيد"
        variant="primary"
        onConfirm={() => void submitSheet()}
        onCancel={() => setConfirmOpen(false)}
        loading={submitting}
      />
    </AppScreen>
  );
}
