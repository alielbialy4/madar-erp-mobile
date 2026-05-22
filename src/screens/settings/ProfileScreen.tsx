import React, { useState } from 'react';
import { View } from 'react-native';
import { flexRow } from '@/constants/layout';
import { AppText } from '@/components/ui/AppText';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppListItem, AppSectionHeader, AppBadge } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
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
      <View style={{
        backgroundColor: c.accent, borderRadius: 20, padding: spacing.xl,
        alignItems: 'center', gap: spacing.md,
      }}>
        <View style={{
          width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.2)',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <AppText style={{ color: '#FFFFFF', fontSize: 28, fontFamily: fonts.extraBold, fontWeight: '800' }}>
            {user?.name?.charAt(0) ?? 'U'}
          </AppText>
        </View>
        <AppText style={{ color: '#FFFFFF', fontSize: typography.h2, fontFamily: fonts.bold, fontWeight: '700', textAlign: 'center', writingDirection: 'rtl' }}>
          {user?.name ?? 'مستخدم'}
        </AppText>
        <AppText style={{ color: 'rgba(255,255,255,0.8)', fontSize: typography.body, textAlign: 'center', writingDirection: 'rtl' }}>
          {user?.email ?? user?.phone ?? ''}
        </AppText>
      </View>

      <AppCard>
        <AppSectionHeader title="بيانات المستخدم" />
        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.xs }}>
          {(user?.roles ?? []).map((role) => (
            <AppBadge key={role} label={role} tone="info" />
          ))}
        </View>
        <AppListItem title="الصلاحيات" subtitle={`${permCount} صلاحية فعالة`} />
        {user?.is_super_admin ? <AppBadge label="مدير أعلى" tone="danger" /> : null}
      </AppCard>

      <AppCard>
        <AppSectionHeader title="السياق الحالي" />
        <AppListItem title="الفرع" subtitle={activeBranch?.name ?? 'عرض عام'} />
        <AppListItem title="وضع العرض" subtitle={viewMode === 'global' ? 'عرض عام' : 'فرع'} />
      </AppCard>

      <AppButton title="تسجيل الخروج" variant="danger" onPress={() => setLogoutConfirm(true)} loading={loading} fullWidth />
      <ConfirmDialog
        visible={logoutConfirm}
        title="تسجيل الخروج"
        message="سيتم تسجيل خروجك من التطبيق."
        confirmLabel="خروج"
        onConfirm={() => { setLogoutConfirm(false); void logout(); }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </AppScreen>
  );
}
