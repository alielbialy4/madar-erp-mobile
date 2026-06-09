import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { DashboardShortcutsHub } from '@/components/dashboard/DashboardShortcutsHub';
import { BranchDashboardView, type BranchOperationalPayload } from '@/components/dashboard/BranchDashboardView';
import { GlobalDashboardView, type GlobalAnalyticsPayload } from '@/components/dashboard/GlobalDashboardView';
import { CashierDashboardView } from '@/components/dashboard/CashierDashboardView';
import { dashboardAPI } from '@/api/dashboard';
import { useBranchStore } from '@/store/branchStore';
import { useAuthStore } from '@/store/authStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { canAccessBranchOperationalDashboard } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from '@/types/navigation';

type Props = {
  navigation: BottomTabNavigationProp<MainTabParamList>;
};

export function DashboardScreen({ navigation }: Props) {
  const user = useAuthStore((s) => s.user);
  const viewMode = useBranchStore((s) => s.viewMode);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const isGlobalView = viewMode === 'global';
  const canAccessBranch = canAccessBranchOperationalDashboard(user);

  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [globalData, setGlobalData] = useState<GlobalAnalyticsPayload | null>(null);
  const [branchData, setBranchData] = useState<BranchOperationalPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lastUpdatedLabel = useMemo(
    () =>
      lastUpdatedAt
        ? lastUpdatedAt.toLocaleTimeString('ar-EG-u-nu-latn', { hour: '2-digit', minute: '2-digit' })
        : '—',
    [lastUpdatedAt],
  );

  const refreshNow = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent === true;
      if (!silent) setLoading(true);
      setError(null);
      try {
        if (isGlobalView) {
          const res = await dashboardAPI.getGlobalAnalytics();
          setGlobalData((extractData<GlobalAnalyticsPayload>(res) ?? {}) as GlobalAnalyticsPayload);
          setBranchData(null);
        } else if (canAccessBranch && activeBranch?.id) {
          const res = await dashboardAPI.getBranchOperational();
          setBranchData((extractData<BranchOperationalPayload>(res) ?? {}) as BranchOperationalPayload);
          setGlobalData(null);
        } else {
          setGlobalData(null);
          setBranchData(null);
        }
        setLastUpdatedAt(new Date());
      } catch (err) {
        setError(normalizeApiError(err).message);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [isGlobalView, canAccessBranch, activeBranch?.id],
  );

  useEffect(() => {
    void refreshNow();
  }, [refreshNow]);

  useEffect(() => {
    const id = setInterval(() => {
      void refreshNow({ silent: true });
    }, 30000);
    return () => clearInterval(id);
  }, [refreshNow]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void refreshNow({ silent: true });
  }, [refreshNow]);

  const shell = useMemo(
    () => ({
      lastUpdatedLabel,
      isLoading: loading || refreshing,
      onRefresh: () => void refreshNow({ silent: true }),
    }),
    [lastUpdatedLabel, loading, refreshing, refreshNow],
  );

  const pageTitle = 'لوحة التحكم';

  const pageSubtitle = isGlobalView
    ? 'مركز العمليات — إيرادات، مبيعات، ومقارنة الفروع.'
    : canAccessBranch
      ? 'تشغيل الفرع — مؤشرات اليوم، الوردية، والتنبيهات.'
      : 'ورديتك ومبيعاتك في هذا الفرع.';

  return (
    <AppScreen
      title={pageTitle}
      subtitle={pageSubtitle}
      noHeader
      scroll
      refreshing={refreshing}
      onRefresh={onRefresh}
      contentStyle={{ padding: 0, gap: spacing.md }}
    >
      {isGlobalView ? (
        <GlobalDashboardView
          data={globalData}
          loading={loading}
          error={error}
          shell={shell}
          onRetry={() => void refreshNow()}
        />
      ) : !canAccessBranch ? (
        <CashierDashboardView shell={shell} navigation={navigation} />
      ) : (
        <BranchDashboardView
          data={branchData}
          loading={loading}
          error={error}
          shell={shell}
          navigation={navigation}
          onRetry={() => void refreshNow()}
        />
      )}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.xl }}>
        <DashboardShortcutsHub navigation={navigation} />
      </View>
    </AppScreen>
  );
}
