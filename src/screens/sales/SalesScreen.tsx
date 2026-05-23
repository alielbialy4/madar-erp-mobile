import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { salesAPI } from '@/api/sales';
import { AppScreen } from '@/components/layout';
import { AppInput } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { SaleInvoiceCard } from '@/components/sales/SaleInvoiceCard';
import { statusTone } from '@/screens/shared/CrudListScreen';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { Sale } from '@/types/api';
import { Text } from '@/components/ui/AppText';

export function SalesScreen({ navigation }: { navigation: { navigate: (a: string, b?: object) => void } }) {
  const c = useColors();
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const listParams = useMemo(() => (debounced ? { search: debounced } : {}), [debounced]);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Sale & Record<string, unknown>>(
    salesAPI.getAll,
    listParams,
  );

  return (
    <AppScreen title="المبيعات" subtitle="الفواتير والطلبات" scroll={false} noHeader>
      <View style={[styles.hero, { backgroundColor: c.primarySoftMuted, borderColor: c.primarySoftBorder }]}>
        <View style={styles.heroInner}>
          <View style={[styles.heroIcon, { backgroundColor: c.surface }]}>
            <View style={[styles.heroDot, { backgroundColor: c.primary }]} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: c.text }]}>المبيعات</Text>
            <Text style={[styles.heroSub, { color: c.textMuted }]}>فواتير، حالات الدفع، وتفاصيل العملاء</Text>
          </View>
        </View>
      </View>
      <View style={styles.searchWrap}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث برقم الفاتورة أو العميل..." returnKeyType="search" />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد مبيعات"
        keyExtractor={(item, index) => `sale-${String(item.id ?? index)}-${index}`}
        renderItem={({ item }) => {
          const sale = item as Sale;
          const badge = { label: sale.status ?? '—', tone: statusTone(sale.status) };
          return (
            <SaleInvoiceCard
              sale={sale}
              badge={badge}
              onPress={() => navigation.navigate('SaleDetail', { id: sale.id, invoice: sale.invoice_number })}
            />
          );
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    padding: spacing.lg,
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDot: { width: 12, height: 12, borderRadius: 6 },
  heroTitle: { ...textStart, fontSize: typography.sectionTitle, fontFamily: fonts.extraBold, fontWeight: '800' },
  heroSub: { ...textStart, fontSize: typography.tiny, fontFamily: fonts.medium, marginTop: 2 },
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.sm },
});
