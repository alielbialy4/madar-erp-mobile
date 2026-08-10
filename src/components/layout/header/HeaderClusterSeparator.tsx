import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { HEADER_CHROME } from '@/constants/headerChrome';

export function HeaderClusterSeparator() {
  const c = useColors();
  return <View style={[styles.sep, { backgroundColor: c.borderSubtle }]} />;
}

const styles = StyleSheet.create({
  sep: {
    width: StyleSheet.hairlineWidth,
    height: HEADER_CHROME.separatorHeight,
    flexShrink: 0,
  },
});
