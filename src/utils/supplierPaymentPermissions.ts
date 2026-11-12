import type { User } from '@/types/api';
import { hasPermission } from './permissions';

/** Matches POST /supplier-payments route permissions. */
export function canCreateSupplierPayment(user: User | null | undefined): boolean {
  return hasPermission(user, ['manage_supplier_payments', 'pay_supplier']);
}

/** Matches POST /supplier-payments/{id}/reverse route permissions. */
export function canReverseSupplierPayment(user: User | null | undefined): boolean {
  return hasPermission(user, 'reverse_supplier_payment');
}
