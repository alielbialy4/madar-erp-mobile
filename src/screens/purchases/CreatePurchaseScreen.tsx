import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { purchasesAPI } from '@/api/purchases';
import type { PurchasePayload } from '@/api/purchases';
import { suppliersAPI } from '@/api/suppliers';
import { productsAPI } from '@/api/products';
import { inventoryAPI } from '@/api/inventory';
import { useBranchStore } from '@/store/branchStore';
import { FormScreenLayout, AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppListItem, AppPicker, AppAmountInput, AppDatePicker } from '@/components/ui';
import { FormSection } from '@/components/forms/FormSection';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { useColors } from '@/hooks/useColors';
import { useKeyboardHeight } from '@/hooks/useKeyboardHeight';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { createModuleStyles } from '@/styles/createModuleStyles';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { extractArray } from '@/utils/data';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';

type PurchaseItem = {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  unit_id?: number;
  production_date?: string;
  expiry_date?: string;
  batch_number?: string;
  variant_id?: string;
  track_expiry?: boolean;
};

const itemRoleLabel = (role: unknown): string => {
  switch (String(role ?? '')) {
    case 'raw_material':
      return 'خامة';
    case 'packaging_material':
      return 'خامة تعبئة';
    case 'semi_finished':
      return 'نصف مصنع';
    case 'service':
      return 'خدمة';
    case 'sellable_product':
      return 'منتج';
    default:
      return '';
  }
};

export function CreatePurchaseScreen({ navigation }: { route: any; navigation: any }) {
  const c = useColors();
  const toast = useToast();
  const moduleStyles = useMemo(() => createModuleStyles(c), [c]);
  const keyboardHeight = useKeyboardHeight();
  const tabBarInset = useTabBarBottomInset(spacing.md);
  const listPaddingBottom = tabBarInset + 96 + (keyboardHeight > 0 ? spacing.xl : spacing.xxl);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const [suppliers, setSuppliers] = useState<Record<string, unknown>[]>([]);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
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
    itemRow: { ...moduleStyles.listRow, alignItems: 'flex-start' },
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
    stickyBar: {
      ...moduleStyles.stickyFooter,
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      paddingHorizontal: spacing.lg,
      paddingBottom: tabBarInset,
    },
  }), [c, moduleStyles, tabBarInset]);

  useEffect(() => {
    setSupplierLoading(true);
    suppliersAPI.getAll({})
      .then((res) => setSuppliers(extractArray(res)))
      .catch(() => {})
      .finally(() => setSupplierLoading(false));
  }, []);

  const supplierOptions = useMemo(
    () => suppliers.map((s) => ({ label: String(s.name ?? ''), value: String(s.id) })),
    [suppliers],
  );
  const warehouseOptions = useMemo(
    () => warehouses.map((w) => ({ label: String(w.name ?? ''), value: String(w.id) })),
    [warehouses],
  );
  const selectedSupplier = useMemo(
    () => suppliers.find((s) => String(s.id) === selectedSupplierId) ?? null,
    [suppliers, selectedSupplierId],
  );

  useEffect(() => {
    inventoryAPI.warehouses()
      .then((res) => setWarehouses(extractArray(res)))
      .catch(() => {});
  }, []);

  const searchProducts = useCallback(async () => {
    if (!productQuery.trim()) { setProductResults([]); return; }
    setProductSearching(true);
    try {
      const res = await productsAPI.search(productQuery.trim(), { context: 'purchase' });
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
        track_expiry: product.track_expiry === true,
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
    if (!selectedSupplier) { setErrorMsg('اختر المورد'); void hapticError(); return; }
    if (items.length === 0) { setErrorMsg('أضف صنفاً واحداً على الأقل'); void hapticError(); return; }
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
          ...(item.production_date ? { production_date: item.production_date } : {}),
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
      void hapticSuccess();
      toast.success('تم إنشاء الشراء بنجاح');
      navigation.goBack();
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
      void hapticError();
      toast.error(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormScreenLayout
      title="إنشاء شراء"
      onBack={navigation.goBack}
      scroll={false}
      footer={
        <AppButton
          title={`تأكيد الشراء — ${money(total)}`}
          disabled={items.length === 0 || !selectedSupplier || submitting}
          loading={submitting}
          onPress={() => setConfirmVisible(true)}
          fullWidth
        />
      }
    >
      <FlatList
        style={{ flex: 1 }}
        data={items}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={[styles.listContent, { paddingBottom: listPaddingBottom }]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        ListHeaderComponent={
          <View style={styles.headerSection}>
            <FormSection title="بيانات الشراء" icon="shopping-cart">
              <AppPicker
                label="المورد"
                value={selectedSupplierId}
                options={supplierOptions}
                onChange={setSelectedSupplierId}
                placeholder={supplierLoading ? 'جاري التحميل...' : 'اختر المورد'}
              />
              <AppDatePicker label="تاريخ الشراء" value={purchaseDate} onChange={setPurchaseDate} />
              <AppInput label="رقم الفاتورة" value={invoiceNumber} onChangeText={setInvoiceNumber} />
              {warehouses.length > 0 ? (
                <AppPicker
                  label="المخزن"
                  value={selectedWarehouse}
                  options={warehouseOptions}
                  onChange={setSelectedWarehouse}
                />
              ) : null}
              <AppButton title="إضافة منتج أو خامة" variant="secondary" onPress={() => setProductSearchOpen(true)} />
            </FormSection>
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
              {item.track_expiry ? (
                <>
                  <AppInput
                    label="رقم الدفعة"
                    value={item.batch_number ?? ''}
                    onChangeText={(v) => updateItem(index, 'batch_number', v)}
                  />
                  <AppDatePicker
                    label="تاريخ الإنتاج"
                    value={item.production_date ?? ''}
                    onChange={(v) => updateItem(index, 'production_date', v)}
                  />
                  <AppDatePicker
                    label="تاريخ الصلاحية"
                    value={item.expiry_date ?? ''}
                    onChange={(v) => updateItem(index, 'expiry_date', v)}
                  />
                </>
              ) : null}
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
            <AppAmountInput label="المدفوع" value={paid} onChangeText={setPaid} />
            <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
            {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}
          </View>
        }
      />

      <AppBottomSheet visible={productSearchOpen} onClose={() => { setProductSearchOpen(false); setProductQuery(''); setProductResults([]); }}>
        <View style={styles.sheetContent}>
          <Text style={{ fontWeight: '700', fontSize: typography.sectionTitle }}>بحث منتج أو خامة</Text>
          <AppInput value={productQuery} onChangeText={setProductQuery} placeholder="اسم أو باركود..." />
          {productSearching ? <Text style={styles.hintText}>جاري البحث...</Text> : null}
          <FlatList
            data={productResults.slice(0, 30)}
            keyExtractor={(item) => String(item.id)}
            style={styles.sheetList}
            renderItem={({ item }) => (
              <AppListItem
                title={String(item.name ?? '')}
                subtitle={[itemRoleLabel(item.product_role), item.barcode ? String(item.barcode) : '']
                  .filter(Boolean)
                  .join(' - ') || undefined}
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
    </FormScreenLayout>
  );
}
