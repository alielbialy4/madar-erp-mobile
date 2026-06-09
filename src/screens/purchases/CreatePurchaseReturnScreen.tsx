import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { purchasesAPI, purchaseReturnsAPI } from '@/api/purchases';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog, AppErrorState } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { createUuid } from '@/utils/uuid';

type PurchaseItemData = {
  id: number;
  product_name?: string;
  product?: { name?: string };
  quantity: number;
  cost_price: number;
  returned_quantity?: number;
};

type ReturnItem = {
  purchase_item_id: number;
  product_name: string;
  maxQuantity: number;
  quantity: number;
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
  const [purchaseItems, setPurchaseItems] = useState<PurchaseItemData[]>([]);
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
    listContent: { paddingBottom: spacing.xxl, gap: spacing.md },
    loadingText: { color: c.textMuted, ...textStart },
    errorText: { color: c.danger, ...textStart, fontWeight: '800' },
    itemCard: { gap: spacing.sm },
    itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    itemName: { color: c.text, fontWeight: '900', fontSize: typography.body, ...textStart, flex: 1 },
    selectBtn: { minHeight: 36, flex: 0 },
    itemDetails: { ...flexRow, gap: spacing.md, flexWrap: 'wrap' },
    itemMeta: { color: c.textMuted, fontSize: typography.small, ...textStart },
    footer: { gap: spacing.md, paddingTop: spacing.lg },
    selectedCount: { color: c.info, fontWeight: '800', ...textStart },
  }), [c]);

  const loadPurchase = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await purchasesAPI.getById(purchaseId);
      const data = (res as any).data ?? res;
      const rawItems: any[] = Array.isArray(data?.items) ? data.items : [];
      setPurchaseItems(rawItems);
      setReturnItems(rawItems.map((item) => ({
        purchase_item_id: Number(item.id),
        product_name: String(item.product?.name ?? item.product_name ?? ''),
        maxQuantity: Number(item.quantity) - Number(item.returned_quantity ?? 0),
        quantity: 0,
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
    setReturnItems(returnItems.map((item, i) => {
      if (i !== index) return item;
      const selected = !item.selected;
      return { ...item, selected, quantity: selected ? 1 : 0 };
    }));
  };

  const updateQuantity = (index: number, qty: number) => {
    setReturnItems(returnItems.map((item, i) => {
      if (i !== index) return item;
      return { ...item, quantity: Math.min(Math.max(0, qty), item.maxQuantity) };
    }));
  };

  const selectedItems = returnItems.filter((i) => i.selected && i.quantity > 0);

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
      await purchaseReturnsAPI.create({
        client_uuid: clientUuidRef.current,
        purchase_id: purchaseId,
        items: selectedItems.map((item) => ({
          purchase_item_id: item.purchase_item_id,
          quantity: item.quantity,
        })),
        ...(reason ? { reason } : {}),
        ...(notes ? { notes } : {}),
      });
      navigation.goBack();
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      submitLockRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title="مرتجع شراء" onBack={navigation.goBack}>
      {loading ? <Text style={styles.loadingText}>جاري التحميل...</Text> : null}
      {errorMsg && loading ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
      {!loading ? (
        <FlatList
          data={returnItems}
          keyExtractor={(item) => String(item.purchase_item_id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={<AppSectionHeader title={`أصناف الشراء #${purchaseId}`} />}
          renderItem={({ item, index }) => (
            <AppCard style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.product_name}</Text>
                <AppButton
                  title={item.selected ? 'محدد ✓' : 'اختيار'}
                  variant={item.selected ? 'primary' : 'secondary'}
                  onPress={() => toggleItem(index)}
                  style={styles.selectBtn}
                />
              </View>
              <View style={styles.itemDetails}>
                <Text style={styles.itemMeta}>الكمية الأصلية: {numberText(item.maxQuantity)}</Text>
                <Text style={styles.itemMeta}>سعر التكلفة: {money(purchaseItems[index]?.cost_price ?? 0)}</Text>
              </View>
              {item.selected ? (
                <AppInput
                  label="كمية الإرجاع"
                  keyboardType="numeric"
                  value={String(item.quantity)}
                  onChangeText={(v) => updateQuantity(index, Number(v) || 0)}
                />
              ) : null}
            </AppCard>
          )}
          ListFooterComponent={
            selectedItems.length > 0 ? (
              <View style={styles.footer}>
                <Text style={styles.selectedCount}>الأصناف المحددة: {numberText(selectedItems.length)}</Text>
                <AppInput label="السبب" value={reason} onChangeText={setReason} />
                <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
                {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
                <AppButton
                  title="تأكيد المرتجع"
                  loading={submitting}
                  disabled={submitting}
                  onPress={() => setConfirmVisible(true)}
                />
              </View>
            ) : null
          }
        />
      ) : null}

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد مرتجع الشراء"
        message={`سيتم إرجاع ${numberText(selectedItems.length)} صنف. هل أنت متأكد؟`}
        confirmLabel="تأكيد"
        onConfirm={() => { setConfirmVisible(false); void handleSubmit(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </AppScreen>
  );
}
