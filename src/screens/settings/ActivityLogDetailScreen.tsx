import React, { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { activityLogsAPI } from '@/api/activityLogs';
import { AppScreen } from '@/components/layout';
import { AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { extractData } from '@/utils/data';
import { dateText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';

export function ActivityLogDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = Number(route.params?.id);
  const [log, setLog] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void activityLogsAPI
      .getById(id)
      .then((res) => {
        setLog(extractData(res) as Record<string, unknown> | null);
        setError(null);
      })
      .catch((err) => setError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <AppScreen title={`سجل #${id}`} onBack={navigation.goBack}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={navigation.goBack} /> : null}
      {log ? (
        <ScrollView>
          <AppCard>
            <AppSectionHeader title="التفاصيل" />
            <AppListItem title="الإجراء" subtitle={String(log.action ?? '—')} />
            <AppListItem title="النموذج" subtitle={String(log.model_type ?? '—')} />
            <AppListItem title="المستخدم" subtitle={String((log.user as Record<string, unknown>)?.name ?? log.user_name ?? '—')} />
            <AppListItem title="التاريخ" subtitle={dateText(String(log.created_at ?? ''))} />
            <AppListItem title="الوصف" subtitle={String(log.description ?? '—')} />
          </AppCard>
          {log.properties ? (
            <AppCard>
              <AppSectionHeader title="البيانات" />
              <Text>{JSON.stringify(log.properties, null, 2)}</Text>
            </AppCard>
          ) : null}
        </ScrollView>
      ) : null}
    </AppScreen>
  );
}
