import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppListItem, AppSectionHeader, AppText } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { shiftsAPI } from '@/api/shifts';
import { printShiftSummaryForShift } from '@/services/printing/shiftSummaryPrint';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, money, numberText } from '@/utils/format';
import { normalizeShiftSummary } from '@/utils/shiftSummaryNormalize';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { ShiftDetailedSummary } from '@/types/shifts';
import { ShiftClosingAmountBanner } from './ShiftClosingAmountBanner';

const BRANCH_REQUIRED_AR = 'تعذر تحديد فرع الوردية';

type Props = {
  visible: boolean;
  shiftId: string | null;
  branchId: string | null;
  onClose: () => void;
};

function paymentLabel(type: string): string {
  const map: Record<string, string> = {
    cash: 'نقدي',
    card: 'بطاقة',
    credit: 'آجل',
    layaway: 'تقسيط',
    split: 'دفع متعدد',
  };
  return map[type] ?? type;
}

function KpiRow({ label, value, tone }: { label: string; value: string; tone?: 'default' | 'success' | 'warning' | 'danger' }) {
  const c = useColors();
  const color =
    tone === 'success' ? c.success : tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : c.text;
  return (
    <View style={{ ...flexRow, justifyContent: 'space-between', paddingVertical: spacing.xs }}>
      <AppText style={{ ...textStart, color: c.textMuted, fontSize: typography.small }}>{label}</AppText>
      <AppText style={{ fontWeight: '800', color }}>{value}</AppText>
    </View>
  );
}

