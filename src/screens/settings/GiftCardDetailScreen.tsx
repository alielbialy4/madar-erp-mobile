import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { giftCardsAPI } from '@/api/giftCards';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppBadge, AppListItem } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { DocumentHeader, MadarSection, MadarSurface, QuickActionBar } from '@/components/madar';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { money, dateText } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';

export function GiftCardDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = String(route.params?.id ?? '');
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_gift_cards');
  const [card, setCard] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await giftCardsAPI.getById(id);
      setCard(extractData(res) as Record<string, unknown> | null);
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const cancelCard = async () => {
    if (!canManage) return;
    setBusy(true);
    try {
      await giftCardsAPI.cancel(id);
      setMessage('تم إلغاء البطاقة');
      await load();
    } catch (err) {
      setMessage(normalizeApiError(err).message);
    } finally {
      setBusy(false);
      setCancelConfirm(false);
    }
  };

  const status = String(card?.status ?? '');

  return (
    <AppScreen title={String(card?.code ?? 'بطاقة')} onBack={navigation.goBack} onRefresh={() => void load()} refreshing={loading}>
      {message ? <Text style={{ color: c.info, paddingHorizontal: spacing.lg }}>{message}</Text> : null}
      {card ? (
        <View style={{ gap: spacing.md }}>
          <DocumentHeader
            title={String(card.code ?? 'بطاقة هدية')}
            subtitle={`من ${money(card.initial_balance ?? 0)} · ينتهي ${dateText(String(card.expires_at ?? ''))}`}
            statusLabel={status}
            statusTone={status === 'active' ? 'success' : 'danger'}
            amount={Number(card.remaining_balance ?? 0)}
            currency="ج.م"
          />
          <MadarSection title="البطاقة">
            <MadarSurface padded={false}>
              <AppListItem title="الكود" subtitle={String(card.code)} badge={<AppBadge label={status} tone={status === 'active' ? 'success' : 'danger'} />} />
              <AppListItem title="الرصيد" meta={money(card.remaining_balance ?? 0)} subtitle={`من ${money(card.initial_balance ?? 0)}`} />
              <AppListItem title="الصلاحية" subtitle={dateText(String(card.expires_at ?? ''))} />
            </MadarSurface>
          </MadarSection>
          <Text style={{ color: c.textMuted, fontSize: 12, paddingHorizontal: spacing.xs }}>
            الاسترداد في نقطة البيع عبر check/redeem — يتطلب اتصالاً عند الدفع.
          </Text>
          {canManage && status === 'active' ? (
            <QuickActionBar
              actions={[{ id: 'cancel', label: 'إلغاء البطاقة', icon: 'x-circle', onPress: () => setCancelConfirm(true), tone: 'danger' }]}
            />
          ) : null}
        </View>
      ) : null}
      <ConfirmDialog
        visible={cancelConfirm}
        title="إلغاء بطاقة الهدية"
        message="إلغاء هذه البطاقة؟ لا يمكن التراجع."
        confirmLabel="إلغاء"
        onConfirm={() => void cancelCard()}
        onCancel={() => setCancelConfirm(false)}
        loading={busy}
      />
    </AppScreen>
  );
}
