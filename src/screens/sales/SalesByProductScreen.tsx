import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { salesAPI } from '@/api/sales';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppInput } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import type { Sale } from '@/types/api';
import { asText, dateText, money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

type SoldProductItem = {
  id: string;
  sale_id: number;
  product_id?: number;
  product_name: string;
  product_barcode: string;
  invoice_number: string;
  sale_date?: string;
  customer_name: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  status?: string;
};

function numeric(value: unknown): number {
  const n = typeof value === 'string' ? Number(value) : typeof value === 'number' ? value : 0;
  return Number.isFinite(n) ? n : 0;
}

function saleItemsToProductLines(sales: Sale[]): SoldProductItem[] {
  const rows: SoldProductItem[] = [];
  for (const sale of sales) {
    const saleRecord = sale as Sale & Record<string, unknown>;
    if (sale.status && sale.status !== 'completed') continue;
    const items = Array.isArray(sale.items) ? sale.items : [];
    for (const rawItem of items) {
      const item = rawItem as Record<string, unknown>;
      const product = (item.product as Record<string, unknown> | undefined) ?? {};
      const productId = numeric(item.product_id ?? product.id);
      if (!productId) continue;
      const quantity = numeric(item.quantity);
      const unitPrice = numeric(item.unit_price);
      rows.push({
        id: `${sale.id}-${asText(item.id ?? productId)}`,
        sale_id: sale.id,
        product_id: productId,
        product_name: asText(product.name, 'منتج غير معروف'),
        product_barcode: asText((product.barcodes as unknown[] | undefined)?.[0] ?? product.barcode, '-'),
        invoice_number: asText(sale.invoice_number ?? `#${sale.id}`),
        sale_date: asText(saleRecord.sale_date ?? sale.created_at, ''),
        customer_name: asText(sale.customer?.name, 'عميل عابر'),
        quantity,
        unit_price: unitPrice,
        subtotal: numeric(item.subtotal) || quantity * unitPrice,
        status: sale.status,
      });
    }
  }
  return rows.sort((a, b) => new Date(b.sale_date ?? '').getTime() - new Date(a.sale_date ?? '').getTime());
}

export function SalesByProductScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const [rows, setRows] = useState<SoldProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<SoldProductItem | null>(null);
  const [refunding, setRefunding] = useState(false);

  const load = useCallback(async (mode: 'initial' | 'refresh' = 'initial') => {
    if (mode === 'initial') setLoading(true);
    if (mode === 'refresh') setRefreshing(true);
    try {
      const params: Record<string, unknown> = { per_page: 1000 };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const response = await salesAPI.getAll(params);
      const data = Array.isArray(response.data) ? response.data : [];
      setRows(saleItemsToProductLines(data));
      setError(null);
    } catch (err) {
      setRows([]);
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void load();
  }, [load]);

  const filteredRows = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) =>
      [row.product_name, row.product_barcode, row.invoice_number, row.customer_name]
        .some((value) => value.toLowerCase().includes(term)),
    );
  }, [query, rows]);

  const openSale = useCallback((row: SoldProductItem) => {
    navigation.getParent?.()?.navigate('SalesTab', {
      screen: 'SaleDetail',
      params: { id: row.sale_id, invoice: row.invoice_number },
    });
  }, [navigation]);

  const confirmRefund = useCallback(async () => {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await salesAPI.refund(refundTarget.sale_id);
      setRefundTarget(null);
      await load('refresh');
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setRefunding(false);
    }
  }, [load, refundTarget]);

  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <AppScreen
      title="مبيعات المنتجات"
      subtitle="أسطر المنتجات المباعة مع بحث وتصفية بالتاريخ"
      scroll={false}
      onBack={navigation.goBack}
      headerRight={(
        <View style={styles.headerActions}>
          <Pressable onPress={() => setFilterOpen(true)} accessibilityRole="button" accessibilityLabel="فلاتر">
            <MaterialIcons name="filter-list" size={24} color={c.text} />
          </Pressable>
          <Pressable onPress={() => void load('refresh')} accessibilityRole="button" accessibilityLabel="تحديث">
            <MaterialIcons name="refresh" size={24} color={c.accent} />
          </Pressable>
        </View>
      )}
    >
      <View style={styles.searchWrap}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث باسم المنتج أو الباركود أو الفاتورة..." />
      </View>
      {loading && rows.length === 0 ? <AppLoadingState variant="skeleton" skeletonRows={8} /> : null}
      {error && rows.length === 0 ? <AppErrorState message={error} onRetry={() => void load()} /> : null}
      {!loading || rows.length > 0 ? (
        <ResourceList
          data={filteredRows}
          refreshing={refreshing}
          onRefresh={() => void load('refresh')}
          emptyTitle="لا توجد منتجات مباعة"
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AppCard style={styles.card} onPress={() => openSale(item)}>
              <View style={styles.cardTop}>
                <AppBadge label={item.status === 'completed' ? 'مكتملة' : asText(item.status)} tone="success" />
                <AppText style={styles.invoiceText}>{item.invoice_number}</AppText>
              </View>
              <AppText style={styles.title}>{item.product_name}</AppText>
              <AppText style={styles.meta}>{item.customer_name} • {dateText(item.sale_date)}</AppText>
              <View style={styles.metrics}>
                <AppText style={styles.metric}>الكمية: {numberText(item.quantity)}</AppText>
                <AppText style={styles.metric}>السعر: {money(item.unit_price)}</AppText>
                <AppText style={styles.metricStrong}>الإجمالي: {money(item.subtotal)}</AppText>
              </View>
              <View style={styles.actions}>
                <AppButton title="فتح الفاتورة" size="sm" variant="secondary" onPress={() => openSale(item)} />
                <AppButton title="مرتجع كامل" size="sm" variant="danger" onPress={() => setRefundTarget(item)} />
              </View>
            </AppCard>
          )}
        />
      ) : null}
      {error && rows.length > 0 ? <AppErrorState message={error} onRetry={() => void load('refresh')} /> : null}

      <AppBottomSheet visible={filterOpen} onClose={() => setFilterOpen(false)} title="تصفية مبيعات المنتجات">
        <View style={{ gap: spacing.md }}>
          <AppInput label="من تاريخ" value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          <AppInput label="إلى تاريخ" value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
          <View style={styles.actions}>
            <AppButton title="مسح" variant="outline" onPress={() => { setFromDate(''); setToDate(''); }} />
            <AppButton title="تطبيق" onPress={() => { setFilterOpen(false); void load('refresh'); }} />
          </View>
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={Boolean(refundTarget)}
        title="تأكيد المرتجع"
        message={`سيتم تنفيذ مرتجع كامل للفاتورة ${refundTarget?.invoice_number ?? ''}. هذه عملية مالية ولا يمكن اعتبارها مراجعة فقط.`}
        confirmLabel="تنفيذ المرتجع"
        loading={refunding}
        onConfirm={() => void confirmRefund()}
        onCancel={() => setRefundTarget(null)}
      />
    </AppScreen>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    headerActions: { ...flexRow, gap: spacing.md },
    searchWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    card: { gap: spacing.sm },
    cardTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    invoiceText: { color: c.textMuted, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.label },
    title: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
    meta: { ...textStart, color: c.textMuted, fontSize: typography.small },
    metrics: { gap: 4 },
    metric: { ...textStart, color: c.textMuted, fontSize: typography.small },
    metricStrong: { ...textStart, color: c.success, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
    actions: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
  });
}
