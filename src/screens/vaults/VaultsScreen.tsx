import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { post } from '@/api/client';
import { AppScreen, AppBottomSheet } from '@/components/layout';
import { AppBadge, AppButton, AppCard, AppInput, AppListItem, AppSectionHeader, AppStatCard } from '@/components/ui';
import { ConfirmDialog, AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { useBranchStore } from '@/store/branchStore';
import { extractArray, extractData } from '@/utils/data';
import { dateText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
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

  const styles = useMemo(() => StyleSheet.create({
    stats: { ...flexRow, flexWrap: 'wrap', gap: spacing.md },
    card: { gap: spacing.md },
    vaultRow: { gap: spacing.sm },
    vaultActions: { ...flexRow, gap: spacing.sm },
    actionBtn: { flex: 1 },
    sheetContent: { gap: spacing.md },
    vaultName: { color: c.text, fontSize: typography.body, fontWeight: '800', ...textStart },
    errorText: { color: c.danger, ...textStart, fontWeight: '800' },
  }), [c]);

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

  return (
    <AppScreen title="الخزنة / الورديات" refreshing={loading} onRefresh={load}>
      {loading ? <AppLoadingState /> : null}
      {error ? <AppErrorState message={error} onRetry={load} /> : null}
      {!loading && !error ? (
        <>
          <View style={styles.stats}>
            <AppStatCard label="الخزن النشطة" value={String(vaults.length)} tone="primary" />
            <AppStatCard label="نقدية الوردية" value={money(shift?.expected_cash ?? shift?.starting_cash ?? 0)} tone="success" />
          </View>
          <AppCard style={styles.card}>
            <AppSectionHeader title="الوردية الحالية" />
            {shift ? <AppListItem title={`وردية ${shift.shift_no ?? shift.id}`} subtitle={dateText(String(shift.opened_at ?? ''))} meta={money(shift.expected_cash ?? shift.starting_cash ?? 0)} badge={<AppBadge label="مفتوحة" tone="success" />} /> : <AppEmptyState title="لا توجد وردية نشطة" />}
            <AppButton title="إدارة الورديات" variant="secondary" onPress={() => navigation.navigate('ShiftManagement')} />
          </AppCard>
          <AppCard style={styles.card}>
            <AppSectionHeader title="الخزن" />
            {vaults.length === 0 ? <AppEmptyState title="لا توجد خزن" /> : vaults.map((vault) => (
              <View key={String(vault.id)} style={styles.vaultRow}>
                <AppListItem
                  title={String(vault.name ?? 'خزنة')}
                  subtitle={String((vault.branch as any)?.name ?? '')}
                  meta={money(vault.balance ?? 0)}
                  badge={<AppBadge label={vault.is_active === false ? 'غير نشطة' : 'نشطة'} tone={vault.is_active === false ? 'warning' : 'success'} />}
                />
                <View style={styles.vaultActions}>
                  <AppButton title="إيداع" variant="primary" onPress={() => openMovement(vault, 'deposit')} style={styles.actionBtn} />
                  <AppButton title="سحب" variant="secondary" onPress={() => openMovement(vault, 'withdraw')} style={styles.actionBtn} />
                </View>
              </View>
            ))}
          </AppCard>
        </>
      ) : null}

      <AppBottomSheet visible={movementOpen} onClose={() => setMovementOpen(false)}>
        <View style={styles.sheetContent}>
          <AppSectionHeader title={movementType === 'deposit' ? 'إيداع' : 'سحب'} />
          {movementVault ? (
            <Text style={styles.vaultName}>{String(movementVault.name ?? 'خزنة')}: {money(movementVault.balance ?? 0)}</Text>
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
          {movementError ? <Text style={styles.errorText}>{movementError}</Text> : null}
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
    </AppScreen>
  );
}
