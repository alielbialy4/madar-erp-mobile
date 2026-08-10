import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import { activityLogsAPI } from '@/api/activityLogs';
import { ListScreenLayout } from '@/components/layout';
import { AppInput, AppSelect } from '@/components/ui';
import { DenseRow } from '@/components/madar';
import { ResourceList } from '@/components/lists';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { asText, dateText } from '@/utils/format';
import { spacing } from '@/constants/spacing';

export function ActivityLogsScreen({ navigation }: { navigation: any }) {
  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [modelType, setModelType] = useState('');
  const debounced = useDebouncedValue(search);
  const params = useMemo(
    () => ({
      per_page: 40,
      ...(debounced ? { search: debounced } : {}),
      ...(action ? { action } : {}),
      ...(modelType ? { model_type: modelType } : {}),
    }),
    [action, debounced, modelType],
  );
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(
    (p) => activityLogsAPI.getAll(p) as never,
    params,
  );

  return (
    <ListScreenLayout
      title="سجل النشاط"
      subtitle="قراءة فقط — الحذف من الويب"
      searchValue={search}
      onSearchChange={setSearch}
      onRefresh={refresh}
      refreshing={refreshing}
      filters={
        <View style={{ gap: spacing.sm }}>
          <AppInput label="الإجراء" value={action} onChangeText={setAction} placeholder="created, updated..." />
          <AppSelect
            label="النموذج"
            value={modelType || null}
            onChange={(v) => setModelType(v ?? '')}
            options={[
              { label: 'الكل', value: '' },
              { label: 'Sale', value: 'Sale' },
              { label: 'Product', value: 'Product' },
              { label: 'User', value: 'User' },
            ]}
          />
        </View>
      }
      hero={{
        eyebrow: 'الإدارة',
        title: 'سجل النشاط',
        subtitle: 'قراءة فقط — الحذف من الويب',
        stats: [{ label: 'السجلات', value: items.length }],
        compact: true,
      }}
    >
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا سجلات"
        keyExtractor={(item, i) => String(item.id ?? i)}
        renderItem={({ item }) => (
          <DenseRow
            primary={asText(item.description ?? item.action, '—')}
            secondary={`${asText(item.user_name ?? (item.user as Record<string, unknown>)?.name, '—')} · ${dateText(asText(item.created_at, ''))}`}
            meta={asText(item.model_type, '') || undefined}
            onPress={() => item.id != null && navigation.navigate('ActivityLogDetail', { id: Number(item.id) })}
          />
        )}
      />
    </ListScreenLayout>
  );
}
