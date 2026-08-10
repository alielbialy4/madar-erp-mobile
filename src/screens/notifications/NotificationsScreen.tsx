import React, { useMemo, useState } from 'react';
import { notificationsAPI } from '@/api/notifications';
import { ListScreenLayout } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { AppBadge } from '@/components/ui/AppBadge';
import { DenseRow } from '@/components/madar';
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

  const unreadCount = items.filter((item) => !item.read_at).length;

  return (
    <ListScreenLayout
      title="الإشعارات"
      subtitle={message ?? 'قائمة التنبيهات'}
      onRefresh={refresh}
      refreshing={refreshing}
      headerRight={<AppButton title="قراءة الكل" variant="secondary" onPress={markAll} />}
      hero={{
        eyebrow: 'التنبيهات',
        title: 'الإشعارات',
        subtitle: message ?? 'قائمة التنبيهات',
        stats: [
          { label: 'الإشعارات', value: items.length },
          { label: 'غير مقروء', value: unreadCount },
        ],
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
        emptyTitle="لا توجد إشعارات"
        keyExtractor={(item, index) => String(item.id ?? index)}
        renderItem={({ item }) => (
          <DenseRow
            primary={String(item.title ?? item.message ?? 'إشعار')}
            secondary={String(item.message ?? item.body ?? '')}
            meta={dateText(String(item.created_at ?? ''))}
            status={<AppBadge label={item.read_at ? 'مقروء' : 'جديد'} tone={item.read_at ? 'neutral' : 'info'} />}
            onPress={() => (item.id ? notificationsAPI.markAsRead(Number(item.id)).then(refresh).catch(() => undefined) : undefined)}
          />
        )}
      />
    </ListScreenLayout>
  );
}
