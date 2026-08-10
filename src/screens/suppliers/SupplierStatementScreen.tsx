import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { suppliersAPI } from '@/api/suppliers';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppListItem } from '@/components/ui';
import { MadarSection, MadarSurface, MetricBlock } from '@/components/madar';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money, dateText, asText } from '@/utils/format';
import { getCurrentBalanceInterpretation } from '@/utils/supplierBalanceLabels';
import { supplierStatementMovementLabel, statementPaymentTypeLabel } from '@/utils/supplierPaymentLabels';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'SupplierStatement'>;
type Route = RouteProp<MoreStackParamList, 'SupplierStatement'>;

function SummaryBadge({ label, value }: { label: string; value: string }) {
  return <AppBadge label={`${label}: ${value}`} tone="info" />;
}

export function SupplierStatementScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const { id, name } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await suppliersAPI.statement(id);
      setData(extractData(res) ?? (res as Record<string, unknown>));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const supplier = (data?.supplier as Record<string, unknown>) ?? {};
  const summary = (data?.summary as Record<string, unknown>) ?? {};
  const lines = Array.isArray(data?.statement_lines) ? (data.statement_lines as Record<string, unknown>[]) : [];
  const purchases = Array.isArray(data?.purchases) ? (data.purchases as Record<string, unknown>[]) : [];
  const payments = Array.isArray(data?.supplier_payments) ? (data.supplier_payments as Record<string, unknown>[]) : [];

  const endingBalance = Number(summary.ending_balance ?? summary.current_balance ?? 0);
  const balanceInfo = getCurrentBalanceInterpretation(
    endingBalance,
    summary.current_balance_interpretation as never,
  );

  return (
    <AppScreen
      title={`كشف حساب — ${name ?? asText(supplier.name, 'مورد')}`}
      onBack={navigation.goBack}
      onRefresh={() => void load()}
      refreshing={loading}
      scroll={false}
    >
      {loading && !data ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={() => void load()} /> : null}
      {data ? (
        <ScrollView contentContainerStyle={{ gap: spacing.lg, padding: spacing.lg, paddingBottom: spacing.xxl }}>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.md }}>
            <MetricBlock
              label="الرصيد الحالي (ختامي)"
              value={money(endingBalance)}
              hint={balanceInfo.label_ar}
              level="A"
              style={{ flex: 1, minWidth: 140 }}
            />
            <MetricBlock
              label="الرصيد الدائن المتاح"
              value={money(summary.available_credit ?? 0)}
              level="B"
              tone="info"
              style={{ flex: 1, minWidth: 140 }}
            />
          </View>

          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.xs }}>
            <SummaryBadge label="رصيد افتتاحي" value={money(summary.opening_balance ?? supplier.opening_balance ?? 0)} />
            <SummaryBadge label="إجمالي الفواتير" value={money(summary.purchases_total ?? 0)} />
            <SummaryBadge label="مرتجعات" value={money(summary.returns_total ?? 0)} />
            <SummaryBadge label="مدفوع على الفواتير" value={money(summary.purchases_paid_total ?? 0)} />
            <SummaryBadge label="دفع من الخزنة" value={money(summary.supplier_payments_total ?? 0)} />
            <SummaryBadge label="دفعات على الحساب" value={money(summary.supplier_on_account_payments_total ?? 0)} />
            <SummaryBadge label="تسويات" value={money(summary.supplier_credit_allocations_total ?? 0)} />
            <SummaryBadge label="متبقي فواتير" value={money(summary.unpaid_purchases_remaining ?? 0)} />
          </View>

          <MadarSection title="حركات كشف الحساب">
            <MadarSurface padded={false}>
              {lines.length ? (
                lines.map((row, idx) => (
                  <AppListItem
                    key={`${row.type}-${row.date}-${idx}`}
                    title={asText(row.label, supplierStatementMovementLabel(String(row.type)))}
                    subtitle={dateText(String(row.date ?? ''))}
                    meta={`مدين ${money(row.debit ?? 0)} • دائن ${money(row.credit ?? 0)}`}
                    badge={
                      <AppBadge
                        label={row.purchase_id ? `#${row.purchase_id}` : row.supplier_payment_id ? String(row.supplier_payment_id).slice(0, 8) : '—'}
                        tone="default"
                      />
                    }
                    showChevron={false}
                  />
                ))
              ) : (
                <AppEmptyState title="لا توجد حركات" />
              )}
            </MadarSurface>
          </MadarSection>

          <MadarSection title="فواتير الشراء">
            <MadarSurface padded={false}>
              {purchases.length ? (
                purchases.map((row, idx) => (
                  <AppListItem
                    key={String(row.id ?? idx)}
                    title={String(row.invoice_number ?? '—')}
                    subtitle={String(row.status ?? '—')}
                    meta={`إجمالي ${money(row.total ?? 0)} • مدفوع ${money(row.paid ?? 0)}`}
                    showChevron={false}
                  />
                ))
              ) : (
                <AppEmptyState title="لا توجد فواتير" />
              )}
            </MadarSurface>
          </MadarSection>

          <MadarSection title="مدفوعات المورد">
            <MadarSurface padded={false}>
              {payments.length ? (
                payments.map((row, idx) => (
                  <AppListItem
                    key={String(row.id ?? idx)}
                    title={statementPaymentTypeLabel(row)}
                    subtitle={dateText(String(row.payment_date ?? ''))}
                    meta={money(row.amount ?? 0)}
                    badge={<AppBadge label={String(row.payment_method ?? '—')} tone="default" />}
                    showChevron={false}
                  />
                ))
              ) : (
                <AppEmptyState title="لا توجد مدفوعات" />
              )}
            </MadarSurface>
          </MadarSection>
        </ScrollView>
      ) : null}
    </AppScreen>
  );
}
