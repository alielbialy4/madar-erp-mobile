import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { inventoryAPI } from '@/api/inventory';
import { get } from '@/api/client';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

type AdjustmentItem = {
  product_id: number;
  product_name: string;
  quantity: string;
  unit_cost: string;
  variant_id?: string;
  batch_id?: string;
};

export function StockAdjustmentScreen({ navigation }: { navigation: any }) {
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [type, setType] = useState<string>('addition');
  const [reason, setReason] = useState<string>('count');
  const [items, setItems] = useState<AdjustmentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [postConfirmVisible, setPostConfirmVisible] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const typeOptions: SelectOption[] = [
    { label: 'إضافة', value: 'addition' },
    { label: 'خصم', value: 'subtraction' },
  ];

  const reasonOptions: SelectOption[] = [
    { label: 'تالف', value: 'damage' },
    { label: 'فقدان', value: 'loss' },
    { label: 'عثر عليه', value: 'found' },
    { label: 'جرد', value: 'count' },
    { label: 'أخرى', value: 'other' },
  ];

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryAPI.warehouses();
      const list = extractArray<any>(res);
      setWarehouses(list.map((w: any) => ({ label: w.name, value: String(w.id) })));
      if (list.length === 1) setWarehouseId(String(list[0].id));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadWarehouses();
  }, [loadWarehouses]);

  const searchProducts = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await get('/products', { search: query, per_page: 20 });
      const list = extractArray<any>(res);
      setSearchResults(list);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => void searchProducts(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchProducts]);

  const addProduct = (product: any) => {
    const exists = items.find((i) => i.product_id === product.id);
    if (exists) {
      setItems(items.map((i) => i.product_id === product.id ? { ...i, quantity: String(Number(i.quantity) + 1) } : i));
    } else {
      setItems([...items, {
        product_id: product.id,
        product_name: product.name ?? 'منتج',
        quantity: '1',
        unit_cost: String(product.cost_price ?? product.selling_price ?? 0),
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItem = (index: number, field: 'quantity' | 'unit_cost', value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const canSubmit = warehouseId && items.length > 0 && items.every((i) => Number(i.quantity) > 0 && Number(i.unit_cost) >= 0);

  const handleSubmit = async () => {
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const payload = {
        warehouse_id: warehouseId,
        type,
        reason,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost),
          ...(i.variant_id ? { variant_id: i.variant_id } : {}),
          ...(i.batch_id ? { batch_id: i.batch_id } : {}),
        })),
      };
      const res = await inventoryAPI.createStockAdjustment(payload);
      const id = (res as any)?.data?.id ?? (res as any)?.id;
      if (id) {
        setCreatedId(String(id));
        Alert.alert('تم بنجاح', 'تم إنشاء تسوية المخزون');
      } else {
        Alert.alert('تم بنجاح', 'تم إنشاء تسوية المخزون');
        navigation.goBack();
      }
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePost = async () => {
    setPostConfirmVisible(false);
    setSubmitting(true);
    try {
      await inventoryAPI.postStockAdjustment(createdId!);
      Alert.alert('تم بنجاح', 'تم ترحيل تسوية المخزون');
      navigation.goBack();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppScreen title="تسوية مخزون" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen title="تسوية مخزون" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={loadWarehouses} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="تسوية مخزون" onBack={navigation.goBack} scroll>
      <AppCard style={styles.card}>
        <AppSectionHeader title="بيانات التسوية" />
        <AppSelect label="المخزن" value={warehouseId} options={warehouses} onChange={setWarehouseId} />
        <AppSelect label="النوع" value={type} options={typeOptions} onChange={setType} />
        <AppSelect label="السبب" value={reason} options={reasonOptions} onChange={setReason} />
      </AppCard>

      <AppCard style={styles.card}>
        <AppSectionHeader title="المنتجات" />
        <AppInput
          label="بحث عن منتج"
          placeholder="اسم أو باركود..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searching ? <Text style={styles.hint}>جاري البحث...</Text> : null}
        {!searching && searchResults.length > 0 ? (
          <View style={styles.searchResults}>
            {searchResults.map((product) => (
              <Pressable key={product.id} style={styles.searchItem} onPress={() => addProduct(product)}>
                <Text style={styles.searchItemText} numberOfLines={1}>{product.name}</Text>
                <Text style={styles.searchItemSub}>{product.barcode ?? ''}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
        {!searching && searchQuery.length >= 2 && searchResults.length === 0 ? (
          <Text style={styles.hint}>لا توجد نتائج</Text>
        ) : null}
      </AppCard>

      {items.length === 0 ? (
        <AppEmptyState title="لم يتم إضافة منتجات" message="ابحث عن منتج وأضفه للقائمة" />
      ) : (
        <AppCard style={styles.card}>
          <AppSectionHeader title="الأصناف" action={<AppButton title="إضافة" variant="ghost" onPress={() => setSearchQuery('')} />} />
          {items.map((item, index) => (
            <View key={item.product_id} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                <Text style={styles.itemTotal}>{money(Number(item.quantity) * Number(item.unit_cost))}</Text>
              </View>
              <View style={styles.itemInputs}>
                <AppInput
                  label="الكمية"
                  value={item.quantity}
                  onChangeText={(v) => updateItem(index, 'quantity', v)}
                  keyboardType="numeric"
                  style={styles.smallInput}
                />
                <AppInput
                  label="تكلفة الوحدة"
                  value={item.unit_cost}
                  onChangeText={(v) => updateItem(index, 'unit_cost', v)}
                  keyboardType="numeric"
                  style={styles.smallInput}
                />
              </View>
              <AppButton title="حذف" variant="danger" onPress={() => removeItem(index)} style={styles.removeBtn} />
            </View>
          ))}
        </AppCard>
      )}

      {!createdId ? (
        <AppButton
          title="مراجعة وإرسال"
          onPress={() => setConfirmVisible(true)}
          disabled={!canSubmit}
          loading={submitting}
        />
      ) : (
        <View style={styles.postActions}>
          <AppButton
            title="ترحيل التسوية"
            onPress={() => setPostConfirmVisible(true)}
            loading={submitting}
          />
          <AppButton
            title="رجوع"
            variant="secondary"
            onPress={navigation.goBack}
          />
        </View>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد التسوية"
        message={`سيتم إنشاء تسوية ${type === 'addition' ? 'إضافة' : 'خصم'} بسبب ${reasonOptions.find((r) => r.value === reason)?.label ?? reason} بعدد ${items.length} صنف. هل تريد المتابعة؟`}
        confirmLabel="تأكيد"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmVisible(false)}
      />

      <ConfirmDialog
        visible={postConfirmVisible}
        title="ترحيل التسوية"
        message="سيتم ترحيل التسوية وتحديث الأرصدة نهائياً. هل تريد المتابعة؟"
        confirmLabel="ترحيل"
        onConfirm={handlePost}
        onCancel={() => setPostConfirmVisible(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  hint: { color: colors.textMuted, fontSize: typography.small, ...textStart },
  searchResults: { gap: spacing.xs, maxHeight: 200 },
  searchItem: { padding: spacing.md, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  searchItemText: { color: colors.text, fontSize: typography.body, fontWeight: '700', ...textStart },
  searchItemSub: { color: colors.textMuted, fontSize: typography.small, ...textStart },
  itemRow: { gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemInfo: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '700', ...textStart },
  itemTotal: { color: colors.primary, fontSize: typography.small, fontWeight: '800' },
  itemInputs: { ...flexRow, gap: spacing.sm },
  smallInput: { flex: 1 },
  removeBtn: { minHeight: 36, paddingHorizontal: spacing.md },
  postActions: { gap: spacing.md },
});
