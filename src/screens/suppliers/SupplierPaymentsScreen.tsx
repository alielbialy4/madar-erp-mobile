import React, { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { supplierPaymentsAPI } from '@/api/supplierPayments';
import { suppliersAPI } from '@/api/suppliers';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppChip, AppDatePicker, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { MadarSection, MadarSurface, MetricBlock } from '@/components/madar';
import { AppBanner, useToast } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { asText, dateText, money } from '@/utils/format';
import { canCreateSupplierPayment, canReverseSupplierPayment } from '@/utils/supplierPaymentPermissions';
import {
  completeIdempotencyAttempt,
  idempotencyKeyForAttempt,
  resolveIdempotencyAttemptAfterError,
} from '@/utils/idempotencyAttempt';
import {
  buildSupplierPaymentCreatePayload,
  buildSupplierPaymentReversePayload,
  isReversibleSupplierPayment,
} from '@/utils/supplierPaymentPayload';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';

type SupplierPaymentRow = Record<string, unknown> & {
  id?: string | number;
  amount?: string | number | null;
  payment_method?: string | null;
  payment_type?: string | null;
  status?: string | null;
  is_reversed?: boolean | null;
  supplier?: { id?: number; name?: string | null } | null;
  purchase?: { id?: number | string; invoice_number?: string | null } | null;
  vault?: { name?: string | null } | null;
  creator?: { name?: string | null } | null;
  payment_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  notes?: string | null;
};

function paymentLabel(row: SupplierPaymentRow) {
  const type = row.payment_type;
  if (type === 'credit_allocation') return 'رصيد دائن';
  if (type === 'balance_settlement') return 'تسوية رصيد';
  const method = row.payment_method;
  if (method === 'cash') return 'نقدي';
  if (method === 'bank_transfer') return 'تحويل بنكي';
  if (method === 'card') return 'بطاقة';
  return method || type || 'دفعة';
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

export function SupplierPaymentsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const toast = useToast();
  const styles = useMemo(() => createStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const branchId = useBranchStore((s) => s.activeBranch?.id);
  const canPay = canCreateSupplierPayment(user);
  const canReverse = canReverseSupplierPayment(user);

  const [methodFilter, setMethodFilter] = useState('');
  const listParams = useMemo(
    () => ({
      per_page: 20,
      ...(methodFilter ? { payment_method: methodFilter } : {}),
    }),
    [methodFilter],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<SupplierPaymentRow>(
    supplierPaymentsAPI.getAll,
    listParams,
  );

  const [createOpen, setCreateOpen] = useState(false);
  const [suppliers, setSuppliers] = useState<{ id: number; name: string }[]>([]);
  const [paymentSources, setPaymentSources] = useState<PaymentSource[]>([]);
  const [supplierId, setSupplierId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(todayIsoDate());
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const createIdempotencyRef = useRef<{ current: string | null }>({ current: null });

  const [reverseTarget, setReverseTarget] = useState<SupplierPaymentRow | null>(null);
  const [reverseReason, setReverseReason] = useState('');
  const [reverseConfirm, setReverseConfirm] = useState(false);
  const [reverseError, setReverseError] = useState<string | null>(null);
  const reverseIdempotencyRef = useRef<{ current: string | null }>({ current: null });

  const summary = useMemo(() => {
    const nonCashTypes = new Set(['credit_allocation', 'balance_settlement']);
    return items.reduce<{ cash: number; credit: number; settlements: number }>(
      (acc, row) => {
        const value = Number(row.amount ?? 0);
        if (row.payment_type === 'credit_allocation') acc.credit += value;
        else if (row.payment_type === 'balance_settlement') acc.settlements += value;
        else if (!nonCashTypes.has(String(row.payment_type ?? ''))) acc.cash += value;
        return acc;
      },
      { cash: 0, credit: 0, settlements: 0 },
    );
  }, [items]);

  const loadCreateOptions = useCallback(async () => {
    try {
      const [supRes, srcRes] = await Promise.all([
        suppliersAPI.getAll({ per_page: 200 }),
        financialAccountsAPI.paymentSources({
          operation: 'supplier_payment',
          branch_id: branchId ?? undefined,
          include_unavailable: true,
        }),
      ]);
      setSuppliers(
        extractArray<{ id: number; name: string }>(supRes).map((s) => ({
          id: Number(s.id),
          name: String(s.name ?? s.id),
        })),
      );
      const sources = extractArray<PaymentSource>(srcRes);
      setPaymentSources(sources);
      setAccountId((prev) => prev || (sources[0]?.id ? String(sources[0].id) : ''));
    } catch {
      setSuppliers([]);
      setPaymentSources([]);
    }
  }, [branchId]);

  const openCreate = useCallback(() => {
    setCreateOpen(true);
    setAmount('');
    setPaymentDate(todayIsoDate());
    setReferenceNo('');
    setNotes('');
    setCreateError(null);
    createIdempotencyRef.current.current = null;
    void loadCreateOptions();
  }, [loadCreateOptions]);

  const submitCreate = async () => {
    const source = paymentSources.find((s) => String(s.id) === accountId);
    const built = buildSupplierPaymentCreatePayload({
      supplierId,
      amount,
      paymentDate,
      financialAccountId: accountId,
      linkedVaultId: source?.linked_vault_id,
      paymentMethod: source?.payment_method,
      referenceNo,
      notes,
      clientUuid: idempotencyKeyForAttempt(createIdempotencyRef.current),
    });
    if (!built.ok) {
      const messages = {
        missing_supplier: 'اختر المورد',
        invalid_amount: 'أدخل مبلغاً موجباً',
        missing_account: 'اختر حساب الدفع',
        missing_date: 'اختر تاريخ الدفع',
      } as const;
      setCreateError(messages[built.error]);
      return;
    }
    setBusy(true);
    setCreateError(null);
    try {
      await supplierPaymentsAPI.create(built.payload);
      completeIdempotencyAttempt(createIdempotencyRef.current);
      toast.success('تم تسجيل دفعة المورد');
      setCreateOpen(false);
      await refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      resolveIdempotencyAttemptAfterError(createIdempotencyRef.current, normalized);
      setCreateError(normalized.message);
      toast.error(normalized.message);
    } finally {
      setBusy(false);
    }
  };

  const submitReverse = async () => {
    if (!reverseTarget?.id) return;
    const built = buildSupplierPaymentReversePayload({
      reason: reverseReason,
      clientUuid: idempotencyKeyForAttempt(reverseIdempotencyRef.current),
    });
    if (!built.ok) {
      setReverseError('سبب العكس مطلوب (٣ أحرف على الأقل)');
      return;
    }
    if (!reverseConfirm) {
      setReverseConfirm(true);
      return;
    }
    setBusy(true);
    setReverseError(null);
    try {
      await supplierPaymentsAPI.reverse(String(reverseTarget.id), built.payload);
      completeIdempotencyAttempt(reverseIdempotencyRef.current);
      toast.success('تم عكس الدفعة');
      setReverseTarget(null);
      setReverseConfirm(false);
      setReverseReason('');
      await refresh();
    } catch (err) {
      const normalized = normalizeApiError(err);
      resolveIdempotencyAttemptAfterError(reverseIdempotencyRef.current, normalized);
      setReverseError(normalized.message);
      toast.error(normalized.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen
      title="دفعات الموردين"
      subtitle="سندات الدفع والتسويات والعكس"
      scroll={false}
      onBack={navigation.goBack}
      headerRight={
        <View style={{ ...flexRow, gap: spacing.xs }}>
          {canPay ? <AppButton title="دفعة جديدة" onPress={openCreate} /> : null}
          <AppButton title="الموردون" variant="secondary" onPress={() => navigation.navigate('Suppliers')} />
        </View>
      }
    >
      <View style={styles.stats}>
        <MetricBlock label="دفع من الخزنة" value={money(summary.cash)} level="B" tone="positive" style={styles.stat} />
        <MetricBlock label="رصيد دائن" value={money(summary.credit)} level="B" tone="info" style={styles.stat} />
        <MetricBlock label="تسويات" value={money(summary.settlements)} level="B" tone="warning" style={styles.stat} />
      </View>

      <View style={styles.filters}>
        {[
          { label: 'الكل', value: '' },
          { label: 'نقدي', value: 'cash' },
          { label: 'تحويل', value: 'bank_transfer' },
          { label: 'بطاقة', value: 'card' },
        ].map((opt) => (
          <AppChip
            key={opt.value || 'all'}
            label={opt.label}
            active={methodFilter === opt.value}
            onPress={() => setMethodFilter(opt.value)}
          />
        ))}
      </View>

      <MadarSection title="إجراء مالي">
        <MadarSurface>
          <Text style={styles.meta}>
            إنشاء دفعة عامة من هذه الشاشة يطابق نموذج الويب (حساب مالي + client_uuid). التسوية المختلطة وتخصيص الرصيد الدائن تبقى من ملف المورد/الفاتورة.
          </Text>
          {canPay ? (
            <AppButton title="إنشاء دفعة مورد" onPress={openCreate} style={{ marginTop: spacing.sm }} />
          ) : null}
        </MadarSurface>
      </MadarSection>

      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد دفعات موردين"
        emptyCtaLabel={canPay ? 'دفعة جديدة' : undefined}
        onEmptyCta={canPay ? openCreate : undefined}
        keyExtractor={(item, index) => `${asText(item.id, 'row')}-${index}`}
        renderItem={({ item }) => {
          const reversed = !isReversibleSupplierPayment(item);
          return (
            <MadarSurface style={styles.card}>
              <View style={styles.cardTop}>
                <AppBadge
                  label={reversed ? 'معكوسة' : paymentLabel(item)}
                  tone={reversed ? 'danger' : item.payment_type === 'balance_settlement' ? 'warning' : 'info'}
                />
                <Text style={styles.amount}>{money(item.amount ?? 0)}</Text>
              </View>
              <Text style={styles.title}>{item.supplier?.name ?? 'مورد غير محدد'}</Text>
              <Text style={styles.meta}>
                {item.purchase ? `فاتورة #${item.purchase.invoice_number ?? item.purchase.id}` : 'على الحساب'}
                {' • '}
                {item.vault?.name ?? 'بدون خزنة'}
              </Text>
              <Text style={styles.meta}>
                {dateText(item.payment_date ?? item.paid_at ?? item.created_at)} • بواسطة {item.creator?.name ?? '—'}
              </Text>
              {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
              {canReverse && !reversed ? (
                <AppButton
                  title="عكس الدفعة"
                  variant="outline"
                  size="sm"
                  onPress={() => {
                    reverseIdempotencyRef.current.current = null;
                    setReverseReason('');
                    setReverseConfirm(false);
                    setReverseError(null);
                    setReverseTarget(item);
                  }}
                />
              ) : null}
            </MadarSurface>
          );
        }}
      />

      <AppBottomSheet visible={createOpen} onClose={() => !busy && setCreateOpen(false)} title="دفعة مورد جديدة">
        <View style={{ gap: spacing.md }}>
          <AppSelect
            label="المورد"
            value={supplierId}
            options={suppliers.map((s) => ({ label: s.name, value: String(s.id) }))}
            onChange={setSupplierId}
          />
          <AppSelect
            label="حساب الدفع"
            value={accountId}
            options={paymentSources.map((s) => ({
              label: [s.name, s.provider_name, s.masked_identifier].filter(Boolean).join(' - ') || s.id,
              value: String(s.id),
            }))}
            onChange={setAccountId}
          />
          <AppInput label="المبلغ" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
          <AppDatePicker label="تاريخ الدفع" value={paymentDate} onChange={setPaymentDate} />
          <AppInput label="المرجع" value={referenceNo} onChangeText={setReferenceNo} />
          <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} />
          {createError ? <AppBanner tone="danger" message={createError} /> : null}
          <AppButton title="حفظ الدفعة" loading={busy} onPress={() => void submitCreate()} />
        </View>
      </AppBottomSheet>

      <AppBottomSheet
        visible={Boolean(reverseTarget)}
        onClose={() => {
          if (busy) return;
          setReverseTarget(null);
          setReverseConfirm(false);
        }}
        title="عكس دفعة المورد"
      >
        <View style={{ gap: spacing.md }}>
          <Text style={styles.meta}>
            {reverseTarget?.supplier?.name ?? 'مورد'} · {money(reverseTarget?.amount ?? 0)}
          </Text>
          <AppInput label="سبب العكس" value={reverseReason} onChangeText={setReverseReason} multiline />
          {reverseError ? <AppBanner tone="danger" message={reverseError} /> : null}
          <AppButton
            title={reverseConfirm ? 'تأكيد العكس نهائياً' : 'متابعة'}
            variant={reverseConfirm ? 'danger' : 'primary'}
            loading={busy}
            onPress={() => void submitReverse()}
          />
        </View>
      </AppBottomSheet>

    </AppScreen>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    stats: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    filters: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.xs,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.sm,
    },
    stat: { flex: 1, minWidth: 130 },
    card: { gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
    cardTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    title: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
    meta: { ...textStart, color: c.textMuted, fontSize: typography.small },
    notes: { ...textStart, color: c.textCaption, fontSize: typography.tiny },
    amount: { color: c.success, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
  });
}
