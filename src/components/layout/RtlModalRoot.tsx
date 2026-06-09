import React, { PropsWithChildren } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import { modalRtl } from '@/constants/layout';

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

/** Wrap Modal roots so flex rows and text inherit RTL on web and native. */
export function RtlModalRoot({ children, style }: Props) {
  return <View style={[styles.root, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  root: modalRtl,
});
