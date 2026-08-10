import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { post } from '@/api/client';
import { AppBottomSheet, ListScreenLayout } from '@/components/layout';
import { AppButton, AppInput, AppSectionHeader, AppBadge } from '@/components/ui';
import { FinancialRow, OperationalRow } from '@/components/madar';
import { AppEmptyState, AppErrorState, AppLoadingState, ConfirmDialog } from '@/components/feedback';
import { ResourceList } from '@/components/lists';
import { useBranchStore } from '@/store/branchStore';
import { extractArray, extractData } from '@/utils/data';
import { dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';

type MovementType = 'deposit' | 'withdraw';

export function VaultsScreen({ navigation }: { navigation: any }) {
  const c = useColors();
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const [vaults, setVaults] = useState<Record<string, unknown>[]>([]);
  const [shift, setShift] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [movementOpen, setMovementOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('deposit');
  const [movementVault, setMovementVault] = useState<Record<string, unknown> | null>(null);
  const [movementAmount, setMovementAmount] = useState('');
  const [movementNotes, setMovementNotes] = useState('');
  const [movementSubmitting, setMovementSubmitting] = useState(false);
  const [movementError, setMovementError] = useState<string | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [vaultsRes, shiftRes] = await Promise.all([
        vaultsAPI.list({ active_only: true }),
        activeBranch?.id ? shiftsAPI.current(activeBranch.id) : Promise.resolve({ data: null }),
      ]);
      setVaults(extractArray(vaultsRes));
      setShift(extractData<Record<string, unknown> | null>(shiftRes as any) ?? null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [activeBranch?.id]);

  useEffect(() => { void load(); }, [load]);

  const openMovement = (vault: Record<string, unknown>, type: MovementType) => {
    setMovementVault(vault);
    setMovementType(type);
    setMovementAmount('');
    setMovementNotes('');
    setMovementError(null);
    setMovementOpen(true);
  };

  const handleMovement = async () => {
    if (!movementVault || !movementAmount) { setMovementError('أدخل المبلغ'); return; }
    setMovementSubmitting(true);
    setMovementError(null);
    try {
      const vaultId = String(movementVault.id);
      const endpoint = movementType === 'deposit' ? `/vaults/${vaultId}/deposit` : `/vaults/${vaultId}/withdraw`;
      await post(endpoint, {
        amount: Number(movementAmount),
        ...(movementNotes ? { notes: movementNotes } : {}),
      });
      setMovementOpen(false);
      void load();
    } catch (err) {
      setMovementError(normalizeApiError(err).message);
    } finally {
      setMovementSubmitting(false);
    }
  };

  const shiftCashRaw = Number(shift?.expected_cash ?? shift?.starting_cash ?? 0);
  const shiftCash = money(shiftCashRaw);

  return (
    <ListScreenLayout
      title="الخزنة / الورديات"
      subtitle="إيداع وسحب وإدارة الورديات"
      onRefresh={load}
      refreshing={loading}
      hero={{
        eyebrow: 'المالية',
        title: 'الخزنة / الورديات',
        subtitle: 'إيداع وسحب وإدارة الورديات',
        stats: [
          { label: 'الخزن النشطة', value: vaults.length },
          { label: 'نقدية الوردية', value: shiftCash },
        ],
        actions: (
          <AppButton title="إدارة الورديات" variant="secondary" onPress={() => navigation.navigate('ShiftManagement')} />
        ),
      }}
    >
      {loading && vaults.length === 0 ? <AppLoadingState /> : null}
      {error && vaults.length === 0 ? <AppErrorState message={error} onRetry={load} /> : null}
      {!error || vaults.length > 0 ? (
        <View style={{ flex: 1, gap: spacing.md }}>
          {shift ? (
            <OperationalRow
              primary={`وردية ${shift.shift_no ?? shift.id}`}
              secondary={dateText(String(shift.opened_at ?? ''))}
              statusLabel="مفتوحة"
              statusTone="success"
              amount={shiftCashRaw}
              currency="ج.م"
            />
          ) : (
            <AppEmptyState title="لا توجد وردية نشطة" />
          )}
          <ResourceList
            data={vaults}
            loading={false}
            refreshing={loading}
            onRefresh={load}
            emptyTitle="لا توجد خزن"
            keyExtractor={(item) => String(item.id)}
            renderItem={({ item }) => (
              <View style={{ gap: spacing.sm }}>
                <FinancialRow
                  primary={String(item.name ?? 'خزنة')}
                  secondary={String((item.branch as any)?.name ?? '')}
                  amount={Number(item.balance ?? 0)}
                  currency="ج.م"
                  status={<AppBadge label={item.is_active === false ? 'غير نشطة' : 'نشطة'} tone={item.is_active === false ? 'warning' : 'success'} />}
                />
                <View style={{ ...flexRow, gap: spacing.sm }}>
                  <AppButton title="إيداع" variant="primary" onPress={() => openMovement(item, 'deposit')} style={{ flex: 1 }} />
                  <AppButton title="سحب" variant="secondary" onPress={() => openMovement(item, 'withdraw')} style={{ flex: 1 }} />
                </View>
              </View>
            )}
          />
        </View>
      ) : null}

      <AppBottomSheet visible={movementOpen} onClose={() => setMovementOpen(false)}>
        <View style={{ gap: spacing.md }}>
          <AppSectionHeader title={movementType === 'deposit' ? 'إيداع' : 'سحب'} />
          {movementVault ? (
            <Text style={{ color: c.text, fontSize: typography.body, fontWeight: '800', ...textStart }}>
              {String(movementVault.name ?? 'خزنة')}: {money(movementVault.balance ?? 0)}
            </Text>
          ) : null}
          <AppInput
            label="المبلغ"
            keyboardType="numeric"
            value={movementAmount}
            onChangeText={setMovementAmount}
            placeholder="أدخل المبلغ"
          />
          <AppInput
            label="ملاحظات"
            value={movementNotes}
            onChangeText={setMovementNotes}
            multiline
          />
          {movementError ? <Text style={{ color: c.danger, ...textStart, fontWeight: '800' }}>{movementError}</Text> : null}
          <AppButton
            title={movementType === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
            loading={movementSubmitting}
            disabled={!movementAmount}
            onPress={() => setConfirmVisible(true)}
          />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirmVisible}
        title={movementType === 'deposit' ? 'تأكيد الإيداع' : 'تأكيد السحب'}
        message={`${movementType === 'deposit' ? 'إيداع' : 'سحب'} ${money(Number(movementAmount) || 0)}`}
        confirmLabel="تأكيد"
        onConfirm={() => { setConfirmVisible(false); void handleMovement(); }}
        onCancel={() => setConfirmVisible(false)}
      />
    </ListScreenLayout>
  );
}
