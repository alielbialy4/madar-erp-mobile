import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { AppBottomSheet, AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppInput, AppListItem, AppStatCard } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { giftCardsAPI } from '@/api/giftCards';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useListResource } from '@/hooks/useListResource';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { asText, money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { spacing } from '@/constants/spacing';

export function GiftCardsScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const branch = useBranchStore((s) => s.activeBranch);
  const canManage = hasPermission(user, 'manage_gift_cards');
  const [query, setQuery] = useState('');
  const debounced = useDebouncedValue(query);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [balance, setBalance] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { items, loading, refreshing, error: listError, refresh, loadMore } = useListResource<Record<string, unknown>>(
    (p) => giftCardsAPI.getAll(p) as never,
    debounced ? { search: debounced } : {},
  );

  const loadStats = useCallback(() => {
    void giftCardsAPI.statistics().then((res) => setStats(extractData(res) as Record<string, unknown> | null)).catch(() => setStats(null));
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const createCard = async () => {
    if (!canManage) {
      setError('ليس لديك صلاحية لتنفيذ هذه العملية.');
      return;
    }
    const amt = Number(balance);
    if (!Number.isFinite(amt) || amt <= 0) {
      setError('أدخل رصيداً موجباً');
      return;
    }
    setBusy(true);
    try {
      await giftCardsAPI.create({ initial_balance: amt, branch_id: branch?.id ?? null, ...(code.trim() ? { code: code.trim() } : {}) });
      setCreateOpen(false);
      setBalance('');
      setCode('');
      void refresh();
      loadStats();
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppScreen title="بطاقات الهدايا" scroll={false} headerRight={canManage ? <AppButton title="إنشاء" onPress={() => setCreateOpen(true)} /> : undefined}>
      {stats ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
          <View style={{ flex: 1, minWidth: 120 }}>
            <AppStatCard label="نشطة" value={String(stats.active_count ?? stats.active ?? '—')} tone="success" />
          </View>
          <View style={{ flex: 1, minWidth: 120 }}>
            <AppStatCard label="رصيد متبقٍ" value={money(stats.total_balance ?? stats.total_remaining ?? 0)} />
          </View>
        </View>
      ) : null}
      <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm }}>
        <AppInput value={query} onChangeText={setQuery} placeholder="بحث بالكود..." />
        <AppButton title="تقرير بطاقات الهدايا" variant="ghost" onPress={() => navigation.navigate('ReportViewer', { reportId: 'gift-cards' })} />
      </View>
      <ResourceList
        data={items}
        loading={loading}
        refreshing={refreshing}
        error={listError}
        onRefresh={refresh}
        onEndReached={loadMore}
        emptyTitle="لا بطاقات"
        keyExtractor={(item, i) => String(item.id ?? i)}
        renderItem={({ item }) => (
          <AppListItem
            title={asText(item.code)}
            subtitle={`${money(item.remaining_balance ?? 0)} / ${money(item.initial_balance ?? 0)}`}
            badge={<AppBadge label={String(item.status ?? '—')} tone={item.status === 'active' ? 'success' : 'danger'} />}
            onPress={() => navigation.navigate('GiftCardDetail', { id: String(item.id) })}
          />
        )}
      />
      <AppBottomSheet visible={createOpen} onClose={() => setCreateOpen(false)}>
        <View style={{ gap: spacing.md }}>
          <AppInput label="الرصيد" value={balance} onChangeText={setBalance} keyboardType="decimal-pad" />
          <AppInput label="كود (اختياري)" value={code} onChangeText={setCode} />
          {error ? <AppInput label="خطأ" value={error} editable={false} /> : null}
          <AppButton title="إنشاء" onPress={() => void createCard()} loading={busy} />
        </View>
      </AppBottomSheet>
    </AppScreen>
  );
}
