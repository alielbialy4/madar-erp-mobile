import MaterialIcons from '@expo/vector-icons/MaterialIcons';

/** Maps web sidebar `icon` strings to Material Icons (see `front/design-system/layouts/sidebar.tsx`). */
export const webSidebarIconMap: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'las la-tachometer-alt': 'dashboard',
  'ri-shopping-cart-line': 'point-of-sale',
  'las la-boxes': 'inventory-2',
  'ri-store-2-line': 'warehouse',
  'ri-barcode-line': 'qr-code',
  'ri-folder-line': 'folder',
  'ri-shopping-bag-line': 'shopping-bag',
  'ri-user-line': 'people',
  'ri-price-tag-3-line': 'local-offer',
  'ri-file-list-line': 'description',
  'ri-clipboard-fill': 'assignment',
  'ri-node-tree': 'account-tree',
  'ri-settings-line': 'settings',
  'ri-database-2-line': 'storage',
  'ri-file-list-3-line': 'assessment',
  'ri-printer-line': 'print',
  'ri-truck-line': 'local-shipping',
  'ri-receipt-line': 'receipt-long',
  'ri-bank-line': 'payments',
  'ri-gift-line': 'card-giftcard',
  'ri-building-line': 'business',
  'ri-layout-grid-line': 'grid-view',
  'ri-safe-2-line': 'account-balance-wallet',
  'ri-time-line': 'schedule',
  'ri-restaurant-line': 'restaurant',
  'ri-shield-user-line': 'admin-panel-settings',
  'ri-arrow-go-back-line': 'undo',
  'ri-money-dollar-circle-line': 'attach-money',
};

export function resolveSidebarIcon(icon?: string): keyof typeof MaterialIcons.glyphMap {
  if (!icon) return 'folder';
  return webSidebarIconMap[icon] ?? 'folder';
}
