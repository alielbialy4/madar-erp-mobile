import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { BatchPickerSheet } from '@/components/inventory/BatchPickerSheet';
import { InventoryProductSearch } from '@/components/inventory/InventoryProductSearch';
import { stockCountsAPI } from '@/api/stockCounts';
import { DetailScreen } from '@/screens/shared/DetailScreen';
import { FormSection } from '@/components/forms/FormSection';
import { AppButton, AppInput, AppListItem } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBanner, ConfirmDialog } from '@/components/feedback';
import { dateText, numberText, asText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { useInventoryScope } from '@/hooks/useInventoryScope';
import { inventoryStatusLabel } from '@/utils/inventoryLabels';
import type { MoreStackParamList } from '@/types/navigation';
import {
  balancesToStockCountLines,
  fetchAllBalancesForWarehouse,
  mergeStockCountLines,
  stockCountLineKey,
  type StockCountLineDraft,
} from '@/services/inventory/stockCountLines';
import { upsertStockCountItemsChunked } from '@/services/inventory/stockCountChunkedUpsert';
import { parseStockCountQuantity } from '@/utils/stockCountQuantity';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockCountDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockCountDetail'>;
type Stage = 'entry' | 'review';

function StockCountBody({
  doc,
  refresh,
  id,
}: {
  doc: Record<string, unknown>;
  refresh: () => void;
  id: string;
}) {
  const c = useColors();
  const { canOperateDocuments } = useInventoryScope();
  const [lines, setLines] = useState<StockCountLineDraft[]>([]);
  const [stage, setStage] = useState<Stage>('entry');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingBalances, setLoadingBalances] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const [notice, setNotice] = useState<{ message: string; tone: 'danger' | 'success' | 'info' } | null>(null);
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({});
  const [lotPickerLineIndex, setLotPickerLineIndex] = useState<number | null>(null);
  const isDraft = doc.status === 'draft';
  const serverItems = useMemo(
    () => (Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : []),
    [doc.items],
  );
  const persistedLineKeys = useMemo(() => new Set(serverItems.map((item) => stockCountLineKey(
    Number(item.product_id),
    item.variant_id != null ? String(item.variant_id) : null,
    item.batch_id != null ? String(item.batch_id) : null,
  ))), [serverItems]);
  const warehouseId = String((doc.warehouse as Record<string, unknown>)?.id ?? doc.warehouse_id ?? '');

  const styles = useMemo(() => StyleSheet.create({
    line: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    lineHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    lineTitle: { ...textStart, flex: 1, color: c.text, fontSize: typography.body, fontWeight: '800' },
    lineMeta: { ...textStart, color: c.textMuted, fontSize: typography.small },
    difference: { ...textStart, color: c.text, fontSize: typography.small, fontWeight: '800' },
    differencePositive: { color: c.success },
    differenceNegative: { color: c.danger },
    lineError: { ...textStart, color: c.danger, fontSize: typography.tiny, fontWeight: '700' },
    actions: { gap: spacing.sm },
    actionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    actionGrow: { flexGrow: 1, minWidth: 140 },
  }), [c]);

  useEffect(() => {
    setLines(serverItems.map((item) => {
      const productId = Number(item.product_id);
      const variantId = item.variant_id != null ? String(item.variant_id) : null;
      const batchId = item.batch_id != null ? String(item.batch_id) : null;
      return {
        key: stockCountLineKey(productId, variantId, batchId),
        product_id: productId,
        variant_id: variantId,
        batch_id: batchId,
        product_name: asText((item.product as Record<string, unknown>)?.name ?? item.product_name, 'منتج'),
        system_quantity: Number(item.system_quantity ?? 0),
        counted_quantity: String(item.counted_quantity ?? 0),
        variant_sku: (item.variant as Record<string, unknown>)?.sku
          ? String((item.variant as Record<string, unknown>).sku)
          : null,
        batch_number: (item.batch as Record<string, unknown>)?.batch_number
          ? String((item.batch as Record<string, unknown>).batch_number)
          : null,
      };
    }));
    setDirty(false);
    setLineErrors({});
  }, [doc.id, doc.status, serverItems]);

  const updateLine = (index: number, patch: Partial<StockCountLineDraft>) => {
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));
    setDirty(true);
    setStage('entry');
  };

  const addProduct = (product: { id: number; name?: string }) => {
    const key = stockCountLineKey(product.id, null, null);
    if (lines.some((line) => line.key === key)) {
      setNotice({ message: 'هذا المنتج موجود بالفعل في بنود الجرد.', tone: 'info' });
      return;
    }
    setLines((current) => [
      ...current,
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
    setDirty(true);
    setStage('entry');
  };

  const loadWarehouseBalances = async () => {
    if (!warehouseId) {
      setNotice({ message: 'لا يوجد مخزن مرتبط بجلسة الجرد.', tone: 'danger' });
      return;
    }
    setLoadingBalances(true);
    setNotice(null);
    try {
      const balances = await fetchAllBalancesForWarehouse(warehouseId);
      const draft = balancesToStockCountLines(balances);
      setLines((current) => mergeStockCountLines(current, draft));
      setDirty(true);
      setStage('entry');
      setNotice({ message: `تم تحميل ${numberText(draft.length)} سطر رصيد من المخزن.`, tone: 'success' });
    } catch (err) {
      setNotice({ message: normalizeApiError(err).message, tone: 'danger' });
    } finally {
      setLoadingBalances(false);
    }
  };

  const validateLines = (): boolean => {
    const nextErrors: Record<string, string> = {};
    const seen = new Set<string>();
    for (const line of lines) {
      const parsed = parseStockCountQuantity(line.counted_quantity);
      if (!parsed.ok) nextErrors[line.key] = parsed.error;
      if (seen.has(line.key)) nextErrors[line.key] = 'يوجد سطر مكرر لنفس المنتج والمتغير والدفعة.';
      seen.add(line.key);
    }
    setLineErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const saveItems = async () => {
    if (!canOperateDocuments) {
      setNotice({ message: 'لا تملك صلاحية إدارة الجرد.', tone: 'danger' });
      return;
    }
    if (!lines.length || !validateLines()) return;
    setSaving(true);
    setNotice(null);
    try {
      const payload = lines.map((line) => ({
        product_id: line.product_id,
        counted_quantity: parseStockCountQuantity(line.counted_quantity).value,
        variant_id: line.variant_id,
        batch_id: line.batch_id,
      }));
      await upsertStockCountItemsChunked(id, payload);
      setDirty(false);
      setStage('review');
      setNotice({ message: 'تم حفظ البنود. راجع الفروقات قبل الترحيل.', tone: 'success' });
      refresh();
    } catch (err) {
      setNotice({ message: normalizeApiError(err).message, tone: 'danger' });
    } finally {
      setSaving(false);
    }
  };

  const reviewStats = useMemo(() => {
    let unchanged = 0;
    let positive = 0;
    let negative = 0;
    for (const line of lines) {
      const parsed = parseStockCountQuantity(line.counted_quantity);
      if (!parsed.ok) continue;
      const difference = parsed.value - line.system_quantity;
      if (difference === 0) unchanged += 1;
      else if (difference > 0) positive += 1;
      else negative += 1;
    }
    return { unchanged, positive, negative, total: lines.length };
  }, [lines]);

  const changedLines = useMemo(
    () => lines.filter((line) => {
      const parsed = parseStockCountQuantity(line.counted_quantity);
      return !parsed.ok || parsed.value !== line.system_quantity;
    }),
    [lines],
  );

  const postCount = async () => {
    setConfirmPost(false);
    if (dirty || stage !== 'review' || !validateLines()) {
      setNotice({ message: 'احفظ البنود وراجع الفروقات قبل الترحيل.', tone: 'danger' });
      return;
    }
    setPosting(true);
    setNotice(null);
    try {
      await stockCountsAPI.post(id);
      setNotice({ message: 'تم ترحيل الجرد وتحديث أرصدة المخزون.', tone: 'success' });
      refresh();
    } catch (err) {
      setNotice({ message: normalizeApiError(err).message, tone: 'danger' });
    } finally {
      setPosting(false);
    }
  };

  if (!isDraft) {
    return (
      <FormSection title="بنود الجرد المرحّل" subtitle="سجل للقراءة فقط بعد تحديث المخزون" icon="fact-check">
        {serverItems.map((item, index) => (
          <AppListItem
            key={String(item.id ?? index)}
            title={asText((item.product as Record<string, unknown>)?.name, 'منتج')}
            subtitle={[
              item.variant_id ? `متغير: ${String(item.variant_id)}` : null,
              item.batch_id ? `دفعة: ${String(item.batch_id)}` : null,
              `دفتري: ${numberText(item.system_quantity)}`,
            ].filter(Boolean).join(' · ')}
            meta={`فعلي: ${numberText(item.counted_quantity)}`}
          />
        ))}
      </FormSection>
    );
  }

  return (
    <>
      {!canOperateDocuments ? (
        <AppBanner tone="warning" message="هذه الجلسة للقراءة فقط لأنك لا تملك صلاحية إدارة المخزون." />
      ) : null}
      {notice ? <AppBanner tone={notice.tone} message={notice.message} onDismiss={() => setNotice(null)} /> : null}

      {stage === 'entry' ? (
        <>
          <AppBanner
            tone="info"
            message="احفظ البنود أولًا. لن يظهر إجراء الترحيل إلا بعد الانتقال إلى مراجعة الفروقات."
          />
          <FormSection title="إدخال الكميات الفعلية" subtitle="القيمة الدفترية مرجع، والكمية المعدودة هي ما وجده فريق الجرد" icon="playlist-add-check">
            <View style={styles.actionRow}>
              <AppButton
                title="تحميل أرصدة المخزن"
                variant="secondary"
                loading={loadingBalances}
                onPress={() => void loadWarehouseBalances()}
                disabled={!canOperateDocuments}
                style={styles.actionGrow}
              />
            </View>
            {canOperateDocuments ? <InventoryProductSearch onSelect={addProduct} /> : null}
            {lines.map((line, index) => {
              const parsed = parseStockCountQuantity(line.counted_quantity);
              const difference = parsed.ok ? parsed.value - line.system_quantity : null;
              const persisted = persistedLineKeys.has(line.key);
              return (
                <View key={`${line.key}-${index}`} style={styles.line}>
                  <View style={styles.lineHeader}>
                    <Text style={styles.lineTitle}>{line.product_name}</Text>
                    <AppButton
                      title={persisted ? 'إلغاء الفرق' : 'إزالة'}
                      variant="dangerGhost"
                      onPress={() => {
                        if (persisted) {
                          updateLine(index, { counted_quantity: String(line.system_quantity) });
                          return;
                        }
                        setLines((current) => current.filter((_, lineIndex) => lineIndex !== index));
                        setDirty(true);
                      }}
                      disabled={!canOperateDocuments}
                    />
                  </View>
                  <Text style={styles.lineMeta}>
                    {[
                      line.variant_sku ? `متغير ${line.variant_sku}` : null,
                      line.batch_number ? `دفعة ${line.batch_number}` : null,
                      `الرصيد الدفتري ${numberText(line.system_quantity)}`,
                    ].filter(Boolean).join(' · ')}
                  </Text>
                  <AppInput
                    label="الكمية المعدودة"
                    keyboardType="number-pad"
                    value={line.counted_quantity}
                    onChangeText={(value) => updateLine(index, { counted_quantity: value })}
                    editable={canOperateDocuments}
                  />
                  {lineErrors[line.key] ? <Text style={styles.lineError}>{lineErrors[line.key]}</Text> : null}
                  <Text
                    style={[
                      styles.difference,
                      difference != null && difference > 0 && styles.differencePositive,
                      difference != null && difference < 0 && styles.differenceNegative,
                    ]}
                  >
                    الفرق: {difference == null ? '—' : `${difference > 0 ? '+' : ''}${numberText(difference)}`}
                  </Text>
                  <AppButton
                    title={line.variant_sku || line.batch_number
                      ? [line.variant_sku ? `متغير ${line.variant_sku}` : null, line.batch_number ? `دفعة ${line.batch_number}` : null].filter(Boolean).join(' · ')
                      : 'اختيار متغير أو دفعة من الرصيد'}
                    variant="secondary"
                    onPress={() => setLotPickerLineIndex(index)}
                    disabled={!canOperateDocuments}
                  />
                </View>
              );
            })}
            <AppButton
              title={dirty ? 'حفظ البنود والمراجعة' : 'مراجعة الفروقات'}
              loading={saving}
              disabled={!lines.length || saving || !canOperateDocuments}
              onPress={() => void saveItems()}
            />
          </FormSection>
        </>
      ) : (
        <>
          <AppBanner
            tone="warning"
            message="الترحيل ينشئ حركات مخزون نهائية للفروقات. ارجع للإدخال إذا كانت أي كمية غير صحيحة."
          />
          <FormSection
            title="مراجعة الفروقات"
            subtitle={`${numberText(reviewStats.total)} سطر · زيادة ${numberText(reviewStats.positive)} · نقصان ${numberText(reviewStats.negative)} · مطابق ${numberText(reviewStats.unchanged)}`}
            icon="rule"
          >
            {changedLines.length === 0 ? (
              <AppBanner tone="info" message="كل الكميات مطابقة للأرصدة الدفترية؛ لن تنشأ فروقات كمية." />
            ) : null}
            {changedLines.map((line) => {
              const parsed = parseStockCountQuantity(line.counted_quantity);
              const counted = parsed.ok ? parsed.value : 0;
              const difference = counted - line.system_quantity;
              return (
                <AppListItem
                  key={line.key}
                  title={line.product_name}
                  subtitle={`دفتري ${numberText(line.system_quantity)} · فعلي ${numberText(counted)}`}
                  meta={`الفرق ${difference > 0 ? '+' : ''}${numberText(difference)}`}
                />
              );
            })}
            <View style={styles.actions}>
              <AppButton title="العودة لتعديل الكميات" variant="secondary" onPress={() => setStage('entry')} disabled={posting} />
              <AppButton title="ترحيل فروقات الجرد" onPress={() => setConfirmPost(true)} loading={posting} disabled={dirty || posting || !canOperateDocuments} />
            </View>
          </FormSection>
        </>
      )}

      <ConfirmDialog
        visible={confirmPost}
        title="ترحيل الجرد نهائيًا"
        message={`سيتم إنشاء حركات مخزون: ${numberText(reviewStats.positive)} زيادة و${numberText(reviewStats.negative)} نقصان. لا يمكن تعديل الجلسة بعد الترحيل.`}
        confirmLabel="ترحيل وتحديث المخزون"
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
            const index = lotPickerLineIndex;
            setLotPickerLineIndex(null);
            const current = lines[index];
            if (!current) return;
            const nextKey = stockCountLineKey(current.product_id, lot.variant_id, lot.batch_id);
            if (lines.some((line, lineIndex) => lineIndex !== index && line.key === nextKey)) {
              setNotice({ message: 'هذا المتغير أو دفعة التشغيل موجودة بالفعل في الجرد.', tone: 'danger' });
              return;
            }
            updateLine(index, {
              variant_id: lot.variant_id,
              batch_id: lot.batch_id,
              variant_sku: lot.variant_sku ?? null,
              batch_number: lot.batch_number ?? null,
              system_quantity: lot.system_quantity ?? current.system_quantity,
              key: nextKey,
            });
          }}
        />
      ) : null}
    </>
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
        label: inventoryStatusLabel(doc.status_label_ar ?? doc.status),
        tone: doc.status === 'posted' ? 'success' : 'warning',
      })}
      fields={[
        { label: 'المستودع', value: (doc) => asText((doc.warehouse as Record<string, unknown>)?.name ?? doc.warehouse_name) },
        { label: 'التاريخ', value: (doc) => dateText(String(doc.created_at ?? '')) },
        { label: 'إجمالي الفرق', value: (doc) => numberText(doc.variance_total ?? 0), ltr: true },
      ]}
    >
      {(doc, { refresh }) => <StockCountBody doc={doc} refresh={refresh} id={id} />}
    </DetailScreen>
  );
}
