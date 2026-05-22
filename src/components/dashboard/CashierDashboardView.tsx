import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge, AppButton } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { DashboardHero } from './DashboardHero';
import { DashboardKpiCard } from './DashboardKpiCard';
import { DashboardScopePill } from './DashboardScopePill';
import { DashboardSection } from './DashboardSection';
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
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';

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
  onRefresh: () => void;
  quickActions: React.ReactNode;
  greeting?: string;
};

type Props = {
  shell: Shell;
  navigation: BottomTabNavigationProp<MainTabParamList>;
};

function numFromApi(v: string | number | null | undefined): number {
  return parseApiMoneyFirst(v) ?? 0;
}

export function CashierDashboardView({ shell, navigation }: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const user = useAuthStore((s) => s.user);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const branchId = activeBranch?.id;

  const [myShift, setMyShift] = useState<ActiveShift | null>(null);
  const [totals, setTotals] = useState<ShiftTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const canOpenShift = hasPermission(user, 'open_shift');
  const canPos = hasPermission(user, 'process_sales');

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
      <DashboardScopePill label={activeBranch?.name ?? '—'} dotColor={c.info} />
      <DashboardScopePill
        label={myShift ? 'وردية مفتوحة' : 'لا وردية'}
        dotColor={myShift ? c.success : c.warning}
      />
    </>
  );

  if (loading && !myShift && !loadError) {
    return (
      <View style={ds.page}>
        <DashboardHero
          eyebrow="لوحة الكاشير"
          title={shell.greeting ?? 'لوحة الكاشير'}
          subtitle="بيانات ورديتك المفتوحة فقط في هذا الفرع."
          scopeBadges={scopeBadges}
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={handleRefresh}
          quickActions={shell.quickActions}
        />
        <AppLoadingState />
      </View>
    );
  }

  return (
    <View style={ds.page}>
      <DashboardHero
        eyebrow="لوحة الكاشير"
        title={shell.greeting ?? 'لوحة الكاشير'}
        subtitle="بيانات ورديتك المفتوحة فقط في هذا الفرع — مبيعات، نقد، ومستردات."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={loading}
        onRefresh={handleRefresh}
        quickActions={shell.quickActions}
      />

      {loadError ? <AppErrorState message={loadError} onRetry={() => void load()} /> : null}

      {!loading && !myShift && !loadError ? (
        <DashboardSection title="الوردية" icon="schedule" iconTone="warning" badge="مغلقة" badgeTone="warning">
          <View style={[ds.surfaceCard, { padding: spacing.xxl, alignItems: 'center', gap: spacing.md }]}>
            <MaterialIcons name="schedule" size={40} color={c.textCaption} />
            <Text style={[ds.sectionTitle, { textAlign: 'center' }]}>لا توجد وردية مفتوحة</Text>
            <Text style={[ds.sectionHint, { textAlign: 'center' }]}>افتح الوردية لكي تظهر بياناتها</Text>
            {canOpenShift ? (
              <AppButton
                title="فتح وردية"
                onPress={() => navigation.navigate('MoreTab', { screen: 'ShiftManagement' })}
              />
            ) : (
              <Text style={ds.emptyText}>ليس لديك صلاحية فتح وردية. راجع المشرف.</Text>
            )}
          </View>
        </DashboardSection>
      ) : null}

      {myShift ? (
        <>
          <DashboardSection
            title="ورديتك الحالية"
            hint={
              myShift.opened_at
                ? `افتتحت ${new Date(myShift.opened_at).toLocaleString('ar-EG-u-nu-latn')}`
                : undefined
            }
            icon="point-of-sale"
            iconTone="accent"
            badge={`#${myShift.shift_no ?? '—'}`}
          >
            <View style={[ds.surfaceCard, { padding: spacing.lg, gap: spacing.md }]}>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                <AppBadge label={myShift.vault?.name ?? 'خزينة'} tone="info" />
                <AppBadge label={`افتتاح: ${money(numFromApi(myShift.starting_cash))}`} tone="neutral" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                {canPos ? (
                  <AppButton title="فتح نقطة البيع" size="sm" onPress={() => navigation.navigate('POSTab')} />
                ) : null}
                <AppButton
                  title="إدارة الوردية"
                  variant="outline"
                  size="sm"
                  onPress={() => navigation.navigate('MoreTab', { screen: 'ShiftManagement' })}
                />
              </View>
            </View>
          </DashboardSection>

          {totals ? (
            <DashboardSection title="ملخص الوردية" icon="summarize" iconTone="success">
              <View style={ds.kpiGrid}>
                <DashboardKpiCard
                  wide
                  label="النقد المتوقع في الدرج"
                  value={money(numFromApi(totals.expected_cash))}
                  icon="account-balance-wallet"
                  tone="success"
                />
                <DashboardKpiCard label="مبيعات نقدية" value={money(numFromApi(totals.cash_sales))} icon="payments" tone="success" />
                <DashboardKpiCard label="غير نقدية" value={money(numFromApi(totals.non_cash_sales))} icon="credit-card" tone="accent" />
                <DashboardKpiCard label="إجمالي المبيعات" value={money(numFromApi(totals.gross_sales))} icon="shopping-cart" tone="info" />
                <DashboardKpiCard
                  label="المستردات"
                  value={money(numFromApi(totals.total_refunds))}
                  hint={`${numberText(totals.refund_count ?? 0)} عملية`}
                  icon="undo"
                  tone="warning"
                />
                <DashboardKpiCard label="المصروفات" value={money(numFromApi(totals.total_expenses))} icon="receipt" tone="danger" />
                <DashboardKpiCard label="إيداعات نقدية" value={money(numFromApi(totals.cash_deposits))} icon="arrow-downward" tone="info" />
                <DashboardKpiCard label="سحوبات نقدية" value={money(numFromApi(totals.cash_withdrawals))} icon="arrow-upward" tone="warning" />
              </View>
            </DashboardSection>
          ) : !loading ? (
            <Text style={ds.emptyText}>تعذر تحميل ملخص الوردية التفصيلي.</Text>
          ) : null}
        </>
      ) : null}
    </View>
  );
}
