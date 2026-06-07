import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { suppliersAPI } from '@/api/suppliers';
import { supplierPaymentsAPI } from '@/api/supplierPayments';
import { purchasesAPI } from '@/api/purchases';
import { vaultsAPI } from '@/api/vaults';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppListItem, AppSectionHeader, AppSelect, AppStatCard } from '@/components/ui';
import { AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money, dateText, asText } from '@/utils/format';
import { getCurrentBalanceInterpretation } from '@/utils/supplierBalanceLabels';
import { supplierVoucherTypeLabel } from '@/utils/supplierPaymentLabels';
import { parsePositiveMoneyInput, purchaseRemainingAmount } from '@/utils/supplierPurchaseFinancials';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { FormError } from '@/components/forms';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { statusTone } from '@/utils/statusTone';
import { AppBadge } from '@/components/ui';

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
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [availableCredit, setAvailableCredit] = useState(0);
  const [settleableBalance, setSettleableBalance] = useState(0);

  const vaultsResource = useAsyncResource(() => vaultsAPI.list({ active_only: true }));
  const vaultOptions = extractArray<Record<string, unknown>>(vaultsResource.data).map((v) => ({
    label: String(v.name ?? ''),
    value: String(v.id),
  }));

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
    setVaultId(null);

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
      if (sheetMode === 'vault') {
        if (!vaultId) {
          setSheetError('اختر الخزنة');
          return;
        }
        await supplierPaymentsAPI.create({
          supplier_id: id,
          purchase_id: selectedPurchase?.id ? Number(selectedPurchase.id) : null,
          vault_id: vaultId,
          amount: num,
          payment_date: new Date().toISOString().split('T')[0],
          notes: notes || undefined,
        });
      } else if (sheetMode === 'purchase_pay' && selectedPurchase?.id) {
        await purchasesAPI.addPayment(Number(selectedPurchase.id), {
          amount: num,
          payment_date: new Date().toISOString().split('T')[0],
          notes: notes || undefined,
          vault_id: vaultId ?? undefined,
        });
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
      Alert.alert('تم', 'تمت العملية بنجاح');
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
          <View style={{ flex: 1, minWidth: 140 }}>
            <AppStatCard label="إجمالي المشتريات" value={money(summary?.total_purchases ?? 0)} />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <AppStatCard label="سندات الصرف" value={money(summary?.total_payments ?? 0)} tone="success" />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <AppStatCard label="التسويات" value={money(summary?.total_credit_allocations ?? 0)} tone="info" />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <AppStatCard label="الرصيد الحالي" value={money(currentBalance)} hint={balanceInfo.label_ar} />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <AppStatCard label="رصيد دائن متاح" value={money(summary?.available_credit ?? 0)} tone="info" />
          </View>
          <View style={{ flex: 1, minWidth: 140 }}>
            <AppStatCard label="عدد الفواتير" value={String(summary?.purchases_count ?? 0)} />
          </View>
        </View>

        {canPay ? (
          <AppCard>
            <AppSectionHeader title="إجراءات" />
            <AppButton title="دفع من الخزنة" onPress={() => void openSheet('vault')} />
            <AppButton title="كشف حساب" variant="secondary" onPress={() => navigation.navigate('SupplierStatement', { id, name: supplier?.name ?? name })} />
          </AppCard>
        ) : null}

        <AppCard>
          <AppSectionHeader title="فواتير الشراء" />
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
        </AppCard>

        <AppCard>
          <AppSectionHeader title="سجل المدفوعات" />
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
        </AppCard>
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
            <AppSelect label="الخزنة" value={vaultId} options={vaultOptions} onChange={setVaultId} />
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
