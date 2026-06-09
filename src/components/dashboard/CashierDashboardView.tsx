import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge, AppButton } from '@/components/ui';
import { AppErrorState } from '@/components/feedback';
import { OpenShiftSheet } from '@/components/shifts/OpenShiftSheet';
import { CloseShiftSheet } from '@/components/shifts/CloseShiftSheet';
import { ShiftSummarySheet } from '@/components/shifts/ShiftSummarySheet';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { DashboardSkeleton } from './DashboardSkeleton';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { shiftsAPI } from '@/api/shifts';
import { money, numberText } from '@/utils/format';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import type { ActiveShift } from '@/types/api';
import type { ActiveShiftExtended } from '@/types/shifts';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';
import { Text } from '@/components/ui/AppText';

type ShiftTotals = {
  cash_sales?: string | number;
  non_cash_sales?: string | number;
  gross_sales?: string | number;
  total_refunds?: string | number;
  refund_count?: number;
  total_expenses?: string | number;
  expected_cash?: string | number;
  cash_deposits?: string | number;
  cash_withdrawals?: string | number;
};

type Shell = {
  lastUpdatedLabel: string;
  isLoading?: boolean;
  onRefresh: () => void;
};

type Props = {
  shell: Shell;
  navigation: BottomTabNavigationProp<MainTabParamList>;
};

function numFromApi(v: string | number | null | undefined): number {
  return parseApiMoneyFirst(v) ?? 0;
}

function toExtendedShift(shift: ActiveShift): ActiveShiftExtended {
  return {
    id: shift.id,
    shift_no: shift.shift_no,
    branch_id: shift.branch_id,
    vault_id: shift.vault_id,
    vault: shift.vault,
    opened_at: shift.opened_at,
    starting_cash: shift.starting_cash,
    expected_cash: shift.expected_cash,
    drawer_ledger_enabled: shift.drawer_ledger_enabled,
    accounting_model: shift.accounting_model,
    status: shift.status,
  };
}

