import React from 'react';
import { StyleSheet } from 'react-native';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppButton, AppListItem } from '@/components/ui';
import { MadarSection, MadarSurface } from '@/components/madar';
import { AppEmptyState } from '@/components/feedback';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { canUseGlobalView } from '@/utils/permissions';
import { spacing } from '@/constants/spacing';
import { normalizeApiError } from '@/utils/errors';

export function BranchSwitcherScreen({ onDone }: { onDone?: () => void }) {
  const user = useAuthStore((state) => state.user);
  const branches = useBranchStore((state) => state.branches);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const viewMode = useBranchStore((state) => state.viewMode);
  const loading = useBranchStore((state) => state.loading);
  const switchBranch = useBranchStore((state) => state.switchBranch);
  const loadBranches = useBranchStore((state) => state.loadBranches);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const handleSwitch = async (branchId: string | null) => {
    setError(null);
    try {
      await switchBranch(branchId);
      onDone?.();
    } catch (err) {
      setError(normalizeApiError(err).message);
    }
  };

  return (
    <AppScreen title="اختيار الفرع" subtitle="حدد سياق العمل قبل العمليات الحساسة" refreshing={loading} onRefresh={loadBranches}>
      {error ? <AppBadge label={error} tone="danger" /> : null}
      <MadarSection title="الفروع المتاحة">
        <MadarSurface style={styles.card} padded={false}>
        {branches.length === 0 ? <AppEmptyState title="لا توجد فروع متاحة" message="تأكد من صلاحيات المستخدم أو إعدادات الفروع." /> : null}
        {branches.map((branch) => (
          <AppListItem
            key={branch.id}
            title={branch.name}
            subtitle={branch.code ? `الكود: ${branch.code}` : undefined}
            badge={activeBranch?.id === branch.id && viewMode === 'branch' ? <AppBadge label="نشط" tone="success" /> : undefined}
            onPress={() => handleSwitch(branch.id)}
          />
        ))}
        </MadarSurface>
      </MadarSection>
      {canUseGlobalView(user) ? (
        <AppButton title="التحويل إلى العرض العام" variant="secondary" onPress={() => handleSwitch(null)} />
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md },
});
