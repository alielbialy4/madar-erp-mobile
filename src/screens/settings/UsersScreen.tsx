import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppInput, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { settingsAPI } from '@/api/settings';
import { asText, dateText } from '@/utils/format';
import { spacing } from '@/constants/spacing';

export function UsersScreen() {
  const [query, setQuery] = React.useState('');
  const debounced = useDebouncedValue(query);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    (params) => settingsAPI.getUsers(params) as any,
    debounced ? { search: debounced } : {},
  );

  return (
    <AppScreen title="المستخدمون والأدوار" subtitle="إدارة المستخدمين (قراءة فقط)" scroll={false}>
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
        emptyTitle="لا يوجد مستخدمون"
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => {
          const isActive = Boolean(item.active);
          const roles = Array.isArray(item.roles) ? item.roles.join(', ') : '';
          return (
            <AppListItem
              title={asText(item.name)}
              subtitle={`${asText(item.email ?? item.phone ?? '')} • ${dateText(asText(item.created_at, ''))}`}
              meta={roles || '—'}
              badge={<AppBadge label={isActive ? 'نشط' : 'معطل'} tone={isActive ? 'success' : 'danger'} />}
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
