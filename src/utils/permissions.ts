import type { User } from '@/types/api';

const unrestrictedRoles = ['Super Admin', 'owner'] as const;

export function hasPermission(user: User | null | undefined, permission?: string | string[]): boolean {
  if (!permission) return true;
  if (!user) return false;
  if (user.is_super_admin) return true;
  if (user.roles?.some((role) => unrestrictedRoles.includes(role as (typeof unrestrictedRoles)[number]))) return true;
  const wanted = Array.isArray(permission) ? permission : [permission];
  return wanted.some((item) => user.permissions?.includes(item));
}

export function hasFeature(user: User | null | undefined, feature?: string): boolean {
  if (!feature) return true;
  if (!user) return false;
  if (user.is_super_admin) return true;
  const plan = user.plan_access;
  if (!plan) return true;
  if (plan.can_operate === false) return false;
  const features = [...(plan.features ?? []), ...(plan.enabled_features ?? [])];
  if (features.length === 0) return true;
  return features.includes(feature);
}
