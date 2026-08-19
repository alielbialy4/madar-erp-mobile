import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { posRegistersAPI, type MobilePosRegister } from '@/api/posRegisters';
import {
  getOrCreateMobilePosDeviceId,
  resolveSessionDrawerFinancialAccountId,
  setActiveRegisterSessionId,
  setCachedSessionDrawerFa,
  setSelectedPosRegisterId,
} from '@/services/storage/registerSessionContext';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

type Props = {
  visible: boolean;
  branchId?: string | null;
  onReady: () => void;
};

async function persistSessionDrawerCache(
  branchId: string,
  register: MobilePosRegister,
  session: {
    uuid?: string;
    id?: string;
    drawer?: { financial_account_id?: string | null } | null;
    cash_drawer_financial_account_id?: string | null;
  },
): Promise<void> {
  const sessionId = session.uuid || session.id;
  if (!sessionId) return;
  const drawerFaId = resolveSessionDrawerFinancialAccountId({
    drawerFinancialAccountId: session.drawer?.financial_account_id ?? register.drawer?.financial_account_id,
    cashDrawerFinancialAccountId: session.cash_drawer_financial_account_id,
  });
  if (!drawerFaId) return;
  await setCachedSessionDrawerFa({
    branchId,
    registerId: register.uuid,
    sessionId: String(sessionId),
    drawerFaId,
  });
}

export function RegisterSessionGateSheet({ visible, branchId, onReady }: Props) {
  const { t } = useTranslation();
  const s = usePosSheetStyles();
  const [registers, setRegisters] = useState<MobilePosRegister[]>([]);
  const [registerId, setRegisterId] = useState<string | null>(null);
  const [openingCash, setOpeningCash] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    (async () => {
      try {
        const rows = (await posRegistersAPI.list()).filter((r) => r.is_active);
        if (cancelled) return;
        setRegisters(rows);
        const deviceId = await getOrCreateMobilePosDeviceId();
        const pairing = await posRegistersAPI.validatePairing({ device_uuid: deviceId });
        if (cancelled) return;
        if (pairing.valid && pairing.register?.uuid) {
          setRegisterId(pairing.register.uuid);
          if (!pairing.register.current_session) {
            setOpeningCash('');
          }
          if (pairing.register.current_session?.uuid) {
            await setSelectedPosRegisterId(pairing.register.uuid);
            await setActiveRegisterSessionId(pairing.register.current_session.uuid);
            if (branchId) {
              await persistSessionDrawerCache(branchId, pairing.register, pairing.register.current_session);
            }
            onReady();
          }
        }
      } catch (e) {
        if (!cancelled) setError(normalizeApiError(e).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible, onReady, branchId]);

  const selected = registers.find((r) => r.uuid === registerId);

  useEffect(() => {
    if (!registerId || selected?.current_session) return;
    setOpeningCash('');
  }, [registerId, selected?.uuid, selected?.current_session]);

  const submit = async () => {
    if (!registerId) {
      setError(t('pos.registerGate.selectRequired'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const deviceId = await getOrCreateMobilePosDeviceId();
      await posRegistersAPI.pair(registerId, { device_uuid: deviceId, device_label: 'mobile' }).catch(() => undefined);
      if (selected?.current_session?.uuid) {
        await setSelectedPosRegisterId(registerId);
        await setActiveRegisterSessionId(selected.current_session.uuid);
        if (branchId) {
          await persistSessionDrawerCache(branchId, selected, selected.current_session);
        }
        onReady();
        return;
      }
      const session = await posRegistersAPI.openSession(registerId, { opening_cash: openingCash || '0' });
      const sessionId = session.uuid || session.id;
      if (!sessionId) throw new Error(t('pos.registerGate.openMissingId'));
      await setSelectedPosRegisterId(registerId);
      await setActiveRegisterSessionId(sessionId);
      if (branchId && selected) {
        await persistSessionDrawerCache(branchId, selected, session);
      }
      onReady();
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={() => undefined} dismissable={false}>
      <PosSheetHeader title={t('pos.registerGate.title')} />
      <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
        <Text style={s.sheetSubtitle}>{t('pos.registerGate.pairingNote')}</Text>
        <AppSelect
          label={t('pos.registerGate.register')}
          value={registerId}
          onChange={(v) => {
            setRegisterId(v);
            const next = registers.find((r) => r.uuid === v);
            if (!next?.current_session) setOpeningCash('');
          }}
          options={registers.map((r) => ({
            value: r.uuid,
            label: `${r.code} — ${r.name}${r.current_session ? ` (${t('pos.registerGate.yourOpenSession')})` : ''}`,
          }))}
        />
        {!selected?.current_session ? (
          <>
            <AppInput
              label={t('pos.registerGate.openingCash')}
              value={openingCash}
              onChangeText={setOpeningCash}
              keyboardType="decimal-pad"
              placeholder={t('pos.registerGate.openingCashHint')}
            />
            <Text style={s.sheetSubtitle}>{t('pos.registerGate.openingCashIndependent')}</Text>
          </>
        ) : null}
        {error ? <Text style={{ color: 'tomato' }}>{error}</Text> : null}
        <AppButton
          title={selected?.current_session ? t('pos.registerGate.resumeSession') : t('pos.registerGate.openSession')}
          loading={busy}
          onPress={() => void submit()}
        />
      </View>
    </AppBottomSheet>
  );
}
