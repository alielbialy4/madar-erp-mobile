import React, { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { branchesManageAPI } from '@/api/branchesManage';
import { AppScreen } from '@/components/layout';
import {
  AppButton,
  AppCard,
  AppListItem,
  AppSectionHeader,
  AppStatCard,
  AppTabs,
} from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { useAuthStore } from '@/store/authStore';
import { hasPermission } from '@/utils/permissions';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { BranchManageRow, BranchSummary } from '@/types/branches';

const DETAIL_TABS = [
  { key: 'overview', label: 'نظرة عامة' },
  { key: 'warehouses', label: 'المخزن' },
  { key: 'vaults', label: 'الخزائن' },
  { key: 'halls', label: 'القاعات' },
  { key: 'sections', label: 'الأقسام' },
];

export function BranchDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const id = String(route.params?.id ?? '');
  const c = useColors();
  const user = useAuthStore((s) => s.user);
  const canManage = hasPermission(user, 'manage_branches');

  const [branch, setBranch] = useState<BranchManageRow | null>(null);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        branchesManageAPI.get(id),
        branchesManageAPI.summary(id).catch(() => null),
      ]);
      setBranch(extractData<BranchManageRow>(bRes) ?? null);
      setSummary(sRes ? (extractData<BranchSummary>(sRes) ?? null) : null);
      setError(null);
    } catch (err) {
      setError(normalizeApiError(err).message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const statusLabel = branch?.status === 'inactive' ? 'غير نشط' : 'نشط';

  const renderTab = () => {
    if (!branch) return null;
    switch (activeTab) {
      case 'overview':
        return (
          <AppCard>
            <AppListItem title="الكود" subtitle={branch.code} />
            <AppListItem title="الموقع" subtitle={branch.location ?? '—'} />
            <AppListItem title="العنوان" subtitle={branch.address ?? '—'} />
            <AppListItem title="هاتف" subtitle={branch.contact_info?.phone ?? branch.phone ?? '—'} />
            <AppListItem title="بريد" subtitle={branch.contact_info?.email ?? branch.email ?? '—'} />
            <AppListItem title="المخزن الافتراضي" subtitle={branch.default_warehouse?.name ?? '—'} />
            <AppListItem title="الخزينة الافتراضية" subtitle={branch.default_vault?.name ?? '—'} />
            <AppListItem title="المخازن" subtitle={String(branch.warehouses_count ?? 0)} />
            <AppListItem title="الخزائن" subtitle={String(branch.vaults_count ?? 0)} />
            <AppListItem title="الطاولات" subtitle={String(branch.dining_tables_count ?? 0)} />
            <AppListItem title="الموظفين" subtitle={String(branch.users_count ?? 0)} />
            <AppListItem title="فرع رئيسي" subtitle={branch.is_main ? 'نعم' : 'لا'} />
          </AppCard>
        );
      case 'warehouses': {
        const w = branch.default_warehouse ?? branch.warehouse ?? branch.warehouses?.[0];
        if (!w) return <Text style={{ color: c.textMuted }}>لا يوجد مخزن مرتبط</Text>;
        return (
          <AppCard>
            <AppListItem title={w.name} subtitle={w.code ?? '—'} meta={'status' in w ? String((w as { status?: string }).status ?? '') : undefined} />
          </AppCard>
        );
      }
      case 'vaults':
        if (!branch.vaults?.length) return <Text style={{ color: c.textMuted }}>لا توجد خزائن</Text>;
        return (
          <AppCard>
            {branch.vaults.map((v) => (
              <AppListItem key={v.id} title={v.name} subtitle={v.is_active ? 'نشطة' : 'غير نشطة'} />
            ))}
          </AppCard>
        );
      case 'halls':
        if (!branch.dining_halls?.length) return <Text style={{ color: c.textMuted }}>لا توجد قاعات</Text>;
        return (
          <AppCard>
            {branch.dining_halls.map((h) => (
              <AppListItem
                key={h.id}
                title={h.name}
                subtitle={`${(h.tables ?? []).length} طاولة`}
                meta={h.is_active ? 'نشطة' : 'غير نشطة'}
              />
            ))}
          </AppCard>
        );
      case 'sections':
        if (!branch.sections?.length) return <Text style={{ color: c.textMuted }}>لا توجد أقسام</Text>;
        return (
          <AppCard>
            {branch.sections.map((s) => (
              <AppListItem key={s.id} title={s.name} subtitle={s.type} meta={s.is_active ? 'نشط' : 'غير نشط'} />
            ))}
          </AppCard>
        );
      default:
        return null;
    }
  };

  return (
    <AppScreen
      title={branch?.name ?? 'فرع'}
      subtitle={`${branch?.code ?? ''} • ${statusLabel}`}
      onBack={navigation.goBack}
      onRefresh={() => void load()}
      refreshing={loading}
    >
      {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}

      {summary ? (
        <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md }}>
          <View style={{ width: '48%' }}>
            <AppStatCard label="مبيعات اليوم" value={money(summary.today_sales ?? 0)} />
          </View>
          <View style={{ width: '48%' }}>
            <AppStatCard label="طلبات اليوم" value={String(summary.today_orders ?? 0)} />
          </View>
          <View style={{ width: '48%' }}>
            <AppStatCard label="مبيعات الشهر" value={money(summary.month_sales ?? 0)} />
          </View>
          <View style={{ width: '48%' }}>
            <AppStatCard label="قيمة المخزون" value={money(summary.inventory_value ?? 0)} />
          </View>
        </View>
      ) : null}

      {canManage ? (
        <View style={{ ...flexRow, gap: spacing.sm, marginBottom: spacing.md, flexWrap: 'wrap' }}>
          <AppButton title="الإعدادات" variant="secondary" onPress={() => navigation.navigate('BranchSettings', { id })} />
          <AppButton title="تعديل" variant="secondary" onPress={() => navigation.navigate('BranchForm', { id })} />
        </View>
      ) : null}

      <AppSectionHeader title="تفاصيل الفرع" />
      <AppTabs tabs={DETAIL_TABS} activeKey={activeTab} onChange={setActiveTab} />
      <View style={{ marginTop: spacing.md }}>{renderTab()}</View>
    </AppScreen>
  );
}
