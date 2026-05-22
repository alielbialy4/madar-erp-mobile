import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasPermission } from '@/utils/permissions';

const BRANCH_READ_ONLY_HINT =
  'وضع الفرع: عرض المخازن فقط. للإضافة والتعديل انتقل إلى الوضع العام.';

/**
 * Warehouse directory mutations match web: allowed in global view with manage_inventory.
 */
export function useInventoryDirectoryAccess() {
  const user = useAuthStore((s) => s.user);
  const viewMode = useBranchStore((s) => s.viewMode);
  const isGlobalView = viewMode === 'global';

  return useMemo(() => {
    const canManage = hasPermission(user, 'manage_inventory') && isGlobalView;
    return {
      canManage,
      isGlobalView,
      readOnlyHint: isGlobalView ? null : BRANCH_READ_ONLY_HINT,
    };
  }, [user, isGlobalView]);
}
