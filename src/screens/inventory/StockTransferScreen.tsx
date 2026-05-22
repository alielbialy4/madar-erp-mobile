import React, { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, View, Pressable } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { inventoryAPI } from '@/api/inventory';
import { get } from '@/api/client';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

type TransferItem = {
  product_id: number;
  product_name: string;
  quantity: string;
  variant_id?: string;
  batch_id?: string;
};

export function StockTransferScreen({ navigation }: { navigation: any }) {
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState<string | null>(null);
  const [toWarehouseId, setToWarehouseId] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const filteredToWarehouses = warehouses.filter((w) => w.value !== fromWarehouseId);
  const filteredFromWarehouses = warehouses.filter((w) => w.value !== toWarehouseId);

  const loadWarehouses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await inventoryAPI.warehouses();
      const list = extractArray<any>(res);
      setWarehouses(list.map((w: any) => ({ label: w.name, value: String(w.id) })));
      if (list.length === 1) setFromWarehouseId(String(list[0].id));
      if (list.length === 2) {
        setFromWarehouseId(String(list[0].id));
        setToWarehouseId(String(list[1].id));
      }
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
      }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateItemQuantity = (index: number, value: string) => {
    setItems(items.map((item, i) => i === index ? { ...item, quantity: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const canSubmit = fromWarehouseId && toWarehouseId && fromWarehouseId !== toWarehouseId && items.length > 0 && items.every((i) => Number(i.quantity) > 0);

  const handleSubmit = async () => {
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const payload = {
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        ...(shippingCost ? { shipping_cost: Number(shippingCost) } : {}),
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          ...(i.variant_id ? { variant_id: i.variant_id } : {}),
          ...(i.batch_id ? { batch_id: i.batch_id } : {}),
        })),
      };
      await inventoryAPI.createStockTransfer(payload);
      Alert.alert('تم بنجاح', 'تم إنشاء تحويل المخزون');
      navigation.goBack();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppScreen title="تحويل مخزون" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen title="تحويل مخزون" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={loadWarehouses} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="تحويل مخزون" onBack={navigation.goBack} scroll>
      <AppCard style={styles.card}>
        <AppSectionHeader title="بيانات التحويل" />
        <AppSelect label="من مخزن" value={fromWarehouseId} options={filteredFromWarehouses} onChange={setFromWarehouseId} />
        <AppSelect label="إلى مخزن" value={toWarehouseId} options={filteredToWarehouses} onChange={setToWarehouseId} />
        {fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId ? (
          <Text style={styles.errorText}>لا يمكن أن يكون مخزن المصدر والوجهة واحداً</Text>
        ) : null}
        <AppInput
          label="تكلفة الشحن (اختياري)"
          value={shippingCost}
          onChangeText={setShippingCost}
          keyboardType="numeric"
          placeholder="0"
        />
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
          <AppSectionHeader title="الأصناف" />
          {items.map((item, index) => (
            <View key={item.product_id} style={styles.itemRow}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName} numberOfLines={1}>{item.product_name}</Text>
                <AppButton title="حذف" variant="danger" onPress={() => removeItem(index)} style={styles.removeBtn} />
              </View>
              <AppInput
                label="الكمية"
                value={item.quantity}
                onChangeText={(v) => updateItemQuantity(index, v)}
                keyboardType="numeric"
              />
            </View>
          ))}
        </AppCard>
      )}

      <AppButton
        title="إرسال التحويل"
        onPress={() => setConfirmVisible(true)}
        disabled={!canSubmit}
        loading={submitting}
      />

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد التحويل"
        message={`سيتم تحويل ${items.length} صنف من "${warehouses.find((w) => w.value === fromWarehouseId)?.label ?? ''}" إلى "${warehouses.find((w) => w.value === toWarehouseId)?.label ?? ''}". هل تريد المتابعة؟`}
        confirmLabel="تأكيد"
        onConfirm={handleSubmit}
        onCancel={() => setConfirmVisible(false)}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
  errorText: { color: colors.danger, fontSize: typography.small, ...textStart },
  hint: { color: colors.textMuted, fontSize: typography.small, ...textStart },
  searchResults: { gap: spacing.xs, maxHeight: 200 },
  searchItem: { padding: spacing.md, backgroundColor: colors.background, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  searchItemText: { color: colors.text, fontSize: typography.body, fontWeight: '700', ...textStart },
  searchItemSub: { color: colors.textMuted, fontSize: typography.small, ...textStart },
  itemRow: { gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  itemHeader: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
  itemName: { flex: 1, color: colors.text, fontSize: typography.body, fontWeight: '700', ...textStart },
  removeBtn: { minHeight: 36, paddingHorizontal: spacing.md },
});
