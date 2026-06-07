import type { MobileSidebarMenuItem } from './buildSidebarMenu';
import type { SidebarNavAction } from './sidebarNavMap';
import { webLinkToNav } from './sidebarNavMap';

export type MoreHubGroupId =
  | 'operations'
  | 'restaurant'
  | 'inventory'
  | 'purchases'
  | 'finance'
  | 'marketing'
  | 'reports'
  | 'admin';

export type MoreHubItem = {
  id: string;
  label: string;
  description?: string;
  icon: string;
  nav?: SidebarNavAction;
  disabled?: boolean;
  disabledReason?: string;
  badge?: 'قراءة' | 'جديد';
};

export type MoreHubGroup = {
  id: MoreHubGroupId;
  title: string;
  subtitle: string;
  items: MoreHubItem[];
};

const GROUP_META: Record<MoreHubGroupId, { title: string; subtitle: string }> = {
  operations: { title: 'العمليات', subtitle: 'عملاء، مرتجعات، مصروفات، توصيل' },
  restaurant: { title: 'المطعم والمطبخ', subtitle: 'صالات، مطبخ، نادل' },
  inventory: { title: 'المخزون', subtitle: 'أرصدة، حركات، تسويات، صلاحية' },
  purchases: { title: 'المشتريات والموردين', subtitle: 'فواتير، موردون، دفعات' },
  finance: { title: 'المالية والورديات', subtitle: 'خزن، ورديات، مدفوعات' },
  marketing: { title: 'التسويق', subtitle: 'كوبونات، عروض، بطاقات هدايا' },
  reports: { title: 'التقارير', subtitle: 'مركز تقارير مطابق للويب' },
  admin: { title: 'الإدارة والحساب', subtitle: 'إعدادات، موظفون، فروع، نشاط' },
};

/** Route → hub group (bottom tabs excluded) */
const ROUTE_GROUP: { prefix: string; group: MoreHubGroupId; description?: string }[] = [
  { prefix: '/customers', group: 'operations', description: 'قائمة وبحث العملاء' },
  { prefix: '/sales/returns', group: 'operations', description: 'مرتجعات المبيعات' },
  { prefix: '/expenses', group: 'operations', description: 'تسجيل ومتابعة المصروفات' },
  { prefix: '/delivery', group: 'operations', description: 'طلبات التوصيل' },
  { prefix: '/drivers', group: 'operations', description: 'إدارة السائقين' },
  { prefix: '/delivery-zones', group: 'operations', description: 'مناطق التوصيل' },
  { prefix: '/driver-settlements', group: 'operations', description: 'تسويات السائقين' },
  { prefix: '/delivery-finance', group: 'operations', description: 'ماليات التوصيل' },
  { prefix: '/sales/products', group: 'operations', description: 'مبيعات حسب المنتج' },
  { prefix: '/sales/layaway', group: 'operations', description: 'مبيعات التقسيط' },
  { prefix: '/dining-halls', group: 'restaurant', description: 'القاعات والطاولات' },
  { prefix: '/kitchen', group: 'restaurant', description: 'شاشة المطبخ KDS' },
  { prefix: '/waiter', group: 'restaurant', description: 'وضع النادل — مرجع صالات' },
  { prefix: '/inventory', group: 'inventory', description: 'نظرة عامة على المخزون' },
  { prefix: '/inventory/balances', group: 'inventory', description: 'أرصدة المخازن' },
  { prefix: '/inventory/warehouses', group: 'inventory', description: 'قائمة المخازن' },
  { prefix: '/inventory/movements', group: 'inventory', description: 'حركات المخزون' },
  { prefix: '/inventory/adjustments', group: 'inventory', description: 'تسوية كميات' },
  { prefix: '/inventory/transfers', group: 'inventory', description: 'تحويل بين المخازن' },
  { prefix: '/inventory/stock-counts', group: 'inventory', description: 'جرد المخزون' },
  { prefix: '/inventory/expiry', group: 'inventory', description: 'تنبيهات الصلاحية' },
  { prefix: '/inventory/reorder-rules', group: 'inventory', description: 'قواعد إعادة الطلب' },
  { prefix: '/inventory/requisitions', group: 'inventory', description: 'طلبات الصرف' },
  { prefix: '/raw-materials', group: 'inventory', description: 'المواد الخام' },
  { prefix: '/purchases', group: 'purchases', description: 'فواتير الشراء' },
  { prefix: '/purchases/returns', group: 'purchases', description: 'مرتجعات الشراء' },
  { prefix: '/suppliers', group: 'purchases', description: 'ملفات الموردين' },
  { prefix: '/supplier-payments', group: 'purchases', description: 'دفعات الموردين' },
  { prefix: '/shifts', group: 'finance', description: 'فتح وإغلاق الورديات' },
  { prefix: '/vaults', group: 'finance', description: 'أرصدة الخزن' },
  { prefix: '/vaults/transactions', group: 'finance', description: 'حركات الخزن' },
  { prefix: '/payments', group: 'finance', description: 'سجل المدفوعات' },
  { prefix: '/marketing/coupons', group: 'marketing', description: 'إدارة الكوبونات' },
  { prefix: '/marketing/promotions', group: 'marketing', description: 'العروض الترويجية' },
  { prefix: '/gift-cards', group: 'marketing', description: 'بطاقات الهدايا' },
  { prefix: '/notifications', group: 'admin', description: 'الإشعارات والتنبيهات' },
  { prefix: '/barcode-print', group: 'admin', description: 'طباعة الباركود' },
  { prefix: '/reports', group: 'reports', description: 'مركز التقارير' },
  { prefix: '/settings', group: 'admin', description: 'إعدادات النظام' },
  { prefix: '/employees', group: 'admin', description: 'الموظفون والصلاحيات' },
  { prefix: '/branches', group: 'admin', description: 'فروع المستأجر' },
  { prefix: '/activity-logs', group: 'admin', description: 'سجل النشاط' },
  { prefix: '/backup', group: 'admin', description: 'نسخ احتياطي — ويب فقط' },
];

