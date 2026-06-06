import type { MobileSidebarMenuItem } from './buildSidebarMenu';
import { navActionsEqual, sidebarActionKey, type SidebarNavAction } from './sidebarNavMap';

export type NavCatalogEntry = {
  id: string;
  label: string;
  section: string;
  icon?: string;
  nav: SidebarNavAction;
  webRoute?: string;
  keywords: string[];
};

const TAB_LABELS: Record<string, string> = {
  DashboardTab: 'الرئيسية',
  POSTab: 'نقطة البيع',
  ProductsTab: 'المنتجات',
  SalesTab: 'المبيعات',
  MoreTab: 'المزيد',
};

function catalogEntryId(item: MobileSidebarMenuItem): string {
  return item.id ?? item.link ?? `${sidebarActionKey(item.nav!)}:${item.label}`;
}

/** Leaf screens only — used by command palette and recent routes */
export function flattenNavCatalog(items: MobileSidebarMenuItem[]): NavCatalogEntry[] {
  const out: NavCatalogEntry[] = [];
  const seen = new Set<string>();

  const walk = (list: MobileSidebarMenuItem[], section: string) => {
    for (const item of list) {
      if (item.type === 'section') {
        walk(item.subItems ?? [], item.label);
        continue;
      }
      const sec = section || item.label;
      if (item.subItems?.length) {
        walk(item.subItems, sec);
        continue;
      }
      if (!item.nav) continue;

      const id = catalogEntryId(item);
      if (seen.has(id)) continue;
      seen.add(id);

      const tabLabel = item.nav.kind === 'tab' ? TAB_LABELS[item.nav.tab] : undefined;
      out.push({
        id,
        label: item.label,
        section: sec,
        icon: item.icon,
        nav: item.nav,
        webRoute: item.link,
        keywords: [item.label, sec, item.link ?? '', tabLabel ?? ''].filter(Boolean).map((k) => k.toLowerCase()),
      });
    }
  };

  walk(items, 'القائمة');
  return out;
}

export function findCatalogEntry(entries: NavCatalogEntry[], action: SidebarNavAction): NavCatalogEntry | undefined {
  return entries.find((entry) => navActionsEqual(entry.nav, action));
}

export function filterNavCatalog(entries: NavCatalogEntry[], query: string): NavCatalogEntry[] {
  const q = query.trim().toLowerCase();
  if (!q) return entries;
  return entries.filter(
    (e) => e.keywords.some((k) => k.includes(q)) || e.label.toLowerCase().includes(q) || e.section.toLowerCase().includes(q),
  );
}
