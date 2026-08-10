import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { purchasesAPI, purchaseReturnsAPI } from '@/api/purchases';
import { AppScreen, FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { AppButton, AppInput } from '@/components/ui';
import { AppBanner, ConfirmDialog, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { createUuid } from '@/utils/uuid';

type ReturnItem = {
  purchase_item_id: number;
  product_name: string;
  maxQuantity: number;
  quantity: number;
  costPrice: number;
  selected: boolean;
};

export function CreatePurchaseReturnScreen({ route, navigation }: { route: any; navigation: any }) {
  const rawPurchaseId = route.params?.purchaseId ?? route.params?.id;
  if (!rawPurchaseId) {
    return (
      <AppScreen title="خطأ" onBack={navigation.goBack}>
        <AppErrorState message="معرّف الشراء مفقود" onRetry={navigation.goBack} />
      </AppScreen>
    );
  }
  return <CreatePurchaseReturn purchaseId={Number(rawPurchaseId)} navigation={navigation} />;
}

function CreatePurchaseReturn({ purchaseId, navigation }: { purchaseId: number; navigation: any }) {
  const c = useColors();
  const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const clientUuidRef = useRef<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    loadingText: { color: c.textMuted, ...textStart },
    itemCard: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: spacing.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    itemSelected: { borderColor: c.softWarningBorder, backgroundColor: c.softWarning },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { color: c.text, fontWeight: '900', fontSize: typography.body, ...textStart, flex: 1 },
    selectBtn: { minHeight: 36, flex: 0 },
    itemDetails: { ...flexRow, gap: spacing.md, flexWrap: 'wrap' },
    itemMeta: { color: c.textMuted, fontSize: typography.small, ...textStart },
    selectedCount: { color: c.info, fontWeight: '800', ...textStart },
  }), [c]);

  const loadPurchase = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await purchasesAPI.getById(purchaseId);
      const data = (res as any).data ?? res;
      const rawItems: any[] = Array.isArray(data?.items) ? data.items : [];
      setReturnItems(rawItems.map((item) => ({
        purchase_item_id: Number(item.id),
        product_name: String(item.product?.name ?? item.product_name ?? 'صنف'),
        maxQuantity: Math.max(0, Number(item.quantity) - Number(item.returned_quantity ?? 0)),
        quantity: 0,
        costPrice: Number(item.cost_price ?? item.unit_price ?? 0),
        selected: false,
      })));
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [purchaseId]);

  useEffect(() => { void loadPurchase(); }, [loadPurchase]);

  const toggleItem = (index: number) => {
    setReturnItems((current) => current.map((item, i) => {
      if (i !== index) return item;
      const selected = !item.selected;
      return { ...item, selected, quantity: selected && item.maxQuantity > 0 ? 1 : 0 };
    }));
  };

  const updateQuantity = (index: number, qty: number) => {
    setReturnItems((current) => current.map((item, i) => {
      if (i !== index) return item;
      return { ...item, quantity: Math.min(Math.max(0, qty), item.maxQuantity) };
    }));
  };

  const selectedItems = returnItems.filter((i) => i.selected && i.quantity > 0);
  const estimatedTotal = selectedItems.reduce((sum, item) => sum + item.quantity * item.costPrice, 0);

  const handleSubmit = async () => {
    if (submitLockRef.current || submitting) return;
    if (selectedItems.length === 0) { setErrorMsg('اختر صنفاً واحداً على الأقل'); return; }
    submitLockRef.current = true;
    if (!clientUuidRef.current) {
      clientUuidRef.current = createUuid();
    }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const response = await purchaseReturnsAPI.create({
        client_uuid: clientUuidRef.current,
        purchase_id: purchaseId,
        items: selectedItems.map((item) => ({
          purchase_item_id: item.purchase_item_id,
          quantity: item.quantity,
        })),
        ...(reason ? { reason } : {}),
        ...(notes ? { notes } : {}),
      });
      const data = (response as { data?: Record<string, unknown> }).data ?? response;
      const returnId = Number((data as Record<string, unknown>)?.id ?? 0);
      if (returnId) {
        navigation.replace('PurchaseReturnDetail', { id: returnId });
      } else {
        navigation.goBack();
      }
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  if (loading) {
    return <AppScreen title="مرتجع شراء" onBack={navigation.goBack}><AppLoadingState /></AppScreen>;
  }

  if (errorMsg && returnItems.length === 0) {
    return <AppScreen title="مرتجع شراء" onBack={navigation.goBack}><AppErrorState message={errorMsg} onRetry={loadPurchase} /></AppScreen>;
  }

  return (
    <FormScreenLayout
      title="مرتجع شراء"
      onBack={navigation.goBack}
      heroTitle={`فاتورة شراء #${purchaseId}`}
      heroSubtitle="حدد الأصناف والكميات المراد إرجاعها إلى المورد"
      heroAmount={money(estimatedTotal)}
      saveLabel={selectedItems.length > 0 ? `مراجعة ${numberText(selectedItems.length)} صنف` : 'اختر أصنافًا'}
      onSave={() => setConfirmVisible(true)}
      saveLoading={submitting}
      saveDisabled={selectedItems.length === 0 || submitting}
      onCancel={navigation.goBack}
    >
      <AppBanner
        tone="warning"
        icon="inventory-2"
        message="ترحيل المرتجع يخفض مخزون الأصناف ويعدّل رصيد المورد. القيمة المعروضة تقديرية حتى يعتمدها الخادم."
      />

      <FormSection
        title="الأصناف القابلة للإرجاع"
        subtitle="الكمية المتاحة تستبعد ما تم إرجاعه سابقًا"
        icon="assignment-return"
      >
        {returnItems.length === 0 ? <Text style={styles.loadingText}>لا توجد كميات متاحة للإرجاع.</Text> : null}
        {returnItems.map((item, index) => (
          <View key={String(item.purchase_item_id)} style={[styles.itemCard, item.selected && styles.itemSelected]}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <AppButton
                title={item.selected ? 'محدد ✓' : 'اختيار'}
                variant={item.selected ? 'primary' : 'secondary'}
                onPress={() => toggleItem(index)}
                style={styles.selectBtn}
                disabled={item.maxQuantity <= 0}
              />
            </View>
            <View style={styles.itemDetails}>
              <Text style={styles.itemMeta}>متاح: {numberText(item.maxQuantity)}</Text>
              <Text style={styles.itemMeta}>تكلفة الوحدة: {money(item.costPrice)}</Text>
            </View>
            {item.selected ? (
              <AppInput
                label="كمية الإرجاع"
                keyboardType="decimal-pad"
                value={String(item.quantity)}
                onChangeText={(v) => updateQuantity(index, Number(v) || 0)}
              />
            ) : null}
          </View>
        ))}
      </FormSection>

      <FormSection
        title="سبب المرتجع"
        subtitle="أضف سياقًا واضحًا للمراجعة والمحاسبة"
        icon="notes"
      >
        <Text style={styles.selectedCount}>المحدد: {numberText(selectedItems.length)} صنف</Text>
        <AppInput label="السبب" value={reason} onChangeText={setReason} placeholder="مثال: تلف أو اختلاف توريد" />
        <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
        {errorMsg ? <AppBanner message={errorMsg} tone="danger" onDismiss={() => setErrorMsg(null)} /> : null}
      </FormSection>

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد مرتجع الشراء"
        message={`سيتم ترحيل ${numberText(selectedItems.length)} صنف بقيمة تقديرية ${money(estimatedTotal)} وخفض كمياتها من المخزون.`}
        confirmLabel="ترحيل المرتجع"
        loading={submitting}
        onConfirm={() => { setConfirmVisible(false); void handleSubmit(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </FormScreenLayout>
  );
}
