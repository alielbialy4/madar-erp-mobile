import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppScreen } from '@/components/layout';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { AppBadge, AppCard, AppInput, AppSectionHeader, AppText as Text } from '@/components/ui';
import { get } from '@/api/client';
import { colors } from '@/constants/colors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { asText, dateText, money } from '@/utils/format';

type RouteParams = {
  title: string;
  webRoute: string;
  endpoint?: string;
  status: 'Complete' | 'Partial' | 'Disabled with reason' | 'Missing API';
  note?: string;
  searchParam?: 'search' | 'q';
  params?: Record<string, unknown>;
};

type Props = {
  route: { params?: RouteParams };
  navigation: { goBack: () => void };
};

function defaultParams(endpoint: string, extra?: Record<string, unknown>, query?: string, searchParam: 'search' | 'q' = 'search') {
  const today = new Date().toISOString().slice(0, 10);
  const params: Record<string, unknown> = { per_page: 30, ...(extra ?? {}) };
  if (endpoint.startsWith('/reports/') && !('from_date' in params)) params.from_date = today;
  if (endpoint.startsWith('/reports/') && !('to_date' in params)) params.to_date = today;
  if (query) params[searchParam] = query;
  return params;
}

function valueText(value: unknown): string {
  if (value == null || value === '') return '-';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '-';
  if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
  if (Array.isArray(value)) return `${value.length} عنصر`;
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    return asText(obj.name ?? obj.title ?? obj.code ?? obj.id ?? JSON.stringify(obj));
  }
  return String(value);
}

function rowTitle(item: Record<string, unknown>) {
  return asText(
    item.name ??
      item.title ??
      item.invoice_number ??
      item.reference_no ??
      item.settlement_code ??
      item.code ??
      item.product_name ??
      item.driver_name ??
      item.customer_name ??
      item.id,
    'عنصر',
  );
}

function rowSubtitle(item: Record<string, unknown>) {
  const candidates = [
    item.status_label_ar,
    item.status,
    item.branch_name,
    item.warehouse_name,
    item.customer?.toString(),
    item.phone,
    item.created_at ? dateText(String(item.created_at)) : undefined,
  ].filter(Boolean);
  return candidates.slice(0, 2).join(' • ');
}

function rowMeta(item: Record<string, unknown>) {
  const amount = item.total ?? item.amount ?? item.balance ?? item.remaining_balance ?? item.total_due ?? item.net_due_from_driver;
  if (amount != null) return money(amount);
  const count = item.items_count ?? item.deliveries_count ?? item.products_count;
  if (count != null) return `${count} عنصر`;
  return undefined;
}

function flattenObject(data: unknown): [string, unknown][] {
  const obj = extractData<Record<string, unknown>>(data as Record<string, unknown>);
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return [];
  return Object.entries(obj).filter(([, value]) => typeof value !== 'object' || value == null);
}

