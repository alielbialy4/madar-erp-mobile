import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppBadge, AppButton, AppListItem } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { shiftsAPI } from '@/api/shifts';
import { printShiftSummaryForShift } from '@/services/printing/shiftSummaryPrint';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { dateText, money, numberText } from '@/utils/format';
import { paymentTypeLabel } from '@/utils/paymentLabels';
import { saleStatusBadgeTone, saleStatusLabel, shiftStatusBadgeTone, shiftStatusLabel } from '@/utils/saleStatus';
import { normalizeShiftSummary } from '@/utils/shiftSummaryNormalize';
import {
  preferDrawerCashRefundOutflows,
  preferShiftNetSalesActivity,
  preferShiftTotalRefunds,
} from '@/utils/shiftTotalsCanonical';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import type { ShiftDetailedSummary } from '@/types/shifts';
import { ShiftClosingAmountBanner } from './ShiftClosingAmountBanner';
import {
  ShiftHighlightCard,
  ShiftInfoTile,
  ShiftKpiRow,
  ShiftKpiTile,
  ShiftSectionCard,
  ShiftSheetFooter,
} from './shiftSheetUi';
import { AppText } from '@/components/ui/AppText';

const BRANCH_REQUIRED_AR = 'تعذر تحديد فرع الوردية';

type Props = {
  visible: boolean;
  shiftId: string | null;
  branchId: string | null;
  onClose: () => void;
};

