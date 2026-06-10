import React, { useEffect, useState } from 'react';
import { BatchPickerSheet } from '@/components/inventory/BatchPickerSheet';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { stockCountsAPI } from '@/api/stockCounts';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { AppButton, AppCard, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { dateText, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import type { MoreStackParamList } from '@/types/navigation';
import { asText } from '@/utils/format';
import {
  balancesToStockCountLines,
  fetchAllBalancesForWarehouse,
  mergeStockCountLines,
  stockCountLineKey,
  type StockCountLineDraft,
} from '@/services/inventory/stockCountLines';
import { upsertStockCountItemsChunked } from '@/services/inventory/stockCountChunkedUpsert';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockCountDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockCountDetail'>;

function StockCountBody({
  doc,
  refresh,
  id,
}: {
  doc: Record<string, unknown>;
  refresh: () => void;
  id: string;
}) {
  const [lines, setLines] = useState<StockCountLineDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [lotPickerLineIndex, setLotPickerLineIndex] = useState<number | null>(null);
  const isDraft = doc.status === 'draft';
  const serverItems = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];
  const warehouseId = String((doc.warehouse as Record<string, unknown>)?.id ?? doc.warehouse_id ?? '');

  useEffect(() => {
    if (serverItems.length) {
      setLines(
        serverItems.map((it) => {
          const productId = Number(it.product_id);
          const variantId = it.variant_id != null ? String(it.variant_id) : null;
          const batchId = it.batch_id != null ? String(it.batch_id) : null;
          return {
            key: stockCountLineKey(productId, variantId, batchId),
            product_id: productId,
            variant_id: variantId,
            batch_id: batchId,
            product_name: asText((it.product as Record<string, unknown>)?.name ?? it.product_name, 'منتج'),
            system_quantity: Number(it.system_quantity ?? 0),
            counted_quantity: String(it.counted_quantity ?? 0),
            variant_sku: (it.variant as Record<string, unknown>)?.sku
              ? String((it.variant as Record<string, unknown>).sku)
              : null,
            batch_number: (it.batch as Record<string, unknown>)?.batch_number
              ? String((it.batch as Record<string, unknown>).batch_number)
              : null,
          };
        }),
      );
    }
  }, [doc.id, doc.status, serverItems.length]);

  const addProduct = (product: { id: number; name?: string }) => {
    const key = stockCountLineKey(product.id, null, null);
    if (lines.some((l) => l.key === key)) return;
    setLines([
      ...lines,
      {
        key,
        product_id: product.id,
        variant_id: null,
        batch_id: null,
        product_name: product.name ?? 'منتج',
        system_quantity: 0,
        counted_quantity: '0',
      },
    ]);
  };

  const loadWarehouseBalances = async () => {
    if (!warehouseId) {
      Alert.alert('تنبيه', 'لا يوجد مخزن مرتبط بجلسة الجرد.');
      return;
    }
    setLoadingBalances(true);
    try {
      const balances = await fetchAllBalancesForWarehouse(warehouseId);
      const draft = balancesToStockCountLines(balances);
      setLines((prev) => mergeStockCountLines(prev, draft));
      Alert.alert('تم', `تم تحميل ${draft.length} سطر رصيد من المخزن.`);
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setLoadingBalances(false);
    }
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      const payload = lines.map((l) => ({
        product_id: l.product_id,
        counted_quantity: Number(l.counted_quantity) || 0,
        variant_id: l.variant_id,
        batch_id: l.batch_id,
      }));
      await upsertStockCountItemsChunked(id, payload);
      Alert.alert('تم', 'تم حفظ بنود الجرد');
      refresh();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const postCount = async () => {
    setConfirmPost(false);
    setPosting(true);
    try {
      await stockCountsAPI.post(id);
      Alert.alert('تم', 'تم ترحيل الجرد');
      refresh();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setPosting(false);
    }
  };

  if (isDraft) {
    return (
      <>
        <AppCard>
          <AppSectionHeader title="إدخال الكميات" />
          <AppButton
            title="تحميل أرصدة المخزن"
            variant="secondary"
            loading={loadingBalances}
            onPress={() => void loadWarehouseBalances()}
          />
          <InventoryProductSearch onSelect={addProduct} />
          {lines.map((line, index) => (
            <View key={line.key} style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <AppListItem
                title={line.product_name}
                subtitle={[
                  line.variant_sku ? `متغير: ${line.variant_sku}` : null,
                  line.batch_number ? `دفعة: ${line.batch_number}` : null,
                  `نظام: ${numberText(line.system_quantity)}`,
                ]
                  .filter(Boolean)
                  .join(' • ')}
              />
              <AppInput
                label="الكمية المعدودة"
                keyboardType="numeric"
                value={line.counted_quantity}
                onChangeText={(v) => {
                  const next = [...lines];
                  next[index] = { ...line, counted_quantity: v };
                  setLines(next);
                }}
              />
              <AppButton
                title={
                  line.variant_sku || line.batch_number
                    ? [line.variant_sku ? `متغير: ${line.variant_sku}` : null, line.batch_number ? `دفعة: ${line.batch_number}` : null]
                        .filter(Boolean)
                        .join(' • ')
                    : 'اختر من الرصيد (دفعة / متغير)'
                }
                variant="secondary"
                onPress={() => setLotPickerLineIndex(index)}
              />
            </View>
          ))}
          <AppButton title="حفظ البنود" variant="secondary" loading={saving} disabled={!lines.length} onPress={() => void saveItems()} />
          <AppButton title="ترحيل الجرد" loading={posting} onPress={() => setConfirmPost(true)} />
        </AppCard>
        <ConfirmDialog
          visible={confirmPost}
          title="ترحيل الجرد"
          message="سيتم تطبيق فروقات الجرد على المخزون."
          confirmLabel="ترحيل"
          loading={posting}
          onCancel={() => setConfirmPost(false)}
          onConfirm={() => void postCount()}
        />
        {lotPickerLineIndex != null && lines[lotPickerLineIndex] ? (
          <BatchPickerSheet
            visible
            warehouseId={warehouseId}
            productId={lines[lotPickerLineIndex].product_id}
            productName={lines[lotPickerLineIndex].product_name}
            onClose={() => setLotPickerLineIndex(null)}
            onSelect={(lot) => {
              const idx = lotPickerLineIndex;
              setLotPickerLineIndex(null);
              setLines((prev) => {
                const next = [...prev];
                const line = next[idx];
                if (!line) return prev;
                next[idx] = {
                  ...line,
                  variant_id: lot.variant_id,
                  batch_id: lot.batch_id,
                  variant_sku: lot.variant_sku ?? null,
                  batch_number: lot.batch_number ?? null,
                  system_quantity: lot.system_quantity ?? line.system_quantity,
                  key: stockCountLineKey(line.product_id, lot.variant_id, lot.batch_id),
                };
                return next;
              });
            }}
          />
        ) : null}
      </>
    );
  }

  return (
    <AppCard>
      <AppSectionHeader title="بنود الجرد" />
      {serverItems.map((it, index) => (
        <AppListItem
          key={String(it.id ?? index)}
          title={asText((it.product as Record<string, unknown>)?.name, 'منتج')}
          subtitle={[
            it.variant_id ? `متغير: ${String(it.variant_id)}` : null,
            it.batch_id ? `دفعة: ${String(it.batch_id)}` : null,
            `نظام: ${numberText(it.system_quantity)}`,
          ]
            .filter(Boolean)
            .join(' • ')}
          meta={`معدود: ${numberText(it.counted_quantity)}`}
        />
      ))}
    </AppCard>
  );
}

export function StockCountDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const id = route.params.id;
  return (
    <DetailScreen
      title="جلسة الجرد"
      onBack={navigation.goBack}
      loader={() => stockCountsAPI.get(id)}
      badge={(doc) => ({
        label: asText(doc.status, '—'),
        tone: doc.status === 'posted' ? 'success' : 'warning',
      })}
      fields={[
        { label: 'المستودع', value: (d) => asText((d.warehouse as Record<string, unknown>)?.name ?? d.warehouse_name) },
        { label: 'التاريخ', value: (d) => dateText(String(d.created_at ?? '')) },
        { label: 'الفرق', value: (d) => numberText(d.variance_total ?? 0), ltr: true },
      ]}
    >
      {(doc, { refresh }) => <StockCountBody doc={doc} refresh={refresh} id={id} />}
    </DetailScreen>
  );
}
