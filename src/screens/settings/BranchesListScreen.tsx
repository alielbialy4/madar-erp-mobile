import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { branchesManageAPI } from '@/api/branchesManage';
import { ListScreenLayout } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppDomainCard, AppSelect, AppSwipeRow } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { asText } from '@/utils/format';
import type { BranchManageRow } from '@/types/branches';
import type { SelectOption } from '@/components/ui/AppSelect';

const STATUS_FILTER_OPTS: SelectOption[] = [
  { label: 'كل الحالات', value: 'all' },
  { label: 'نشط', value: 'active' },
  { label: 'غير نشط', value: 'inactive' },
];

export function BranchesListScreen({ navigation }: { navigation: any }) {
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_branches');

  const [items, setItems] = useState<BranchManageRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const res = await branchesManageAPI.list({ per_page: 200 } as never);
      setItems(extractArray<BranchManageRow>(res));
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    let rows = items;
    if (statusFilter !== 'all') {
      rows = rows.filter((b) => b.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        (b.location ?? '').toLowerCase().includes(q) ||
        (b.default_warehouse?.name ?? '').toLowerCase().includes(q) ||
        (b.default_vault?.name ?? '').toLowerCase().includes(q),
    );
  }, [items, search, statusFilter]);

  const toggleStatus = async (branch: BranchManageRow) => {
    if (!canManage) return;
    const next = branch.status === 'active' ? 'inactive' : 'active';
    setBusy(true);
    try {
      await branchesManageAPI.updateStatus(branch.id, next);
      await load(true);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteId || !canManage) return;
    setBusy(true);
    try {
      await branchesManageAPI.delete(deleteId);
      setDeleteId(null);
      await load(true);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ListScreenLayout
      title="إدارة الفروع"
      subtitle={canManage ? 'إدارة الفروع والمخازن والخزائن' : 'عرض الفروع فقط'}
      searchValue={search}
      onSearchChange={setSearch}
      searchPlaceholder="اسم، كود، موقع، مخزن…"
      onRefresh={() => void load(true)}
      refreshing={refreshing}
      fab={canManage ? { onPress: () => navigation.navigate('BranchForm', {}), label: 'فرع جديد' } : undefined}
      filters={<AppSelect label="الحالة" value={statusFilter} options={STATUS_FILTER_OPTS} onChange={setStatusFilter} />}
      hero={{
        eyebrow: 'الإعدادات',
        title: 'إدارة الفروع',
        subtitle: canManage ? 'إدارة الفروع والمخازن والخزائن' : 'عرض الفروع فقط',
        stats: [{ label: 'الفروع', value: filtered.length }],
        compact: true,
      }}
    >
      <ResourceList
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void load(true)}
        emptyTitle="لا فروع مطابقة"
        emptyCtaLabel={canManage ? 'فرع جديد' : undefined}
        onEmptyCta={canManage ? () => navigation.navigate('BranchForm', {}) : undefined}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const row = item as unknown as BranchManageRow;
          const inactive = row.status === 'inactive';
          const card = (
            <AppDomainCard
              title={asText(row.name, 'فرع')}
              subtitle={`${asText(row.code)}${row.location ? ` • ${row.location}` : ''}`}
              meta={[row.default_warehouse?.name, row.default_vault?.name].filter(Boolean).join(' • ') || undefined}
              badgeLabel={inactive ? 'غير نشط' : 'نشط'}
              badgeTone={inactive ? 'warning' : 'success'}
              leadingIcon="store"
              onPress={() => navigation.navigate('BranchDetail', { id: String(row.id) })}
            />
          );
          if (!canManage) return card;
          const swipeActions = [
            { label: 'إعدادات', icon: 'settings' as const, onPress: () => navigation.navigate('BranchSettings', { id: String(row.id) }) },
            { label: 'تعديل', icon: 'edit' as const, onPress: () => navigation.navigate('BranchForm', { id: String(row.id) }) },
            { label: inactive ? 'تفعيل' : 'تعطيل', icon: (inactive ? 'toggle-off' : 'toggle-on') as 'toggle-off' | 'toggle-on', onPress: () => void toggleStatus(row) },
            ...(!row.is_main ? [{ label: 'حذف', icon: 'delete' as const, tone: 'danger' as const, onPress: () => setDeleteId(String(row.id)) }] : []),
          ];
          return <AppSwipeRow rightActions={swipeActions}>{card}</AppSwipeRow>;
        }}
      />

      <ConfirmDialog
        visible={!!deleteId}
        title="حذف الفرع"
        message="هل أنت متأكد من حذف هذا الفرع؟"
        confirmLabel="حذف"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
        loading={busy}
      />
    </ListScreenLayout>
  );
}