export function CashierDashboardView({ shell, navigation }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const branchId = activeBranch?.id ?? null;

  const [myShift, setMyShift] = useState<ActiveShift | null>(null);
  const [totals, setTotals] = useState<ShiftTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [closeSheet, setCloseSheet] = useState(false);
  const [summaryOpen, setSummaryOpen] = useState(false);

  const canOpenShift = hasPermission(user, 'open_shift');
  const canCloseShift = hasPermission(user, 'close_shift');
  const canPos = hasPermission(user, 'process_sales');
  const isAdmin = Boolean(user?.is_super_admin || hasPermission(user, 'access_admin_routes'));

  const load = useCallback(async () => {
    if (!branchId) {
      setMyShift(null);
      setTotals(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const cur = await shiftsAPI.current(branchId);
      const shift = extractData<ActiveShift | null>(cur) ?? null;
      setMyShift(shift);
      if (shift?.id) {
        const sum = await shiftsAPI.getSummary(shift.id, { branch_id: branchId });
        const raw = extractData(sum) as { totals?: ShiftTotals } | undefined;
        setTotals(raw?.totals ?? null);
      } else {
        setTotals(null);
      }
    } catch (err) {
      setLoadError(normalizeApiError(err).message);
      setMyShift(null);
      setTotals(null);
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRefresh = () => {
    shell.onRefresh();
    void load();
  };

  const scopeBadges = (
    <>
      <DashboardScopePill variant="hero" label={activeBranch?.name ?? '—'} dotColor={c.info} />
      <DashboardScopePill
        variant="hero"
        label={myShift ? 'وردية مفتوحة' : 'لا وردية'}
        dotColor={myShift ? c.success : c.warning}
      />
    </>
  );

  if (loading && !myShift && !loadError) {
    return (
      <View style={ds.page}>
        <DashboardHero
          title="لوحة الكاشير"
          subtitle="بيانات ورديتك فقط — مبيعات، نقد، ومستردات."
          scopeBadges={scopeBadges}
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={handleRefresh}
        />
        <DashboardSkeleton variant="cashier" />
      </View>
    );
  }

  return (
    <View style={ds.page}>
      <DashboardHero
        title="لوحة الكاشير"
        subtitle="بيانات ورديتك فقط — مبيعات، نقد، ومستردات."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={loading || shell.isLoading}
        onRefresh={handleRefresh}
      />

      {loadError ? <AppErrorState message={loadError} onRetry={() => void load()} /> : null}

      {!loading && !myShift && !loadError ? (
        <View style={[ds.surfaceCard, { padding: spacing.xxl, alignItems: 'center', gap: spacing.md, borderStyle: 'dashed' }]}>
          <MaterialIcons name="schedule" size={40} color={c.textCaption} />
          <Text style={[ds.sectionTitle, { textAlign: 'center' }]}>لا توجد وردية مفتوحة</Text>
          <Text style={[ds.sectionHint, { textAlign: 'center' }]}>افتح الوردية لكي تظهر بياناتها</Text>
          {canOpenShift ? (
            <AppButton title="فتح وردية" onPress={() => setOpenSheet(true)} />
          ) : (
            <Text style={ds.emptyText}>ليس لديك صلاحية فتح وردية. راجع المشرف.</Text>
          )}
        </View>
      ) : null}

      {myShift ? (
        <>
          <View style={[ds.surfaceCard, { padding: spacing.lg, gap: spacing.md }]}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
              <AppBadge label={`وردية #${myShift.shift_no ?? '—'}`} tone="info" />
              <AppBadge label={activeBranch?.name ?? 'الفرع'} tone="neutral" />
            </View>
            <Text style={[ds.sectionHint, { ...ds.sectionHint }]}>
              {myShift.vault?.name ?? 'خزينة'}
              {myShift.opened_at
                ? ` · افتتحت ${new Date(myShift.opened_at).toLocaleString('ar-EG-u-nu-latn')}`
                : ''}
            </Text>
            <Text style={ds.sectionTitle}>
              رصيد افتتاحي: <Text style={{ fontWeight: '800' }}>{money(numFromApi(myShift.starting_cash))}</Text>
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
              {canPos ? (
                <AppButton title="فتح نقطة البيع" size="sm" onPress={() => navigation.navigate('POSTab')} />
              ) : null}
              <AppButton title="ملخص الوردية" variant="outline" size="sm" onPress={() => setSummaryOpen(true)} />
              {canCloseShift ? (
                <AppButton title="إغلاق الوردية" variant="secondary" size="sm" onPress={() => setCloseSheet(true)} />
              ) : null}
            </View>
          </View>

          {totals ? (
            <>
              <Text style={ds.sectionLabel}>ملخص الوردية</Text>
              <View style={ds.kpiGrid}>
                <DashboardKpiCard label="مبيعات نقدية" value={money(numFromApi(totals.cash_sales))} icon="payments" tone="success" index={0} />
                <DashboardKpiCard label="غير نقدية" value={money(numFromApi(totals.non_cash_sales))} icon="credit-card" tone="accent" index={1} />
                <DashboardKpiCard label="إجمالي المبيعات" value={money(numFromApi(totals.gross_sales))} icon="shopping-cart" tone="info" index={2} />
                <DashboardKpiCard
                  label="المستردات"
                  value={money(numFromApi(totals.total_refunds))}
                  hint={`${numberText(totals.refund_count ?? 0)} عملية`}
                  icon="undo"
                  tone="warning"
                  index={3}
                />
                <DashboardKpiCard label="المصروفات" value={money(numFromApi(totals.total_expenses))} icon="receipt" tone="danger" index={4} />
                <DashboardKpiCard
                  label="النقد المتوقع في الدرج"
                  value={money(numFromApi(totals.expected_cash))}
                  icon="account-balance-wallet"
                  tone="success"
                  index={5}
                />
                <DashboardKpiCard label="إيداعات نقدية" value={money(numFromApi(totals.cash_deposits))} icon="arrow-downward" tone="info" index={6} />
                <DashboardKpiCard label="سحوبات نقدية" value={money(numFromApi(totals.cash_withdrawals))} icon="arrow-upward" tone="warning" index={7} />
              </View>
            </>
          ) : !loading ? (
            <Text style={ds.emptyText}>تعذر تحميل ملخص الوردية التفصيلي.</Text>
          ) : null}
        </>
      ) : null}

      <OpenShiftSheet
        visible={openSheet}
        branchId={branchId}
        onClose={() => setOpenSheet(false)}
        onSuccess={() => {
          setOpenSheet(false);
          void load();
        }}
      />

      <CloseShiftSheet
        visible={closeSheet}
        shift={myShift ? toExtendedShift(myShift) : null}
        isAdmin={isAdmin}
        onClose={() => setCloseSheet(false)}
        onSuccess={() => {
          setCloseSheet(false);
          void load();
        }}
      />

      <ShiftSummarySheet
        visible={summaryOpen}
        shiftId={myShift?.id ?? null}
        branchId={branchId ?? myShift?.branch_id ?? null}
        onClose={() => setSummaryOpen(false)}
      />
    </View>
  );
}
