import React, { useState } from 'react';
import { View } from 'react-native';
import { flexRow } from '@/constants/layout';
import { AppText } from '@/components/ui/AppText';
import { AppScreen } from '@/components/layout';
import { AppButton, AppListItem, AppBadge } from '@/components/ui';
import { DocumentHeader, MadarSection, MadarSurface } from '@/components/madar';
import { ConfirmDialog } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export function ProfileScreen() {
  const c = useColors();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const loading = useAuthStore((state) => state.loading);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const permCount = user?.permissions?.length ?? 0;

  return (
    <AppScreen title="الملف الشخصي">
      <DocumentHeader
        title={user?.name ?? 'مستخدم'}
        subtitle={user?.email ?? user?.phone ?? undefined}
        statusLabel={user?.is_super_admin ? 'مدير أعلى' : undefined}
        statusTone="danger"
        meta={activeBranch?.name ? `فرع: ${activeBranch.name}` : 'عرض عام'}
      />

      <View
        style={{
          alignSelf: 'flex-start',
          width: 56,
          height: 56,
          borderRadius: radius.control,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surface,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.md,
        }}
      >
        <AppText style={{ color: c.accent, fontSize: typography.h2, fontFamily: fonts.extraBold, fontWeight: '800' }}>
          {user?.name?.charAt(0) ?? 'U'}
        </AppText>
      </View>

      <MadarSection title="بيانات المستخدم">
        <MadarSurface padded={false}>
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.xs, padding: spacing.lg }}>
            {(user?.roles ?? []).map((role) => (
              <AppBadge key={role} label={role} tone="info" />
            ))}
          </View>
          <AppListItem title="الصلاحيات" subtitle={`${permCount} صلاحية فعالة`} />
        </MadarSurface>
      </MadarSection>

      <MadarSection title="السياق الحالي">
        <MadarSurface padded={false}>
          <AppListItem title="الفرع" subtitle={activeBranch?.name ?? 'عرض عام'} />
          <AppListItem title="وضع العرض" subtitle={viewMode === 'global' ? 'عرض عام' : 'فرع'} />
        </MadarSurface>
      </MadarSection>

      <AppButton title="تسجيل الخروج" variant="danger" onPress={() => setLogoutConfirm(true)} loading={loading} fullWidth />

      <ConfirmDialog
        visible={logoutConfirm}
        title="تسجيل الخروج"
        message="سيتم تسجيل خروجك من التطبيق."
        confirmLabel="خروج"
        onConfirm={() => {
          setLogoutConfirm(false);
          void logout();
        }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </AppScreen>
  );
}
