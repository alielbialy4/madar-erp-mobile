import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { paymentsAPI, type PaymentLedgerRow } from '@/api/payments';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppInput, AppStatCard } from '@/components/ui';
import { AppText } from '@/components/ui/AppText';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import { useColors } from '@/hooks/useColors';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';

function methodLabel(method?: string | null) {
  switch (method) {
    case 'cash': return 'نقدي';
    case 'card': return 'بطاقة';
    case 'bank':
    case 'bank_transfer': return 'تحويل بنكي';
    case 'wallet': return 'محفظة';
    default: return method || 'غير محدد';
  }
}

export function PaymentsLedgerScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [grandTotal, setGrandTotal] = useState<string>('0 ج.م');
  const [totalsError, setTotalsError] = useState<string | null>(null);

  const params = useMemo(() => ({
    limit: 20,
    filter: {
      invoice_number: invoiceNumber || null,
      phone_number: phoneNumber || null,
      start_date: fromDate || null,
      end_date: toDate || null,
    },
  }), [fromDate, invoiceNumber, phoneNumber, toDate]);

  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<PaymentLedgerRow & Record<string, unknown>>(
    paymentsAPI.getAll,
    params,
  );

  const loadTotals = useCallback(async () => {
    try {
      const response = await paymentsAPI.getSafeTotals({ start_date: fromDate || null, end_date: toDate || null });
      const data = extractData(response);
      setGrandTotal(money(data?.grand_total ?? 0));
      setTotalsError(null);
    } catch (err) {
      setTotalsError(normalizeApiError(err).message);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    void loadTotals();
  }, [loadTotals]);

  const refreshAll = useCallback(async () => {
    await Promise.all([refresh(), loadTotals()]);
  }, [loadTotals, refresh]);

  return (
    <AppScreen
      title="المدفوعات"
      subtitle="دفعات الفواتير مع فلاتر الويب الأساسية"
      scroll={false}
      onBack={navigation.goBack}
      headerRight={(
        <View style={styles.headerActions}>
          <Pressable onPress={() => setFiltersOpen(true)} accessibilityRole="button" accessibilityLabel="فلاتر">
            <MaterialIcons name="filter-list" size={24} color={c.text} />
          </Pressable>
          <Pressable onPress={() => void refreshAll()} accessibilityRole="button" accessibilityLabel="تحديث">
            <MaterialIcons name="refresh" size={24} color={c.accent} />
          </Pressable>
        </View>
      )}
    >
      <View style={styles.statWrap}>
        <AppStatCard label="الإجمالي" value={grandTotal} tone="info" />
      </View>
      {totalsError ? <AppErrorState message={totalsError} onRetry={() => void loadTotals()} /> : null}
      {loading && items.length === 0 ? <AppLoadingState variant="skeleton" skeletonRows={8} /> : null}
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void refreshAll()}
        onEndReached={loadMore}
        emptyTitle="لا توجد مدفوعات"
        keyExtractor={(item, index) => `${String(item.id)}-${index}`}
        renderItem={({ item }) => {
          const invoice = item.invoice?.invoice_number ?? `Payment #${item.id}`;
          const clientName = item.invoice?.client?.name ?? item.client_name ?? 'N/A';
          const clientPhone = item.invoice?.client?.phone_number ?? item.client_phone ?? '';
          const method = item.payment_method ?? item.payment_type;
          return (
            <AppCard style={styles.card}>
              <View style={styles.cardTop}>
                <AppBadge label={methodLabel(method)} tone={method === 'cash' ? 'success' : 'info'} />
                <AppText style={styles.invoice}>{invoice}</AppText>
              </View>
              <AppText style={styles.title}>{clientName}</AppText>
              <AppText style={styles.meta}>{clientPhone || 'بدون هاتف'} • {dateText(item.created_at)}</AppText>
              <AppText style={styles.amount}>{money(item.amount ?? 0)}</AppText>
            </AppCard>
          );
        }}
      />

      <AppBottomSheet visible={filtersOpen} onClose={() => setFiltersOpen(false)} title="تصفية المدفوعات">
        <View style={{ gap: spacing.md }}>
          <AppInput label="رقم الفاتورة" value={invoiceNumber} onChangeText={setInvoiceNumber} />
          <AppInput label="رقم الهاتف" value={phoneNumber} onChangeText={setPhoneNumber} keyboardType="phone-pad" />
          <AppInput label="من تاريخ" value={fromDate} onChangeText={setFromDate} placeholder="YYYY-MM-DD" />
          <AppInput label="إلى تاريخ" value={toDate} onChangeText={setToDate} placeholder="YYYY-MM-DD" />
          <View style={styles.actions}>
            <AppButton title="مسح" variant="outline" onPress={() => { setInvoiceNumber(''); setPhoneNumber(''); setFromDate(''); setToDate(''); }} />
            <AppButton title="تطبيق" onPress={() => { setFiltersOpen(false); void refreshAll(); }} />
          </View>
        </View>
      </AppBottomSheet>
    </AppScreen>
  );
}

function createStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    headerActions: { ...flexRow, gap: spacing.md },
    statWrap: { paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
    card: { gap: spacing.sm },
    cardTop: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
    invoice: { color: c.textMuted, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.label },
    title: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
    meta: { ...textStart, color: c.textMuted, fontSize: typography.small },
    amount: { ...textStart, color: c.success, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
    actions: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
  });
}
