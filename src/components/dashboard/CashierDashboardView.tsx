import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppBadge } from '@/components/ui';
import { AppErrorState } from '@/components/feedback';
import { AttentionBand, MadarSection, MadarSurface, MetricBlock, QuickActionBar } from '@/components/madar';
import { OpenShiftSheet } from '@/components/shifts/OpenShiftSheet';
import { CloseShiftSheet } from '@/components/shifts/CloseShiftSheet';
import { DashboardHero } from './DashboardHero';
import { DashboardScopePill } from './DashboardScopePill';
import { DashboardSkeleton } from './DashboardSkeleton';
import { createDashboardStyles } from './dashboardStyles';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { shiftsAPI } from '@/api/shifts';
import { money } from '@/utils/format';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import { hasPermission } from '@/utils/permissions';
import { cashierMayCloseBranchShift } from '@/utils/branchShiftCloseVisibility';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import type { ActiveShift } from '@/types/api';
import type { ActiveShiftExtended } from '@/types/shifts';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';
import { spacing } from '@/constants/spacing';
import { Text } from '@/components/ui/AppText';

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
    mode: shift.mode,
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
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openSheet, setOpenSheet] = useState(false);
  const [closeSheet, setCloseSheet] = useState(false);

  const canOpenShift = hasPermission(user, 'open_shift');
  const canPos = hasPermission(user, 'process_sales');
  const isAdmin = Boolean(user?.is_super_admin || hasPermission(user, 'access_admin_routes'));
  const canCloseShift =
    hasPermission(user, 'close_shift') &&
    cashierMayCloseBranchShift({
      isCashier: Boolean(user?.roles?.some((role) => String(role).toLowerCase() === 'cashier')),
      registerMode:
        myShift?.mode ??
        String((activeBranch?.settings as { register_mode?: string } | undefined)?.register_mode ?? 'legacy_shared_drawer'),
      canManageShifts:
        hasPermission(user, 'manage_shifts') || hasPermission(user, 'access_admin_routes'),
    });

  const load = useCallback(async () => {
    if (!branchId) {
      setMyShift(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const cur = await shiftsAPI.current(branchId);
      const shift = extractData<ActiveShift | null>(cur) ?? null;
      setMyShift(shift);
    } catch (err) {
      setLoadError(normalizeApiError(err).message);
      setMyShift(null);
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
          subtitle="ورديتك الحالية — افتح نقطة البيع أو أغلق الوردية عند الانتهاء."
          scopeBadges={scopeBadges}
          lastUpdatedLabel={shell.lastUpdatedLabel}
          isLoading
          onRefresh={handleRefresh}
        />
        <DashboardSkeleton variant="cashier" />
      </View>
    );
  }

  const actions = [
    canPos
      ? {
          id: 'pos',
          label: 'نقطة البيع',
          icon: 'storefront' as const,
          onPress: () => navigation.navigate('POSTab'),
          tone: 'accent' as const,
        }
      : null,
    canOpenShift && !myShift
      ? {
          id: 'open-shift',
          label: 'فتح وردية',
          icon: 'clock' as const,
          onPress: () => setOpenSheet(true),
        }
      : null,
    canCloseShift && myShift
      ? {
          id: 'close-shift',
          label: 'إغلاق الوردية',
          icon: 'logout' as const,
          onPress: () => setCloseSheet(true),
          tone: 'danger' as const,
        }
      : null,
  ].filter(Boolean) as {
    id: string;
    label: string;
    icon?: 'storefront' | 'clock' | 'logout';
    onPress: () => void;
    tone?: 'default' | 'danger' | 'accent';
  }[];

  return (
    <View style={ds.page}>
      <DashboardHero
        title="لوحة الكاشير"
        subtitle="حالة الوردية أولاً — ثم إجراء واحد واضح للبيع أو الإغلاق."
        scopeBadges={scopeBadges}
        lastUpdatedLabel={shell.lastUpdatedLabel}
        isLoading={loading || shell.isLoading}
        onRefresh={handleRefresh}
      />

      {loadError ? <AppErrorState message={loadError} onRetry={() => void load()} /> : null}

      {!loading && !myShift && !loadError ? (
        <AttentionBand
          items={[
            {
              id: 'need-shift',
              title: 'لا توجد وردية مفتوحة',
              detail: canOpenShift
                ? 'افتح وردية لتفعيل نقطة البيع ومتابعة الصندوق.'
                : 'ليس لديك صلاحية فتح وردية. راجع المشرف.',
              tone: 'warning',
              onPress: canOpenShift ? () => setOpenSheet(true) : undefined,
            },
          ]}
        />
      ) : null}

      {myShift ? (
        <MadarSection title="وردية نشطة">
          <MadarSurface style={{ gap: spacing.md }}>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, alignItems: 'center' }}>
              <AppBadge label={`وردية #${myShift.shift_no ?? '—'}`} tone="info" />
              <AppBadge label={activeBranch?.name ?? 'الفرع'} tone="neutral" />
            </View>
            <Text style={ds.sectionHint}>
              {myShift.vault?.name ?? 'خزينة'}
              {myShift.opened_at
                ? ` · افتتحت ${new Date(myShift.opened_at).toLocaleString('ar-EG-u-nu-latn')}`
                : ''}
            </Text>
            <MetricBlock
              label="رصيد الافتتاح"
              value={money(numFromApi(myShift.starting_cash))}
              level="B"
              tone="info"
            />
          </MadarSurface>
        </MadarSection>
      ) : null}

      <QuickActionBar actions={actions} />

      <OpenShiftSheet
        visible={openSheet}
        branchId={branchId}
        onClose={() => setOpenSheet(false)}
        onSuccess={() => {
          setOpenSheet(false);
          void load();
        }}
      />

      {canCloseShift ? (
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
      ) : null}
    </View>
  );
}
