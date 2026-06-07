import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText } from '@/components/ui/AppText';
import { ListScreenLayout } from '@/components/layout';
import { AppButton, AppDomainCard, AppInput, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { BranchSwitcherScreen } from './BranchSwitcherScreen';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/api/auth';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { moduleIcons } from '@/constants/iconMap';
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
    <ListScreenLayout
      title="الإعدادات"
      subtitle="إعدادات الحساب والسياق"
      hero={{
        eyebrow: 'النظام',
        title: 'الإعدادات',
        subtitle: 'إعدادات الحساب والسياق',
        compact: true,
      }}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }} showsVerticalScrollIndicator={false}>
        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title="الحساب" />
          {!editingProfile ? (
            <>
              <AppDomainCard title="الاسم" subtitle={user?.name ?? '—'} leadingIcon={moduleIcons.users} />
              <AppDomainCard title="البريد" subtitle={user?.email ?? '—'} leadingIcon="email" />
              <AppDomainCard title="الهاتف" subtitle={user?.phone ?? '—'} leadingIcon="phone" />
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
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title="الأمان" />
          {!editingPassword ? (
            <AppDomainCard title="تغيير كلمة المرور" subtitle="تحديث كلمة مرور الحساب" leadingIcon="lock" onPress={() => setEditingPassword(true)} />
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
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title="الفروع" />
          <AppDomainCard
            title="تغيير الفرع / العرض العام"
            subtitle="يستخدم X-Branch-Id مثل تطبيق الويب"
            leadingIcon="store"
            onPress={() => setBranchMode(true)}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title="الإدارة" />
          <AppDomainCard title="المستخدمون" subtitle="إدارة الحسابات والأدوار" leadingIcon={moduleIcons.users} onPress={() => navigation.navigate('Users')} />
          <AppDomainCard title="الفروع" subtitle="إعدادات POS والضريبة لكل فرع" leadingIcon="store" onPress={() => navigation.navigate('BranchesList')} />
          <AppDomainCard title="إعدادات المستأجر" subtitle="قراءة بيانات الشركة" leadingIcon="business" onPress={() => navigation.navigate('TenantSettings')} />
          <AppDomainCard title="سجل النشاط" subtitle="بحث وتصفية الأحداث" leadingIcon="history" onPress={() => navigation.navigate('ActivityLogs')} />
          <AppDomainCard title="النسخ الاحتياطي" subtitle="ويب فقط — سبب التعطيل" leadingIcon="backup" onPress={() => navigation.navigate('BackupInfo')} />
          <AppDomainCard title="الكوبونات" leadingIcon={moduleIcons.coupons} onPress={() => navigation.navigate('Coupons')} />
          <AppDomainCard title="العروض" leadingIcon={moduleIcons.promotions} onPress={() => navigation.navigate('Promotions')} />
          <AppDomainCard title="بطاقات الهدايا" leadingIcon="card-giftcard" onPress={() => navigation.navigate('GiftCards')} />
        </View>

        <View style={{ gap: spacing.sm }}>
          <AppSectionHeader title="النظام" />
          <AppDomainCard title="الملف الشخصي" subtitle="عرض الحساب والأدوار" leadingIcon="person" onPress={() => navigation.navigate('Profile')} />
          <AppDomainCard title="حالة المزامنة" subtitle="اطلع على حالة الاتصال والمزامنة" leadingIcon="sync" onPress={() => navigation?.navigate('SyncStatus')} />
          <AppDomainCard title="ملفات الطابعات" subtitle="شبكة Ethernet · بلوتوث Android · AirPrint iOS" leadingIcon="print" onPress={() => navigation?.navigate('PrinterProfiles')} />
          <AppDomainCard title="تشخيص الطباعة" subtitle="اختبار اتصال وطباعة عربية" leadingIcon="bug-report" onPress={() => navigation?.navigate('PrinterDiagnostics')} />
          <AppDomainCard title="قائمة انتظار الطباعة" subtitle="إعادة محاولة المهام الفاشلة" leadingIcon="queue" onPress={() => navigation?.navigate('PrintQueue')} />
          <AppDomainCard title="الإشعارات" subtitle="الإشعارات غير المقروءة" leadingIcon={moduleIcons.notifications} onPress={() => navigation?.navigate('Notifications')} />
        </View>

        <AppButton title="تسجيل الخروج" variant="danger" onPress={() => setLogoutConfirm(true)} loading={busy} fullWidth />
      </ScrollView>

      <ConfirmDialog
        visible={logoutConfirm}
        title="تسجيل الخروج"
        message="سيتم تسجيل خروجك من التطبيق."
        confirmLabel="خروج"
        onConfirm={() => { setLogoutConfirm(false); void logout(); }}
        onCancel={() => setLogoutConfirm(false)}
      />
    </ListScreenLayout>
  );
}
