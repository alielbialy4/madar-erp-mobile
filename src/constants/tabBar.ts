import { Dimensions } from 'react-native';
import { spacing } from './spacing';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const isWide = SCREEN_WIDTH >= 900;

export const TAB_BAR_DOCK_HEIGHT = isWide ? 0 : 64;
export const TAB_BAR_HORIZONTAL_MARGIN = 0;
export const TAB_BAR_FLOAT_GAP = 0;
export const TAB_BAR_POS_LIFT = 0;
export const TAB_BAR_MIN_BOTTOM_INSET = spacing.sm;
export const BOTTOM_NAV_HEIGHT = TAB_BAR_DOCK_HEIGHT + TAB_BAR_FLOAT_GAP + TAB_BAR_POS_LIFT;
export const TAB_BAR_BASE_INSET = BOTTOM_NAV_HEIGHT;
