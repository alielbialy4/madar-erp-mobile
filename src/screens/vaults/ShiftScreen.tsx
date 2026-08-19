import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect } from '@react-navigation/native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { shiftsAPI } from '@/api/shifts';
import { useBranchStore } from '@/store/branchStore';
import { AppScreen, ModuleHeader } from '@/components/layout';
import { AppBadge, AppButton, AppListItem, AppSectionHeader } from '@/components/ui';
import { MetricBlock, FinancialValue } from '@/components/madar';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { CloseShiftSheet } from '@/components/shifts/CloseShiftSheet';
import { OpenShiftSheet } from '@/components/shifts/OpenShiftSheet';
import { ShiftFilterSheet, type ShiftListFilters } from '@/components/shifts/ShiftFilterSheet';
import { ShiftSummarySheet } from '@/components/shifts/ShiftSummarySheet';
import { extractArray, extractData, extractPagination } from '@/utils/data';
import { dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { formatShiftLabel } from '@/utils/shiftLabel';
import { parseApiMoneyFirst } from '@/utils/parseMoney';
import { dateDaysAgoLocal, todayLocalDateString } from '@/utils/dateLocal';
import { useColors } from '@/hooks/useColors';
import { usePermissions } from '@/hooks/usePermissions';
import { hasRole } from '@/utils/permissions';
import { cashierMayCloseBranchShift } from '@/utils/branchShiftCloseVisibility';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import type { ActiveShiftExtended, CurrentMeta, ShiftFilterUser, ShiftListRow } from '@/types/shifts';

const defaultFilters = (): ShiftListFilters => ({
  from_date: dateDaysAgoLocal(30),
  to_date: todayLocalDateString(),
  status: 'all',
  branch_id: '',
  user_id: '',
});

export function ShiftScreen({ navigation }: { route: unknown; navigation: { goBack: () => void } }) {
  const c = useColors();
  const { can, user } = usePermissions();
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const viewMode = useBranchStore((s) => s.viewMode);
  const isGlobalView = viewMode === 'global';

  const [filters, setFilters] = useState(defaultFilters);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filterUsers, setFilterUsers] = useState<ShiftFilterUser[]>([]);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<ShiftListRow[]>([]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1 });
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [currentShift, setCurrentShift] = useState<ActiveShiftExtended | null>(null);
  const [currentMeta, setCurrentMeta] = useState<CurrentMeta | null>(null);
  const [currentLoading, setCurrentLoading] = useState(false);

  const [openSheet, setOpenSheet] = useState(false);
  const [closeSheet, setCloseSheet] = useState(false);
  const [summaryShiftId, setSummaryShiftId] = useState<string | null>(null);
  const [summaryBranchId, setSummaryBranchId] = useState<string | null>(null);

  const isAdmin = Boolean(user?.is_super_admin || can('access_admin_routes') || hasRole(user, ['admin']));
  const isCashier = hasRole(user, ['cashier', 'Cashier']);
  const canOpen = can(['open_shift', 'manage_shifts', 'access_admin_routes', 'process_sales']);
  const canViewShiftSummary = !isCashier;

  const effectiveBranchForCurrent = useMemo(() => {
    if (!isGlobalView && activeBranch?.id) return activeBranch.id;
    if (isGlobalView && filters.branch_id) return filters.branch_id;
    return activeBranch?.id ?? null;
  }, [isGlobalView, activeBranch?.id, filters.branch_id]);

  const listBranchId = useMemo(() => {
    if (isGlobalView && filters.branch_id) return filters.branch_id;
    return undefined;
  }, [isGlobalView, filters.branch_id]);

  const filterUsersBranchParam = useMemo(() => {
    if (isGlobalView) return listBranchId;
    return activeBranch?.id;
  }, [isGlobalView, listBranchId, activeBranch?.id]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        subtitle: { color: c.textMuted, fontSize: typography.small, ...textStart },
        currentPanel: {
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.border,
          backgroundColor: c.surface,
        },
        currentRow: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
        currentItem: { flex: 1, minWidth: '42%', gap: 2, paddingVertical: spacing.xs },
        currentLabel: { color: c.textMuted, fontSize: typography.small, ...textStart },
        currentValue: { color: c.text, fontWeight: '800', ...textStart },
        actions: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
        historySection: { gap: spacing.sm },
        historyTable: {
          overflow: 'hidden',
          borderRadius: radius.lg,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: c.border,
          backgroundColor: c.surface,
        },
        pager: { ...flexRow, justifyContent: 'space-between', alignItems: 'center', paddingTop: spacing.sm },
        pagerText: { color: c.textMuted, fontSize: typography.small },
      }),
    [c],
  );

  const loadFilterUsers = useCallback(async () => {
    try {
      const res = await shiftsAPI.filterUsers(
        filterUsersBranchParam ? { branch_id: filterUsersBranchParam } : undefined,
      );
      setFilterUsers(extractArray<ShiftFilterUser>(res));
    } catch {
      setFilterUsers([]);
    }
  }, [filterUsersBranchParam]);

  const loadList = useCallback(async () => {
    setListLoading(true);
    setListError(null);
    try {
      const userNum = parseInt(filters.user_id.trim(), 10);
      const res = await shiftsAPI.list({
        page,
        per_page: 20,
        from_date: filters.from_date,
        to_date: filters.to_date,
        status: filters.status === 'all' ? undefined : filters.status,
        branch_id: listBranchId,
        user_id: Number.isFinite(userNum) && userNum > 0 ? userNum : undefined,
      });
      setRows(extractArray<ShiftListRow>(res));
      const pag = extractPagination(res);
      if (pag) {
        setPagination({
          current_page: pag.current_page ?? page,
          last_page: pag.last_page ?? 1,
        });
      }
    } catch (err) {
      setListError(normalizeApiError(err).message);
      setRows([]);
    } finally {
      setListLoading(false);
    }
  }, [page, filters, listBranchId]);

  const loadCurrent = useCallback(async () => {
    if (!effectiveBranchForCurrent) {
      setCurrentShift(null);
      setCurrentMeta(null);
      return;
    }
    setCurrentLoading(true);
    try {
      const res = await shiftsAPI.current(effectiveBranchForCurrent);
      const shift = extractData<ActiveShiftExtended | null>(res) ?? null;
      setCurrentShift(shift);
      setCurrentMeta((res as { meta?: CurrentMeta }).meta ?? null);
    } catch {
      setCurrentShift(null);
      setCurrentMeta(null);
    } finally {
      setCurrentLoading(false);
    }
  }, [effectiveBranchForCurrent]);

  const refreshAll = useCallback(async () => {
    await Promise.all([loadList(), loadCurrent(), loadFilterUsers()]);
  }, [loadList, loadCurrent, loadFilterUsers]);

  useEffect(() => {
    void loadFilterUsers();
  }, [loadFilterUsers]);

  useEffect(() => {
    void loadList();
  }, [loadList]);

  useEffect(() => {
    void loadCurrent();
  }, [loadCurrent]);

  useFocusEffect(
    useCallback(() => {
      void refreshAll();
    }, [refreshAll]),
  );

  const openSummary = (row: ShiftListRow) => {
    if (!canViewShiftSummary) return;
    const branchId = row.branch_id || row.branch?.id || (!isGlobalView ? activeBranch?.id : null) || null;
    setSummaryShiftId(row.id);
    setSummaryBranchId(branchId);
  };

  const statusBadge = (status: string) => (
    <AppBadge label={status === 'open' ? 'مفتوحة' : 'مغلقة'} tone={status === 'open' ? 'success' : 'default'} />
  );

  const canCloseCurrent =
    currentShift &&
    cashierMayCloseBranchShift({
      isCashier,
      registerMode:
        currentShift.mode ??
        String((activeBranch?.settings as { register_mode?: string } | undefined)?.register_mode ?? 'legacy_shared_drawer'),
      canManageShifts: can(['manage_shifts', 'access_admin_routes']),
    }) &&
    (currentMeta?.can_close_shift !== false || can(['manage_shifts', 'access_admin_routes']));

  const vaultLedger =
    currentShift?.status === 'open'
      ? parseApiMoneyFirst(currentShift.vault?.balance, currentShift.vault)
      : null;
  const drawerExpected =
    currentShift?.status === 'open' ? parseApiMoneyFirst(currentShift.expected_cash) : null;

  const headerRight = (
    <Pressable onPress={() => setFilterOpen(true)} accessibilityLabel="تصفية">
      <MaterialIcons name="filter-list" size={24} color={c.text} />
    </Pressable>
  );

  return (
    <AppScreen
      title="العمليات"
      onBack={navigation.goBack}
      headerRight={headerRight}
      refreshing={listLoading && !listError}
      onRefresh={() => void refreshAll()}
    >
      <ModuleHeader
        eyebrow="الرقابة النقدية"
        title="الورديات"
        subtitle="الحالة الحالية، النقد المتوقع، الإغلاق، وسجل الورديات."
        compact
        onRefresh={() => void refreshAll()}
        refreshing={listLoading || currentLoading}
        stats={[
          { label: 'الحالة الحالية', value: currentShift ? 'مفتوحة' : 'لا توجد', tone: currentShift ? 'success' : 'warning' },
          { label: 'السجلات', value: rows.length },
          { label: 'الصفحة', value: `${pagination.current_page}/${pagination.last_page}` },
        ]}
      />

      <View style={styles.currentPanel}>
        <AppSectionHeader title="الوردية الحالية" />
        {currentLoading ? (
          <AppLoadingState />
        ) : !effectiveBranchForCurrent ? (
          <AppEmptyState title="اختر فرعاً" message="حدد فرعاً لعرض الوردية المفتوحة (من الفلاتر أو مبدّل الفرع)." />
        ) : currentShift ? (
          <>
            <View style={{ ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[styles.currentValue, { fontSize: typography.entityTitle }]}>
                {formatShiftLabel(currentShift, currentShift.id, currentShift.branch?.name)}
              </Text>
              {statusBadge(currentShift.status ?? 'open')}
            </View>
            <View style={styles.currentRow}>
              <MetricBlock
                label="النقد المتوقع"
                value={drawerExpected ?? currentShift.starting_cash ?? 0}
                currency="ج.م"
                level="B"
                style={{ flex: 1, minWidth: '45%' }}
              />
              <MetricBlock
                label="رصيد الخزنة"
                value={vaultLedger ?? '—'}
                currency={vaultLedger != null ? 'ج.م' : undefined}
                level="B"
                tone="info"
                style={{ flex: 1, minWidth: '45%' }}
              />
            </View>
            <View style={styles.currentRow}>
              <View style={styles.currentItem}>
                <Text style={styles.currentLabel}>الخزنة</Text>
                <Text style={styles.currentValue}>{currentShift.vault?.name ?? '—'}</Text>
              </View>
              <View style={styles.currentItem}>
                <Text style={styles.currentLabel}>نقدية الافتتاح</Text>
                <FinancialValue amount={currentShift.starting_cash ?? 0} currency="ج.م" level="inline" align="start" />
              </View>
              <View style={styles.currentItem}>
                <Text style={styles.currentLabel}>وقت الافتتاح</Text>
                <Text style={styles.currentValue}>{dateText(currentShift.opened_at)}</Text>
              </View>
            </View>
            <View style={styles.actions}>
              {canViewShiftSummary ? (
                <AppButton
                  title="ملخص الوردية"
                  variant="secondary"
                  onPress={() => {
                    setSummaryShiftId(currentShift.id);
                    setSummaryBranchId(
                      currentShift.branch_id ?? currentShift.branch?.id ?? effectiveBranchForCurrent,
                    );
                  }}
                />
              ) : null}
              {canCloseCurrent ? (
                <AppButton title="إغلاق الوردية" variant="danger" onPress={() => setCloseSheet(true)} />
              ) : null}
            </View>
          </>
        ) : (
          <>
            <AppEmptyState title="لا توجد وردية مفتوحة" message="افتح وردية جديدة للبدء." />
            {canOpen ? <AppButton title="فتح وردية" onPress={() => setOpenSheet(true)} /> : null}
          </>
        )}
      </View>

      <View style={styles.historySection}>
        <AppSectionHeader title="سجل الورديات" />
        {listLoading ? <AppLoadingState /> : null}
        {listError ? <AppErrorState message={listError} onRetry={loadList} /> : null}
        {!listLoading && !listError && rows.length === 0 ? (
          <AppEmptyState title="لا توجد ورديات" message="غيّر الفترة أو الفلاتر." />
        ) : null}
        {!listLoading && !listError && rows.length ? (
          <View style={styles.historyTable}>
            {rows.map((row) => (
                <AppListItem
                  key={row.id}
                  title={formatShiftLabel(row, row.id, row.branch?.name)}
                  subtitle={`${row.branch?.name ?? '—'} · ${row.user?.name ?? row.user_id}`}
                  meta={money(row.drawer_balance ?? row.starting_cash ?? 0)}
                  badge={statusBadge(row.status)}
                  onPress={canViewShiftSummary ? () => openSummary(row) : undefined}
                  showChevron={canViewShiftSummary}
                />
              ))}
          </View>
        ) : null}

        {pagination.last_page > 1 ? (
          <View style={styles.pager}>
            <Text style={styles.pagerText}>
              صفحة {pagination.current_page} من {pagination.last_page}
            </Text>
            <View style={{ ...flexRow, gap: spacing.sm }}>
              <AppButton
                title="السابق"
                variant="secondary"
                size="sm"
                disabled={page <= 1}
                onPress={() => setPage((p) => Math.max(1, p - 1))}
              />
              <AppButton
                title="التالي"
                variant="secondary"
                size="sm"
                disabled={page >= pagination.last_page}
                onPress={() => setPage((p) => p + 1)}
              />
            </View>
          </View>
        ) : null}
      </View>

      {canOpen && currentShift ? (
        <AppButton title="فتح وردية أخرى" variant="secondary" onPress={() => setOpenSheet(true)} />
      ) : null}

      <ShiftFilterSheet
        visible={filterOpen}
        filters={filters}
        filterUsers={filterUsers}
        showBranchFilter={isGlobalView}
        onClose={() => setFilterOpen(false)}
        onApply={(next) => {
          setFilters(next);
          setPage(1);
        }}
      />

      <OpenShiftSheet
        visible={openSheet}
        branchId={effectiveBranchForCurrent}
        onClose={() => setOpenSheet(false)}
        onSuccess={() => void refreshAll()}
      />

      {canCloseCurrent ? (
      <CloseShiftSheet
        visible={closeSheet}
        shift={currentShift}
        isAdmin={isAdmin}
        onClose={() => setCloseSheet(false)}
        onSuccess={() => void refreshAll()}
      />
      ) : null}

      {canViewShiftSummary ? (
        <ShiftSummarySheet
          visible={!!summaryShiftId}
          shiftId={summaryShiftId}
          branchId={summaryBranchId}
          onClose={() => {
            setSummaryShiftId(null);
            setSummaryBranchId(null);
          }}
        />
      ) : null}
    </AppScreen>
  );
}
