import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { InventoryLineItemCard } from '@/components/inventory/InventoryLineItemCard';
import { ProductFormSection } from '@/components/products/ProductFormSection';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import type { MoreStackParamList } from '@/types/navigation';
import { Text } from '@/components/ui/AppText';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockTransfer'>;

type TransferItem = {
  product_id: number;
  product_name: string;
  quantity: string;
};

export function StockTransferScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [fromWarehouseId, setFromWarehouseId] = useState<string | null>(null);
  const [toWarehouseId, setToWarehouseId] = useState<string | null>(null);
  const [shippingCost, setShippingCost] = useState('');
  const [items, setItems] = useState<TransferItem[]>([]);
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
      const list = extractArray<Record<string, unknown>>(res);
      setWarehouses(list.map((w) => ({ label: String(w.name), value: String(w.id) })));
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

  const addProduct = (product: { id: number; name?: string }) => {
    const exists = items.find((i) => i.product_id === product.id);
    if (exists) {
      setItems(items.map((i) => (i.product_id === product.id ? { ...i, quantity: String(Number(i.quantity) + 1) } : i)));
    } else {
      setItems([...items, { product_id: product.id, product_name: product.name ?? 'منتج', quantity: '1' }]);
    }
  };

  const canSubmit =
    fromWarehouseId && toWarehouseId && fromWarehouseId !== toWarehouseId && items.length > 0 && items.every((i) => Number(i.quantity) > 0);

  const handleSubmit = async () => {
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      await inventoryAPI.createStockTransfer({
        from_warehouse_id: fromWarehouseId,
        to_warehouse_id: toWarehouseId,
        ...(shippingCost ? { shipping_cost: Number(shippingCost) } : {}),
        items: items.map((i) => ({ product_id: i.product_id, quantity: Number(i.quantity) })),
      });
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
        <AppErrorState message={error} onRetry={() => void loadWarehouses()} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="تحويل مخزون" onBack={navigation.goBack} scroll contentStyle={{ padding: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <InventoryHero
            eyebrow="عملية مخزون"
            title="تحويل بين المخازن"
            subtitle="انقل كميات بين مخزن المصدر والوجهة — يُسجّل كحركة مخزون."
            stats={[
              { label: 'أصناف', value: items.length },
              { label: 'مخازن', value: warehouses.length },
            ]}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.md }}>
          <ProductFormSection title="بيانات التحويل" subtitle="المخازن وتكلفة الشحن" icon="swap-horiz">
            <AppSelect label="من مخزن" value={fromWarehouseId} options={filteredFromWarehouses} onChange={setFromWarehouseId} />
            <AppSelect label="إلى مخزن" value={toWarehouseId} options={filteredToWarehouses} onChange={setToWarehouseId} />
            {fromWarehouseId && toWarehouseId && fromWarehouseId === toWarehouseId ? (
              <Text style={ui.errorInline}>لا يمكن أن يكون المصدر والوجهة نفس المخزن</Text>
            ) : null}
            <AppInput
              label="تكلفة الشحن (اختياري)"
              value={shippingCost}
              onChangeText={setShippingCost}
              keyboardType="numeric"
              placeholder="0"
            />
          </ProductFormSection>

          <ProductFormSection title="إضافة منتجات" subtitle="ابحث ثم اضغط لإضافة الصنف" icon="search">
            <InventoryProductSearch onSelect={addProduct} />
          </ProductFormSection>

          {items.length === 0 ? (
            <AppEmptyState title="لم يتم إضافة منتجات" message="ابحث عن منتج وأضفه للقائمة" />
          ) : (
            <ProductFormSection title={`الأصناف (${items.length})`} subtitle="حدّد الكمية لكل صنف" icon="inventory-2">
              {items.map((item, index) => (
                <InventoryLineItemCard
                  key={item.product_id}
                  title={item.product_name}
                  onRemove={() => setItems(items.filter((_, i) => i !== index))}
                >
                  <AppInput
                    label="الكمية"
                    value={item.quantity}
                    onChangeText={(v) =>
                      setItems(items.map((row, i) => (i === index ? { ...row, quantity: v } : row)))
                    }
                    keyboardType="numeric"
                  />
                </InventoryLineItemCard>
              ))}
            </ProductFormSection>
          )}

          <AppButton
            title="إرسال التحويل"
            onPress={() => setConfirmVisible(true)}
            disabled={!canSubmit}
            loading={submitting}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد التحويل"
        message={`سيتم تحويل ${items.length} صنف من «${warehouses.find((w) => w.value === fromWarehouseId)?.label ?? ''}» إلى «${warehouses.find((w) => w.value === toWarehouseId)?.label ?? ''}».`}
        confirmLabel="تأكيد"
        onConfirm={() => void handleSubmit()}
        onCancel={() => setConfirmVisible(false)}
      />
    </AppScreen>
  );
}
