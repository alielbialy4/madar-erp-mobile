import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText } from '@/components/ui/AppText';
import { ListScreenLayout } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader } from '@/components/ui';
import { DenseRow, MadarSurface } from '@/components/madar';
import { ConfirmDialog } from '@/components/feedback';
import { BranchSwitcherScreen } from './BranchSwitcherScreen';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { authAPI } from '@/api/auth';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useTu } from '@/i18n/useTu';

export function SettingsScreen({ navigation }: { navigation: any }) {
  const tx = useTu();
  const c = useColors();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [branchMode, setBranchMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPassword, setEditingPassword] = useState(false);
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileMessage, setProfileMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  if (branchMode) return <BranchSwitcherScreen onDone={() => setBranchMode(false)} />;

  const handleUpdateProfile = async () => {
    setBusy(true);
    setProfileMessage(null);
    try {
      await authAPI.updateProfile({ name, email, phone });
      setProfileMessage(tx('تم تحديث البيانات بنجاح'));
      setEditingProfile(false);
    } catch (err) {
      setProfileMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage(tx('كلمة المرور الجديدة غير متطابقة'));
      return;
    }
    setBusy(true);
    setPasswordMessage(null);
    try {
      await authAPI.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });
      setPasswordMessage(tx('تم تغيير كلمة المرور بنجاح'));
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const rowActions = { ...flexRow, gap: spacing.sm };

  return (
    <ListScreenLayout
      title={tx('الإعدادات')}
      subtitle={tx('إعدادات الحساب والسياق')}
      hero={{
        eyebrow: tx('النظام'),
        title: tx('الإعدادات'),
        subtitle: tx('إعدادات الحساب والسياق'),
        compact: true,
      }}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.xl, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title={tx('الحساب')} />
          {!editingProfile ? (
            <>
              <MadarSurface padded={false}>
                <DenseRow primary={tx('الاسم')} secondary={user?.name ?? '—'} showDivider />
                <DenseRow primary={tx('البريد')} secondary={user?.email ?? '—'} showDivider />
                <DenseRow primary={tx('الهاتف')} secondary={user?.phone ?? '—'} showDivider={false} />
              </MadarSurface>
              <AppButton
                title={tx('تعديل البيانات')}
                variant="secondary"
                onPress={() => {
                  setName(user?.name ?? '');
                  setEmail(user?.email ?? '');
                  setEditingProfile(true);
                }}
              />
            </>
          ) : (
            <>
              <AppInput label={tx('الاسم')} value={name} onChangeText={setName} />
              <AppInput label={tx('البريد')} value={email} onChangeText={setEmail} keyboardType="email-address" />
              <AppInput label={tx('الهاتف')} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
              {profileMessage ? (
                <AppText style={{ ...textStart, color: c.accent, fontSize: typography.body }}>{profileMessage}</AppText>
              ) : null}
              <View style={rowActions}>
                <AppButton title={tx('حفظ')} onPress={handleUpdateProfile} loading={busy} style={{ flex: 1 }} />
                <AppButton title={tx('إلغاء')} variant="secondary" onPress={() => setEditingProfile(false)} style={{ flex: 1 }} />
              </View>
            </>
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title={tx('الأمان')} />
          {!editingPassword ? (
            <MadarSurface padded={false}>
              <DenseRow
                primary={tx('تغيير كلمة المرور')}
                secondary={tx('تحديث كلمة مرور الحساب')}
                onPress={() => setEditingPassword(true)}
                showDivider={false}
              />
            </MadarSurface>
          ) : (
            <>
              <AppInput label={tx('كلمة المرور الحالية')} value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
              <AppInput label={tx('كلمة المرور الجديدة')} value={newPassword} onChangeText={setNewPassword} secureTextEntry />
              <AppInput label={tx('تأكيد كلمة المرور')} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
              {passwordMessage ? (
                <AppText style={{ ...textStart, color: c.accent, fontSize: typography.body }}>{passwordMessage}</AppText>
              ) : null}
              <View style={rowActions}>
                <AppButton title={tx('تغيير')} onPress={handleChangePassword} loading={busy} style={{ flex: 1 }} />
                <AppButton
                  title={tx('إلغاء')}
                  variant="secondary"
                  onPress={() => {
                    setEditingPassword(false);
                    setPasswordMessage(null);
                  }}
                  style={{ flex: 1 }}
                />
              </View>
            </>
          )}
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title={tx('الفروع')} />
          <MadarSurface padded={false}>
            <DenseRow
              primary={tx('تغيير الفرع / العرض العام')}
              secondary={tx('يستخدم X-Branch-Id مثل تطبيق الويب')}
              onPress={() => setBranchMode(true)}
              showDivider={false}
            />
          </MadarSurface>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title={tx('الإدارة')} />
          <MadarSurface padded={false}>
            <DenseRow primary={tx('المستخدمون')} secondary={tx('إدارة الحسابات والأدوار')} onPress={() => navigation.navigate('Users')} showDivider />
            <DenseRow primary={tx('الفروع')} secondary={tx('إعدادات POS والضريبة لكل فرع')} onPress={() => navigation.navigate('BranchesList')} showDivider />
            <DenseRow primary={tx('إعدادات المستأجر')} secondary={tx('قراءة بيانات الشركة')} onPress={() => navigation.navigate('TenantSettings')} showDivider />
            <DenseRow primary={tx('سجل النشاط')} secondary={tx('بحث وتصفية الأحداث')} onPress={() => navigation.navigate('ActivityLogs')} showDivider />
            <DenseRow primary={tx('النسخ الاحتياطي')} secondary={tx('ويب فقط — سبب التعطيل')} onPress={() => navigation.navigate('BackupInfo')} showDivider />
            <DenseRow primary={tx('الكوبونات')} onPress={() => navigation.navigate('Coupons')} showDivider />
            <DenseRow primary={tx('العروض')} onPress={() => navigation.navigate('Promotions')} showDivider />
            <DenseRow primary={tx('بطاقات الهدايا')} onPress={() => navigation.navigate('GiftCards')} showDivider={false} />
          </MadarSurface>
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title={tx('النظام')} />
          <MadarSurface padded={false}>
            <DenseRow primary={tx('الملف الشخصي')} secondary={tx('عرض الحساب والأدوار')} onPress={() => navigation.navigate('Profile')} showDivider />
            <DenseRow primary={tx('حالة المزامنة')} secondary={tx('اطلع على حالة الاتصال والمزامنة')} onPress={() => navigation?.navigate('SyncStatus')} showDivider />
            <DenseRow
              primary={tx('ملفات الطابعات')}
              secondary={tx('إعداد طابعات الفرع النشط')}
              onPress={() => {
                const activeId = useBranchStore.getState().activeBranch?.id;
                if (activeId) navigation.navigate('BranchDetail', { id: activeId });
                else navigation.navigate('BranchesList');
              }}
              showDivider
            />
            <DenseRow primary={tx('تشخيص الطباعة')} secondary={tx('اختبار اتصال وطباعة عربية')} onPress={() => navigation?.navigate('PrinterDiagnostics')} showDivider />
            <DenseRow primary={tx('قائمة انتظار الطباعة')} secondary={tx('إعادة محاولة المهام الفاشلة')} onPress={() => navigation?.navigate('PrintQueue')} showDivider />
            <DenseRow primary={tx('الإشعارات')} secondary={tx('الإشعارات غير المقروءة')} onPress={() => navigation?.navigate('Notifications')} showDivider={false} />
          </MadarSurface>
        </View>

        <AppButton title={tx('تسجيل الخروج')} variant="danger" onPress={() => setLogoutConfirm(true)} loading={busy} fullWidth />
      </ScrollView>

      <ConfirmDialog
        visible={logoutConfirm}
        title={tx('تسجيل الخروج')}
        message={tx('سيتم تسجيل خروجك من التطبيق.')}
        confirmLabel={tx('خروج')}
        onConfirm={() => {
          setLogoutConfirm(false);
          void logout();
        }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </ListScreenLayout>
  );
}
