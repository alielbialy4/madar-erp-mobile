import type { ComponentProps } from 'react';
import type MaterialIcons from '@expo/vector-icons/MaterialIcons';

type IconName = ComponentProps<typeof MaterialIcons>['name'];

export type ModuleIconKey =
  | 'dashboard'
  | 'products'
  | 'sales'
  | 'pos'
  | 'inventory'
  | 'purchases'
  | 'suppliers'
  | 'customers'
  | 'expenses'
  | 'vaults'
  | 'delivery'
  | 'kitchen'
  | 'dining'
  | 'reports'
  | 'settings'
  | 'coupons'
  | 'refunds'
  | 'notifications'
  | 'users'
  | 'promotions';

export const moduleIcons: Record<ModuleIconKey, IconName> = {
  dashboard: 'dashboard',
  products: 'inventory-2',
  sales: 'receipt-long',
  pos: 'point-of-sale',
  inventory: 'warehouse',
  purchases: 'shopping-cart',
  suppliers: 'local-shipping',
  customers: 'people',
  expenses: 'payments',
  vaults: 'account-balance-wallet',
  delivery: 'delivery-dining',
  kitchen: 'restaurant',
  dining: 'table-restaurant',
  reports: 'assessment',
  settings: 'settings',
  coupons: 'confirmation-number',
  refunds: 'undo',
  notifications: 'notifications',
  users: 'admin-panel-settings',
  promotions: 'campaign',
};

export type StatusIconKey = 'pending' | 'active' | 'completed' | 'cancelled' | 'draft';

export const statusIcons: Record<StatusIconKey, IconName> = {
  pending: 'schedule',
  active: 'play-circle-outline',
  completed: 'check-circle',
  cancelled: 'cancel',
  draft: 'edit-note',
};
