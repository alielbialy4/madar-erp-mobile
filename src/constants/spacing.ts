/**
 * MADAR Executive Operational Fintech — spacing, radius, shadows.
 * Prefer spacing over borders; elevation only for real overlays.
 */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 40,
  massive: 48,
  cardPadding: 16,
  sectionGap: 24,
};

/** Mature radii — no bubble ERP */
export const radius = {
  xs: 4,
  sm: 6,
  md: 8,
  lg: 10,
  xl: 12,
  xxl: 16,
  xxxl: 16,
  pill: 999,
  control: 8,
  button: 8,
  input: 10,
  badge: 6,
  card: 12,
  surface: 12,
  sheet: 16,
};

export const shadows = {
  sm: {
    shadowColor: '#080D18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#080D18',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#080D18',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  xl: {
    shadowColor: '#080D18',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
  card: {
    shadowColor: '#080D18',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  dock: {
    shadowColor: '#080D18',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
};

/** Target row heights for density discipline */
export const rowHeight = {
  dense: 52,
  standard: 60,
  financial: 56,
  operational: 64,
  entity: 68,
} as const;

export const controlHeight = {
  icon: 40,
  field: 44,
  button: 48,
  chip: 28,
  nav: 48,
} as const;
