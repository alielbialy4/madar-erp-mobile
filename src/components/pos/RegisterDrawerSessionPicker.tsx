import React, { useEffect, useRef, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppBadge, AppText } from '@/components/ui';
import { AppBanner } from '@/components/feedback';
import { posRegistersAPI, type EligibleRegisterMoneySession } from '@/api/posRegisters';
import { usePermissions } from '@/hooks/usePermissions';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import {
  canSelectAnyRegisterDrawer,
  getActiveRegisterSessionId,
} from '@/services/storage/registerSessionContext';

export type RegisterDrawerAvailability = {
  loading: boolean;
  sessions: EligibleRegisterMoneySession[];
  requiredBlocked: boolean;
};

type Props = {
  visible?: boolean;
  saleId?: string | number | null;
  value: string;
  onChange: (sessionId: string, session: EligibleRegisterMoneySession | null) => void;
  hideWhenEmpty?: boolean;
  required?: boolean;
  onAvailabilityChange?: (info: RegisterDrawerAvailability) => void;
};

function requiredDrawerBlocked(input: {
  visible: boolean;
  required: boolean;
  hideWhenEmpty: boolean;
  loading: boolean;
  visibleCount: number;
  value?: string | null;
}): boolean {
  if (!input.visible) return false;
  if (!input.required || input.hideWhenEmpty) return false;
  if (input.loading) return true;
  return input.visibleCount === 0 || !input.value;
}

function registerTitle(session: EligibleRegisterMoneySession): string {
  const code = session.register?.code?.trim();
  const name = session.register?.name?.trim();
  if (code && name && code !== name) return `${code} · ${name}`;
  return name || code || '—';
}

export function RegisterDrawerSessionPicker({
  visible = true,
  saleId,
  value,
  onChange,
  hideWhenEmpty = false,
  required = false,
  onAvailabilityChange,
}: Props) {
  const c = useColors();
  const { user, can } = usePermissions();
  const [sessions, setSessions] = useState<EligibleRegisterMoneySession[]>([]);
  const [loading, setLoading] = useState(false);
  const onChangeRef = useRef(onChange);
  const onAvailabilityChangeRef = useRef(onAvailabilityChange);
  const valueRef = useRef(value);
  const canPickAny = canSelectAnyRegisterDrawer(
    (name) => can(name),
    Boolean(user?.is_super_admin),
  );

  useEffect(() => {
    onChangeRef.current = onChange;
    onAvailabilityChangeRef.current = onAvailabilityChange;
    valueRef.current = value;
  });

  useEffect(() => {
    if (!visible) {
      setSessions([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void posRegistersAPI.eligibleRefundSessions({
      sale_id: saleId != null ? String(saleId) : undefined,
    }).then(async (rows) => {
      if (cancelled) return;
      const list = rows || [];
      const actorId = user?.id != null ? Number(user.id) : null;
      const active = await getActiveRegisterSessionId();
      const visibleRows = canPickAny
        ? list
        : list.filter((row) => (
          (actorId != null && Number(row.cashier?.id) === actorId)
          || (active != null && row.uuid === active)
        ));
      setSessions(visibleRows);
      setLoading(false);

      const current = valueRef.current;
      if (current && visibleRows.some((row) => row.uuid === current)) return;
      const preferred = (active && visibleRows.find((row) => row.uuid === active))
        || (visibleRows.length === 1 ? visibleRows[0] : null);
      if (preferred) onChangeRef.current(preferred.uuid, preferred);
    }).catch(() => {
      if (cancelled) return;
      setSessions([]);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [canPickAny, saleId, user?.id, visible]);

  useEffect(() => {
    onAvailabilityChangeRef.current?.({
      loading: visible ? loading : false,
      sessions: visible ? sessions : [],
      requiredBlocked: requiredDrawerBlocked({
        visible,
        required,
        hideWhenEmpty,
        loading,
        visibleCount: sessions.length,
        value,
      }),
    });
  }, [hideWhenEmpty, loading, required, sessions, value, visible]);

  if (!visible) return null;
  if (hideWhenEmpty && !loading && sessions.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <AppText style={{ color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.label, ...textStart }}>
        درج النقدية
      </AppText>
      <AppText style={{ color: c.textMuted, fontSize: typography.caption, ...textStart }}>
        اختر جلسة مفتوحة. تُسجَّل الحركة على درج تلك الجلسة.
      </AppText>
      {loading ? (
        <AppText style={{ color: c.textMuted, fontSize: typography.caption }}>جاري تحميل الأدراج المفتوحة…</AppText>
      ) : sessions.length === 0 ? (
        <AppBanner tone="warning" message="لا توجد جلسات مفتوحة. افتح جلسة كاشير قبل الصرف من الدرج." />
      ) : (
        sessions.map((session) => {
          const selected = session.uuid === value;
          const isOwn = user?.id != null && Number(session.cashier?.id) === Number(user.id);
          return (
            <Pressable
              key={session.uuid}
              onPress={() => onChange(session.uuid, session)}
              style={{
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: selected ? c.accent : c.border,
                backgroundColor: selected ? c.accentSoft : c.surface,
                padding: spacing.md,
                gap: spacing.xs,
              }}
            >
              <View style={{ ...flexRow, justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <AppText style={{ color: c.text, fontFamily: fonts.bold, fontWeight: '700', ...textStart }}>
                    {registerTitle(session)}
                  </AppText>
                  <AppText style={{ color: c.textMuted, fontSize: typography.caption, ...textStart }}>
                    {session.drawer?.name || 'درج'} · {session.cashier?.name || 'كاشير'}
                  </AppText>
                </View>
                <AppBadge
                  label={isOwn ? 'جلستك' : 'مفتوحة'}
                  tone={isOwn ? 'success' : 'neutral'}
                />
              </View>
            </Pressable>
          );
        })
      )}
      {required && !loading && sessions.length > 0 && !value ? (
        <AppBanner tone="danger" message="اختر درجاً مفتوحاً" />
      ) : null}
    </View>
  );
}
