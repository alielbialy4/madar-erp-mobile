import React, { useMemo, useState } from 'react';
import { notificationsAPI } from '@/api/notifications';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppListItem } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useListResource } from '@/hooks/useListResource';
import { dateText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

export function NotificationsScreen() {
  const [message, setMessage] = useState<string | null>(null);
  const params = useMemo(() => ({ per_page: 30 }), []);
  const { items, loading, refreshing, error, refresh, loadMore } = useListResource<Record<string, unknown>>(notificationsAPI.getAll, params);

  const markAll = async () => {
    setMessage(null);
    try {
      await notificationsAPI.markAllAsRead();
      await refresh();
      setMessage('تم تعليم كل الإشعارات كمقروءة');
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    }
  };

  return (
    <AppScreen title="الإشعارات" subtitle={message ?? 'قائمة التنبيهات'} scroll={false} headerRight={<AppButton title="قراءة الكل" variant="secondary" onPress={markAll} />}>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا توجد إشعارات"
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => (
          <AppListItem
            title={String(item.title ?? item.message ?? 'إشعار')}
            subtitle={String(item.message ?? item.body ?? '')}
            meta={dateText(String(item.created_at ?? ''))}
            badge={<AppBadge label={item.read_at ? 'مقروء' : 'جديد'} tone={item.read_at ? 'default' : 'info'} />}
            onPress={() => item.id ? notificationsAPI.markAsRead(Number(item.id)).then(refresh).catch(() => undefined) : undefined}
          />
        )}
      />
    </AppScreen>
  );
}
