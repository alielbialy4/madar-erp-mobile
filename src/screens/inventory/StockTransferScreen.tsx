import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI } from '@/api/inventory';
import { AppScreen } from '@/components/layout';
import { InventoryHero } from '@/components/inventory/InventoryHero';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { BatchPickerSheet } from '@/components/inventory/BatchPickerSheet';
import { InventoryLineItemCard } from '@/components/inventory/InventoryLineItemCard';
import { stockCountLineKey } from '@/services/inventory/stockCountLines';
import type { InventoryLotSelection } from '@/services/inventory/inventoryLots';
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
  key: string;
  product_id: number;
  product_name: string;
  quantity: string;
  variant_id?: string | null;
  batch_id?: string | null;
  variant_sku?: string | null;
  batch_number?: string | null;
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
  const [lotPickerKey, setLotPickerKey] = useState<string | null>(null);

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
    const key = stockCountLineKey(product.id, null, null);
    const exists = items.find((i) => i.key === key);
    if (exists) {
      setItems(items.map((i) => (i.key === key ? { ...i, quantity: String(Number(i.quantity) + 1) } : i)));
    } else {
      setItems([
        ...items,
        {
          key,
          product_id: product.id,
          product_name: product.name ?? 'منتج',
          quantity: '1',
          variant_id: null,
          batch_id: null,
        },
      ]);
    }
  };

  const applyLotToItem = (itemKey: string, lot: InventoryLotSelection) => {
    setItems((prev) =>
      prev.map((row) => {
        if (row.key !== itemKey) return row;
        const nextKey = stockCountLineKey(row.product_id, lot.variant_id, lot.batch_id);
        return {
          ...row,
          key: nextKey,
          variant_id: lot.variant_id,
          batch_id: lot.batch_id,
          variant_sku: lot.variant_sku ?? null,
          batch_number: lot.batch_number ?? null,
        };
      }),
    );
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
        items: items.map((i) => ({
          product_id: i.product_id,
          quantity: Number(i.quantity),
          ...(i.variant_id ? { variant_id: i.variant_id } : {}),
          ...(i.batch_id ? { batch_id: i.batch_id } : {}),
        })),
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
      <View style={{ paddingBottom: spacing.xxl }}>
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
                  key={item.key}
                  title={item.product_name}
                  onRemove={() => setItems(items.filter((_, i) => i !== index))}
                >
                  {fromWarehouseId ? (
                    <AppButton
                      title={
                        item.variant_sku || item.batch_number
                          ? [item.variant_sku ? `متغير: ${item.variant_sku}` : null, item.batch_number ? `دفعة: ${item.batch_number}` : null]
                              .filter(Boolean)
                              .join(' • ')
                          : 'اختر دفعة / متغير (اختياري)'
                      }
                      variant="secondary"
                      onPress={() => setLotPickerKey(item.key)}
                    />
                  ) : null}
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
      </View>

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد التحويل"
        message={`سيتم تحويل ${items.length} صنف من «${warehouses.find((w) => w.value === fromWarehouseId)?.label ?? ''}» إلى «${warehouses.find((w) => w.value === toWarehouseId)?.label ?? ''}».`}
        confirmLabel="تأكيد"
        onConfirm={() => void handleSubmit()}
        onCancel={() => setConfirmVisible(false)}
      />
      {lotPickerKey && fromWarehouseId ? (
        (() => {
          const row = items.find((i) => i.key === lotPickerKey);
          if (!row) return null;
          return (
            <BatchPickerSheet
              visible
              warehouseId={fromWarehouseId}
              productId={row.product_id}
              productName={row.product_name}
              onClose={() => setLotPickerKey(null)}
              onSelect={(lot) => {
                applyLotToItem(lotPickerKey, lot);
                setLotPickerKey(null);
              }}
            />
          );
        })()
      ) : null}
    </AppScreen>
  );
}
