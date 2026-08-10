import React, { useEffect, useState } from 'react';
import { settingsAPI } from '@/api/settings';
import { FormScreenLayout } from '@/components/layout';
import { FormSection } from '@/components/forms';
import { ConfirmDialog, useToast } from '@/components/feedback';
import { AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractArray, extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hapticError, hapticSuccess } from '@/utils/haptics';
import type { SelectOption } from '@/components/ui/AppSelect';

export function UserFormScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = route.params?.id as number | undefined;
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_users');
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [active, setActive] = useState('1');
  const [roles, setRoles] = useState<string[]>([]);
  const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  useEffect(() => {
    void settingsAPI.getRoles().then((res) => {
      const list = extractArray<Record<string, unknown>>(res);
      setRoleOptions(list.map((r) => ({ label: String(r.name ?? r.slug ?? r.id), value: String(r.name ?? r.slug) })));
    });
    if (id) {
      void settingsAPI.getUsers({ per_page: 200 }).then((res) => {
        const list = extractArray<Record<string, unknown>>(res);
        const row = list.find((u) => Number(u.id) === id);
        if (row) {
          setName(String(row.name ?? ''));
          setEmail(String(row.email ?? ''));
          setPhone(String(row.phone ?? ''));
          setActive(row.active === false ? '0' : '1');
          setRoles(Array.isArray(row.roles) ? (row.roles as string[]) : []);
        }
      });
    }
  }, [id]);

  const save = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية لتنفيذ هذه العملية.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = { name: name.trim(), email: email.trim() || null, phone: phone.trim() || null, active: active === '1' };
      if (!id && password) payload.password = password;
      let userId = id;
      if (id) {
        await settingsAPI.updateUser(id, payload);
      } else {
        const created = await settingsAPI.createUser({ ...payload, password: password || 'changeme123' });
        const row = extractData(created) as Record<string, unknown> | undefined;
        userId = Number(row?.id ?? 0) || undefined;
      }
      if (userId && roles.length) await settingsAPI.syncUserRoles(userId, roles);
      toast.success(id ? 'تم تحديث المستخدم' : 'تم إنشاء المستخدم');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!id || !canManage) return;
    setBusy(true);
    try {
      await settingsAPI.deleteUser(id);
      toast.success('تم حذف المستخدم');
      void hapticSuccess();
      navigation.goBack();
    } catch (err) {
      const msg = normalizeApiError(err).message;
      setError(msg);
      toast.error(msg);
      void hapticError();
    } finally {
      setBusy(false);
      setDeleteConfirm(false);
    }
  };

  const toggleRole = (role: string) => {
    setRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  };

  if (!canManage && !id) {
    return (
      <FormScreenLayout title="مستخدم" onBack={navigation.goBack}>
        <Text>ليس لديك صلاحية manage_users لإنشاء مستخدمين.</Text>
      </FormScreenLayout>
    );
  }

  return (
    <FormScreenLayout
      title={id ? 'تعديل مستخدم' : 'مستخدم جديد'}
      onBack={navigation.goBack}
      onSave={canManage ? () => void save() : undefined}
      saveLoading={busy}
      onDelete={id && canManage ? () => setDeleteConfirm(true) : undefined}
    >
      <FormSection title="بيانات المستخدم" icon="person">
        {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
        <AppInput label="الاسم" value={name} onChangeText={setName} editable={canManage} />
        <AppInput label="البريد" value={email} onChangeText={setEmail} keyboardType="email-address" editable={canManage} />
        <AppInput label="الهاتف" value={phone} onChangeText={setPhone} keyboardType="phone-pad" editable={canManage} />
        {!id ? <AppInput label="كلمة المرور" value={password} onChangeText={setPassword} secureTextEntry editable={canManage} /> : null}
        <AppSelect label="نشط" value={active} options={[{ label: 'نعم', value: '1' }, { label: 'لا', value: '0' }]} onChange={setActive} />
      </FormSection>
      <FormSection title="الأدوار" icon="admin-panel-settings">
        <AppSelect label="إضافة دور" value={null} options={[{ label: 'اختر دور', value: '' }, ...roleOptions]} onChange={(v) => v && toggleRole(v)} />
        <Text>الأدوار: {roles.length ? roles.join('، ') : '—'}</Text>
      </FormSection>
      <ConfirmDialog visible={deleteConfirm} title="حذف المستخدم" message="حذف هذا المستخدم؟" confirmLabel="حذف" onConfirm={() => void remove()} onCancel={() => setDeleteConfirm(false)} loading={busy} />
    </FormScreenLayout>
  );
}
