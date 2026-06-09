import { buildMobileSidebarMenu, type MobileSidebarMenuItem } from './buildSidebarMenu';
import type { SidebarNavAction } from './sidebarNavMap';

export type DashboardShortcutItem = {
  id: string;
  label: string;
  link: string;
  icon?: string;
  nav: SidebarNavAction;
};

export type DashboardShortcutGroup = {
  id: string;
  title: string;
  icon?: string;
  items: DashboardShortcutItem[];
};

const REPORTS_GROUP_ID = 'nav-reports';
const REPORTS_PREVIEW_LIMIT = 8;

function flattenSubItems(items: MobileSidebarMenuItem[]): DashboardShortcutItem[] {
  return items
    .filter((item) => item.type !== 'section' && item.nav)
    .map((item) => ({
      id: item.id ?? item.label,
      label: item.label,
      link: item.link ?? '',
      icon: item.icon,
      nav: item.nav!,
    }));
}

export function buildDashboardShortcutGroups(
  isSuperAdmin: boolean,
  hasPermission: (permission: string) => boolean,
  viewMode?: string,
  hasFeature: (feature: string) => boolean = () => true,
): DashboardShortcutGroup[] {
  const menu = buildMobileSidebarMenu(isSuperAdmin, hasPermission, viewMode, hasFeature);
  const groups: DashboardShortcutGroup[] = [];

  for (const item of menu) {
    if (item.id === 'nav-dashboard') continue;
    if (item.type === 'section') continue;

    if (item.subItems?.length) {
      let items = flattenSubItems(item.subItems);
      if (item.id === REPORTS_GROUP_ID && items.length > REPORTS_PREVIEW_LIMIT) {
        const reportsNav = items.find((i) => i.link === '/reports')?.nav ?? items[0]?.nav;
        if (reportsNav) {
          items = [
            ...items.slice(0, REPORTS_PREVIEW_LIMIT),
            {
              id: 'nav-reports-view-all',
              label: 'عرض كل التقارير',
              link: '/reports',
              icon: 'ri-file-list-3-line',
              nav: reportsNav,
            },
          ];
        } else {
          items = items.slice(0, REPORTS_PREVIEW_LIMIT);
        }
      }
      if (items.length === 0) continue;
      groups.push({
        id: item.id ?? item.label,
        title: item.label,
        icon: item.icon,
        items,
      });
      continue;
    }

    if (item.nav) {
      groups.push({
        id: item.id ?? item.link ?? item.label,
        title: item.label,
        icon: item.icon,
        items: [
          {
            id: item.id ?? item.link ?? item.label,
            label: item.label,
            link: item.link ?? '',
            icon: item.icon,
            nav: item.nav,
          },
        ],
      });
    }
  }

  return groups;
}

export function filterDashboardShortcutGroups(
  groups: DashboardShortcutGroup[],
  query: string,
): DashboardShortcutGroup[] {
  const q = query.trim().toLowerCase();
  if (!q) return groups;

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(q)),
    }))
    .filter((group) => group.items.length > 0);
}
