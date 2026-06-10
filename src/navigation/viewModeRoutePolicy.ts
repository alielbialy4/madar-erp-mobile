import { SIDEBAR_MENU_TEMPLATE, type SidebarMenuItem } from './buildSidebarMenu';
import { webLinkToNav, type SidebarNavAction } from './sidebarNavMap';
import type { MoreStackParamList, POSStackParamList } from '@/types/navigation';

export type ViewMode = 'global' | 'branch';

const BOTH: ViewMode[] = ['global', 'branch'];

function modesFromMenuItem(item: SidebarMenuItem): ViewMode[] {
  if (item.globalOnly) return ['global'];
  if (item.branchOnly) return ['branch'];
  return BOTH;
}

function mergeModes(existing: ViewMode[] | undefined, next: ViewMode[]): ViewMode[] {
  if (!existing) return next;
  const set = new Set<ViewMode>([...existing, ...next]);
  return BOTH.filter((mode) => set.has(mode));
}

type ScreenKey = `more:${keyof MoreStackParamList}` | `pos:${keyof POSStackParamList}`;

const screenPolicies = new Map<ScreenKey, ViewMode[]>();
const linkPolicies = new Map<string, ViewMode[]>();

function policyKey(stack: 'more' | 'pos', screen: string): ScreenKey {
  return `${stack}:${screen}` as ScreenKey;
}

function applyNavPolicy(nav: SidebarNavAction, modes: ViewMode[]): void {
  if (nav.kind === 'tab' && nav.tab === 'POSTab') {
    screenPolicies.set(policyKey('pos', 'POSHome'), mergeModes(screenPolicies.get(policyKey('pos', 'POSHome')), modes));
    screenPolicies.set(policyKey('pos', 'WaiterPos'), mergeModes(screenPolicies.get(policyKey('pos', 'WaiterPos')), modes));
    screenPolicies.set(
      policyKey('pos', 'DiningTableOrder'),
      mergeModes(screenPolicies.get(policyKey('pos', 'DiningTableOrder')), modes),
    );
    return;
  }
  if (nav.kind === 'more') {
    screenPolicies.set(policyKey('more', nav.screen), mergeModes(screenPolicies.get(policyKey('more', nav.screen)), modes));
  }
}

function walkMenu(items: SidebarMenuItem[]): void {
  for (const item of items) {
    if (item.type === 'section') continue;
    const modes = modesFromMenuItem(item);
    if (item.link) {
      linkPolicies.set(item.link, mergeModes(linkPolicies.get(item.link), modes));
      const nav = webLinkToNav(item.link, item.label);
      if (nav) applyNavPolicy(nav, modes);
    }
    if (item.subItems?.length) walkMenu(item.subItems);
  }
}

/** Deep screens and branch-admin routes not represented as top-level sidebar links. */
const MANUAL_MORE_POLICIES: Partial<Record<keyof MoreStackParamList, ViewMode[]>> = {
  BranchesList: ['global'],
  BranchDetail: ['global'],
  BranchForm: ['global'],
  BranchSettings: ['global'],
  BranchPosSettings: ['global'],
  BranchPrintHub: ['global'],
  BranchPrintSettings: ['global'],
  BranchKitchenPrinters: ['global'],
  BranchKitchenRouting: ['global'],
  TenantSettings: ['global'],
  BackupInfo: ['global'],
  KitchenRouting: ['global'],
  KitchenRoutingForm: ['global'],
  Dining: ['branch'],
  DiningTableOrder: ['branch'],
  DiningHallForm: ['branch'],
  WaiterPos: ['branch'],
  Kitchen: ['branch'],
  KitchenOrder: ['branch'],
  KitchenTicketPreview: ['branch'],
  KitchenStationsList: ['branch'],
  KitchenStationForm: ['branch'],
  KitchenPrintJobs: ['branch'],
  BarcodePrintInfo: ['branch'],
};

const MANUAL_POS_POLICIES: Partial<Record<keyof POSStackParamList, ViewMode[]>> = {
  POSHome: ['branch'],
  WaiterPos: ['branch'],
  DiningTableOrder: ['branch'],
};

function applyManualPolicies(): void {
  for (const [screen, modes] of Object.entries(MANUAL_MORE_POLICIES) as [keyof MoreStackParamList, ViewMode[]][]) {
    const key = policyKey('more', screen);
    screenPolicies.set(key, mergeModes(screenPolicies.get(key), modes));
  }
  for (const [screen, modes] of Object.entries(MANUAL_POS_POLICIES) as [keyof POSStackParamList, ViewMode[]][]) {
    const key = policyKey('pos', screen);
    screenPolicies.set(key, mergeModes(screenPolicies.get(key), modes));
  }
}

let built = false;

function ensureBuilt(): void {
  if (built) return;
  walkMenu(SIDEBAR_MENU_TEMPLATE);
  applyManualPolicies();
  built = true;
}

export function getAllowedModesForMoreScreen(screen: keyof MoreStackParamList): ViewMode[] {
  ensureBuilt();
  return screenPolicies.get(policyKey('more', screen)) ?? BOTH;
}

export function getAllowedModesForPosScreen(screen: keyof POSStackParamList): ViewMode[] {
  ensureBuilt();
  return screenPolicies.get(policyKey('pos', screen)) ?? BOTH;
}

export function getAllowedModesForWebRoute(webRoute: string): ViewMode[] {
  ensureBuilt();
  return linkPolicies.get(webRoute) ?? BOTH;
}

export function isViewModeAllowed(modes: ViewMode[], viewMode: ViewMode): boolean {
  return modes.includes(viewMode);
}

/** @internal — reset cached policies (tests only). */
export function __resetViewModePolicyCacheForTests(): void {
  screenPolicies.clear();
  linkPolicies.clear();
  built = false;
}
