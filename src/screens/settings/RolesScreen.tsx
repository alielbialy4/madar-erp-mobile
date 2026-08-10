import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { settingsAPI } from '@/api/settings';
import { ListScreenLayout } from '@/components/layout';
import { AppBadge, AppDomainCard } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
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

  const reload = () => {
    setLoading(true);
    void settingsAPI
      .getRoles()
      .then((res) => {
        setRoles(extractArray(res));
        setError(null);
      })
      .catch((err) => setError(normalizeApiError(err).message))
      .finally(() => setLoading(false));
  };

  return (
    <ListScreenLayout
      title="الأدوار والصلاحيات"
      onBack={navigation.goBack}
      hero={{
        eyebrow: 'الإدارة',
        title: 'الأدوار والصلاحيات',
        stats: [{ label: 'الأدوار', value: roles.length }],
        compact: true,
      }}
    >
      <View style={{ gap: spacing.md, marginBottom: spacing.sm }}>
        <Text style={{ color: c.textMuted, lineHeight: 20 }}>
          {canEdit
            ? 'تعيين الأدوار للمستخدمين متاح من شاشة تعديل المستخدم. تعديل تعريف الأدوار والصلاحيات نفسها يبقى من الويب فقط لأن API الجوال المتاح يعرض /mcp/roles ويزامن أدوار المستخدم فقط، ولا توجد عقود create/update/delete لتعريف الدور.'
            : 'عرض الأدوار فقط. تعيين الأدوار يتطلب صلاحية manage_users.'}
        </Text>
      </View>
      {loading && roles.length === 0 ? <AppLoadingState /> : null}
      {error && roles.length === 0 ? <AppErrorState message={error} onRetry={reload} /> : null}
      {!loading && !error ? (
        <ResourceList
          data={roles}
          loading={false}
          emptyTitle="لا أدوار"
          keyExtractor={(item, i) => String(item.id ?? item.name ?? i)}
          renderItem={({ item }) => (
            <View style={{ gap: spacing.sm }}>
              <AppDomainCard
                title={String(item.label ?? item.name ?? item.slug ?? '—')}
                subtitle={Array.isArray(item.permissions) ? `${item.permissions.length} صلاحية` : String(item.description ?? '')}
                badgeLabel="قراءة فقط"
                badgeTone="default"
                leadingIcon="admin-panel-settings"
              />
              {Array.isArray(item.permissions) && item.permissions.length > 0 ? (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
                  {item.permissions.slice(0, 12).map((permission) => (
                    <AppBadge key={String(permission)} label={String(permission)} tone="default" />
                  ))}
                  {item.permissions.length > 12 ? <AppBadge label={`+${item.permissions.length - 12}`} tone="info" /> : null}
                </View>
              ) : null}
            </View>
          )}
        />
      ) : null}
    </ListScreenLayout>
  );
}
