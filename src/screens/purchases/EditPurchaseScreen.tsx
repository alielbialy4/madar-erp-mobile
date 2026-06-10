import React, { useEffect, useMemo, useState } from 'react';
import { Alert, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { purchasesAPI, type PurchasePayload } from '@/api/purchases';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppDatePicker, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { money, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';
import { asText } from '@/utils/format';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'EditPurchase'>;
type Route = RouteProp<MoreStackParamList, 'EditPurchase'>;

type Line = {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: number;
  production_date?: string;
  expiry_date?: string;
  batch_number?: string;
};

export function EditPurchaseScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const purchaseId = route.params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [paid, setPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState(0);
  const [warehouseId, setWarehouseId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);

  useEffect(() => {
    void purchasesAPI
      .getById(purchaseId)
      .then((res) => {
        const data = extractData(res);
        if (!data) {
          setError('تعذر تحميل الشراء');
          return;
        }
        const supplier = data.supplier as Record<string, unknown> | undefined;
        setSupplierId(Number(supplier?.id ?? data.supplier_id ?? 0));
        setSupplierName(asText(supplier?.name ?? data.supplier_name, 'مورد'));
        setPurchaseDate(String(data.purchase_date ?? data.created_at ?? '').slice(0, 10));
        setPaid(String(data.paid ?? 0));
        setNotes(String(data.notes ?? ''));
        setWarehouseId(data.warehouse_id ? String(data.warehouse_id) : null);
        setLines(
          (Array.isArray(data.items) ? data.items : []).map((it: Record<string, unknown>) => ({
            product_id: Number(it.product_id),
            product_name: asText((it.product as Record<string, unknown>)?.name ?? it.product_name, 'صنف'),
            quantity: Number(it.quantity ?? 0),
            cost_price: Number(it.cost_price ?? it.unit_price ?? 0),
            production_date: it.production_date || it.manufacturing_date ? String(it.production_date ?? it.manufacturing_date) : undefined,
            expiry_date: it.expiry_date ? String(it.expiry_date) : undefined,
            batch_number: it.batch_number ? String(it.batch_number) : undefined,
          })),
        );
      })
      .catch((err) => setError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [purchaseId]);

  const subtotal = useMemo(() => lines.reduce((s, l) => s + l.quantity * l.cost_price, 0), [lines]);

  const save = async () => {
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const payload: Partial<PurchasePayload> = {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        notes: notes.trim() || undefined,
        invoice_number: undefined,
      };
      await purchasesAPI.update(purchaseId, payload);
      Alert.alert('تم', 'تم تحديث فاتورة الشراء');
      navigation.goBack();
    } catch (err) {
      Alert.alert('خطأ', normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AppScreen title="تعديل شراء" onBack={navigation.goBack}>
        <AppLoadingState />
      </AppScreen>
    );
  }

  if (error) {
    return (
      <AppScreen title="تعديل شراء" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={navigation.goBack} />
      </AppScreen>
    );
  }

  return (
    <AppScreen title={`تعديل — ${supplierName}`} onBack={navigation.goBack}>
      <AppInput label="تاريخ الشراء" value={purchaseDate} onChangeText={setPurchaseDate} />
      <AppInput label="المدفوع" keyboardType="numeric" value={paid} onChangeText={setPaid} editable={false} />
      <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
      <AppCard style={{ gap: spacing.sm }}>
        <AppSectionHeader title="الأصناف" />
        {lines.map((line, index) => (
          <View key={line.product_id} style={{ gap: spacing.xs }}>
            <AppListItem title={line.product_name} meta={money(line.quantity * line.cost_price)} />
            <AppInput
              label="الكمية"
              keyboardType="numeric"
              value={String(line.quantity)}
              editable={false}
              onChangeText={(v) => {
                const next = [...lines];
                next[index] = { ...line, quantity: Number(v) || 0 };
                setLines(next);
              }}
            />
            <AppInput
              label="سعر التكلفة"
              keyboardType="numeric"
              value={String(line.cost_price)}
              editable={false}
              onChangeText={(v) => {
                const next = [...lines];
                next[index] = { ...line, cost_price: Number(v) || 0 };
                setLines(next);
              }}
            />
            {line.expiry_date != null || line.batch_number ? (
              <>
              <AppInput
                label="تاريخ الإنتاج"
                value={line.production_date ?? ''}
                editable={false}
                placeholder="YYYY-MM-DD"
              />
              <AppDatePicker
                label="تاريخ الصلاحية"
                value={line.expiry_date ?? ''}
                onChange={(v) => {
                  const next = [...lines];
                  next[index] = { ...line, expiry_date: v };
                  setLines(next);
                }}
              />
              </>
            ) : null}
          </View>
        ))}
        <AppListItem title="الإجمالي" meta={money(subtotal)} />
      </AppCard>
      <AppButton title="حفظ التعديلات" loading={submitting} onPress={() => setConfirmVisible(true)} />
      <ConfirmDialog
        visible={confirmVisible}
        title="تأكيد التعديل"
        message={`${lines.length} صنف — ${money(subtotal)}`}
        confirmLabel="حفظ"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void save()}
      />
    </AppScreen>
  );
}