const BOTTOM_TAB_ROUTES = new Set(['/', '/pos', '/products', '/sales', '/categories']);

function groupForLink(link?: string): MoreHubGroupId | null {
  if (!link || BOTTOM_TAB_ROUTES.has(link)) return null;
  const match = ROUTE_GROUP.find((r) => link === r.prefix || link.startsWith(`${r.prefix}/`));
  return match?.group ?? null;
}

function descriptionForLink(link?: string): string | undefined {
  return ROUTE_GROUP.find((r) => link === r.prefix || link?.startsWith(`${r.prefix}/`))?.description;
}

export function buildMoreHubGroups(menuItems: MobileSidebarMenuItem[]): MoreHubGroup[] {
  const buckets = new Map<MoreHubGroupId, MoreHubItem[]>();

  const add = (group: MoreHubGroupId, item: MoreHubItem) => {
    const list = buckets.get(group) ?? [];
    if (!list.some((x) => x.id === item.id)) list.push(item);
    buckets.set(group, list);
  };

  const walk = (items: MobileSidebarMenuItem[]) => {
    for (const item of items) {
      if (item.type === 'section') continue;
      if (item.subItems?.length) {
        walk(item.subItems);
        continue;
      }
      const link = item.link;
      const group = groupForLink(link);
      if (!group) continue;
      const nav = item.nav ?? (link ? webLinkToNav(link, item.label) : undefined);
      const isParity = nav?.kind === 'more' && nav.screen === 'ParityModule';
      add(group, {
        id: item.id ?? link ?? item.label,
        label: item.label,
        description: descriptionForLink(link),
        icon: item.icon ?? 'ri-file-list-line',
        nav,
        badge: isParity ? 'قراءة' : undefined,
      });
    }
  };

  walk(menuItems);

  const order: MoreHubGroupId[] = [
    'operations',
    'restaurant',
    'inventory',
    'purchases',
    'finance',
    'marketing',
    'reports',
    'admin',
  ];

  return order
    .filter((id) => (buckets.get(id)?.length ?? 0) > 0)
    .map((id) => ({
      id,
      title: GROUP_META[id].title,
      subtitle: GROUP_META[id].subtitle,
      items: buckets.get(id) ?? [],
    }));
}
