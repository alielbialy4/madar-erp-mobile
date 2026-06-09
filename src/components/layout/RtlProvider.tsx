import React, { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';

/** App shell wrapper — layout mirroring from I18nManager.forceRTL (see bootstrap/rtl.ts). */
export function RtlProvider({ children }: PropsWithChildren) {
  return <View style={styles.root}>{children}</View>;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
