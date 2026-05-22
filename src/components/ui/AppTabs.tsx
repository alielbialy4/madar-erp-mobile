import React from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';
import { colors } from '@/constants/colors';
import { flexRow } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';

type Tab = { key: string; label: string };

type Props = {
  tabs: Tab[];
  activeKey: string;
  onChange: (key: string) => void;
};

export function AppTabs({ tabs, activeKey, onChange }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[styles.tab, active ? styles.tabActive : undefined]}
          >
            <Text style={[styles.label, active ? styles.labelActive : undefined]}>{tab.label}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    ...flexRow,
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  tab: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  tabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: typography.small,
    fontFamily: fonts.medium,
    color: colors.textMuted,
  },
  labelActive: {
    color: colors.primaryForeground,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
});
