import React, { useEffect, useState } from 'react';
import { Alert, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader, AppSelect, AppText } from '@/components/ui';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { useAuthStore } from '@/store/authStore';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission, hasRole } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import type { ShiftFilterUser } from '@/types/shifts';

type Props = {
  visible: boolean;
  branchId: string | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function OpenShiftSheet({ visible, branchId, onClose, onSuccess }: Props) {
  const user = useAuthStore((s) => s.user);
  const [vaults, setVaults] = useState<Record<string, unknown>[]>([]);
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [startingCash, setStartingCash] = useState('');
  const [assignableUsers, setAssignableUsers] = useState<ShiftFilterUser[]>([]);
  const [shiftOwnerId, setShiftOwnerId] = useState<string | null>(null);
  const [loadingVaults, setLoadingVaults] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const canAssignShiftOwner = Boolean(
    user &&
      (user.is_super_admin ||
        hasPermission(user, 'access_admin_routes') ||
        hasRole(user, ['owner', 'partner', 'branch_manager'])),
  );

  useEffect(() => {
    if (!visible) return;
    if (user?.id) setShiftOwnerId(String(user.id));
    setStartingCash('');
    setErrorMsg(null);
  }, [visible, user?.id]);

  useEffect(() => {
    if (!visible || !branchId) return;
    setLoadingVaults(true);
    vaultsAPI
      .list({ active_only: true })
      .then((res) => {
        const list = extractArray<Record<string, unknown>>(res);
        setVaults(list);
        setVaultId((prev) => (prev && list.some((v) => String(v.id) === prev) ? prev : list[0]?.id ? String(list[0].id) : null));
      })
      .catch(() => setVaults([]))
      .finally(() => setLoadingVaults(false));
  }, [visible, branchId]);

  useEffect(() => {
    if (!visible || !canAssignShiftOwner || !branchId) return;
    shiftsAPI
      .filterUsers({ branch_id: branchId })
      .then((res) => {
        const list = extractArray<ShiftFilterUser>(res);
        const merged = [...list];
        if (user?.id && !merged.some((u) => u.id === user.id)) {
          merged.unshift({ id: user.id, name: user.name || 'أنا' });
        }
        setAssignableUsers(merged);
      })
      .catch(() => {
        if (user?.id) setAssignableUsers([{ id: user.id, name: user.name || 'أنا' }]);
      });
  }, [visible, canAssignShiftOwner, branchId, user]);

  const handleOpen = async () => {
    if (!branchId) {
      setErrorMsg('اختر فرعاً أولاً');
      return;
    }
    if (!vaultId) {
      setErrorMsg('اختر الخزنة');
      return;
    }
    const amount = Number(startingCash);
    if (!Number.isFinite(amount) || amount < 0) {
      setErrorMsg('أدخل مبلغ افتتاح صحيح');
      return;
    }
    const meId = user?.id;
    const selectedOwner = Number(shiftOwnerId);
    const forUserId =
      canAssignShiftOwner && meId != null && Number.isFinite(selectedOwner) && selectedOwner !== meId
        ? selectedOwner
        : undefined;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await shiftsAPI.open({
        vault_id: vaultId,
        starting_cash: amount,
        ...(forUserId != null ? { for_user_id: forUserId } : {}),
      });
      Alert.alert('تم', 'تم فتح الوردية بنجاح');
      onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(normalizeApiError(err).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose} title="فتح وردية">
      <View style={{ gap: spacing.md, paddingBottom: spacing.md }}>
        <AppText style={textStart}>حدد الخزنة ونقدية الافتتاح لبدء وردية جديدة.</AppText>

        {!branchId ? (
          <AppText style={{ ...textStart, color: '#b45309' }}>اختر فرعاً لعرض الخزائن المتاحة.</AppText>
        ) : null}

        {canAssignShiftOwner && assignableUsers.length > 0 ? (
          <AppSelect
            label="كاشير الوردية"
            value={shiftOwnerId}
            options={assignableUsers.map((u) => ({ label: u.name, value: String(u.id) }))}
            onChange={setShiftOwnerId}
          />
        ) : null}

        {loadingVaults ? (
          <AppText style={textStart}>جاري تحميل الخزائن…</AppText>
        ) : vaults.length === 0 ? (
          <AppText style={{ ...textStart, color: '#dc2626' }}>لا توجد خزائن نقدية نشطة لهذا الفرع.</AppText>
        ) : (
          <AppSelect
            label="الخزنة"
            value={vaultId}
            options={vaults.map((v) => ({ label: String(v.name ?? ''), value: String(v.id) }))}
            onChange={setVaultId}
          />
        )}

        <AppInput
          label="نقدية الافتتاح"
          keyboardType="decimal-pad"
          value={startingCash}
          onChangeText={setStartingCash}
          placeholder="0.00"
        />

        {errorMsg ? <AppText style={{ ...textStart, color: '#dc2626', fontWeight: '700' }}>{errorMsg}</AppText> : null}

        <AppButton
          title="فتح الوردية"
          loading={submitting}
          disabled={!branchId || !vaultId || loadingVaults || vaults.length === 0}
          onPress={() => void handleOpen()}
        />
      </View>
    </AppBottomSheet>
  );
}