export function ShiftSummarySheet({ visible, shiftId, branchId, onClose }: Props) {
  const c = useColors();
  const [data, setData] = useState<ShiftDetailedSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [printing, setPrinting] = useState(false);

  const listDivider = useMemo(
    () => ({
      borderTopWidth: 1,
      borderTopColor: c.borderSubtle,
      paddingTop: spacing.sm,
      marginTop: spacing.xs,
    }),
    [c.borderSubtle],
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
    <AppBottomSheet
      visible={visible}
      onClose={onClose}
      title="ملخص الوردية"
      subtitle="نظرة سريعة على أداء الوردية الحالية"
      size="fullscreen"
    >
      {!shiftId ? (
        <AppText style={textStart}>لا توجد وردية محددة.</AppText>
      ) : loading ? (
        <AppLoadingState />
      ) : error && !data ? (
        <AppErrorState message={error} onRetry={fetchData} />
      ) : data ? (
        <View style={styles.content}>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            <AppBadge
              label={shiftStatusLabel(data.shift.status)}
              tone={shiftStatusBadgeTone(data.shift.status)}
            />
            {data.shift.branch?.name ? <AppBadge label={data.shift.branch.name} tone="info" /> : null}
            {data.shift.shift_no != null ? (
              <AppBadge label={`وردية #${data.shift.shift_no}`} tone="neutral" />
            ) : null}
          </View>

          <ShiftHighlightCard label="رصيد الافتتاح" value={fmt(data.shift.starting_cash)} />

          <View style={styles.kpiGrid}>
            <ShiftKpiTile label="إجمالي المبيعات" value={fmt(data.totals.gross_sales)} tone="info" />
            <ShiftKpiTile
              label="صافي الإيراد"
              value={fmt(preferShiftNetSalesActivity(data.totals))}
              tone="success"
            />
            <ShiftKpiTile label="مبيعات نقدية" value={fmt(data.totals.cash_sales)} tone="default" />
            <ShiftKpiTile
              label="المرتجعات"
              value={fmt(preferShiftTotalRefunds(data.totals))}
              tone="warning"
            />
          </View>

          <View style={styles.infoGrid}>
            <ShiftInfoTile label="الكاشير" value={data.shift.cashier?.name ?? '—'} />
            <ShiftInfoTile label="الخزينة" value={data.shift.vault?.name ?? '—'} />
            <ShiftInfoTile label="وقت الافتتاح" value={dateText(data.shift.opened_at)} />
            <ShiftInfoTile label="وقت الإغلاق" value={dateText(data.shift.closed_at)} />
          </View>

          <ShiftSectionCard title="ملخص الإيرادات" icon="bar-chart">
            <ShiftKpiRow label="إجمالي المدفوع" value={fmt(data.totals.total_paid)} />
            <ShiftKpiRow label="مبيعات غير نقدية" value={fmt(data.totals.non_cash_sales)} />
            {Number(data.totals.card_payments ?? 0) > 0 ? (
              <ShiftKpiRow label="بطاقات" value={fmt(data.totals.card_payments ?? 0)} />
            ) : null}
            {Number(data.totals.instapay_payments ?? 0) > 0 ? (
              <ShiftKpiRow label="إنستا باي" value={fmt(data.totals.instapay_payments ?? 0)} />
            ) : null}
            {Number(data.totals.electronic_wallet_payments ?? 0) > 0 ? (
              <ShiftKpiRow label="محافظ إلكترونية" value={fmt(data.totals.electronic_wallet_payments ?? 0)} />
            ) : null}
            {Number(data.totals.credit_payments ?? 0) > 0 ? (
              <ShiftKpiRow label="مبيعات آجل (إجمالي الفواتير)" value={fmt(data.totals.credit_payments ?? 0)} tone="warning" />
            ) : null}
            {Number(data.totals.layaway_payments ?? 0) > 0 ? (
              <ShiftKpiRow label="مبيعات تقسيط (إجمالي الفواتير)" value={fmt(data.totals.layaway_payments ?? 0)} tone="warning" />
            ) : null}
            {Number(data.totals.debt_collections ?? 0) > 0 ? (
              <ShiftKpiRow label="تحصيل ديون عملاء" value={fmt(data.totals.debt_collections ?? 0)} tone="success" />
            ) : null}
            {Number(data.totals.layaway_collections ?? 0) > 0 ? (
              <ShiftKpiRow label="تحصيل أقساط تقسيط" value={fmt(data.totals.layaway_collections ?? 0)} tone="success" />
            ) : null}
            <ShiftKpiRow label="عدد الفواتير" value={numberText(data.totals.invoice_count)} tone="info" />
          </ShiftSectionCard>

          <ShiftSectionCard title={`الفواتير (${data.invoices.length})`} icon="receipt-long">
            {data.invoices.length === 0 ? (
              <AppText style={{ ...textStart, color: c.textMuted }}>لا توجد فواتير في هذه الوردية.</AppText>
            ) : (
              data.invoices.slice(0, 30).map((inv, index) => (
                <View key={inv.id} style={index > 0 ? listDivider : undefined}>
                  <AppListItem
                    title={inv.invoice_number || String(inv.print_sequence ?? inv.id)}
                    subtitle={`${dateText(inv.created_at)} · ${paymentTypeLabel(inv.payment_type)}`}
                    meta={fmt(inv.total)}
                    badge={
                      <AppBadge
                        label={saleStatusLabel(inv.status)}
                        tone={saleStatusBadgeTone(inv.status)}
                      />
                    }
                  />
                </View>
              ))
            )}
          </ShiftSectionCard>

          {data.sold_products.length > 0 ? (
            <ShiftSectionCard title={`المنتجات المباعة (${data.sold_products.length})`} icon="inventory-2">
              {data.sold_products.slice(0, 25).map((p, index) => (
                <View key={p.product_id} style={index > 0 ? listDivider : undefined}>
                  <AppListItem
                    title={p.product_name}
                    subtitle={p.category_name ?? undefined}
                    meta={fmt(p.net_amount)}
                  />
                </View>
              ))}
            </ShiftSectionCard>
          ) : null}

          {data.refunds.length > 0 ? (
            <ShiftSectionCard title={`المرتجعات (${data.refunds.length})`} icon="undo">
              {data.refunds.map((r, index) => (
                <View key={r.id} style={index > 0 ? listDivider : undefined}>
                  <AppListItem
                    title={r.invoice_number || String(r.sale_id)}
                    subtitle={dateText(r.created_at)}
                    meta={fmt(r.amount)}
                    badge={<AppBadge label="مرتجع" tone="warning" />}
                  />
                </View>
              ))}
            </ShiftSectionCard>
          ) : null}

          {data.expenses.length > 0 ? (
            <ShiftSectionCard title={`المصروفات (${data.expenses.length})`} icon="receipt">
              <ShiftKpiRow label="إجمالي المصروفات" value={fmt(data.totals.total_expenses)} tone="danger" />
              {data.expenses.map((e, index) => (
                <View key={e.id} style={index > 0 ? listDivider : undefined}>
                  <AppListItem
                    title={e.category_name ?? 'مصروف'}
                    subtitle={e.note ?? undefined}
                    meta={fmt(e.amount)}
                  />
                </View>
              ))}
            </ShiftSectionCard>
          ) : null}

          <ShiftSectionCard title="الحركات النقدية" icon="swap-horiz">
            <ShiftKpiRow label="إيداعات نقدية" value={fmt(data.totals.cash_deposits)} tone="success" />
            <ShiftKpiRow label="مسحوبات نقدية" value={fmt(data.totals.cash_withdrawals)} tone="warning" />
            <ShiftKpiRow label="مصروفات نقدية" value={fmt(data.totals.cash_expenses)} tone="warning" />
            {data.cash_movements.map((cm, index) => (
              <View key={String(cm.id)} style={index > 0 ? listDivider : undefined}>
                <AppListItem
                  title={cm.type === 'cash_in' ? 'إيداع' : 'سحب'}
                  subtitle={cm.note ?? undefined}
                  meta={fmt(cm.amount)}
                  badge={
                    <AppBadge
                      label={cm.direction === 'in' ? 'داخل' : 'خارج'}
                      tone={cm.direction === 'in' ? 'success' : 'warning'}
                    />
                  }
                />
              </View>
            ))}
          </ShiftSectionCard>

          <ShiftSectionCard title="ملخص الإغلاق" icon="account-balance-wallet">
            <ShiftKpiRow label="رصيد الافتتاح" value={fmt(data.shift.starting_cash)} />
            <ShiftKpiRow label="+ مبيعات نقدية" value={fmt(data.totals.cash_sales)} tone="success" />
            <ShiftKpiRow label="+ إيداعات" value={fmt(data.totals.cash_deposits)} tone="success" />
            <ShiftKpiRow
              label="- مرتجعات نقدية"
              value={fmt(preferDrawerCashRefundOutflows(data.totals))}
              tone="warning"
            />
            <ShiftKpiRow label="- مصروفات نقدية" value={fmt(data.totals.cash_expenses)} tone="warning" />
            <ShiftKpiRow label="- مسحوبات" value={fmt(data.totals.cash_withdrawals)} tone="warning" />
            {Number(data.totals.debt_collections ?? 0) > 0 ? (
              <ShiftKpiRow label="تحصيل ديون عملاء" value={fmt(data.totals.debt_collections ?? 0)} tone="success" />
            ) : null}
            {Number(data.totals.layaway_collections ?? 0) > 0 ? (
              <ShiftKpiRow label="تحصيل أقساط تقسيط" value={fmt(data.totals.layaway_collections ?? 0)} tone="success" />
            ) : null}
            {Number(data.totals.card_payments ?? 0) > 0 ? (
              <ShiftKpiRow label="بطاقات (معلوماتي)" value={fmt(data.totals.card_payments ?? 0)} />
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
                <ShiftKpiRow label="النقد الفعلي" value={fmt(data.totals.actual_cash)} />
                {Number(data.totals.deposit_amount ?? 0) > 0 ? (
                  <ShiftKpiRow
                    label={
                      data.totals.closing_vault_settlement_direction === 'withdraw'
                        ? 'سحب إغلاق من الخزنة'
                        : 'إيداع إغلاق إلى الخزنة'
                    }
                    value={fmt(data.totals.deposit_amount ?? 0)}
                    tone={data.totals.closing_vault_settlement_direction === 'withdraw' ? 'success' : 'warning'}
                  />
                ) : null}
                <ShiftKpiRow
                  label="الفرق"
                  value={fmt(data.totals.variance)}
                  tone={variance != null && variance < 0 ? 'danger' : variance != null && variance > 0 ? 'success' : 'default'}
                />
              </>
            ) : null}
          </ShiftSectionCard>

          <ShiftSheetFooter>
            <AppButton title="طباعة التقرير" variant="secondary" loading={printing} style={{ flex: 1 }} onPress={() => void handlePrint()} />
            <AppButton title="إغلاق" style={{ flex: 1 }} onPress={onClose} />
          </ShiftSheetFooter>
        </View>
      ) : null}
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.lg, paddingBottom: spacing.xl },
  kpiGrid: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
  infoGrid: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
});
