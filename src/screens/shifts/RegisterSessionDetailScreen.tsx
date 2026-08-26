import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { posRegistersAPI, type MobileRegisterSession } from '@/api/posRegisters';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner } from '@/components/feedback';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppText as Text } from '@/components/ui';
import { MadarSection } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';

const money = (value: unknown) =>
  value === null || value === undefined || value === ''
    ? '—'
    : Number(value).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const statusLabel = (status: string) => ({ open: 'مفتوحة', closed: 'مغلقة' })[status] ?? status;
const statusTone = (status: string): 'success' | 'info' | 'neutral' =>
  status === 'open' ? 'info' : status === 'closed' ? 'success' : 'neutral';

type MetricEntry = [string, string | boolean | null];

function metricLabel(key: string): string {
  const labels: Record<string, string> = {
    opening_cash: 'نقدية الافتتاح',
    cash_sales: 'المبيعات نقداً',
    card_tips: 'إكراميات البطاقات',
    refunds: 'المرتجعات',
    payouts: 'مدفوعات صادرة',
    cash_movements_in: 'حركات نقدية واردة',
    cash_movements_out: 'حركات نقدية صادرة',
    expected_cash: 'النقد المتوقع',
    counted_cash: 'النقد المعدود',
    variance: 'الفرق',
    deposits: 'إيداعات',
    withdrawals: 'مسحوبات',
  };
  return labels[key] ?? key;
}

const INFLOW_KEYS = new Set([
  'opening_cash',
  'cash_sales',
  'cash_movements_in',
  'deposits',
]);
const OUTFLOW_KEYS = new Set(['refunds', 'payouts', 'cash_movements_out', 'withdrawals']);

