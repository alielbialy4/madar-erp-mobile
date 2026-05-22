import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { settingsAPI } from '@/api/settings';
import { AppScreen } from '@/components/layout';
import { AppCard, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

export function RolesScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canEdit = hasPermission(user, 'manage_users');
  const [roles, setRoles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void settingsAPI
      .getRoles()
      .then((res) => {
        setRoles(extractArray(res));
        setError(null);
      })
      .catch((err) => setError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppScreen title="الأدوار والصلاحيات" onBack={navigation.goBack}>
      <AppCard>
        <AppSectionHeader title="ملاحظة" />
        <Text style={{ color: c.textMuted, lineHeight: 20 }}>
          {canEdit
            ? 'تعيين الأدوار يتم من شاشة تعديل المستخدم. تعديل تعريف الأدوار نفسها غير متاح على الجوال — استخدم الويب.'
            : 'عرض الأدوار فقط. تعيين الأدوار يتطلب صلاحية manage_users.'}
        </Text>
      </AppCard>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={() => navigation.goBack()} /> : null}
      {!loading && !error ? (
        <View style={{ gap: spacing.sm }}>
          {roles.length === 0 ? (
            <AppEmptyState title="لا أدوار" />
          ) : (
            roles.map((r, i) => (
              <AppListItem key={String(r.id ?? r.name ?? i)} title={String(r.name ?? r.slug ?? '—')} subtitle={String(r.description ?? '')} />
            ))
          )}
        </View>
      ) : null}
    </AppScreen>
  );
}
