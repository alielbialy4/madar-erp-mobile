import { responsive } from '@/constants/responsive';

/** POS tab uses its own top bar — hide the global Navbar on all screen sizes. */
export function isPosFullscreen(activeTab: string | undefined): boolean {
  return activeTab === 'POSTab';
}

/** Tablet split layout inside POS (catalog + cart side by side). */
export function isPosTabletFullscreen(activeTab: string | undefined, viewportWidth: number): boolean {
  return Boolean(activeTab === 'POSTab' && viewportWidth >= responsive.tabletMinSplit);
}
