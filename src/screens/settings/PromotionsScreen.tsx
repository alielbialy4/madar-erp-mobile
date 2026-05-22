import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { promotionsAPI } from '@/api/promotions';
import { asText, dateText } from '@/utils/format';
import { spacing } from '@/constants/spacing';

export function PromotionsScreen() {
  const [query, setQuery] = React.useState('');
  const debounced = useDebouncedValue(query);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    (params) => promotionsAPI.getAll(params),
    debounced ? { search: debounced } : {},
  );

  return (
    <AppScreen title="العروض" subtitle="إدارة العروض الترويجية" scroll={false}>
      <View style={styles.searchWrap}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث..." returnKeyType="search" />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد عروض"
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const isActive = Boolean(item.is_active);
          const typeLabel = String(item.type === 'bogo' ? 'اشترِ واحصل' : item.type === 'percentage_discount' ? 'نسبة مئوية' : 'مبلغ ثابت');
          return (
            <AppListItem
              title={asText(item.name)}
              subtitle={`${typeLabel} • ${dateText(asText(item.start_date, ''))} → ${dateText(asText(item.end_date, ''))}`}
              badge={<AppBadge label={isActive ? 'نشط' : 'متوقف'} tone={isActive ? 'success' : 'danger'} />}
            />
          );
        }}
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  searchWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
});
