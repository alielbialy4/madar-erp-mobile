import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppDateRangePicker, AppListItem, AppSelect, AppText } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { reportsAPI } from '@/api/reports';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money, numberText } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type TabKey = 'consumption' | 'cost' | 'missing' | 'negative' | 'variance';

const TABS: { id: TabKey; label: string }[] = [
  { id: 'consumption', label: 'الاستهلاك' },
  { id: 'cost', label: 'التكلفة والهامش' },
  { id: 'missing', label: 'وصفات ناقصة' },
  { id: 'negative', label: 'مكونات سالبة' },
  { id: 'variance', label: 'المتوقع مقابل الفعلي' },
];

function fmtNum(v: unknown, digits = 4): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('ar-EG-u-nu-latn', { maximumFractionDigits: digits });
}

function emptyMessage(tab: TabKey): string {
  switch (tab) {
    case 'missing':
      return 'لا توجد منتجات بوصفة بدون مكونات.';
    case 'negative':
      return 'لا توجد خامات بأرصدة سالبة في هذا الفرع.';
    case 'cost':
      return 'لا توجد منتجات بوصفة.';
    default:
      return 'لا توجد نتائج مطابقة للفلاتر المحددة.';
  }
}

export function RecipeReportsScreen({ navigation }: { navigation: { goBack: () => void } }) {
  const c = useColors();
  const viewMode = useBranchStore((s) => s.viewMode);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const branches = useBranchStore((s) => s.branches);
  const loadBranches = useBranchStore((s) => s.loadBranches);
  const isGlobalView = viewMode === 'global';

  useEffect(() => {
    if (isGlobalView && branches.length === 0) void loadBranches();
  }, [isGlobalView, branches.length, loadBranches]);

  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);

  const [activeTab, setActiveTab] = useState<TabKey>('consumption');
  const [branchId, setBranchId] = useState('');
  const [fromDate, setFromDate] = useState(monthAgo);
  const [toDate, setToDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [costPolicy, setCostPolicy] = useState('');

  const branchOptions = useMemo(
    () => branches.map((b) => ({ label: b.name, value: String(b.id) })),
    [branches],
  );

  const branchParam = useMemo(
    () => (isGlobalView && branchId ? { branch_id: branchId } : {}),
    [isGlobalView, branchId],
  );

  const showDateFilter = activeTab === 'consumption' || activeTab === 'variance';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    setCostPolicy('');
    try {
      const dateParams = { from_date: fromDate, to_date: toDate, per_page: 200 };
      let res: unknown;
      if (activeTab === 'consumption') {
        res = await reportsAPI.recipeConsumption({ ...branchParam, ...dateParams });
      } else if (activeTab === 'cost') {
        res = await reportsAPI.recipeCosts({ ...branchParam, per_page: 200 });
        const envelope = res as { cost_policy?: string };
        setCostPolicy(envelope?.cost_policy ?? '');
      } else if (activeTab === 'missing') {
        res = await reportsAPI.recipeMissing({ ...branchParam, per_page: 200 });
      } else if (activeTab === 'negative') {
        res = await reportsAPI.recipeNegativeIngredients({ ...branchParam, per_page: 200 });
      } else {
        res = await reportsAPI.recipeVariance({ ...branchParam, ...dateParams });
      }
      setRows(extractArray<Record<string, unknown>>(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, branchParam, fromDate, toDate]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const renderRow = (row: Record<string, unknown>, index: number) => {
    if (activeTab === 'consumption') {
      return (
        <AppListItem
          key={String(row.id ?? index)}
          title={String(row.ingredient ?? '—')}
          subtitle={`${String(row.unit ?? '-')} • ${String(row.warehouse_name ?? '-')}`}
          meta={`${fmtNum(row.consumed_qty)} • ${money(row.cost)}`}
        />
      );
    }
    if (activeTab === 'cost') {
      const variants = Array.isArray(row.variants) ? row.variants.length : 0;
      const mods = Array.isArray(row.modifiers) ? row.modifiers.length : 0;
      return (
        <AppCard key={String(row.product_id ?? index)} style={{ gap: spacing.sm }}>
          <AppText style={{ fontWeight: '700', ...textStart }}>{String(row.product ?? '—')}</AppText>
          <AppListItem title="تكلفة الوصفة" meta={money(row.recipe_cost)} />
          <AppListItem title="سعر البيع" meta={money(row.sale_price)} />
          <AppListItem title="هامش الربح" meta={money(row.gross_margin)} />
          <AppListItem
            title="نسبة الهامش"
            meta={row.margin_percentage == null ? '—' : `${fmtNum(row.margin_percentage, 1)}%`}
          />
          {variants || mods ? (
            <View style={{ ...flexRow, gap: spacing.sm, flexWrap: 'wrap' }}>
              {variants ? <AppBadge label={`${variants} حجم`} tone="info" /> : null}
              {mods ? <AppBadge label={`${mods} إضافة`} tone="info" /> : null}
            </View>
          ) : null}
        </AppCard>
      );
    }
    if (activeTab === 'missing') {
      return (
        <AppListItem
          key={String(row.id ?? index)}
          title={String(row.name ?? row.product ?? '—')}
          subtitle={String(row.barcode ?? '-')}
        />
      );
    }
    if (activeTab === 'negative') {
      return (
        <AppListItem
          key={String(row.id ?? index)}
          title={String(row.ingredient ?? '—')}
          subtitle={String(row.unit ?? '-')}
          meta={`رصيد: ${fmtNum(row.stock_quantity)} • ${String(row.used_by_products ?? '—')}`}
        />
      );
    }
    const variance = Number(row.variance_qty ?? 0);
    return (
      <AppListItem
        key={String(row.id ?? index)}
        title={String(row.ingredient ?? '—')}
        subtitle={`متوقع: ${fmtNum(row.expected_qty)} • فعلي: ${fmtNum(row.actual_qty)}`}
        meta={`فرق: ${fmtNum(variance)}${row.variance_pct != null ? ` (${fmtNum(row.variance_pct, 1)}%)` : ''}`}
      />
    );
  };

  return (
    <AppScreen
      title="تقارير تكلفة الوصفات"
      subtitle="استهلاك الخامات، التكلفة، الوصفات الناقصة، والفرق المتوقع"
      onBack={navigation.goBack}
    >
      <AppCard style={{ gap: spacing.md }}>
        {isGlobalView ? (
          <AppSelect
            label="الفرع"
            value={branchId || null}
            options={[{ label: 'كل الفروع المسموحة', value: '' }, ...branchOptions]}
            onChange={(v) => setBranchId(v ?? '')}
          />
        ) : activeBranch ? (
          <AppText style={{ ...textStart, color: c.textMuted }}>الفرع: {activeBranch.name}</AppText>
        ) : null}
        {showDateFilter ? (
          <AppDateRangePicker
            fromDate={fromDate}
            toDate={toDate}
            onChangeFrom={setFromDate}
            onChangeTo={setToDate}
          />
        ) : null}
        <AppButton title="تطبيق" onPress={() => void fetchData()} loading={loading} />
        {costPolicy ? <AppBadge label={`سياسة التكلفة: ${costPolicy}`} tone="info" /> : null}
      </AppCard>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ ...flexRow, gap: spacing.sm, paddingVertical: spacing.sm }}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTab(tab.id)}
              style={{
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
                borderRadius: 999,
                backgroundColor: active ? c.accent : c.surfaceMuted,
              }}
            >
              <AppText style={{ color: active ? c.onPrimary : c.text, fontWeight: '700' }}>{tab.label}</AppText>
            </Pressable>
          );
        })}
      </ScrollView>

      {loading && rows.length === 0 ? <AppLoadingState /> : null}
      {error && !rows.length ? <AppErrorState message={error} onRetry={() => void fetchData()} /> : null}
      {!loading && !error && rows.length === 0 ? <AppEmptyState title={emptyMessage(activeTab)} /> : null}
      <View style={{ gap: spacing.sm }}>{rows.map(renderRow)}</View>
    </AppScreen>
  );
}
