import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { purchasesAPI } from '@/api/purchases';
import type { PurchasePayload } from '@/api/purchases';
import { suppliersAPI } from '@/api/suppliers';
import { productsAPI } from '@/api/products';
import { inventoryAPI } from '@/api/inventory';
import { useBranchStore } from '@/store/branchStore';
import { AppScreen, AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { extractArray } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

type PurchaseItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  unit_id?: number;
  expiry_date?: string;
  batch_number?: string;
  variant_id?: string;
};

export function CreatePurchaseScreen({ navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const [suppliers, setSuppliers] = useState<Record<string, unknown>[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<Record<string, unknown> | null>(null);
  const [supplierQuery, setSupplierQuery] = useState('');
  const [supplierSheetOpen, setSupplierSheetOpen] = useState(false);
  const [supplierLoading, setSupplierLoading] = useState(false);

  const [warehouses, setWarehouses] = useState<Record<string, unknown>[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string | null>(null);

  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [paid, setPaid] = useState('');

  const [productQuery, setProductQuery] = useState('');
  const [productResults, setProductResults] = useState<Record<string, unknown>[]>([]);
  const [productSearchOpen, setProductSearchOpen] = useState(false);
  const [productSearching, setProductSearching] = useState(false);

  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const styles = useMemo(() => StyleSheet.create({
    listContent: { paddingBottom: spacing.xxl, gap: spacing.md },
    headerSection: { gap: spacing.md, paddingBottom: spacing.md },
    selectorButton: { borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: spacing.md, gap: spacing.xs },
    selectorLabel: { color: c.textMuted, fontSize: typography.small, ...textStart },
    selectorValue: { color: c.text, fontSize: typography.body, fontWeight: '700', ...textStart },
    itemRow: { ...flexRow, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: 8, padding: spacing.md, gap: spacing.sm, alignItems: 'flex-start' },
    itemInfo: { flex: 1, gap: spacing.sm },
    itemName: { color: c.text, fontWeight: '900', ...textStart },
    itemFields: { ...flexRow, gap: spacing.sm },
    smallInput: { flex: 1 },
    itemTotal: { color: c.primary, fontWeight: '800', ...textStart },
    removeBtn: { minHeight: 36, flex: 0 },
    footer: { gap: spacing.md, paddingTop: spacing.lg },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    totalLabel: { color: c.textMuted, fontSize: typography.body, ...textStart },
    totalValue: { color: c.text, fontSize: typography.h3, fontWeight: '900', ...textStart },
    errorText: { color: c.danger, ...textStart, fontWeight: '800' },
    sheetContent: { gap: spacing.md },
    sheetList: { maxHeight: 350 },
    hintText: { color: c.textMuted, fontSize: typography.small, ...textStart },
  }), [c]);

  useEffect(() => {
    setSupplierLoading(true);
    suppliersAPI.getAll({ search: supplierQuery || undefined })
      .then((res) => setSuppliers(extractArray(res)))
      .catch(() => {})
      .finally(() => setSupplierLoading(false));
  }, [supplierQuery]);

  useEffect(() => {
    inventoryAPI.warehouses()
      .then((res) => setWarehouses(extractArray(res)))
      .catch(() => {});
  }, []);

  const searchProducts = useCallback(async () => {
    if (!productQuery.trim()) { setProductResults([]); return; }
    setProductSearching(true);
    try {
      const res = await productsAPI.search(productQuery.trim());
      setProductResults(extractArray(res));
    } catch {
      setProductResults([]);
    } finally {
      setProductSearching(false);
    }
  }, [productQuery]);

  useEffect(() => {
    const timer = setTimeout(() => { void searchProducts(); }, 400);
    return () => clearTimeout(timer);
  }, [searchProducts]);

  const addItem = (product: Record<string, unknown>) => {
    const exists = items.find((i) => i.product_id === Number(product.id));
    if (exists) {
      setItems(items.map((i) => i.product_id === Number(product.id) ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        product_id: Number(product.id),
        product_name: String(product.name ?? ''),
        quantity: 1,
        cost_price: Number(product.cost_price ?? 0),
      }]);
    }
    setProductQuery('');
    setProductResults([]);
  };

  const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
    setItems(items.map((item, i) => i === index ? { ...item, [field]: value } : item));
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.quantity * item.cost_price, 0), [items]);
  const total = subtotal;
  const paidAmount = Number(paid) || 0;

  const handleSubmit = async () => {
    if (!selectedSupplier) { setErrorMsg('اختر المورد'); return; }
    if (items.length === 0) { setErrorMsg('أضف صنفاً واحداً على الأقل'); return; }
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: PurchasePayload = {
        supplier_id: Number(selectedSupplier.id),
        purchase_date: purchaseDate,
        items: items.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          cost_price: item.cost_price,
          ...(item.unit_id ? { unit_id: item.unit_id } : {}),
          ...(item.expiry_date ? { expiry_date: item.expiry_date } : {}),
          ...(item.batch_number ? { batch_number: item.batch_number } : {}),
          ...(item.variant_id ? { variant_id: item.variant_id } : {}),
        })),
        subtotal,
        paid: paidAmount,
        ...(notes ? { notes } : {}),
        ...(selectedWarehouse ? { warehouse_id: selectedWarehouse } : {}),
        ...(activeBranch?.id ? { branch_id: activeBranch.id } : {}),
        ...(invoiceNumber ? { invoice_number: invoiceNumber } : {}),
      };
      await purchasesAPI.create(payload);
      navigation.goBack();
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppScreen title="إنشاء شراء" onBack={navigation.goBack} scroll={false}>
      <FlatList
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <Pressable onPress={() => setSupplierSheetOpen(true)} style={styles.selectorButton}>
              <Text style={styles.selectorLabel}>المورد</Text>
              <Text style={styles.selectorValue}>{selectedSupplier ? String(selectedSupplier.name) : 'اختر المورد'}</Text>
            </Pressable>

            <AppInput label="تاريخ الشراء" value={purchaseDate} onChangeText={setPurchaseDate} placeholder="YYYY-MM-DD" />
            <AppInput label="رقم الفاتورة" value={invoiceNumber} onChangeText={setInvoiceNumber} />

            {warehouses.length > 0 ? (
              <AppSelect
                label="المخزن"
                value={selectedWarehouse}
                options={warehouses.map((w) => ({ label: String(w.name ?? ''), value: String(w.id) }))}
                onChange={setSelectedWarehouse}
              />
            ) : null}

            <AppButton title="إضافة صنف" variant="secondary" onPress={() => setProductSearchOpen(true)} />
          </View>
        }
        renderItem={({ item, index }) => (
          <View style={styles.itemRow}>
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.product_name}</Text>
              <View style={styles.itemFields}>
                <AppInput
                  label="الكمية"
                  keyboardType="numeric"
                  value={String(item.quantity)}
                  onChangeText={(v) => updateItem(index, 'quantity', Number(v) || 0)}
                  style={styles.smallInput}
                />
                <AppInput
                  label="سعر التكلفة"
                  keyboardType="numeric"
                  value={String(item.cost_price)}
                  onChangeText={(v) => updateItem(index, 'cost_price', Number(v) || 0)}
                  style={styles.smallInput}
                />
              </View>
              <Text style={styles.itemTotal}>{money(item.quantity * item.cost_price)}</Text>
            </View>
            <AppButton title="حذف" variant="ghost" onPress={() => removeItem(index)} style={styles.removeBtn} />
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>المجموع الفرعي</Text>
              <Text style={styles.totalValue}>{money(subtotal)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>الإجمالي</Text>
              <Text style={styles.totalValue}>{money(total)}</Text>
            </View>
            <AppInput label="المدفوع" keyboardType="numeric" value={paid} onChangeText={setPaid} />
            <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
            <AppButton
              title="تأكيد الشراء"
              disabled={items.length === 0 || !selectedSupplier || submitting}
              loading={submitting}
              onPress={() => setConfirmVisible(true)}
            />
          </View>
        }
      />

      <AppBottomSheet visible={supplierSheetOpen} onClose={() => setSupplierSheetOpen(false)}>
        <View style={styles.sheetContent}>
          <AppSectionHeader title="اختيار المورد" />
          <AppInput value={supplierQuery} onChangeText={setSupplierQuery} placeholder="بحث عن مورد..." />
          {supplierLoading ? <Text style={styles.hintText}>جاري البحث...</Text> : null}
          <FlatList
            data={suppliers.slice(0, 50)}
            keyExtractor={(item) => String(item.id)}
            style={styles.sheetList}
            renderItem={({ item }) => (
              <AppListItem
                title={String(item.name ?? '')}
                subtitle={item.phone ? String(item.phone) : undefined}
                onPress={() => { setSelectedSupplier(item); setSupplierSheetOpen(false); }}
              />
            )}
          />
        </View>
      </AppBottomSheet>

      <AppBottomSheet visible={productSearchOpen} onClose={() => { setProductSearchOpen(false); setProductQuery(''); setProductResults([]); }}>
        <View style={styles.sheetContent}>
          <AppSectionHeader title="بحث منتج" />
          <AppInput value={productQuery} onChangeText={setProductQuery} placeholder="اسم أو باركود..." />
          {productSearching ? <Text style={styles.hintText}>جاري البحث...</Text> : null}
          <FlatList
            data={productResults.slice(0, 30)}
            keyExtractor={(item) => String(item.id)}
            style={styles.sheetList}
            renderItem={({ item }) => (
              <AppListItem
                title={String(item.name ?? '')}
                subtitle={item.barcode ? String(item.barcode) : undefined}
                meta={money(item.cost_price ?? 0)}
                onPress={() => addItem(item)}
              />
            )}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد إنشاء الشراء"
        message={`الإجمالي: ${money(total)} | المدفوع: ${money(paidAmount)}`}
        confirmLabel="تأكيد"
        onConfirm={() => { setConfirmVisible(false); void handleSubmit(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </AppScreen>
  );
}
