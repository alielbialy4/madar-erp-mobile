import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { inventoryAPI } from '@/api/inventory';
import { AppScreen, FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { BatchPickerSheet } from '@/components/inventory/BatchPickerSheet';
import { InventoryLineItemCard, lineTotal } from '@/components/inventory/InventoryLineItemCard';
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

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockAdjustment'>;

type AdjustmentItem = {
  key: string;
  product_id: number;
  product_name: string;
  quantity: string;
  unit_cost: string;
  variant_id?: string | null;
  batch_id?: string | null;
  variant_sku?: string | null;
  batch_number?: string | null;
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
  const [lotPickerKey, setLotPickerKey] = useState<string | null>(null);

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
          unit_cost: String(product.cost_price ?? product.selling_price ?? 0),
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
          ...(i.variant_id ? { variant_id: i.variant_id } : {}),
          ...(i.batch_id ? { batch_id: i.batch_id } : {}),
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

  const reasonLabel = reasonOptions.find((option) => option.value === reason)?.label ?? reason;
  const typeLabel = type === 'addition' ? 'إضافة' : 'خصم';

  return (
    <FormScreenLayout
      title="تسوية مخزون"
      subtitle={createdId ? 'مسودة جاهزة للمراجعة والترحيل' : 'تصحيح مضبوط للكميات الدفترية'}
      onBack={navigation.goBack}
      heroTitle={createdId ? 'التسوية جاهزة للترحيل' : 'بناء مسودة التسوية'}
      heroSubtitle={
        createdId
          ? 'تم حفظ بيانات التسوية. راجع الملخص ثم رحّلها فقط عندما تكون مستعدًا لتحديث الأرصدة.'
          : 'حدد المخزن ونوع التصحيح وسببه، ثم أضف الأصناف والكميات المطلوبة.'
      }
      heroAmount={`${items.length} صنف`}
      saveLabel={createdId ? 'ترحيل وتحديث الأرصدة' : 'مراجعة وإنشاء المسودة'}
      onSave={() => createdId ? setPostConfirmVisible(true) : setConfirmVisible(true)}
      saveLoading={submitting}
      saveDisabled={submitting || (!createdId && !canSubmit)}
      cancelLabel={createdId ? 'العودة للسجل' : 'إلغاء'}
      onCancel={navigation.goBack}
    >
      <AppBanner
        tone={createdId ? 'warning' : 'info'}
        message={
          createdId
            ? 'الترحيل إجراء نهائي يغيّر أرصدة المخزون. راجع النوع والسبب والكميات قبل المتابعة.'
            : 'إنشاء المسودة لا يغيّر المخزون. الأثر الفعلي يحدث فقط عند ترحيل التسوية.'
        }
      />

      {createdId ? (
        <FormSection title="ملخص المسودة" subtitle="هذه هي البيانات المحفوظة في التسوية المنشأة" icon="fact-check">
          <Text style={ui.hint}>النوع: {typeLabel}</Text>
          <Text style={ui.hint}>السبب: {reasonLabel}</Text>
          <Text style={ui.hint}>عدد الأصناف: {items.length}</Text>
          <Text style={ui.successInline}>تم إنشاء المسودة بنجاح</Text>
        </FormSection>
      ) : (
        <>
          <FormSection title="نطاق التسوية" subtitle="المخزن ونوع التصحيح والسبب التشغيلي" icon="edit">
            <AppSelect label="المخزن" value={warehouseId} options={warehouses} onChange={setWarehouseId} />
            <AppSelect label="النوع" value={type} options={typeOptions} onChange={setType} />
            <AppSelect label="السبب" value={reason} options={reasonOptions} onChange={setReason} />
          </FormSection>

          <FormSection title="إضافة الأصناف" subtitle="ابحث ثم اضغط لإضافة الصنف إلى المسودة" icon="search">
            <InventoryProductSearch onSelect={addProduct} />
          </FormSection>

          {items.length === 0 ? (
            <AppEmptyState title="لم تضف أصنافًا بعد" message="أضف صنفًا واحدًا على الأقل لبناء التسوية." />
          ) : (
            <FormSection title={`الأصناف (${items.length})`} subtitle="راجع الكمية والتكلفة لكل صنف" icon="inventory-2">
              {items.map((item, index) => (
                <InventoryLineItemCard
                  key={item.key}
                  title={item.product_name}
                  totalHint={lineTotal(item.quantity, item.unit_cost)}
                  onRemove={() => setItems(items.filter((_, i) => i !== index))}
                >
                  {warehouseId ? (
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
                  <View style={ui.dualFieldRow}>
                    <View style={{ flex: 1 }}>
                      <AppInput
                        label="الكمية"
                        value={item.quantity}
                        onChangeText={(v) =>
                          setItems(items.map((row, i) => (i === index ? { ...row, quantity: v } : row)))
                        }
                        keyboardType="numeric"
                        error={Number(item.quantity) > 0 ? undefined : 'أدخل كمية أكبر من صفر'}
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
                        error={Number(item.unit_cost) >= 0 ? undefined : 'لا يمكن أن تكون التكلفة سالبة'}
                      />
                    </View>
                  </View>
                </InventoryLineItemCard>
              ))}
            </FormSection>
          )}
        </>
      )}

      <ConfirmDialog
        visible={confirmVisible}
        title="إنشاء مسودة التسوية"
        message={`تسوية ${typeLabel} — ${reasonLabel} — ${items.length} صنف. لن تتغير الأرصدة قبل الترحيل.`}
        confirmLabel="إنشاء المسودة"
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
      {lotPickerKey && warehouseId ? (
        (() => {
          const row = items.find((i) => i.key === lotPickerKey);
          if (!row) return null;
          return (
            <BatchPickerSheet
              visible
              warehouseId={warehouseId}
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
