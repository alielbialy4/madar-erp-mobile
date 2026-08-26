import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { posRegistersAPI, type RegisterReconciliationAdjustment } from '@/api/posRegisters';
import { ListScreenLayout } from '@/components/layout';
import { AppBanner, useToast } from '@/components/feedback';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppButton, AppInput, AppText as Text } from '@/components/ui';
import { MadarSection } from '@/components/madar';
import { useAuthStore } from '@/store/authStore';
import { normalizeApiError } from '@/utils/errors';
import { hasPermission } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';

const money = (value: unknown) =>
  value === null || value === undefined || value === ''
    ? '—'
    : Number(value).toLocaleString('ar-EG', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function RegisterReconciliationScreen({ navigation }: { navigation: any }) {
  const toast = useToast();
  const user = useAuthStore((state) => state.user);
  const canView = hasPermission(user, [
    'view_register_session_reconciliation',
    'access_admin_routes',
    'manage_shifts',
  ]);

  const [items, setItems] = useState<RegisterReconciliationAdjustment[]>([]);
  const [openCount, setOpenCount] = useState(0);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const data = await posRegistersAPI.listReconciliationAdjustments('open');
      setItems(data.items ?? []);
      setOpenCount(data.open_count ?? 0);
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [canView, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const resolve = async (item: RegisterReconciliationAdjustment) => {
    setResolvingId(item.id);
    try {
      await posRegistersAPI.resolveReconciliationAdjustment(item.id, notes[item.id] || '');
      toast.success('تمت مراجعة التسوية');
      await load();
    } catch (err) {
      toast.error(normalizeApiError(err).message);
    } finally {
      setResolvingId(null);
    }
  };

  if (!canView) {
    return (
      <ListScreenLayout title="مركز مراجعة التسويات" subtitle="مراجعة فروقات المزامنة المتأخرة">
        <AppBanner tone="warning" message="تتطلب هذه الشاشة صلاحية متابعة جلسات الأدراج." />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title="مركز مراجعة التسويات"
      subtitle="فروقات المزامنة المتأخرة تُضاف للجلسة دون إعادة كتابة لحظة الإغلاق"
      onRefresh={() => void load()}
      refreshing={loading}
      hero={{
        eyebrow: "الورديات",
        title: 'مراجعة الفروقات',
        subtitle: `${openCount} تسوية مفتوحة`,
        compact: true,
      }}
    >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xxl }} showsVerticalScrollIndicator={false}>
        {!loading && items.length === 0 ? (
          <AppBanner tone="success" message="لا توجد تسويات مزامنة متأخرة بحاجة لمراجعة." />
        ) : null}

        {items.map((item) => (
          <MadarSection
            key={item.id}
            title={item.register?.code ? `درج ${item.register.code}` : 'درج'}
            action={<AppBadge label={item.review_status} tone="warning" />}
          >
            <View style={{ gap: spacing.sm }}>
              <Text>
                {item.cashier?.name ? `${item.cashier.name} · ` : ''}
                {item.direction} {money(item.amount)}
                {item.reason ? ` — ${item.reason}` : ''}
              </Text>
              <View style={styles.metaRow}>
                {item.expected_cash != null ? <AppBadge label={`متوقع ${money(item.expected_cash)}`} tone="neutral" /> : null}
                {item.counted_cash != null ? <AppBadge label={`معدود ${money(item.counted_cash)}`} tone="neutral" /> : null}
              </View>
              <AppButton
                title="عرض الجلسة"
                variant="outline"
                onPress={() => navigation.navigate('RegisterSessionDetail', { id: item.register_session_id })}
              />
              <AppInput
                label="ملاحظة المراجعة"
                value={notes[item.id] ?? ''}
                onChangeText={(v) => setNotes((prev) => ({ ...prev, [item.id]: v }))}
                placeholder="سبب القرار أو ملاحظة"
                multiline
              />
              <AppButton
                title="اعتماد المراجعة"
                onPress={() => void resolve(item)}
                loading={resolvingId === item.id}
                disabled={resolvingId !== null && resolvingId !== item.id}
              />
            </View>
          </MadarSection>
        ))}
      </ScrollView>
    </ListScreenLayout>
  );
}

const styles = StyleSheet.create({
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
});
