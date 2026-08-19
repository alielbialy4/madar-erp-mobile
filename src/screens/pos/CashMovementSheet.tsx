import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { cashMovementsAPI, type CashMovementSource } from '@/api/cashMovements';
import { vaultsAPI } from '@/api/vaults';
import type { ActiveShift, Vault } from '@/types/api';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { completeIdempotencyAttempt, idempotencyKeyForAttempt, resolveIdempotencyAttemptAfterError } from '@/utils/idempotencyAttempt';
import { registerMoneyContextFields, registerMoneyContextFromSession } from '@/services/storage/registerSessionContext';
import { RegisterDrawerSessionPicker } from '@/components/pos/RegisterDrawerSessionPicker';
import type { EligibleRegisterMoneySession } from '@/api/posRegisters';
import { spacing } from '@/constants/spacing';

type MovementType = 'cash_in' | 'cash_out';

type Props = {
  visible: boolean;
  shift: ActiveShift | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function CashMovementSheet({ visible, shift, onClose, onSuccess }: Props) {
  const s = usePosSheetStyles();
  const drawerLedger = Boolean(shift?.drawer_ledger_enabled);
  const [type, setType] = useState<MovementType>('cash_in');
  const [source, setSource] = useState<CashMovementSource>('drawer');
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [drawerSessionId, setDrawerSessionId] = useState('');
  const [drawerSession, setDrawerSession] = useState<EligibleRegisterMoneySession | null>(null);
  const [drawerSessionCount, setDrawerSessionCount] = useState(0);
  const idempotencyKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setType('cash_in');
      setSource('drawer');
      setVaultId(null);
      setAmount('');
      setReason('');
      setError(null);
      setSaving(false);
      setConfirm(false);
      completeIdempotencyAttempt(idempotencyKeyRef);
      setDrawerSessionId('');
      setDrawerSession(null);
      setDrawerSessionCount(0);
      return;
    }
    if (!drawerLedger) {
      setSource('vault');
    }
  }, [visible, drawerLedger]);

  useEffect(() => {
    if (!visible || (source !== 'vault' && source !== 'drop_to_vault')) return;
    let cancelled = false;
    vaultsAPI
      .list({ active_only: true })
      .then((res) => {
        if (cancelled) return;
        const rows = extractArray<Vault>(res);
        setVaults(rows);
        const fallback = shift?.vault_id ?? rows[0]?.id ?? null;
        setVaultId((prev) => (prev && rows.some((v) => v.id === prev) ? prev : fallback));
      })
      .catch(() => {
        if (!cancelled) setVaults([]);
      });
    return () => {
      cancelled = true;
    };
  }, [visible, source, shift?.vault_id]);

  useEffect(() => {
    if (type === 'cash_in' && source === 'drop_to_vault') {
      setSource(drawerLedger ? 'drawer' : 'vault');
    }
  }, [type, source, drawerLedger]);

  const parsedAmount = useMemo(() => {
    const value = Number(amount);
    return Number.isFinite(value) && value > 0 ? value : null;
  }, [amount]);

  const sourceOptions = useMemo(() => {
    if (!drawerLedger) {
      return [{ label: 'الخزنة', value: 'vault' as CashMovementSource }];
    }
    const opts: { label: string; value: CashMovementSource }[] = [
      {
        label: type === 'cash_in' ? 'إلى درج الوردية' : 'من درج الوردية',
        value: 'drawer',
      },
      {
        label: type === 'cash_in' ? 'إلى الخزنة' : 'من الخزنة',
        value: 'vault',
      },
    ];
    if (type === 'cash_out') {
      opts.push({ label: 'إيداع من الدرج إلى الخزنة', value: 'drop_to_vault' });
    }
    return opts;
  }, [drawerLedger, type]);

  const requestConfirm = () => {
    if (!shift?.id) {
      setError('لا توجد وردية نشطة لتسجيل حركة نقدية.');
      return;
    }
    if (parsedAmount == null) {
      setError('أدخل مبلغاً موجباً.');
      return;
    }
    if (!reason.trim()) {
      setError('سبب الحركة مطلوب.');
      return;
    }
    if ((source === 'vault' || source === 'drop_to_vault') && !vaultId) {
      setError('اختر الخزنة.');
      return;
    }
    if ((source === 'drawer' || source === 'drop_to_vault') && drawerSessionCount > 0 && !drawerSessionId) {
      setError('اختر درجاً مفتوحاً.');
      return;
    }
    setError(null);
    setConfirm(true);
  };

  const submit = async () => {
    if (!shift?.id || parsedAmount == null) return;
    setSaving(true);
    setError(null);
    try {
      await cashMovementsAPI.create(String(shift.id), {
        type,
        amount: parsedAmount,
        reason: reason.trim(),
        source: drawerLedger ? source : 'vault',
        ...((source === 'vault' || source === 'drop_to_vault') && vaultId ? { vault_id: vaultId } : {}),
        idempotency_key: idempotencyKeyForAttempt(idempotencyKeyRef),
        ...((source === 'drawer' || source === 'drop_to_vault')
          ? await registerMoneyContextFromSession(drawerSession)
          : await registerMoneyContextFields()),
      });
      completeIdempotencyAttempt(idempotencyKeyRef);
      setConfirm(false);
      onSuccess?.();
      onClose();
    } catch (err) {
      const normalized = normalizeApiError(err);
      resolveIdempotencyAttemptAfterError(idempotencyKeyRef, normalized);
      setError(normalized.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AppBottomSheet visible={visible} onClose={onClose}>
        <View style={{ gap: spacing.md }}>
          <PosSheetHeader
            title="حركة نقدية"
            subtitle={
              drawerLedger
                ? 'إيداع أو سحب على درج الوردية، أو تحريك بين الدرج والخزنة.'
                : 'تسجيل إيداع أو سحب على خزنة الوردية.'
            }
          />
          {shift?.drawer_ledger_enabled && shift.expected_cash != null ? (
            <View style={s.warningBanner}>
              <Text style={s.warningText}>
                نقد متوقع في الدرج: {money(shift.expected_cash)}
              </Text>
            </View>
          ) : null}
          {!shift ? (
            <View style={s.warningBanner}>
              <Text style={s.warningText}>افتح وردية أولاً قبل تسجيل حركة نقدية.</Text>
            </View>
          ) : null}
          {error ? (
            <View style={s.errorBanner}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}
          <AppSelect
            label="النوع"
            value={type}
            onChange={(value) => setType(value as MovementType)}
            options={[
              { label: 'إيداع نقدي', value: 'cash_in' },
              { label: 'سحب نقدي', value: 'cash_out' },
            ]}
          />
          {drawerLedger ? (
            <AppSelect
              label="المصدر / الوجهة"
              value={source}
              onChange={(value) => setSource(value as CashMovementSource)}
              options={sourceOptions}
            />
          ) : null}
          {(source === 'drawer' || source === 'drop_to_vault') ? (
            <RegisterDrawerSessionPicker
              visible={visible}
              hideWhenEmpty
              required
              value={drawerSessionId}
              onChange={(id, session) => {
                setDrawerSessionId(id);
                setDrawerSession(session);
              }}
              onAvailabilityChange={({ sessions }) => setDrawerSessionCount(sessions.length)}
            />
          ) : null}
          {(source === 'vault' || source === 'drop_to_vault') && vaults.length > 0 ? (
            <AppSelect
              label="الخزنة"
              value={vaultId}
              options={vaults.map((v) => ({ label: String(v.name ?? v.id), value: String(v.id) }))}
              onChange={setVaultId}
            />
          ) : null}
          <AppInput
            label="المبلغ"
            required
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <AppInput label="السبب" required value={reason} onChangeText={setReason} placeholder="سبب الحركة" />
          <AppButton title="تسجيل الحركة" onPress={requestConfirm} disabled={!shift || saving} />
        </View>
      </AppBottomSheet>

      <ConfirmDialog
        visible={confirm}
        title="تأكيد الحركة النقدية"
        message={`${type === 'cash_in' ? 'إيداع' : 'سحب'} ${money(parsedAmount ?? 0)}`}
        confirmLabel="تأكيد"
        loading={saving}
        onConfirm={() => void submit()}
        onCancel={() => setConfirm(false)}
      />
    </>
  );
}
