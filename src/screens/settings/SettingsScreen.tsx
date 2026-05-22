import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { AppScreen } from '@/components/layout';
import { AppButton, AppCard, AppInput, AppListItem, AppSectionHeader } from '@/components/ui';
import { ConfirmDialog } from '@/components/feedback';
import { BranchSwitcherScreen } from './BranchSwitcherScreen';
import { useAuthStore } from '@/store/authStore';
import { authAPI } from '@/api/auth';
import { normalizeApiError } from '@/utils/errors';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function SettingsScreen({ navigation }: { navigation: any }) {
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
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  if (branchMode) return <BranchSwitcherScreen onDone={() => setBranchMode(false)} />;

  const handleUpdateProfile = async () => {
    setBusy(true);
    setMessage(null);
    try {
      await authAPI.updateProfile({ name, email, phone });
      setMessage('تم تحديث البيانات بنجاح');
      setEditingProfile(false);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setMessage('كلمة المرور الجديدة غير متطابقة');
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      await authAPI.changePassword({ current_password: currentPassword, new_password: newPassword, new_password_confirmation: confirmPassword });
      setMessage('تم تغيير كلمة المرور بنجاح');
      setEditingPassword(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

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
            {message ? <Text style={styles.messageText}>{message}</Text> : null}
            <View style={styles.rowActions}>
              <AppButton title="حفظ" onPress={handleUpdateProfile} loading={busy} style={styles.halfBtn} />
              <AppButton title="إلغاء" variant="secondary" onPress={() => setEditingProfile(false)} style={styles.halfBtn} />
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
            {message ? <Text style={styles.messageText}>{message}</Text> : null}
            <View style={styles.rowActions}>
              <AppButton title="تغيير" onPress={handleChangePassword} loading={busy} style={styles.halfBtn} />
              <AppButton title="إلغاء" variant="secondary" onPress={() => { setEditingPassword(false); setMessage(null); }} style={styles.halfBtn} />
            </View>
          </>
        )}
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الفروع" />
        <AppListItem title="تغيير الفرع / العرض العام" subtitle="يستخدم X-Branch-Id مثل تطبيق الويب" onPress={() => setBranchMode(true)} />
      </AppCard>
      <AppCard>
        <AppSectionHeader title="المزامنة" />
        <AppListItem title="حالة المزامنة" subtitle="عرض الطلبات المعلقة وإعادة المحاولة" onPress={() => navigation?.navigate('SyncStatus')} />
      </AppCard>
      <AppCard>
        <AppSectionHeader title="الجلسة" />
        <AppButton title="تسجيل الخروج" variant="danger" onPress={() => setLogoutConfirm(true)} />
      </AppCard>
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

const styles = StyleSheet.create({
  messageText: { color: colors.info, fontSize: typography.small, ...textStart, fontWeight: '700' },
  rowActions: { ...flexRow, gap: spacing.md },
  halfBtn: { flex: 1 },
});
