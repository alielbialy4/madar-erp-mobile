import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { inventoryAPI } from '@/api/inventory';
import { productsAPI } from '@/api/products';
import { AppScreen } from '@/components/layout';
import { AppCard, AppListItem, AppSectionHeader, AppStatCard } from '@/components/ui';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money, numberText, asText } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';
import type { MoreStackParamList } from '@/types/navigation';

type Nav = NativeStackNavigationProp<MoreStackParamList, 'StockBalanceDetail'>;
type Route = RouteProp<MoreStackParamList, 'StockBalanceDetail'>;

export function StockBalanceDetailScreen({ navigation, route }: { navigation: Nav; route: Route }) {
  const { product_id, warehouse_id, product_name } = route.params;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [balances, setBalances] = useState<Record<string, unknown>[]>([]);
  const [product, setProduct] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [balRes, prodRes] = await Promise.all([
        inventoryAPI.balances({ product_id, warehouse_id, per_page: 100 }),
        productsAPI.getById(product_id),
      ]);
      setBalances(extractArray(balRes));
      setProduct(extractData(prodRes) ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [product_id, warehouse_id]);

  useEffect(() => {
    void load();
  }, [load]);

  const totalQty = balances.reduce((s, b) => s + Number(b.quantity ?? 0), 0);

  return (
    <AppScreen
      title={product_name ?? asText(product?.name, 'رصيد المنتج')}
      subtitle="تفاصيل الرصيد حسب المخزن"
      onBack={navigation.goBack}
      onRefresh={() => void load()}
      refreshing={loading}
    >
      {loading && !balances.length ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={() => void load()} /> : null}
      {!error ? (
        <View style={{ gap: spacing.lg }}>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.md }}>
            <View style={{ flex: 1, minWidth: 140 }}>
              <AppStatCard label="إجمالي الكمية" value={numberText(totalQty)} />
            </View>
            <View style={{ flex: 1, minWidth: 140 }}>
              <AppStatCard label="سعر البيع" value={money(product?.selling_price ?? 0)} />
            </View>
          </View>
          <AppCard>
            <AppSectionHeader title="أرصدة حسب المخزن" />
            {balances.length ? (
              balances.map((b, i) => (
                <AppListItem
                  key={String(b.id ?? i)}
                  title={asText(b.warehouse_name ?? (b.warehouse as Record<string, unknown>)?.name, 'مخزن')}
                  subtitle={b.batch_number ? `دفعة: ${String(b.batch_number)}` : undefined}
                  meta={numberText(b.quantity)}
                />
              ))
            ) : (
              <AppEmptyState title="لا يوجد رصيد لهذا المنتج" />
            )}
          </AppCard>
        </View>
      ) : null}
    </AppScreen>
  );
}
