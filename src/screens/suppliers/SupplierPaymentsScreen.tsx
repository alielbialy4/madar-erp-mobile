import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { supplierPaymentsAPI } from '@/api/supplierPayments';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { MadarSection, MadarSurface, MetricBlock } from '@/components/madar';
import { AppEmptyState } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import { useColors } from '@/hooks/useColors';
import { asText, dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';

type SupplierPaymentRow = Record<string, unknown> & {
  id?: string | number;
  amount?: string | number | null;
  payment_method?: string | null;
  payment_type?: string | null;
  supplier?: { name?: string | null } | null;
  purchase?: { id?: number | string; invoice_number?: string | null } | null;
  vault?: { name?: string | null } | null;
  creator?: { name?: string | null } | null;
  payment_date?: string | null;
  paid_at?: string | null;
  created_at?: string | null;
  notes?: string | null;
};

function paymentLabel(row: SupplierPaymentRow) {
  const type = row.payment_type;
  if (type === 'credit_allocation') return 'رصيد دائن';
  if (type === 'balance_settlement') return 'تسوية رصيد';
  const method = row.payment_method;
  if (method === 'cash') return 'نقدي';
  if (method === 'bank_transfer') return 'تحويل بنكي';
  if (method === 'card') return 'بطاقة';
  return method || type || 'دفعة';
}

export function SupplierPaymentsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<SupplierPaymentRow>(
    supplierPaymentsAPI.getAll,
    { per_page: 20 },
  );

  const summary = useMemo(() => {
    const nonCashTypes = new Set(['credit_allocation', 'balance_settlement']);
    return items.reduce<{ cash: number; credit: number; settlements: number }>(
      (acc, row) => {
        const value = Number(row.amount ?? 0);
        if (row.payment_type === 'credit_allocation') acc.credit += value;
        else if (row.payment_type === 'balance_settlement') acc.settlements += value;
        else if (!nonCashTypes.has(String(row.payment_type ?? ''))) acc.cash += value;
        return acc;
      },
      { cash: 0, credit: 0, settlements: 0 },
    );
  }, [items]);

  return (
    <AppScreen
      title="دفعات الموردين"
      subtitle="سندات الدفع والتسويات"
      scroll={false}
      onBack={navigation.goBack}
      headerRight={<AppButton title="الموردون" variant="secondary" onPress={() => navigation.navigate('Suppliers')} />}
    >
      <View style={styles.stats}>
        <MetricBlock label="دفع من الخزنة" value={money(summary.cash)} level="B" tone="positive" style={styles.stat} />
        <MetricBlock label="رصيد دائن" value={money(summary.credit)} level="B" tone="info" style={styles.stat} />
        <MetricBlock label="تسويات" value={money(summary.settlements)} level="B" tone="warning" style={styles.stat} />
      </View>
      <MadarSection title="إجراء مالي">
        <MadarSurface>
          <AppEmptyState
            title="إنشاء الدفعة من ملف المورد"
            message="الجوال يدعم دفع المورد من شاشة تفاصيل المورد حتى يظل اختيار المورد والخزنة واضحاً. قائمة الويب العامة تحتوي أيضاً تسوية مختلطة واسعة، وهي معروضة هنا للقراءة فقط لحين اكتمال سياسة الاعتماد."
          />
        </MadarSurface>
      </MadarSection>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد دفعات موردين"
        keyExtractor={(item, index) => `${asText(item.id, 'row')}-${index}`}
        renderItem={({ item }) => (
          <MadarSurface style={styles.card}>
            <View style={styles.cardTop}>
              <AppBadge label={paymentLabel(item)} tone={item.payment_type === 'balance_settlement' ? 'warning' : 'info'} />
              <Text style={styles.amount}>{money(item.amount ?? 0)}</Text>
            </View>
            <Text style={styles.title}>{item.supplier?.name ?? 'مورد غير محدد'}</Text>
            <Text style={styles.meta}>
              {item.purchase ? `فاتورة #${item.purchase.invoice_number ?? item.purchase.id}` : 'على الحساب'}
              {' • '}
              {item.vault?.name ?? 'بدون خزنة'}
            </Text>
            <Text style={styles.meta}>{dateText(item.payment_date ?? item.paid_at ?? item.created_at)} • بواسطة {item.creator?.name ?? '—'}</Text>
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
          </MadarSurface>
        )}
      />
    </AppScreen>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    stats: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    stat: { flex: 1, minWidth: 130 },
    card: { gap: spacing.sm, marginHorizontal: spacing.lg, marginBottom: spacing.sm },
    cardTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    title: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
    meta: { ...textStart, color: c.textMuted, fontSize: typography.small },
    notes: { ...textStart, color: c.textCaption, fontSize: typography.tiny },
    amount: { color: c.success, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
  });
}
