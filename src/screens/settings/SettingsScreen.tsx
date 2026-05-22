import React, { useState } from 'react';
import { View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText } from '@/components/ui/AppText';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { BranchSwitcherScreen } from './BranchSwitcherScreen';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/api/auth';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function SettingsScreen({ navigation }: { navigation: any }) {
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
      setProfileMessage('تم تحديث البيانات بنجاح');
      setEditingProfile(false);
    } catch (err) {
      setProfileMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMessage('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setBusy(true);
    setPasswordMessage(null);
    try {
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword, new_password_confirmation: confirmPassword });
      setPasswordMessage('تم تغيير كلمة المرور بنجاح');
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
    <AppScreen title="الإعدادات" subtitle="إعدادات الحساب والسياق">
      <AppCard>
        <AppSectionHeader title="الحساب" />
        {!editingProfile ? (
          <>
            <AppListItem title="الاسم" subtitle={user?.name ?? '—'} />
            <AppListItem title="البريد" subtitle={user?.email ?? '—'} />
            <AppListItem title="الهاتف" subtitle={user?.phone ?? '—'} />
            <AppButton title="تعديل البيانات" variant="secondary" onPress={() => { setName(user?.name ?? ''); setEmail(user?.email ?? ''); setEditingProfile(true); }} />
          </>
        ) : (
          <>
            <AppInput label="الاسم" value={name} onChangeText={setName} />
            <AppInput label="البريد" value={email} onChangeText={setEmail} keyboardType="email-address" />
            <AppInput label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            {profileMessage ? <AppText style={{ ...textStart, color: c.accent, fontSize: typography.body }}>{profileMessage}</AppText> : null}
            <View style={rowActions}>
              <AppButton title="حفظ" onPress={handleUpdateProfile} loading={busy} style={{ flex: 1 }} />
              <AppButton title="إلغاء" variant="secondary" onPress={() => setEditingProfile(false)} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الأمان" />
        {!editingPassword ? (
          <AppButton title="تغيير كلمة المرور" variant="secondary" onPress={() => setEditingPassword(true)} />
        ) : (
          <>
            <AppInput label="كلمة المرور الحالية" value={currentPassword} onChangeText={setCurrentPassword} secureTextEntry />
            <AppInput label="كلمة المرور الجديدة" value={newPassword} onChangeText={setNewPassword} secureTextEntry />
            <AppInput label="تأكيد كلمة المرور" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry />
            {passwordMessage ? <AppText style={{ ...textStart, color: c.accent, fontSize: typography.body }}>{passwordMessage}</AppText> : null}
            <View style={rowActions}>
              <AppButton title="تغيير" onPress={handleChangePassword} loading={busy} style={{ flex: 1 }} />
              <AppButton title="إلغاء" variant="secondary" onPress={() => { setEditingPassword(false); setPasswordMessage(null); }} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الفروع" />
        <AppListItem title="تغيير الفرع / العرض العام" subtitle="يستخدم X-Branch-Id مثل تطبيق الويب" onPress={() => setBranchMode(true)} />
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الإدارة" />
        <AppListItem title="المستخدمون" subtitle="إدارة الحسابات والأدوار" onPress={() => navigation.navigate('Users')} />
        <AppListItem title="الفروع" subtitle="إعدادات POS والضريبة لكل فرع" onPress={() => navigation.navigate('BranchesList')} />
        <AppListItem title="إعدادات المستأجر" subtitle="قراءة بيانات الشركة" onPress={() => navigation.navigate('TenantSettings')} />
        <AppListItem title="سجل النشاط" subtitle="بحث وتصفية الأحداث" onPress={() => navigation.navigate('ActivityLogs')} />
        <AppListItem title="النسخ الاحتياطي" subtitle="ويب فقط — سبب التعطيل" onPress={() => navigation.navigate('BackupInfo')} />
        <AppListItem title="الكوبونات" onPress={() => navigation.navigate('Coupons')} />
        <AppListItem title="العروض" onPress={() => navigation.navigate('Promotions')} />
        <AppListItem title="بطاقات الهدايا" onPress={() => navigation.navigate('GiftCards')} />
      </AppCard>
      <AppCard>
        <AppSectionHeader title="النظام" />
        <AppListItem title="الملف الشخصي" subtitle="عرض الحساب والأدوار" onPress={() => navigation.navigate('Profile')} />
        <AppListItem title="حالة المزامنة" subtitle="اطلع على حالة الاتصال والمزامنة" onPress={() => navigation?.navigate('SyncStatus')} />
        <AppListItem title="ملفات الطابعات" subtitle="شبكة Ethernet · بلوتوث Android · AirPrint iOS" onPress={() => navigation?.navigate('PrinterProfiles')} />
        <AppListItem title="تشخيص الطباعة" subtitle="اختبار اتصال وطباعة عربية" onPress={() => navigation?.navigate('PrinterDiagnostics')} />
        <AppListItem title="قائمة انتظار الطباعة" subtitle="إعادة محاولة المهام الفاشلة" onPress={() => navigation?.navigate('PrintQueue')} />
        <AppListItem title="الإشعارات" subtitle="الإشعارات غير المقروءة" onPress={() => navigation?.navigate('Notifications')} />
      </AppCard>
      <AppButton title="تسجيل الخروج" variant="danger" onPress={() => setLogoutConfirm(true)} loading={busy} fullWidth />
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
