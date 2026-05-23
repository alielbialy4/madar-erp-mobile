import React, { useCallback, useMemo, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { rtlDirection } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import {
  POS_TABLET_CART_MAX,
  POS_TABLET_CART_MIN,
  POS_TABLET_CART_RATIO,
} from './posTabletLayout';

type Props = {
  cart: React.ReactNode;
  catalog: React.ReactNode;
  /** Measured split row width (defaults to flex fill). */
  rowWidth?: number;
  onCatalogWidthChange?: (width: number) => void;
};

/**
 * Physical layout: cart left, catalog right.
 * Each pane uses RTL for Arabic content (no document-level mirroring inside panes).
 */
export function PosTabletSplit({ cart, catalog, rowWidth, onCatalogWidthChange }: Props) {
  const c = useColors();
  const [measuredRowWidth, setMeasuredRowWidth] = useState(0);

  const effectiveRowWidth = rowWidth ?? measuredRowWidth;
  const cartWidth = useMemo(() => {
    if (effectiveRowWidth <= 0) return POS_TABLET_CART_MIN;
    const target = Math.round(effectiveRowWidth * POS_TABLET_CART_RATIO);
    return Math.min(POS_TABLET_CART_MAX, Math.max(POS_TABLET_CART_MIN, target));
  }, [effectiveRowWidth]);

  const handleRowLayout = useCallback(
    (w: number) => {
      if (w > 0 && w !== measuredRowWidth) setMeasuredRowWidth(w);
    },
    [measuredRowWidth],
  );

  const handleCatalogLayout = useCallback(
    (w: number) => {
      if (w > 0) onCatalogWidthChange?.(w);
    },
    [onCatalogWidthChange],
  );

  const styles = useMemo(
    () =>
      StyleSheet.create({
        row: {
          flex: 1,
          flexDirection: 'row-reverse',
          alignItems: 'stretch',
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: c.surfaceMuted,
          ...(Platform.OS === 'web'
            ? ({ display: 'flex', height: '100%' } as object)
            : null),
        },
        cartPane: {
          width: cartWidth,
          maxWidth: cartWidth,
          flexGrow: 0,
          flexShrink: 0,
          minHeight: 0,
          borderRightWidth: 1,
          borderRightColor: c.borderSubtle,
          backgroundColor: c.surface,
          overflow: 'hidden',
        },
        catalogPane: {
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          backgroundColor: c.background,
          overflow: 'hidden',
        },
      }),
    [c.background, c.borderSubtle, c.surface, c.surfaceMuted, cartWidth],
  );

  return (
    <View
      style={styles.row}
      onLayout={(e) => handleRowLayout(Math.round(e.nativeEvent.layout.width))}
    >
      <View style={[styles.cartPane, rtlDirection]}>{cart}</View>
      <View
        style={[styles.catalogPane, rtlDirection]}
        onLayout={(e) => handleCatalogLayout(Math.round(e.nativeEvent.layout.width))}
      >
        {catalog}
      </View>
    </View>
  );
}
