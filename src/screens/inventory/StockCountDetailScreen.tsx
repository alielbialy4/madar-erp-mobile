import React, { useEffect, useState } from 'react';
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
import type { MoreStackParamList } from '@/types/navigation';
import { asText } from '@/utils/format';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockCountDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockCountDetail'>;

type CountLine = { product_id: number; product_name: string; counted_quantity: string };

function StockCountBody({
  doc,
  refresh,
  id,
}: {
  doc: Record<string, unknown>;
  refresh: () => void;
  id: string;
}) {
  const [lines, setLines] = useState<CountLine[]>([]);
  const [saving, setSaving] = useState(false);
  const [confirmPost, setConfirmPost] = useState(false);
  const [posting, setPosting] = useState(false);
  const isDraft = doc.status === 'draft';
  const serverItems = Array.isArray(doc.items) ? (doc.items as Record<string, unknown>[]) : [];

  useEffect(() => {
    if (serverItems.length) {
      setLines(
        serverItems.map((it) => ({
          product_id: Number(it.product_id),
          product_name: asText((it.product as Record<string, unknown>)?.name ?? it.product_name, 'منتج'),
          counted_quantity: String(it.counted_quantity ?? 0),
        })),
      );
    }
  }, [doc.id, doc.status, serverItems.length]);

  const addProduct = (product: { id: number; name?: string }) => {
    if (lines.some((l) => l.product_id === product.id)) return;
    setLines([...lines, { product_id: product.id, product_name: product.name ?? 'منتج', counted_quantity: '0' }]);
  };

  const saveItems = async () => {
    setSaving(true);
    try {
      await stockCountsAPI.upsertItems(
        id,
        lines.map((l) => ({ product_id: l.product_id, counted_quantity: Number(l.counted_quantity) || 0 })),
      );
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
          <InventoryProductSearch onSelect={addProduct} />
          {lines.map((line, index) => (
            <View key={line.product_id} style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              <AppListItem title={line.product_name} />
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
          subtitle={`نظام: ${numberText(it.system_quantity)}`}
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
