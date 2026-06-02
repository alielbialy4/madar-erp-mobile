import React, { useCallback, useMemo, useState } from 'react';
import { textStart } from '@/constants/layout';
import { Pressable, StyleSheet, Switch, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppTextInput as TextInput } from '@/components/ui/AppTextInput';
import { salesAPI } from '@/api/sales';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import { ConfirmDialog, AppLoadingState, AppErrorState } from '@/components/feedback';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { Sale } from '@/types/api';

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
  const loader = useCallback(() => salesAPI.getById(saleId), [saleId]);
  const { data: sale, loading, error, reload } = useAsyncResource<Sale>(loader);

  const [lines, setLines] = useState<Record<number, RefundLine>>({});
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState<'cash' | 'wallet'>('cash');
  const [cashRefundSource, setCashRefundSource] = useState<'drawer' | 'vault'>('drawer');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const styles = useMemo(() => StyleSheet.create({
    emptyText: { ...textStart, color: c.textMuted, fontSize: typography.body },
    itemRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: c.border, gap: spacing.sm },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    itemInfo: { flex: 1, gap: 2 },
    itemName: { fontSize: typography.body, fontWeight: '700', color: c.text, ...textStart },
    itemMeta: { fontSize: typography.small, color: c.textMuted, ...textStart },
    itemTotal: { fontSize: typography.body, fontWeight: '800', color: c.primary },
    itemDetails: { gap: 2 },
    qtyInfo: { fontSize: typography.tiny, color: c.textMuted, ...textStart },
    itemActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.xs },
    qtyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    qtyBtn: { width: 36, height: 36, borderRadius: radius.md, backgroundColor: c.primary, alignItems: 'center', justifyContent: 'center' },
    qtyBtnDisabled: { backgroundColor: c.disabled },
    qtyBtnText: { color: '#fff', fontSize: typography.h3, fontWeight: '900' },
    qtyInput: {
      width: 56,
      height: 36,
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
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { fontSize: typography.body, fontWeight: '800', color: c.text, ...textStart },
    totalValue: { fontSize: typography.h3, fontWeight: '900', color: c.danger },
    messageBox: { padding: spacing.md, borderRadius: radius.md },
    successBox: { backgroundColor: c.softSuccess },
    errorBox: { backgroundColor: c.softDanger },
    messageText: { fontSize: typography.body, ...textStart, fontWeight: '700' },
    successText: { color: c.success },
    errorText: { color: c.danger },
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

  const methodOptions = hasCustomer
    ? [{ label: 'نقدي', value: 'cash' }, { label: 'محفظة', value: 'wallet' }]
    : [{ label: 'نقدي', value: 'cash' }];

  const submit = async () => {
    setSubmitting(true);
    setSubmitMessage(null);
    try {
      const refundItems = items
        .map((item) => {
          const line = getLine(Number(item.id));
          return { sale_item_id: line.saleItemId, quantity: line.quantity, restock: line.restock };
        })
        .filter((i) => i.quantity > 0);

      const response = await salesAPI.partialRefund(saleId, {
        items: refundItems,
        reason: reason || undefined,
        notes: notes || undefined,
        refund_method: refundMethod,
        ...(refundMethod === 'cash' ? { cash_refund_source: cashRefundSource } : {}),
      });
      setSubmitMessage(response.message || 'تم تسجيل الاسترداد الجزئي بنجاح');
      setConfirmOpen(false);
      await reload();
    } catch (err) {
      setSubmitMessage(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title="استرداد جزئي" onBack={navigation.goBack}>
      <AppCard>
        <AppSectionHeader title="أصناف البيع" />
        {items.length === 0 ? (
          <Text style={styles.emptyText}>لا توجد أصناف</Text>
        ) : (
          items.map((item, index) => {
            const itemId = Number(item.id);
            const originalQty = Number(item.quantity ?? 0);
            const refundedQty = Number(item.refunded_quantity ?? 0);
            const availableQty = originalQty - refundedQty;
            const line = getLine(itemId);
            const unitPrice = Number(item.unit_price ?? 0);
            const productName = String((item.product as any)?.name ?? item.product_name ?? 'صنف');

            return (
              <View key={String(itemId ?? index)} style={styles.itemRow}>
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
      </AppCard>

      <AppCard>
        <AppSectionHeader title="تفاصيل الاسترداد" />
        <AppInput label="السبب" value={reason} onChangeText={setReason} placeholder="سبب الاسترداد (اختياري)" />
        <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="ملاحظات إضافية (اختياري)" multiline numberOfLines={3} />
        <AppSelect
          label="طريقة الاسترداد"
          value={refundMethod}
          options={methodOptions}
          onChange={(v) => setRefundMethod(v as 'cash' | 'wallet')}
        />
        {refundMethod === 'cash' ? (
          <AppSelect
            label="مصدر رد النقد"
            value={cashRefundSource}
            options={[
              { label: 'من درج الوردية', value: 'drawer' },
              { label: 'من الخزنة', value: 'vault' },
            ]}
            onChange={(v) => setCashRefundSource(v as 'drawer' | 'vault')}
          />
        ) : null}
      </AppCard>

      <AppCard>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>إجمالي الاسترداد المتوقع</Text>
          <Text style={styles.totalValue}>{money(totalRefund)}</Text>
        </View>
      </AppCard>

      {submitMessage ? (
        <View style={[styles.messageBox, submitMessage.includes('نجاح') || submitMessage.includes('تم') ? styles.successBox : styles.errorBox]}>
          <Text style={[styles.messageText, submitMessage.includes('نجاح') || submitMessage.includes('تم') ? styles.successText : styles.errorText]}>
            {submitMessage}
          </Text>
        </View>
      ) : null}

      <AppButton
        title="تنفيذ الاسترداد الجزئي"
        variant="danger"
        onPress={() => setConfirmOpen(true)}
        disabled={!hasItems || submitting}
        loading={submitting}
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
    </AppScreen>
  );
}
