import type { ComponentType } from 'react';
import type { ViewProps } from 'react-native';

/**
 * Moti's root export pulls `SafeAreaView` from react-native (deprecated warning).
 * Import MotiView from the leaf module instead.
 */
// eslint-disable-next-line @typescript-eslint/no-require-imports
const motiView = require('moti/build/components/view') as {
  View: ComponentType<ViewProps & Record<string, unknown>>;
};

export const MotiView = motiView.View;
export { AnimatePresence } from 'framer-motion';
