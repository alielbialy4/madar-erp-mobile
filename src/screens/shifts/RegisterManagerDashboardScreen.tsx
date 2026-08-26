import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { posRegistersAPI, type RegisterManagerDashboard } from '@/api/posRegisters';
import { shiftsAPI } from '@/api/shifts';
import type { ActiveShift } from '@/types/api';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner } from '@/components/feedback';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppText as Text } from '@/components/ui';
import { DenseRow, MadarSection } from '@/components/madar';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';

const money = (value: unknown) =>
  value === null || value === undefined || value === ''
    ? '—'
    : Number(value).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function RegisterManagerDashboardScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((state) => state.user);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const canView = hasPermission(user, [
    'view_register_session_reconciliation',
    'access_admin_routes',
    'manage_shifts',
  ]);

  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [data, setData] = useState<RegisterManagerDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    setError(null);
    try {
      const branchId = viewMode === 'branch' ? activeBranch?.id ?? null : null;
      const currentRes = await shiftsAPI.current(branchId);
      const activeShift = currentRes.data ?? null;
      setShift(activeShift);
      if (!activeShift?.id) {
        setData(null);
        return;
      }
      setData(await posRegistersAPI.getManagerDashboard(activeShift.id));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id, canView, viewMode]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!canView) {
    return (
      <ListScreenLayout title="لوحة إدارة الأدراج" subtitle="متابعة جلسات صناديق النقد">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية متابعة جلسات الأدراج." />
      </ListScreenLayout>
    );
  }

  const rollup = data?.rollup ?? null;
  const countComplete = Boolean(rollup?.is_count_complete);

  return (
    <ListScreenLayout
      title="لوحة إدارة الأدراج"
      subtitle="النقد المتوقع لكل درج على حدة — دون دمج أفتراضي للأدراج"
      onRefresh={() => void load()}
      refreshing={loading}
      hero={{
        eyebrow: "الورديات",
        title: 'الأدراج المتعددة',
        subtitle: shift ? `الوردية #${shift.shift_no ?? shift.id}` : 'لا توجد وردية مفتوحة',
        compact: true,
      }}
      headerRight={
        <AppButton title="مراجعة التسويات" variant="outline" onPress={() => navigation.navigate('RegisterReconciliation')} />
      }
    >
      {error ? <AppBanner tone="danger" message={error} /> : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {!shift ? <AppBanner tone="info" message="افتح أو اختر وردية لعرض ملخص الأدراج." /> : null}

        {shift && data ? (
          <>
            <View style={styles.badgeRow}>
              <AppBadge label={`جلسات مفتوحة: ${data.open_session_count ?? 0}`} tone="default" />
              <AppBadge label={`تتطلب مراجعة: ${data.review_required_count ?? 0}`} tone="warning" />
              <AppBadge label={`معلق أوفلاين: ${data.server_pending_offline_count ?? 0}`} tone="neutral" />
            </View>

            {rollup ? (
              <MadarSection title="إجمالي الوردية">
                <View style={{ gap: spacing.xs }}>
                  <DenseRow primary="المتوقع" trailing={<Text>{money(rollup.expected_cash)}</Text>} />
                  <DenseRow
                    primary="المعدود"
                    trailing={<Text>{countComplete ? money(rollup.counted_cash) : '—'}</Text>}
                  />
                  <DenseRow
                    primary="الصافي"
                    trailing={
                      <Text>
                        {countComplete ? money(rollup.raw_variance ?? rollup.variance) : '—'}
                      </Text>
                    }
                  />
                  <DenseRow
                    primary="العجز"
                    trailing={<Text>{countComplete ? money(rollup.total_shortage) : '—'}</Text>}
                  />
                  <DenseRow
                    primary="الزيادة"
                    trailing={<Text>{countComplete ? money(rollup.total_overage) : '—'}</Text>}
                  />
                </View>
                {countComplete
                && Number(rollup.raw_variance ?? rollup.variance ?? 0) === 0
                && Boolean(rollup.has_individual_variances) ? (
                  <AppBanner
                    tone="warning"
                    message={`صافي الوردية متوازن لكن توجد فروقات فردية بين الأدراج — عجز ${money(rollup.total_shortage)} وزيادة ${money(rollup.total_overage)}.`}
                  />
                ) : null}
              </MadarSection>
            ) : null}

            {(data.registers ?? []).length > 0 ? (
              <MadarSection title="الأدراج">
                <View style={{ gap: spacing.xs }}>
                  {(data.registers ?? []).map((r) => (
                    <DenseRow
                      key={r.uuid}
                      primary={`${r.code} — ${r.name ?? ''}`}
                      secondary={
                        r.current_session
                          ? `الكاشير: ${r.current_session.cashier?.name ?? '—'} · المتوقع ${money(r.current_session.expected_cash)}`
                          : 'خامل'
                      }
                      meta={r.reconciliation_status ?? undefined}
                      status={
                        r.reconciliation_status && r.reconciliation_status !== 'ok'
                          ? <AppBadge label={r.reconciliation_status} tone="warning" />
                          : undefined
                      }
                      onPress={
                        r.current_session
                          ? () => navigation.navigate('RegisterSessionDetail', { id: r.current_session!.uuid })
                          : undefined
                      }
                    />
                  ))}
                </View>
              </MadarSection>
            ) : null}

            {(rollup?.sessions ?? []).length > 0 ? (
              <MadarSection title="جلسات الوردية">
                <View style={{ gap: spacing.xs }}>
                  {(rollup?.sessions ?? []).map((s) => {
                    const isOpen = s.status === 'open';
                    const shortage = Number(s.effective_variance ?? s.variance ?? 0) < 0
                      ? Math.abs(Number(s.effective_variance ?? s.variance))
                      : 0;
                    const overage = Number(s.effective_variance ?? s.variance ?? 0) > 0
                      ? Number(s.effective_variance ?? s.variance)
                      : 0;
                    return (
                      <DenseRow
                        key={s.uuid}
                        primary={`${s.register?.code ?? 'درج'} · ${s.cashier?.name ?? '—'}`}
                        secondary={`مفتوح ${money(s.opening_cash)} · متوقع ${money(s.expected_cash ?? s.current_expected_cash)} · معدود ${isOpen ? '—' : money(s.counted_cash)}`}
                        meta={`تعديلات متأخرة ${s.late_adjustment_count ?? 0} · أوفلاين ${s.server_pending_offline_count ?? 0}`}
                        status={
                          isOpen ? (
                            <AppBadge label="مفتوحة" tone="info" />
                          ) : shortage > 0 ? (
                            <AppBadge label={`عجز ${money(shortage)}`} tone="danger" />
                          ) : overage > 0 ? (
                            <AppBadge label={`زيادة ${money(overage)}`} tone="warning" />
                          ) : (
                            <AppBadge label="مطابق" tone="success" />
                          )
                        }
                        onPress={() => navigation.navigate('RegisterSessionDetail', { id: s.uuid })}
                      />
                    );
                  })}
                </View>
              </MadarSection>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
