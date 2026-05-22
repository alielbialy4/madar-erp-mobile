import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { InventoryLineItemCard, lineTotal } from '@/components/inventory/InventoryLineItemCard';
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

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockAdjustment'>;

type AdjustmentItem = {
  product_id: number;
  product_name: string;
  quantity: string;
  unit_cost: string;
};

export function StockAdjustmentScreen({ navigation }: { navigation: Nav }) {
  const c = useColors();
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const [warehouses, setWarehouses] = useState<SelectOption[]>([]);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [type, setType] = useState<string>('addition');
  const [reason, setReason] = useState<string>('count');
  const [items, setItems] = useState<AdjustmentItem[]>([]);
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
      const list = extractArray<Record<string, unknown>>(res);
      setWarehouses(list.map((w) => ({ label: String(w.name), value: String(w.id) })));
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

  const addProduct = (product: { id: number; name?: string; cost_price?: number; selling_price?: number }) => {
    const exists = items.find((i) => i.product_id === product.id);
    if (exists) {
      setItems(items.map((i) => (i.product_id === product.id ? { ...i, quantity: String(Number(i.quantity) + 1) } : i)));
    } else {
      setItems([
        ...items,
        {
          product_id: product.id,
          product_name: product.name ?? 'منتج',
          quantity: '1',
          unit_cost: String(product.cost_price ?? product.selling_price ?? 0),
        },
      ]);
    }
  };

  const canSubmit = warehouseId && items.length > 0 && items.every((i) => Number(i.quantity) > 0 && Number(i.unit_cost) >= 0);

  const handleSubmit = async () => {
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const res = await inventoryAPI.createStockAdjustment({
        warehouse_id: warehouseId,
        type,
        reason,
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          unit_cost: Number(i.unit_cost),
        })),
      });
      const id = (res as { data?: { id?: string | number }; id?: string | number })?.data?.id ?? (res as { id?: string | number })?.id;
      if (id) {
        setCreatedId(String(id));
        Alert.alert('تم بنجاح', 'تم إنشاء تسوية المخزون — يمكنك ترحيلها الآن');
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
        <AppErrorState message={error} onRetry={() => void loadWarehouses()} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title="تسوية مخزون" onBack={navigation.goBack} scroll contentStyle={{ padding: 0 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xxl }}>
        <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <InventoryHero
            eyebrow="عملية مخزون"
            title="تسوية الكميات"
            subtitle="إضافة أو خصم مخزون مع سبب واضح — يمكن ترحيل التسوية بعد المراجعة."
            stats={[
              { label: 'أصناف', value: items.length },
              { label: 'النوع', value: type === 'addition' ? 'إضافة' : 'خصم' },
            ]}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg, marginTop: spacing.md }}>
          <ProductFormSection title="بيانات التسوية" subtitle="المخزن والنوع والسبب" icon="edit">
            <AppSelect label="المخزن" value={warehouseId} options={warehouses} onChange={setWarehouseId} />
            <AppSelect label="النوع" value={type} options={typeOptions} onChange={setType} />
            <AppSelect label="السبب" value={reason} options={reasonOptions} onChange={setReason} />
          </ProductFormSection>

          <ProductFormSection title="إضافة منتجات" subtitle="ابحث ثم اضغط لإضافة الصنف" icon="search">
            <InventoryProductSearch onSelect={addProduct} />
          </ProductFormSection>

          {items.length === 0 ? (
            <AppEmptyState title="لم يتم إضافة منتجات" message="ابحث عن منتج وأضفه للقائمة" />
          ) : (
            <ProductFormSection title={`الأصناف (${items.length})`} icon="inventory-2">
              {items.map((item, index) => (
                <InventoryLineItemCard
                  key={item.product_id}
                  title={item.product_name}
                  totalHint={lineTotal(item.quantity, item.unit_cost)}
                  onRemove={() => setItems(items.filter((_, i) => i !== index))}
                >
                  <View style={ui.dualFieldRow}>
                    <View style={{ flex: 1 }}>
                      <AppInput
                        label="الكمية"
                        value={item.quantity}
                        onChangeText={(v) =>
                          setItems(items.map((row, i) => (i === index ? { ...row, quantity: v } : row)))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppInput
                        label="تكلفة الوحدة"
                        value={item.unit_cost}
                        onChangeText={(v) =>
                          setItems(items.map((row, i) => (i === index ? { ...row, unit_cost: v } : row)))
                        }
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </InventoryLineItemCard>
              ))}
            </ProductFormSection>
          )}

          {!createdId ? (
            <AppButton
              title="مراجعة وإرسال"
              onPress={() => setConfirmVisible(true)}
              disabled={!canSubmit}
              loading={submitting}
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              <Text style={ui.successInline}>
                تم إنشاء التسوية — يمكنك ترحيلها لتحديث الأرصدة
              </Text>
              <AppButton title="ترحيل التسوية" onPress={() => setPostConfirmVisible(true)} loading={submitting} />
              <AppButton title="رجوع" variant="secondary" onPress={navigation.goBack} />
            </View>
          )}
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد التسوية"
        message={`تسوية ${type === 'addition' ? 'إضافة' : 'خصم'} — ${reasonOptions.find((r) => r.value === reason)?.label} — ${items.length} صنف.`}
        confirmLabel="تأكيد"
        onConfirm={() => void handleSubmit()}
        onCancel={() => setConfirmVisible(false)}
      />
      <ConfirmDialog
        visible={postConfirmVisible}
        title="ترحيل التسوية"
        message="سيتم ترحيل التسوية وتحديث الأرصدة نهائياً."
        confirmLabel="ترحيل"
        onConfirm={() => void handlePost()}
        onCancel={() => setPostConfirmVisible(false)}
      />
    </AppScreen>
  );
}
