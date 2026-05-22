import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

export function AppSectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  title: {
    ...textStart,
    flex: 1,
    color: colors.text,
    fontSize: typography.cardTitle,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