export function ShiftSummarySheet({ visible, shiftId, branchId, onClose }: Props) {
  const c = useColors();
  const [data, setData] = useState<ShiftDetailedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        footer: { ...flexRow, gap: spacing.sm, paddingTop: spacing.md },
        section: { gap: spacing.sm },
        calcTotal: {
          borderTopWidth: 1,
          borderTopColor: c.border,
          marginTop: spacing.sm,
          paddingTop: spacing.sm,
          ...flexRow,
          justifyContent: 'space-between',
        },
      }),
    [c.border],
  );

  const fetchData = useCallback(async () => {
    if (!shiftId) return;
    if (!branchId) {
      setError(BRANCH_REQUIRED_AR);
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await shiftsAPI.getSummary(shiftId, { branch_id: branchId });
      const raw = extractData<Record<string, unknown>>(res);
      if (raw) {
        setData(normalizeShiftSummary(raw));
      } else {
        setError('تعذر تحميل ملخص الوردية');
      }
    } catch (err) {
      setError(normalizeApiError(err).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [shiftId, branchId]);

  useEffect(() => {
    if (!visible) {
      setData(null);
      setError(null);
      return;
    }
    if (!shiftId) return;
    void fetchData();
  }, [visible, shiftId, fetchData]);

  const handlePrint = async () => {
    if (!shiftId) return;
    setPrinting(true);
    try {
      const res = await printShiftSummaryForShift(shiftId);
      if (!res.ok) setError(res.message);
    } finally {
      setPrinting(false);
    }
  };

  const fmt = (v: string | number | null | undefined) => money(v ?? 0);
  const variance = data?.totals.variance != null ? Number(data.totals.variance) : null;

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="ملخص الوردية">
      {!shiftId ? (
        <AppText style={textStart}>لا توجد وردية محددة.</AppText>
      ) : loading ? (
        <AppLoadingState />
      ) : error && !data ? (
        <AppErrorState message={error} onRetry={fetchData} />
      ) : data ? (
        <View style={{ gap: spacing.lg, paddingBottom: spacing.xl }}>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            <AppBadge label={data.shift.status === 'open' ? 'مفتوحة' : 'مغلقة'} tone={data.shift.status === 'open' ? 'success' : 'default'} />
            {data.shift.branch?.name ? <AppBadge label={data.shift.branch.name} tone="info" /> : null}
          </View>

          <AppCard style={styles.section}>
            <AppSectionHeader title="بيانات الوردية" />
            <KpiRow label="الكاشير" value={data.shift.cashier?.name ?? '—'} />
            <KpiRow label="الخزينة" value={data.shift.vault?.name ?? '—'} />
            <KpiRow label="رقم الوردية" value={data.shift.shift_no != null ? String(data.shift.shift_no) : '—'} />
            <KpiRow label="وقت الافتتاح" value={dateText(data.shift.opened_at)} />
            <KpiRow label="وقت الإغلاق" value={dateText(data.shift.closed_at)} />
            <KpiRow label="رصيد الافتتاح" value={fmt(data.shift.starting_cash)} tone="success" />
          </AppCard>

          <AppCard style={styles.section}>
            <AppSectionHeader title="ملخص الإيرادات" />
            <KpiRow label="إجمالي المبيعات" value={fmt(data.totals.gross_sales)} />
            <KpiRow label="إجمالي المدفوع" value={fmt(data.totals.total_paid)} />
            <KpiRow label="المرتجعات" value={fmt(data.totals.total_refunds)} tone="warning" />
            <KpiRow label="صافي الإيراد" value={fmt(data.totals.net_revenue)} tone="success" />
            <KpiRow label="مبيعات نقدية" value={fmt(data.totals.cash_sales)} />
            <KpiRow label="مبيعات غير نقدية" value={fmt(data.totals.non_cash_sales)} />
            {Number(data.totals.card_payments ?? 0) > 0 ? (
              <KpiRow label="بطاقات" value={fmt(data.totals.card_payments ?? 0)} />
            ) : null}
            {Number(data.totals.instapay_payments ?? 0) > 0 ? (
              <KpiRow label="إنستا باي" value={fmt(data.totals.instapay_payments ?? 0)} />
            ) : null}
            {Number(data.totals.electronic_wallet_payments ?? 0) > 0 ? (
              <KpiRow label="محافظ إلكترونية" value={fmt(data.totals.electronic_wallet_payments ?? 0)} />
            ) : null}
            <KpiRow label="عدد الفواتير" value={numberText(data.totals.invoice_count)} />
          </AppCard>

          <AppCard style={styles.section}>
            <AppSectionHeader title={`الفواتير (${data.invoices.length})`} />
            {data.invoices.length === 0 ? (
              <AppText style={{ ...textStart, color: c.textMuted }}>لا توجد فواتير في هذه الوردية.</AppText>
            ) : (
              data.invoices.slice(0, 30).map((inv) => (
                <AppListItem
                  key={inv.id}
                  title={inv.invoice_number || String(inv.print_sequence ?? inv.id)}
                  subtitle={`${dateText(inv.created_at)} · ${paymentLabel(inv.payment_type)}`}
                  meta={fmt(inv.total)}
                  badge={<AppBadge label={inv.status} tone={inv.status === 'completed' ? 'success' : 'warning'} />}
                />
              ))
            )}
          </AppCard>

          {data.sold_products.length > 0 ? (
            <AppCard style={styles.section}>
              <AppSectionHeader title={`المنتجات المباعة (${data.sold_products.length})`} />
              {data.sold_products.slice(0, 25).map((p) => (
                <AppListItem
                  key={p.product_id}
                  title={p.product_name}
                  subtitle={p.category_name ?? undefined}
                  meta={fmt(p.net_amount)}
                />
              ))}
            </AppCard>
          ) : null}

          {data.refunds.length > 0 ? (
            <AppCard style={styles.section}>
              <AppSectionHeader title={`المرتجعات (${data.refunds.length})`} />
              {data.refunds.map((r) => (
                <AppListItem
                  key={r.id}
                  title={r.invoice_number || String(r.sale_id)}
                  subtitle={dateText(r.created_at)}
                  meta={fmt(r.amount)}
                  badge={<AppBadge label="مرتجع" tone="warning" />}
                />
              ))}
            </AppCard>
          ) : null}

          {data.expenses.length > 0 ? (
            <AppCard style={styles.section}>
              <AppSectionHeader title={`المصروفات (${data.expenses.length})`} />
              <KpiRow label="إجمالي المصروفات" value={fmt(data.totals.total_expenses)} tone="danger" />
              {data.expenses.map((e) => (
                <AppListItem
                  key={e.id}
                  title={e.category_name ?? 'مصروف'}
                  subtitle={e.note ?? undefined}
                  meta={fmt(e.amount)}
                />
              ))}
            </AppCard>
          ) : null}

          <AppCard style={styles.section}>
            <AppSectionHeader title="الحركات النقدية" />
            <KpiRow label="إيداعات نقدية" value={fmt(data.totals.cash_deposits)} tone="success" />
            <KpiRow label="مسحوبات نقدية" value={fmt(data.totals.cash_withdrawals)} tone="warning" />
            <KpiRow label="مصروفات نقدية" value={fmt(data.totals.cash_expenses)} tone="warning" />
            {data.cash_movements.map((cm) => (
              <AppListItem
                key={String(cm.id)}
                title={cm.type === 'cash_in' ? 'إيداع' : 'سحب'}
                subtitle={cm.note ?? undefined}
                meta={fmt(cm.amount)}
                badge={<AppBadge label={cm.direction === 'in' ? 'داخل' : 'خارج'} tone={cm.direction === 'in' ? 'success' : 'warning'} />}
              />
            ))}
          </AppCard>

          <AppCard style={styles.section}>
            <AppSectionHeader title="ملخص الإغلاق" />
            <KpiRow label="رصيد الافتتاح" value={fmt(data.shift.starting_cash)} />
            <KpiRow label="+ مبيعات نقدية" value={fmt(data.totals.cash_sales)} tone="success" />
            <KpiRow label="+ إيداعات" value={fmt(data.totals.cash_deposits)} tone="success" />
            <KpiRow label="- مرتجعات نقدية" value={fmt(data.totals.cash_refunds)} tone="warning" />
            <KpiRow label="- مصروفات نقدية" value={fmt(data.totals.cash_expenses)} tone="warning" />
            <KpiRow label="- مسحوبات" value={fmt(data.totals.cash_withdrawals)} tone="warning" />
            {Number(data.totals.card_payments ?? 0) > 0 ? (
              <KpiRow label="بطاقات (معلوماتي)" value={fmt(data.totals.card_payments ?? 0)} />
            ) : null}
            <ShiftClosingAmountBanner label="إنستا باي" value={fmt(data.totals.instapay_payments ?? 0)} variant="instapay" />
            <ShiftClosingAmountBanner
              label="محافظ إلكترونية"
              value={fmt(data.totals.electronic_wallet_payments ?? 0)}
              variant="ewallet"
              style={{ marginTop: spacing.sm }}
            />
            <ShiftClosingAmountBanner
              label="النقد المتوقع"
              value={fmt(data.totals.expected_cash)}
              variant="cash"
              style={{ marginTop: spacing.sm }}
            />
            <AppText style={{ ...textStart, opacity: 0.75, fontSize: 12, marginTop: 4 }}>
              نقد الدرج فقط — لا يشمل البطاقات أو المحافظ الإلكترونية أو إنستاباي
            </AppText>
            {data.totals.actual_cash != null ? (
              <>
                <KpiRow label="النقد الفعلي" value={fmt(data.totals.actual_cash)} />
                {Number(data.totals.deposit_amount ?? 0) > 0 ? (
                  <KpiRow
                    label={
                      data.totals.closing_vault_settlement_direction === 'withdraw'
                        ? 'سحب إغلاق من الخزنة'
                        : 'إيداع إغلاق إلى الخزنة'
                    }
                    value={fmt(data.totals.deposit_amount ?? 0)}
                    tone={data.totals.closing_vault_settlement_direction === 'withdraw' ? 'success' : 'warning'}
                  />
                ) : null}
                <KpiRow
                  label="الفرق"
                  value={fmt(data.totals.variance)}
                  tone={variance != null && variance < 0 ? 'danger' : variance != null && variance > 0 ? 'success' : 'default'}
                />
              </>
            ) : null}
          </AppCard>

          <View style={styles.footer}>
            <AppButton title="طباعة التقرير" variant="secondary" loading={printing} style={{ flex: 1 }} onPress={() => void handlePrint()} />
            <AppButton title="إغلاق" style={{ flex: 1 }} onPress={onClose} />
          </View>
        </View>
      ) : null}
    </AppBottomSheet>
  );
}
