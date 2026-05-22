import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';

export function AppLoadingState({ message = 'جاري تحميل البيانات...' }: { message?: string }) {
  return (
    <View style={styles.state}>
      <ActivityIndicator color={colors.accent} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  state: { padding: spacing.xxxl, alignItems: 'center', gap: spacing.md },
  message: { color: colors.textMuted, fontSize: typography.body, textAlign: 'center' },
});
