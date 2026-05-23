import { responsive } from '@/constants/responsive';

export function isPosTabletFullscreen(activeTab: string | undefined, viewportWidth: number): boolean {
  return Boolean(activeTab === 'POSTab' && viewportWidth >= responsive.tabletMinSplit);
}
