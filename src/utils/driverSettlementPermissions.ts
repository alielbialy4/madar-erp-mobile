import type { User } from '@/types/api';
import { hasPermission } from './permissions';

/** POST /driver-settlements is protected by the backend's `delivery_settle` permission. */
export function canCreateDriverSettlement(user: User | null | undefined): boolean {
  return hasPermission(user, 'delivery_settle');
}
