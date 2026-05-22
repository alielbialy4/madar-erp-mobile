import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { hasFeature, hasPermission } from '@/utils/permissions';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const can = useCallback(
    (permission?: string | string[]) => hasPermission(user, permission),
    [user],
  );
  const checkFeature = useCallback(
    (feature?: string) => hasFeature(user, feature),
    [user],
  );
  return {
    user,
    can,
    hasFeature: checkFeature,
  };
}
