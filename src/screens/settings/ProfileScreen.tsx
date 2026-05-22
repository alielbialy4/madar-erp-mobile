import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppListItem, AppSectionHeader, AppBadge } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function ProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const loading = useAuthStore((state) => state.loading);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  return (
    <AppScreen title="الملف الشخصي">
      <AppCard>
        <AppSectionHeader title="بيانات المستخدم" />
        <AppListItem title={user?.name ?? 'مستخدم'} subtitle={user?.email ?? user?.phone ?? undefined} />
        <View style={styles.roleRow}>
          {(user?.roles ?? []).map((role) => (
            <AppBadge key={role} label={role} tone="info" />
          ))}
        </View>
      </AppCard>
      <AppCard>
        <AppSectionHeader title="السياق الحالي" />
        <AppListItem title="الفرع" subtitle={activeBranch?.name ?? 'عرض عام'} />
        <AppListItem title="وضع العرض" subtitle={viewMode === 'global' ? 'عرض عام' : 'فرع'} />
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الصلاحيات" />
        <Text style={styles.permCount}>{numberText(user?.permissions?.length ?? 0)} صلاحية</Text>
        {user?.is_super_admin ? <AppBadge label="مدير أعلى" tone="danger" /> : null}
      </AppCard>
      <AppButton title="تسجيل الخروج" variant="danger" onPress={() => setLogoutConfirm(true)} loading={loading} />
      <ConfirmDialog
        visible={logoutConfirm}
        title="تسجيل الخروج"
        message="سيتم تسجيل خروجك من التطبيق."
        confirmLabel="خروج"
        onConfirm={() => { setLogoutConfirm(false); logout(); }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </AppScreen>
  );
}

function numberText(n: number): string {
  return n.toLocaleString('ar-EG');
}

const styles = StyleSheet.create({
  roleRow: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs },
  permCount: { color: colors.textMuted, fontSize: typography.small, ...textStart },
});
