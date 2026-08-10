import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI } from '@/api/inventory';
import { AppScreen, FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { BatchPickerSheet } from '@/components/inventory/BatchPickerSheet';
import { InventoryLineItemCard } from '@/components/inventory/InventoryLineItemCard';
import { stockCountLineKey } from '@/services/inventory/stockCountLines';
import type { InventoryLotSelection } from '@/services/inventory/inventoryLots';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import type { SelectOption } from '@/components/ui/AppSelect';
import { AppBanner, ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
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
      const res = await inventoryAPI.createStockTransfer({
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
      const data = (res as { data?: Record<string, unknown> }).data ?? res;
      const id = String((data as Record<string, unknown>).id ?? '');
      Alert.alert('تم بنجاح', 'تم إنشاء التحويل كطلب معلّق للمراجعة والتنفيذ');
      if (id) navigation.replace('StockTransferDetail', { id });
      else navigation.goBack();
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
    <FormScreenLayout
      title="تحويل مخزون"
      subtitle="إنشاء طلب حركة بين مخزنين"
      onBack={navigation.goBack}
      heroTitle="مسار التحويل"
      heroSubtitle="حدد المصدر والوجهة، ثم أضف الكميات التي ستُنقل بعد اعتماد التنفيذ."
      heroAmount={`${items.length} صنف`}
      saveLabel="مراجعة وإنشاء التحويل"
      onSave={() => setConfirmVisible(true)}
      saveLoading={submitting}
      saveDisabled={!canSubmit || submitting}
      onCancel={navigation.goBack}
    >
      <AppBanner
        tone="info"
        message="إنشاء التحويل لا يغيّر الأرصدة. يتم الخصم من المصدر والإضافة للوجهة فقط عند إكمال التحويل."
      />
      <FormSection title="نطاق التحويل" subtitle="مخزن المصدر والوجهة والتكلفة التشغيلية" icon="swap-horiz">
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
      </FormSection>

      <FormSection title="إضافة الأصناف" subtitle="ابحث ثم اضغط لإضافة الصنف إلى التحويل" icon="search">
        <InventoryProductSearch onSelect={addProduct} />
      </FormSection>

      {items.length === 0 ? (
        <AppEmptyState title="لم تضف أصنافًا بعد" message="أضف صنفًا واحدًا على الأقل لبناء التحويل." />
      ) : (
        <FormSection title={`الأصناف (${items.length})`} subtitle="راجع الدفعة والكمية قبل إنشاء الطلب" icon="inventory-2">
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
                error={Number(item.quantity) > 0 ? undefined : 'أدخل كمية أكبر من صفر'}
              />
            </InventoryLineItemCard>
          ))}
        </FormSection>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="إنشاء طلب التحويل"
        message={`سيتم إنشاء طلب معلّق يضم ${items.length} صنف من «${warehouses.find((w) => w.value === fromWarehouseId)?.label ?? ''}» إلى «${warehouses.find((w) => w.value === toWarehouseId)?.label ?? ''}» دون تغيير الأرصدة الآن.`}
        confirmLabel="إنشاء الطلب"
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
    </FormScreenLayout>
  );
}
