import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { branchesManageAPI } from '@/api/branchesManage';
import { AppScreen } from '@/components/layout';
import { ConfirmDialog } from '@/components/feedback';
import { AppBadge, AppButton, AppInput, AppListItem, AppSelect } from '@/components/ui';
import { ResourceList } from '@/components/lists';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractArray } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { asText } from '@/utils/format';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import type { BranchManageRow } from '@/types/branches';
import type { SelectOption } from '@/components/ui/AppSelect';

const STATUS_FILTER_OPTS: SelectOption[] = [
  { label: 'كل الحالات', value: 'all' },
  { label: 'نشط', value: 'active' },
  { label: 'غير نشط', value: 'inactive' },
];

export function BranchesListScreen({ navigation }: { navigation: any }) {
  const c = useColors();
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
    <AppScreen
      title="إدارة الفروع"
      subtitle={canManage ? 'إدارة الفروع والمخازن والخزائن' : 'عرض الفروع فقط'}
      scroll={false}
      headerRight={
        canManage ? <AppButton title="فرع جديد" onPress={() => navigation.navigate('BranchForm', {})} /> : undefined
      }
      onRefresh={() => void load(true)}
      refreshing={refreshing}
    >
      <View style={styles.filters}>
        <AppInput value={search} onChangeText={setSearch} placeholder="اسم، كود، موقع، مخزن…" returnKeyType="search" />
        <AppSelect label="الحالة" value={statusFilter} options={STATUS_FILTER_OPTS} onChange={setStatusFilter} />
      </View>

      <ResourceList
        data={filtered as unknown as Record<string, unknown>[]}
        loading={loading}
        refreshing={refreshing}
        error={error}
        onRefresh={() => void load(true)}
        emptyTitle="لا فروع مطابقة"
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => {
          const row = item as unknown as BranchManageRow;
          const inactive = row.status === 'inactive';
          return (
            <View style={[styles.rowWrap, { borderBottomColor: c.borderSubtle }]}>
              <AppListItem
                title={asText(row.name, 'فرع')}
                subtitle={`${asText(row.code)}${row.location ? ` • ${row.location}` : ''}`}
                meta={[row.default_warehouse?.name, row.default_vault?.name].filter(Boolean).join(' • ') || undefined}
                badge={
                  <AppBadge label={inactive ? 'غير نشط' : 'نشط'} tone={inactive ? 'warning' : 'success'} />
                }
                onPress={() => navigation.navigate('BranchDetail', { id: String(row.id) })}
                showChevron
              />
              {canManage ? (
                <View style={styles.actions}>
                  <ActionIcon
                    icon="settings"
                    color={c.accent}
                    onPress={() => navigation.navigate('BranchSettings', { id: String(row.id) })}
                  />
                  <ActionIcon icon="edit" color={c.text} onPress={() => navigation.navigate('BranchForm', { id: String(row.id) })} />
                  <ActionIcon
                    icon={inactive ? 'toggle-off' : 'toggle-on'}
                    color={inactive ? c.danger : c.success}
                    onPress={() => void toggleStatus(row)}
                  />
                  {!row.is_main ? (
                    <ActionIcon icon="delete" color={c.danger} onPress={() => setDeleteId(String(row.id))} />
                  ) : null}
                </View>
              ) : null}
            </View>
          );
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
    </AppScreen>
  );
}

function ActionIcon({
  icon,
  color,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  color: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionBtn} hitSlop={8}>
      <MaterialIcons name={icon} size={20} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  filters: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  rowWrap: { borderBottomWidth: 1 },
  actions: { ...flexRow, justifyContent: 'flex-end', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  actionBtn: { padding: 4 },
});
