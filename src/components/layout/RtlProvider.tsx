import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { rootRtl } from '@/constants/layout';

/** Ensures RTL direction on every subtree (backup to I18nManager.forceRTL). */
export function RtlProvider({ children }: PropsWithChildren) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: rootRtl,
});