export function ParityModuleScreen({ route, navigation }: Props) {
  const params = route.params;
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query);
  const [data, setData] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const endpoint = params?.endpoint;
  const status = params?.status ?? 'Disabled with reason';
  const title = params?.title ?? 'مسار من الويب';
  const note = params?.note;

  const load = useCallback(
    async (refresh = false) => {
      if (!endpoint) return;
      if (refresh) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const response = await get(endpoint, defaultParams(endpoint, params?.params, debouncedQuery, params?.searchParam));
        setData(response);
      } catch (err) {
        setError(normalizeApiError(err).message);
      } finally {
        if (refresh) setRefreshing(false);
        else setLoading(false);
      }
    },
    [debouncedQuery, endpoint, params?.params, params?.searchParam],
  );

  useEffect(() => {
    void load(false);
  }, [load]);

  const rows = useMemo(() => extractArray<Record<string, unknown>>(data), [data]);
  const metrics = useMemo(() => flattenObject(data).slice(0, 18), [data]);
  const disabled = status === 'Disabled with reason' || status === 'Missing API';

  return (
    <AppScreen
      title={title}
      subtitle={`مطابقة مسار الويب: ${params?.webRoute ?? '-'}`}
      onBack={navigation.goBack}
      refreshing={refreshing}
      onRefresh={endpoint ? () => void load(true) : undefined}
    >
      <AppCard style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <View style={styles.statusIcon}>
            <MaterialIcons name={disabled ? 'lock-outline' : 'fact-check'} size={20} color={disabled ? colors.warning : colors.accent} />
          </View>
          <View style={styles.statusTextCol}>
            <Text style={styles.statusTitle}>{disabled ? 'مسار معطل بأمان' : 'مسار مطابقة للويب'}</Text>
            <Text style={styles.statusNote}>
              {note ?? 'هذه الشاشة مولدة من مسار الويب وتعرض البيانات المتاحة من API بدون تنفيذ عمليات خطرة.'}
            </Text>
          </View>
          <AppBadge label={status} tone={disabled ? 'warning' : status === 'Complete' ? 'success' : 'info'} />
        </View>
      </AppCard>

      {!endpoint ? (
        <AppEmptyState
          title="لا يوجد API آمن لهذا المسار"
          message="تم إبقاء المسار ظاهراً في القائمة للحفاظ على مطابقة التنقل، لكن التنفيذ معطل حتى يتوفر endpoint واضح وآمن."
        />
      ) : (
        <>
          <AppInput value={query} onChangeText={setQuery} placeholder="بحث في هذا المسار..." returnKeyType="search" />
          {loading ? <AppLoadingState message="جاري تحميل بيانات المسار..." /> : null}
          {error ? <AppErrorState message={error} onRetry={() => void load(false)} /> : null}
          {!loading && !error && rows.length === 0 && metrics.length === 0 ? (
            <AppEmptyState title="لا توجد بيانات" message="الخادم لم يرجع عناصر لهذا المسار حالياً." />
          ) : null}
          {!loading && !error && rows.length > 0 ? (
            <View style={styles.list}>
              {rows.map((item, index) => (
                <Pressable key={String(item.id ?? index)} style={({ pressed }) => [styles.rowCard, pressed ? styles.rowPressed : undefined]}>
                  <View style={styles.rowTop}>
                    <Text style={styles.rowTitle} numberOfLines={2}>{rowTitle(item)}</Text>
                    {rowMeta(item) ? <Text style={[styles.rowMeta, textLtr]}>{rowMeta(item)}</Text> : null}
                  </View>
                  {rowSubtitle(item) ? <Text style={styles.rowSubtitle}>{rowSubtitle(item)}</Text> : null}
                </Pressable>
              ))}
            </View>
          ) : null}
          {!loading && !error && rows.length === 0 && metrics.length > 0 ? (
            <AppCard>
              <AppSectionHeader title="ملخص البيانات" />
              <View style={styles.metricGrid}>
                {metrics.map(([key, value]) => (
                  <View key={key} style={styles.metric}>
                    <Text style={styles.metricLabel}>{key}</Text>
                    <Text style={styles.metricValue}>{valueText(value)}</Text>
                  </View>
                ))}
              </View>
            </AppCard>
          ) : null}
        </>
      )}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  statusCard: { borderColor: colors.accentBorder },
  statusHeader: { ...flexRow, alignItems: 'center', gap: spacing.md },
  statusIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusTextCol: { flex: 1, gap: spacing.xs },
  statusTitle: { color: colors.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
  statusNote: { color: colors.textMuted, lineHeight: 22, fontSize: typography.small },
  list: { gap: spacing.sm },
  rowCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xl,
    padding: spacing.md,
    gap: spacing.xs,
  },
  rowPressed: { backgroundColor: colors.surfaceMuted },
  rowTop: { ...flexRow, alignItems: 'flex-start', gap: spacing.sm },
  rowTitle: { flex: 1, ...textStart, color: colors.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body },
  rowMeta: { color: colors.accent, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small },
  rowSubtitle: { color: colors.textMuted, fontSize: typography.small, lineHeight: 21 },
  metricGrid: { gap: spacing.sm },
  metric: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    backgroundColor: colors.surfaceMuted,
    padding: spacing.md,
    gap: spacing.xs,
  },
  metricLabel: { color: colors.textMuted, fontSize: typography.tiny },
  metricValue: { color: colors.text, fontFamily: fonts.bold, fontWeight: '700' },
});
