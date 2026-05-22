import React from 'react';
import { textStart } from '@/constants/layout';
import { StyleSheet } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { typography } from '@/constants/typography';

export function FormError({ message }: { message?: string | null }) {
  if (!message) return null;
  return <Text style={styles.error}>{message}</Text>;
}

const styles = StyleSheet.create({
  error: { color: colors.danger, fontSize: typography.small, ...textStart, fontWeight: '700' },
});
