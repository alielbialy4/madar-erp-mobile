import React from 'react';
import { View } from 'react-native';
import { settingsAPI } from '@/api/settings';
import { CrudListScreen } from '@/screens/shared/CrudListScreen';
import { AppButton } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { asText, dateText } from '@/utils/format';

export function UsersScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_users');

  return (
    <CrudListScreen<Record<string, unknown>>
      title="المستخدمون"
      subtitle={canManage ? 'إنشاء وتعديل وتعيين أدوار' : 'قراءة فقط'}
      loader={(p) => settingsAPI.getUsers(p) as never}
      onItemPress={(item) => navigation.navigate('UserForm', { id: Number(item.id) })}
      itemTitle={(item) => asText(item.name)}
      itemSubtitle={(item) => `${asText(item.email ?? item.phone ?? '')} • ${dateText(asText(item.created_at, ''))}`}
      itemMeta={(item) => (Array.isArray(item.roles) ? (item.roles as string[]).join(', ') : '—')}
      itemBadge={(item) => ({ label: item.active === false ? 'معطل' : 'نشط', tone: item.active === false ? 'danger' : 'success' })}
      emptyTitle="لا مستخدمين"
      headerRight={
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {canManage ? <AppButton title="جديد" onPress={() => navigation.navigate('UserForm', {})} /> : null}
          <AppButton title="الأدوار" variant="secondary" onPress={() => navigation.navigate('Roles')} />
        </View>
      }
    />
  );
}
