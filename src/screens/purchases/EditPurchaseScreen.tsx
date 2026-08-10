import React, { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { purchasesAPI, type PurchasePayload } from '@/api/purchases';
import { AppScreen, FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms/FormSection';
import { AppDatePicker, AppInput, AppListItem } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBanner, AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { money, asText, numberText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { MoreStackParamList } from '@/types/navigation';

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
  const c = useColors();
  const purchaseId = route.params.id;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lines, setLines] = useState<Line[]>([]);
  const [paid, setPaid] = useState('0');
  const [notes, setNotes] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [supplierId, setSupplierId] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
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
        setInvoiceNumber(asText(data.invoice_number, `#${purchaseId}`));
        setPurchaseDate(String(data.purchase_date ?? data.created_at ?? '').slice(0, 10));
        setPaid(String(data.paid ?? 0));
        setNotes(String(data.notes ?? ''));
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
  const styles = useMemo(() => StyleSheet.create({
    line: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    lineMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
    meta: { ...textStart, color: c.textMuted, fontSize: typography.small },
    batch: { ...textStart, color: c.textCaption, fontSize: typography.tiny },
  }), [c]);

  const save = async () => {
    setConfirmVisible(false);
    setSubmitting(true);
    try {
      const payload: Partial<PurchasePayload> = {
        supplier_id: supplierId,
        purchase_date: purchaseDate,
        notes: notes.trim() || undefined,
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
    <FormScreenLayout
      title="تعديل بيانات الشراء"
      onBack={navigation.goBack}
      heroTitle={invoiceNumber || `فاتورة #${purchaseId}`}
      heroSubtitle={supplierName}
      heroAmount={money(subtotal)}
      saveLabel="حفظ البيانات"
      onSave={() => setConfirmVisible(true)}
      saveLoading={submitting}
      saveDisabled={!purchaseDate || submitting}
      onCancel={navigation.goBack}
    >
      <AppBanner
        tone="info"
        icon="lock-outline"
        message="الفاتورة مرحّلة. يمكنك تعديل التاريخ والملاحظات فقط؛ الأصناف والكميات والتكلفة والمدفوع محمية للحفاظ على المخزون والقيود المالية."
      />

      <FormSection title="بيانات المستند" subtitle="الحقول المسموح تعديلها بعد الترحيل" icon="edit-note">
        <AppListItem title="المورد" meta={supplierName} />
        <AppDatePicker label="تاريخ الشراء" value={purchaseDate} onChange={setPurchaseDate} />
        <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
      </FormSection>

      <FormSection title="التسوية المالية" subtitle="للقراءة فقط — استخدم تدفق دفعات المورد لأي حركة جديدة" icon="payments">
        <AppListItem title="إجمالي الفاتورة" meta={money(subtotal)} />
        <AppListItem title="المدفوع المسجل" meta={money(Number(paid) || 0)} />
        <AppListItem title="المتبقي" meta={money(Math.max(0, subtotal - (Number(paid) || 0)))} />
      </FormSection>

      <FormSection title="الأصناف المرحّلة" subtitle={`${numberText(lines.length)} سطر — للقراءة فقط`} icon="inventory-2">
        {lines.map((line, index) => (
          <View key={`${line.product_id}-${index}`} style={styles.line}>
            <AppListItem title={line.product_name} meta={money(line.quantity * line.cost_price)} />
            <View style={styles.lineMeta}>
              <Text style={styles.meta}>الكمية: {numberText(line.quantity)}</Text>
              <Text style={styles.meta}>تكلفة الوحدة: {money(line.cost_price)}</Text>
            </View>
            {line.batch_number || line.production_date || line.expiry_date ? (
              <Text style={styles.batch}>
                {[line.batch_number ? `تشغيلة ${line.batch_number}` : null, line.production_date ? `إنتاج ${line.production_date}` : null, line.expiry_date ? `صلاحية ${line.expiry_date}` : null].filter(Boolean).join(' · ')}
              </Text>
            ) : null}
          </View>
        ))}
      </FormSection>

      <ConfirmDialog
        visible={confirmVisible}
        title="حفظ بيانات المستند"
        message="سيتم تحديث التاريخ والملاحظات فقط. لن تتغير الأصناف أو المخزون أو التسوية المالية."
        confirmLabel="حفظ"
        loading={submitting}
        onCancel={() => setConfirmVisible(false)}
        onConfirm={() => void save()}
      />
    </FormScreenLayout>
  );
}
