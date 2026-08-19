import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { posRegistersAPI } from '@/api/posRegisters';
import {
  getActiveRegisterSessionId,
  setActiveRegisterSessionId,
} from '@/services/storage/registerSessionContext';
import { getPendingOrders } from '@/services/offline/posOrders';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
  onClosed?: () => void;
};

export function CloseRegisterSessionSheet({ visible, onClose, onClosed }: Props) {
  const s = usePosSheetStyles();
  const [counted, setCounted] = useState('');
  const [reason, setReason] = useState('');
  const [expected, setExpected] = useState<string | null>(null);
  const [pendingLocal, setPendingLocal] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const sessionId = await getActiveRegisterSessionId();
      if (!sessionId) {
        onClose();
        return;
      }
      const pending = await getPendingOrders();
      setPendingLocal(
        pending.filter(
          (o) =>
            (o.status === 'pending' || o.status === 'failed') &&
            String(o.register_session_id || '') === String(sessionId || ''),
        ).length,
      );
      if (!sessionId) return;
      try {
        const detail = await posRegistersAPI.getSession(sessionId);
        setExpected(detail.expected_cash || detail.expected_cash_snapshot || null);
      } catch {
        setExpected(null);
      }
    })();
  }, [visible]);

  const close = async () => {
    const sessionId = await getActiveRegisterSessionId();
    if (!sessionId) {
      setError('لا توجد جلسة نشطة');
      return;
    }
    if (pendingLocal > 0) {
      setError('توجد عمليات أوفلاين معلّقة لهذه الجلسة. زامن أولاً قبل الإغلاق.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await posRegistersAPI.closeSession(sessionId, {
        closing_counted_cash: counted || '0',
        reason: reason || undefined,
        has_local_pending_cash: pendingLocal > 0,
      });
      await setActiveRegisterSessionId(null);
      onClosed?.();
      onClose();
    } catch (e) {
      setError(normalizeApiError(e).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <PosSheetHeader title="إغلاق جلسة نقطة البيع" />
      <View style={{ gap: spacing.sm, paddingBottom: spacing.lg }}>
        <Text style={s.sheetSubtitle}>المتوقع: {expected ?? '—'}</Text>
        {pendingLocal > 0 ? (
          <Text style={{ color: 'tomato' }}>عمليات أوفلاين معلّقة: {pendingLocal}. الإغلاق العادي محظور.</Text>
        ) : null}
        <AppInput label="النقد المعدود" value={counted} onChangeText={setCounted} keyboardType="decimal-pad" />
        <AppInput label="ملاحظة" value={reason} onChangeText={setReason} />
        <Text style={s.sheetSubtitle}>إغلاق الجلسة تسوية فقط ولا يختلق تسوية درج فرع موحّدة.</Text>
        {error ? <Text style={{ color: 'tomato' }}>{error}</Text> : null}
        <AppButton title="إغلاق الجلسة" loading={busy} disabled={pendingLocal > 0} onPress={() => void close()} />
      </View>
    </AppBottomSheet>
  );
}
