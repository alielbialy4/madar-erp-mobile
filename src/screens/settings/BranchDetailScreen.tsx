import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { branchesManageAPI } from '@/api/branchesManage';
import { ListScreenLayout } from '@/components/layout';
import { AppButton, AppListItem, AppSectionHeader } from '@/components/ui';
import { AttentionBand, DenseRow, MadarSection, MadarSurface, MetricBlock } from '@/components/madar';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { useBranchPrintSummary } from '@/hooks/useBranchPrintSummary';
import { useBranchStore } from '@/store/branchStore';
import { extractData } from '@/utils/data';
import { normalizeApiError } from '@/utils/errors';
import { money } from '@/utils/format';
import { spacing } from '@/constants/spacing';
import { flexRow } from '@/constants/layout';
import type { BranchManageRow, BranchSummary } from '@/types/branches';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';

type Props = NativeStackScreenProps<MoreStackParamList, 'BranchDetail'>;

export function BranchDetailScreen({ route, navigation }: Props) {
  const id = String(route.params?.id ?? '');
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const switchBranch = useBranchStore((s) => s.switchBranch);
  const printSummary = useBranchPrintSummary(id);

  const [branch, setBranch] = useState<BranchManageRow | null>(null);
  const [summary, setSummary] = useState<BranchSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bRes, sRes] = await Promise.all([
        branchesManageAPI.get(id),
        branchesManageAPI.summary(id).catch(() => null),
      ]);
      setBranch(extractData<BranchManageRow>(bRes) ?? null);
      setSummary(sRes ? extractData<BranchSummary>(sRes) ?? null : null);
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

  const isActivePos = activeBranch?.id === id;
  const statusLabel = branch?.status === 'inactive' ? 'غير نشط' : 'نشط';

  const statusLine = printSummary.loading
    ? 'جاري تحميل حالة الطباعة…'
    : [
        printSummary.hasDefaultReceipt
          ? `إيصال: ${printSummary.defaultReceiptName}`
          : '⚠ لم تُحدَّد طابعة إيصال',
        printSummary.autoPrintReceipt ? 'طباعة تلقائية ✓' : 'طباعة يدوية',
        printSummary.enableKitchenPrint ? 'مطبخ ✓' : 'مطبخ ✗',
        `${printSummary.printerCount} طابعة`,
      ].join(' · ');

  if (loading && !branch) {
    return (
      <ListScreenLayout title="فرع" onBack={navigation.goBack}>
        <AppLoadingState message="جاري التحميل…" />
      </ListScreenLayout>
    );
  }

  if (error && !branch) {
    return (
      <ListScreenLayout title="فرع" onBack={navigation.goBack}>
        <AppErrorState message={error} onRetry={() => void load()} />
      </ListScreenLayout>
    );
  }

  return (
    <ListScreenLayout
      title={branch?.name ?? 'فرع'}
      subtitle={`${branch?.code ?? ''} · ${statusLabel}`}
      onBack={navigation.goBack}
      onRefresh={() => void load()}
      refreshing={loading}
      hero={{
        eyebrow: 'إدارة الفرع',
        title: branch?.name ?? 'فرع',
        subtitle: statusLine,
        compact: true,
      }}
    >
      <ScrollView contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.xl }}>
        {!isActivePos ? (
          <AppButton
            title="تفعيل كفرع POS النشط"
            variant="secondary"
            onPress={() => void switchBranch(id)}
          />
        ) : (
          <AttentionBand
            title="حالة الفرع"
            items={[{ id: 'active-pos', title: 'الفرع النشط في POS', tone: 'info' }]}
          />
        )}

        {summary ? (
          <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
            <MetricBlock label="مبيعات اليوم" value={money(summary.today_sales ?? 0)} level="B" style={{ width: '48%' }} />
            <MetricBlock label="طلبات اليوم" value={String(summary.today_orders ?? 0)} level="B" style={{ width: '48%' }} />
            <MetricBlock label="مبيعات الشهر" value={money(summary.month_sales ?? 0)} level="B" style={{ width: '48%' }} />
            <MetricBlock label="قيمة المخزون" value={money(summary.inventory_value ?? 0)} level="B" style={{ width: '48%' }} />
          </View>
        ) : null}

        <AppSectionHeader title="الإعدادات" />
        <MadarSurface padded={false}>
          <DenseRow
            primary="بيانات الفرع"
            secondary="الاسم، الكود، المخزن، الخزينة"
            onPress={() => navigation.navigate('BranchForm', { id })}
            showDivider
          />
          <DenseRow
            primary="إعدادات POS"
            secondary="ضريبة، رسوم خدمة، خصومات"
            onPress={() => navigation.navigate('BranchPosSettings', { id })}
            showDivider
          />
          <DenseRow
            primary="الطباعة والإيصالات"
            secondary={statusLine}
            onPress={() => navigation.navigate('BranchPrintHub', { id })}
            showDivider={false}
          />
        </MadarSurface>

        <AppButton
          title={showDetails ? 'إخفاء التفاصيل' : 'عرض تفاصيل الفرع'}
          variant="secondary"
          onPress={() => setShowDetails((v) => !v)}
        />

        {showDetails && branch ? (
          <MadarSection title="تفاصيل الفرع">
            <MadarSurface padded={false}>
              <AppListItem title="الموقع" subtitle={branch.location ?? '—'} />
              <AppListItem title="العنوان" subtitle={branch.address ?? '—'} />
              <AppListItem title="هاتف" subtitle={branch.contact_info?.phone ?? branch.phone ?? '—'} />
              <AppListItem title="بريد" subtitle={branch.contact_info?.email ?? branch.email ?? '—'} />
              <AppListItem title="المخزن الافتراضي" subtitle={branch.default_warehouse?.name ?? '—'} />
              <AppListItem title="الخزينة الافتراضية" subtitle={branch.default_vault?.name ?? '—'} />
              <AppListItem title="الطاولات" subtitle={String(branch.dining_tables_count ?? 0)} />
              <AppListItem title="الموظفين" subtitle={String(branch.users_count ?? 0)} />
              <AppListItem title="فرع رئيسي" subtitle={branch.is_main ? 'نعم' : 'لا'} />
            </MadarSurface>
          </MadarSection>
        ) : null}
      </ScrollView>
    </ListScreenLayout>
  );
}
