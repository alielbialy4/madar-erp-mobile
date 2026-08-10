import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { textStart } from '@/constants/layout';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { salesAPI } from '@/api/sales';
import { financialAccountsAPI, type PaymentSource } from '@/api/financialAccounts';
import { AppScreen, FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppBanner, ConfirmDialog, AppLoadingState, AppErrorState } from '@/components/feedback';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Sale } from '@/types/api';
import { createUuid } from '@/utils/uuid';
import { printSaleReceiptLocal } from '@/services/pos/posReceiptPrint';
import { useBranchStore } from '@/store/branchStore';

type RefundLine = {
  saleItemId: number;
  quantity: number;
  restock: boolean;
};

export function PartialRefundScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawSaleId = route.params?.saleId;
  if (!rawSaleId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف البيع مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <PartialRefund saleId={Number(rawSaleId)} navigation={navigation} />;
}

function PartialRefund({ saleId, navigation }: { saleId: number; navigation: any }) {
  const c = useColors();
  const branchId = useBranchStore((s) => s.activeBranch?.id);
  const loader = useCallback(() => salesAPI.getById(saleId), [saleId]);
  const { data: sale, loading, error, reload } = useAsyncResource<Sale>(loader);

  const [lines, setLines] = useState<Record<number, RefundLine>>({});
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'wallet' | 'original_account' | 'alternative_account'>('original_account');
  const [cashRefundSource, setCashRefundSource] = useState<'drawer' | 'vault'>('drawer');
  const [refundSources, setRefundSources] = useState<PaymentSource[]>([]);
  const [refundAccountId, setRefundAccountId] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [drawerElectronicConfirmOpen, setDrawerElectronicConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitNotice, setSubmitNotice] = useState<{ message: string; tone: 'danger' | 'success' } | null>(null);
  const submitLockRef = useRef(false);
  const clientUuidRef = useRef<string | null>(null);

  useEffect(() => {
    if (!branchId) return;
    let active = true;
    void financialAccountsAPI
      .paymentSources({ operation: 'refund', branch_id: branchId, include_unavailable: true })
      .then((response) => {
        if (active) setRefundSources(response.data ?? []);
      })
      .catch(() => {
        if (active) setRefundSources([]);
      });
    return () => {
      active = false;
    };
  }, [branchId]);

  const isElectronicSale = ['card', 'electronic_wallet', 'instapay', 'vodafone_cash'].includes(
    String(sale?.payment_type ?? '').toLowerCase(),
  );

  useEffect(() => {
    if (isElectronicSale) setCashRefundSource('vault');
  }, [isElectronicSale]);

  const styles = useMemo(() => StyleSheet.create({
    emptyText: { ...textStart, color: c.textMuted, fontSize: typography.body },
    itemRow: {
      padding: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      gap: spacing.sm,
    },
    itemRowSelected: { borderColor: c.softDangerBorder, backgroundColor: c.softDanger },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemInfo: { flex: 1, gap: 2 },
    itemName: { fontSize: typography.body, fontWeight: '700', color: c.text, ...textStart },
    itemMeta: { fontSize: typography.small, color: c.textMuted, ...textStart },
    itemTotal: { fontSize: typography.body, fontWeight: '800', color: c.text },
    itemDetails: { gap: 2 },
    qtyInfo: { fontSize: typography.tiny, color: c.textMuted, ...textStart },
    itemActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    qtyBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    qtyBtnDisabled: { backgroundColor: c.disabled, opacity: 0.5 },
    qtyBtnText: { color: c.text, fontSize: typography.h3, fontWeight: '900' },
    qtyInput: {
      width: 60,
      height: 40,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      textAlign: 'center',
      fontSize: typography.body,
      fontWeight: '700',
      color: c.text,
      backgroundColor: c.surface,
    },
    restockRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    restockLabel: { fontSize: typography.small, color: c.textMuted, ...textStart },
    sourceHint: { ...textStart, color: c.textMuted, fontSize: typography.small, lineHeight: 21 },
  }), [c]);

  if (loading) return <AppScreen title="استرداد جزئي" onBack={navigation.goBack}><AppLoadingState /></AppScreen>;
  if (error || !sale) return <AppScreen title="استرداد جزئي" onBack={navigation.goBack}><AppErrorState message={error || 'لم يتم العثور على البيع'} onRetry={reload} /></AppScreen>;

  const items = (sale.items ?? []) as Record<string, any>[];
  const hasCustomer = Boolean(sale.customer);

  const getLine = (itemId: number): RefundLine => lines[itemId] ?? { saleItemId: itemId, quantity: 0, restock: true };

  const setQuantity = (itemId: number, qty: number, maxQty: number) => {
    const clamped = Math.max(0, Math.min(qty, maxQty));
    setLines((prev) => ({ ...prev, [itemId]: { ...getLine(itemId), quantity: clamped } }));
  };

  const toggleRestock = (itemId: number) => {
    setLines((prev) => ({ ...prev, [itemId]: { ...getLine(itemId), restock: !getLine(itemId).restock } }));
  };

  const totalRefund = items.reduce((sum, item) => {
    const line = getLine(Number(item.id));
    const unitPrice = Number(item.unit_price ?? 0);
    return sum + line.quantity * unitPrice;
  }, 0);

  const hasItems = items.some((item) => getLine(Number(item.id)).quantity > 0);

  const electronicChannelLabel = (() => {
    const type = String(sale?.payment_type ?? '').toLowerCase();
    if (type === 'instapay') return 'رد عبر إنستا باي';
    if (type === 'electronic_wallet' || type === 'vodafone_cash') return 'رد عبر المحفظة الإلكترونية';
    if (type === 'card') return 'رد عبر البطاقة';
    return 'رد عبر القناة الإلكترونية';
  })();

  const cashSourceOptions = isElectronicSale
    ? [
        { label: 'رد نقدي من درج الوردية', value: 'drawer' },
        { label: electronicChannelLabel, value: 'vault' },
      ]
    : [
        { label: 'من درج الوردية', value: 'drawer' },
        { label: 'من الخزنة', value: 'vault' },
      ];

  const availableRefundSources = refundSources.filter((source) => source.is_available !== false);
  const selectedRefundSource = availableRefundSources.find((source) => source.id === refundAccountId);

  const openSubmitConfirm = () => {
    if ((refundMethod === 'alternative_account' || (refundMethod === 'cash' && cashRefundSource === 'vault')) && !refundAccountId) {
      setSubmitNotice({ message: 'اختر الحساب المالي الذي سيُسجّل عليه رد المبلغ.', tone: 'danger' });
      return;
    }
    if (refundMethod === 'alternative_account' && !reason.trim()) {
      setSubmitNotice({ message: 'سبب استخدام الحساب البديل مطلوب.', tone: 'danger' });
      return;
    }
    if (refundMethod === 'cash' && isElectronicSale && cashRefundSource === 'drawer') {
      setDrawerElectronicConfirmOpen(true);
      return;
    }
    setConfirmOpen(true);
  };

  const methodOptions = [
    { label: 'الحساب الأصلي', value: 'original_account' },
    { label: 'نقدي', value: 'cash' },
    ...(availableRefundSources.length > 0 ? [{ label: 'حساب بديل', value: 'alternative_account' }] : []),
    ...(hasCustomer ? [{ label: 'محفظة العميل', value: 'wallet' }] : []),
  ];

  const submit = async () => {
    if (submitLockRef.current || submitting) return;
    submitLockRef.current = true;
    if (!clientUuidRef.current) {
      clientUuidRef.current = createUuid();
    }
    setSubmitting(true);
    setSubmitNotice(null);
    try {
      const refundItems = items
        .map((item) => {
          const line = getLine(Number(item.id));
          return { sale_item_id: line.saleItemId, quantity: line.quantity, restock: line.restock };
        })
        .filter((i) => i.quantity > 0);

      const response = await salesAPI.partialRefund(saleId, {
        client_uuid: clientUuidRef.current,
        items: refundItems,
        reason: reason || undefined,
        notes: notes || undefined,
        refund_method: refundMethod,
        ...(refundMethod === 'cash' ? { cash_refund_source: cashRefundSource } : {}),
        ...((refundMethod === 'alternative_account' || (refundMethod === 'cash' && cashRefundSource === 'vault')) && refundAccountId
          ? {
              refund_financial_account_id: refundAccountId,
              refund_channel: selectedRefundSource?.payment_method as any,
              alternative_refund_reason: reason.trim() || undefined,
            }
          : {}),
      });
      setSubmitNotice({ message: response.message || 'تم تسجيل الاسترداد الجزئي بنجاح', tone: 'success' });
      setConfirmOpen(false);
      setDrawerElectronicConfirmOpen(false);
      await reload();
      if (branchId) {
        const refundId = Number((response as any)?.data?.id ?? 0) || undefined;
        const printResult = await printSaleReceiptLocal(saleId, branchId, {
          isReprint: true,
          documentTitle: 'مستند مرتجع',
          asRefund: true,
          mode: 'return',
          refundId,
        });
        if (printResult.ok) {
          setSubmitNotice({
            message: `${response.message || 'تم تسجيل الاسترداد الجزئي بنجاح'} — ${printResult.message}`,
            tone: 'success',
          });
        }
      }
    } catch (err) {
      setSubmitNotice({ message: normalizeApiError(err).message, tone: 'danger' });
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <FormScreenLayout
      title="استرداد جزئي"
      onBack={navigation.goBack}
      heroTitle={`فاتورة #${sale.invoice_number ?? saleId}`}
      heroSubtitle={`${sale.customer?.name ?? 'بيع مباشر'} · اختر الكمية التي سيتم ردها`}
      heroAmount={money(totalRefund)}
      footer={
        <AppButton
          title={hasItems ? `مراجعة رد ${money(totalRefund)}` : 'اختر أصنافًا للاسترداد'}
          variant="danger"
          onPress={openSubmitConfirm}
          disabled={!hasItems || submitting}
          loading={submitting}
          fullWidth
        />
      }
    >
      <AppBanner
        tone="warning"
        icon="account-balance"
        message="القيمة المعروضة تقديرية. الخادم يثبت المبلغ النهائي وتوزيع الحسابات عند التنفيذ. إعادة الصنف للمخزون اختيار مستقل لكل سطر."
      />

      <FormSection
        title="الأصناف والكميات"
        subtitle="الحد المتاح يراعي أي مرتجعات سابقة لهذه الفاتورة"
        icon="assignment-return"
      >
        {items.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد أصناف</Text>
        ) : (
          items.map((item, index) => {
            const itemId = Number(item.id);
            const originalQty = Number(item.quantity ?? 0);
            const refundedQty = Number(item.refunded_quantity ?? 0);
            const availableQty = item.remaining_quantity != null
              ? Math.max(0, Number(item.remaining_quantity))
              : originalQty - refundedQty;
            const line = getLine(itemId);
            const unitPrice = Number(item.unit_price ?? 0);
            const productName = String((item.product as any)?.name ?? item.product_name ?? 'صنف');

            return (
              <View key={String(itemId ?? index)} style={[styles.itemRow, line.quantity > 0 && styles.itemRowSelected]}>
                <View style={styles.itemHeader}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{productName}</Text>
                    <Text style={styles.itemMeta}>
                      {`السعر: ${money(unitPrice)}`}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>{money(line.quantity * unitPrice)}</Text>
                </View>
                <View style={styles.itemDetails}>
                  <Text style={styles.qtyInfo}>
                    {`الأصلية: ${numberText(originalQty)} | المستردة: ${numberText(refundedQty)} | المتاحة: ${numberText(availableQty)}`}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.qtyRow}>
                    <Pressable
                      style={[styles.qtyBtn, (line.quantity <= 0 || availableQty <= 0) && styles.qtyBtnDisabled]}
                      onPress={() => setQuantity(itemId, line.quantity - 1, availableQty)}
                      disabled={line.quantity <= 0 || availableQty <= 0}
                    >
                      <Text style={styles.qtyBtnText}>−</Text>
                    </Pressable>
                    <TextInput
                      style={styles.qtyInput}
                      value={String(line.quantity)}
                      onChangeText={(text) => setQuantity(itemId, Number(text) || 0, availableQty)}
                      keyboardType="number-pad"
                      editable={availableQty > 0}
                    />
                    <Pressable
                      style={[styles.qtyBtn, (line.quantity >= availableQty || availableQty <= 0) && styles.qtyBtnDisabled]}
                      onPress={() => setQuantity(itemId, line.quantity + 1, availableQty)}
                      disabled={line.quantity >= availableQty || availableQty <= 0}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </Pressable>
                  </View>
                  <View style={styles.restockRow}>
                    <Switch
                      value={line.restock}
                      onValueChange={() => toggleRestock(itemId)}
                      trackColor={{ false: c.border, true: c.primary }}
                      thumbColor={c.surface}
                      disabled={availableQty <= 0}
                    />
                    <Text style={styles.restockLabel}>إعادة للمخزون</Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </FormSection>

      <FormSection
        title="رد المبلغ"
        subtitle="اختر الوجهة المحاسبية التي سيُرحّل عليها الاسترداد"
        icon="account-balance-wallet"
      >
        <AppInput label="السبب" value={reason} onChangeText={setReason} placeholder="سبب الاسترداد (اختياري)" />
        <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات إضافية (اختياري)" multiline numberOfLines={3} />
        <AppSelect
          label="طريقة الاسترداد"
          value={refundMethod}
          options={methodOptions}
          onChange={(v) => {
            const next = v as typeof refundMethod;
            setRefundMethod(next);
            if (next !== 'alternative_account') setRefundAccountId('');
          }}
        />
        {refundMethod === 'cash' ? (
          <AppSelect
            label="مصدر رد النقد"
            value={cashRefundSource}
            options={cashSourceOptions}
            onChange={(v) => setCashRefundSource(v as 'drawer' | 'vault')}
          />
        ) : null}
        {refundMethod === 'alternative_account' || (refundMethod === 'cash' && cashRefundSource === 'vault') ? (
          <AppSelect
            label="الحساب المالي للرد"
            value={refundAccountId}
            options={availableRefundSources.map((source) => ({
              label: [source.name, source.provider_name, source.masked_identifier].filter(Boolean).join(' · '),
              value: source.id,
            }))}
            onChange={setRefundAccountId}
          />
        ) : null}
        {refundSources.some((source) => source.is_available === false) ? (
          <AppBanner message="بعض حسابات الرد غير متاحة حاليًا ولن تُستخدم تلقائيًا." />
        ) : null}
        {refundMethod === 'cash' && isElectronicSale && cashRefundSource === 'drawer' ? (
          <AppBanner message="الرد من الدرج يُخصم من النقد المتوقع؛ ولا يغيّر إجمالي القناة الإلكترونية في التقرير." />
        ) : null}
        {isElectronicSale ? (
          <Text style={styles.sourceHint}>
            الدفع الأصلي إلكتروني — اختر الدرج للرد نقداً أو القناة الإلكترونية للتسوية.
          </Text>
        ) : null}
      </FormSection>

      {submitNotice ? (
        <AppBanner message={submitNotice.message} tone={submitNotice.tone} onDismiss={() => setSubmitNotice(null)} />
      ) : null}

      <ConfirmDialog
        visible={drawerElectronicConfirmOpen}
        title="تأكيد الرد النقدي من الدرج"
        message="هذه الفاتورة دُفعت إلكترونياً. الرد من الدرج يُقلّل النقد المتوقع. هل تريد المتابعة؟"
        confirmLabel="متابعة"
        onConfirm={() => {
          setDrawerElectronicConfirmOpen(false);
          setConfirmOpen(true);
        }}
        onCancel={() => setDrawerElectronicConfirmOpen(false)}
        loading={submitting}
        variant="primary"
      />

      <ConfirmDialog
        visible={confirmOpen}
        title="تأكيد الاسترداد الجزئي"
        message={`سيتم استرداد ${money(totalRefund)}. هل أنت متأكد؟`}
        confirmLabel="تنفيذ الاسترداد"
        onConfirm={submit}
        onCancel={() => setConfirmOpen(false)}
        loading={submitting}
      />
    </FormScreenLayout>
  );
}
