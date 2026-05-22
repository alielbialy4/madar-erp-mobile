import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { giftCardsAPI } from '@/api/giftCards';
import { asText, money } from '@/utils/format';
import { spacing } from '@/constants/spacing';

export function GiftCardsScreen() {
  const [query, setQuery] = React.useState('');
  const debounced = useDebouncedValue(query);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    (params) => giftCardsAPI.getAll(params) as any,
    debounced ? { search: debounced } : {},
  );

  return (
    <AppScreen title="بطاقات الهدايا" scroll={false}>
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
        emptyTitle="لا توجد بطاقات هدايا"
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const status = String(item.status ?? '');
          const tone = status === 'active' ? 'success' : status === 'redeemed' ? 'info' : 'danger';
          return (
            <AppListItem
              title={asText(item.code)}
              subtitle={`الرصيد: ${money(item.remaining_balance ?? 0)} / ${money(item.initial_balance ?? 0)}`}
              badge={<AppBadge label={status} tone={tone} />}
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
