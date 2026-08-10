import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';
import { spacing } from '@/constants/spacing';
import { SIDEBAR_WIDTH } from '@/constants/sidebarLayout';

const KPI_GAP = spacing.sm;

export type DashboardKpiTier = 'primary' | 'secondary';

/** Usable content width (sidebar + page padding excluded on tablet). */
export function useDashboardContentWidth() {
  const { width } = useWindowDimensions();
  return useMemo(() => {
    const isTablet = width >= 900;
    const horizontalInset = spacing.lg * 2;
    const sidebar = isTablet ? SIDEBAR_WIDTH : 0;
    return Math.max(0, width - sidebar - horizontalInset);
  }, [width]);
}

export function dashboardKpiColumns(contentWidth: number, tier: DashboardKpiTier): number {
  if (contentWidth < 280) return 1;

  if (tier === 'primary') {
    return contentWidth < 720 ? 2 : 4;
  }

  if (contentWidth < 720) return 2;
  if (contentWidth < 1120) return 3;
  return 6;
}

export function useDashboardKpiSlotWidth(contentWidth: number, tier: DashboardKpiTier) {
  return useMemo(() => {
    const columns = dashboardKpiColumns(contentWidth, tier);
    const gaps = KPI_GAP * (columns - 1);
    return Math.max(0, (contentWidth - gaps) / columns);
  }, [contentWidth, tier]);
}

/** Kept as a compatibility wrapper for dashboard extensions. */
export function usePrimaryKpiSlotWidth(contentWidth: number) {
  return useDashboardKpiSlotWidth(contentWidth, 'primary');
}

export type PrimaryKpiDensity = 'full' | 'medium' | 'compact' | 'ultra';

export function primaryKpiDensity(slotWidth: number): PrimaryKpiDensity {
  if (slotWidth < 96) return 'ultra';
  if (slotWidth < 132) return 'compact';
  if (slotWidth < 168) return 'medium';
  return 'full';
}

export function primaryKpiSizing(density: PrimaryKpiDensity) {
  switch (density) {
    case 'ultra':
      return { icon: 14, value: 15, label: 9, padding: spacing.xs, iconBox: 28 };
    case 'compact':
      return { icon: 16, value: 18, label: 10, padding: spacing.sm, iconBox: 32 };
    case 'medium':
      return { icon: 18, value: 22, label: 11, padding: spacing.md, iconBox: 36 };
    default:
      return { icon: 20, value: 26, label: 12, padding: spacing.lg, iconBox: 40 };
  }
}