export function RegisterSessionDetailScreen({ route, navigation }: { route: { params: { id: string } }; navigation: any }) {
  const c = useColors();
  const user = useAuthStore((state) => state.user);
  const canView = hasPermission(user, [
    'view_register_session_reconciliation',
    'access_admin_routes',
    'manage_shifts',
  ]);
  const sessionId = route.params.id;

  const [session, setSession] = useState<MobileRegisterSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setSession(await posRegistersAPI.getSession(sessionId));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    void load();
  }, [load]);

  const metrics = useMemo<EntryGroups>(() => {
    const raw = (session as { metrics?: Record<string, string | boolean | null> | null } | null)?.metrics ?? null;
    if (!raw) return { inflow: [], outflow: [], other: [] };
    const inflow: MetricEntry[] = [];
    const outflow: MetricEntry[] = [];
    const other: MetricEntry[] = [];
    for (const [key, value] of Object.entries(raw)) {
      const entry: MetricEntry = [key, value];
      if (INFLOW_KEYS.has(key)) inflow.push(entry);
      else if (OUTFLOW_KEYS.has(key)) outflow.push(entry);
      else other.push(entry);
    }
    return { inflow, outflow, other };
  }, [session]);

  if (!canView) {
    return (
      <ListScreenLayout title="تفاصيل جلسة الدرج" subtitle="جلسة صندوق النقد">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية متابعة جلسات الأدراج." />
      </ListScreenLayout>
    );
  }

  const varianceValue = session?.variance ?? session?.expected_cash_snapshot ?? null;
  const severity = (session as { variance_severity?: string | null } | null)?.variance_severity ?? null;
  const numericVariance = Number(varianceValue ?? 0);
  const isOpen = session?.status === 'open';

  return (
    <ListScreenLayout title="تفاصيل جلسة الدرج" subtitle={session?.register ? `${session.register.code ?? ''} ${session.register.name ?? ''}` : undefined}>
      {error ? <AppBanner tone="danger" message={error} /> : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {isOpen ? (
          <AppBanner tone="warning" message="الجلسة مفتوحة — العد يكون أعمى عن النقد المتوقع حتى الإغلاق." />
        ) : null}

        {session ? (
          <>
            <View style={styles.badgeRow}>
              <AppBadge label={statusLabel(session.status)} tone={statusTone(session.status)} />
              {(session as { needs_reconciliation_review?: boolean } | null)?.needs_reconciliation_review ? (
                <AppBadge label="تحتاج مراجعة" tone="warning" />
              ) : null}
              {(session as { forced_close?: boolean } | null)?.forced_close ? (
                <AppBadge label="إغلاق قسري" tone="danger" />
              ) : null}
            </View>

            <MadarSection title="بيانات الجلسة">
              <View style={{ gap: spacing.xs }}>
                <InfoRow label="الكاشير" value={session.cashier?.name ?? '—'} />
                <InfoRow label="الحالة" value={statusLabel(session.status)} />
                <InfoRow label="معرف الجلسة" value={session.uuid ?? session.id ?? '—'} mono />
              </View>
            </MadarSection>

            <MadarSection title="التسوية">
              <View style={{ gap: spacing.xs }}>
                <InfoRow label="المتوقع" value={money(session.expected_cash ?? session.expected_cash_snapshot)} />
                <InfoRow label="المعدود" value={isOpen ? '—' : money((session as { counted_cash?: string | null }).counted_cash)} />
                <InfoRow
                  label="الفرق"
                  value={isOpen ? '—' : money(varianceValue)}
                  tone={
                    !isOpen && numericVariance === 0
                      ? 'positive'
                      : numericVariance < 0
                        ? 'negative'
                        : numericVariance > 0
                          ? 'warning'
                          : undefined
                  }
                />
                {!isOpen && severity ? (
                  <InfoRow
                    label="الخطورة"
                    value={({ ok: 'مقبول', warning: 'تحذير', critical: 'حرج' } as Record<string, string>)[severity] ?? severity}
                  />
                ) : null}
              </View>
            </MadarSection>

            {metrics.inflow.length > 0 || metrics.outflow.length > 0 || metrics.other.length > 0 ? (
              <MadarSection title="حركة النقد">
                <View style={{ gap: spacing.xs }}>
                  {metrics.inflow.map(([key, value]) => (
                    <InfoRow key={`in-${key}`} label={metricLabel(key)} value={typeof value === 'boolean' ? value ? 'نعم' : 'لا' : money(value)} tone="positive" />
                  ))}
                  {metrics.outflow.map(([key, value]) => (
                    <InfoRow key={`out-${key}`} label={metricLabel(key)} value={typeof value === 'boolean' ? value ? 'نعم' : 'لا' : money(value)} tone="negative" />
                  ))}
                  {metrics.other.map(([key, value]) => (
                    <InfoRow key={`o-${key}`} label={metricLabel(key)} value={typeof value === 'boolean' ? value ? 'نعم' : 'لا' : money(value)} />
                  ))}
                </View>
              </MadarSection>
            ) : null}

            <AppButton title="تحديث" variant="outline" onPress={() => void load()} loading={loading} />
          </>
        ) : (
          !loading ? <AppBanner tone="danger" message="تعذر تحميل الجلسة." /> : null
        )}
      </ScrollView>
    </ListScreenLayout>
  );
}

type EntryGroups = {
  inflow: Array<[string, string | boolean | null]>;
  outflow: Array<[string, string | boolean | null]>;
  other: Array<[string, string | boolean | null]>;
};

function InfoRow({ label, value, mono, tone }: { label: string; value: string; mono?: boolean; tone?: 'positive' | 'negative' | 'warning' }) {
  const c = useColors();
  const toneColor =
    tone === 'positive' ? c.metricPositive
      : tone === 'negative' ? c.metricNegative
        : tone === 'warning' ? c.warning
          : undefined;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[mono ? styles.mono : undefined, toneColor ? { color: toneColor } : undefined]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  infoRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.15)',
  },
  infoLabel: { flexShrink: 1 },
  mono: { fontVariant: ['tabular-nums'] },
});
