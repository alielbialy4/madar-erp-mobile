
export const POS_TABLET_CART_MIN = 360;
export const POS_TABLET_CART_MAX = 430;
export const POS_TABLET_CART_RATIO = 0.36;

export function posTabletCartWidth(viewportWidth: number): number {
  const target = Math.round(viewportWidth * POS_TABLET_CART_RATIO);
  return Math.min(POS_TABLET_CART_MAX, Math.max(POS_TABLET_CART_MIN, target));
}
