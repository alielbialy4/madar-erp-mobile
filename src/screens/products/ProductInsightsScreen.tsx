import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { productsAPI } from '@/api/products';
import { AppScreen } from '@/components/layout';
import { AppInput } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { ProductInsightBlock } from '@/components/products/ProductInsightBlock';
import { createDashboardStyles } from '@/components/dashboard/dashboardStyles';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money, numberText, dateText } from '@/utils/format';
import type { ProductsStackParamList } from '@/types/navigation';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { typography } from '@/constants/typography';
import { Text } from '@/components/ui/AppText';

type Nav = NativeStackNavigationProp<ProductsStackParamList, 'ProductInsights'>;
type Route = RouteProp<ProductsStackParamList, 'ProductInsights'>;

const defaultRange = () => {
  const to = new Date();
  const from = new Date();
  from.setDate(to.getDate() - 29);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
};

export function ProductInsightsScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const cs = useMemo(() => createCategoryStyles(c), [c]);
  const local = useMemo(() => createLocalStyles(c), [c]);
  const id = route.params.id;
  const [range, setRange] = useState(defaultRange);
  const [movementsPage] = useState(1);
  const [payload, setPayload] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await productsAPI.getInsights(id, {
        from: range.from,
        to: range.to,
        movements_page: movementsPage,
        movements_per_page: 15,
      });
      const data = extractData<Record<string, unknown>>(res);
      const inner = (data?.data as Record<string, unknown> | undefined) ?? data;
      setPayload((inner ?? data) as Record<string, unknown>);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id, range.from, range.to, movementsPage]);

  useEffect(() => {
    void load();
  }, [load]);

  const sales = (payload?.sales ?? {}) as Record<string, unknown>;
  const purchases = (payload?.purchases ?? {}) as Record<string, unknown>;
  const returns = (payload?.returns ?? {}) as Record<string, unknown>;
  const inventory = (payload?.inventory ?? {}) as Record<string, unknown>;
  const movements = (payload?.movements ?? {}) as { data?: Record<string, unknown>[] };
  const product = (payload?.product ?? {}) as Record<string, unknown>;

  const branchRows = useMemo(
    () => (Array.isArray(inventory.branches) ? inventory.branches : []) as Record<string, unknown>[],
    [inventory.branches],
  );
  const warehouseRows = useMemo(
    () => (Array.isArray(inventory.warehouses) ? inventory.warehouses : []) as Record<string, unknown>[],
    [inventory.warehouses],
  );

  const displayName = String(route.params.name ?? product.name ?? 'تحليلات المنتج');

  return (
    <AppScreen title="تحليلات المنتج" onBack={navigation.goBack} scroll onRefresh={() => void load()} refreshing={loading}>
      <View style={{ gap: spacing.lg, paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={ds.heroOuter}>
          <View style={ds.heroAccent} />
          <View style={ds.heroBody}>
            <Text style={ds.heroEyebrow}>الأداء</Text>
            <Text style={ds.heroTitle} numberOfLines={2}>
              {displayName}
            </Text>
            <Text style={ds.heroSubtitle}>مبيعات ومشتريات ومخزون وحركات ضمن الفترة المحددة.</Text>
          </View>
        </View>

        <View style={local.rangeCard}>
          <View style={local.rangeHeader}>
            <MaterialIcons name="date-range" size={20} color={c.accent} />
            <Text style={local.rangeTitle}>الفترة</Text>
          </View>
          <AppInput label="من تاريخ" value={range.from} onChangeText={(from) => setRange((r) => ({ ...r, from }))} placeholder="YYYY-MM-DD" />
          <AppInput label="إلى تاريخ" value={range.to} onChangeText={(to) => setRange((r) => ({ ...r, to }))} placeholder="YYYY-MM-DD" />
          <Pressable onPress={() => void load()} style={({ pressed }) => [local.applyBtn, pressed && { opacity: 0.9 }]}>
            <MaterialIcons name="refresh" size={18} color={c.primaryForeground} />
            <Text style={local.applyText}>تطبيق الفترة</Text>
          </Pressable>
        </View>

        {loading && !payload ? <AppLoadingState /> : null}
        {error && !payload ? <AppErrorState message={error} onRetry={() => void load()} /> : null}

        {payload ? (
          <>
            <View style={cs.statsRow}>
              <View style={cs.statBox}>
                <Text style={[cs.statValue, { color: c.success }]}>{money(sales.total_amount ?? 0)}</Text>
                <Text style={cs.statLabel}>مبيعات</Text>
              </View>
              <View style={cs.statBox}>
                <Text style={cs.statValue}>{numberText(sales.qty_sold ?? 0)}</Text>
                <Text style={cs.statLabel}>كمية مباعة</Text>
              </View>
            </View>
            <View style={cs.statsRow}>
              <View style={cs.statBox}>
                <Text style={cs.statValue}>{money(purchases.total_cost ?? 0)}</Text>
                <Text style={cs.statLabel}>مشتريات</Text>
              </View>
              <View style={cs.statBox}>
                <Text style={[cs.statValue, { color: c.warning }]}>{money(returns.refund_amount ?? 0)}</Text>
                <Text style={cs.statLabel}>مستردات</Text>
              </View>
            </View>

            <ProductInsightBlock
              title="مخزون إجمالي"
              icon="inventory"
              rows={[{ key: 'total', label: 'الكمية', value: numberText(inventory.total_quantity ?? 0) }]}
            />

            <ProductInsightBlock
              title="مخزون الفروع"
              icon="store"
              emptyMessage="لا توجد بيانات فرع"
              rows={branchRows.map((b, i) => ({
                key: `b-${i}`,
                label: String(b.branch_name ?? '—'),
                value: numberText(b.quantity ?? 0),
              }))}
            />

            <ProductInsightBlock
              title="مخزون المخازن"
              icon="local-shipping"
              emptyMessage="لا توجد بيانات مخزن"
              rows={warehouseRows.map((w, i) => ({
                key: `w-${i}`,
                label: String(w.warehouse_name ?? '—'),
                value: numberText(w.quantity ?? 0),
              }))}
            />

            <ProductInsightBlock
              title="حركات المخزون"
              icon="sync"
              emptyMessage="لا توجد حركات في هذه الفترة"
              rows={(movements.data ?? []).map((m) => ({
                key: String(m.id),
                label: dateText(String(m.occurred_at ?? '')),
                value: `${String(m.movement_type ?? '')} • ${numberText(m.delta ?? 0)}`,
              }))}
            />
          </>
        ) : null}
      </View>
    </AppScreen>
  );
}

function createLocalStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    rangeCard: {
      borderRadius: radius.xxl,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      gap: spacing.md,
    },
    rangeHeader: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    rangeTitle: {
      ...textStart,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.bold,
      color: c.text,
    },
    applyBtn: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: c.accent,
    },
    applyText: {
      ...textStart,
      textAlign: 'center',
      fontFamily: fonts.bold,
      fontSize: typography.body,
      color: c.primaryForeground,
    },
  });
}
