import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';

const BRANCH_SCOPE_HINT =
  'وضع الفرع: العمليات والعرض حسب الفرع النشط. لإدارة دليل المخازن انتقل إلى الوضع العام.';
const GLOBAL_SCOPE_HINT = 'الوضع العام: عرض وإدارة المخازن عبر كل الفروع المسموح بها.';
const BRANCH_DIRECTORY_HINT =
  'وضع الفرع: عرض المخازن فقط. للإضافة والتعديل انتقل إلى الوضع العام.';

export function useInventoryScope() {
  const user = useAuthStore((s) => s.user);
  const viewMode = useBranchStore((s) => s.viewMode);
  const activeBranch = useBranchStore((s) => s.activeBranch);
  const isGlobalView = viewMode === 'global';

  return useMemo(() => {
    const canManageDirectory = hasPermission(user, 'manage_inventory') && isGlobalView;
    const canOperateDocuments = hasPermission(user, 'manage_inventory');
    const effectiveBranchId = !isGlobalView ? activeBranch?.id ?? null : null;
    const scopeHint = isGlobalView ? GLOBAL_SCOPE_HINT : BRANCH_SCOPE_HINT;
    const directoryReadOnlyHint = isGlobalView ? null : BRANCH_DIRECTORY_HINT;

    return {
      isGlobalView,
      isBranchView: !isGlobalView,
      effectiveBranchId,
      canManageDirectory,
      canOperateDocuments,
      scopeHint,
      directoryReadOnlyHint,
    };
  }, [user, isGlobalView, activeBranch?.id]);
}
