import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet } from 'react-native';
import { AppText as Text } from './AppText';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
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
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

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

function createStyles(c: AppColors) {
  return StyleSheet.create({
    row: {
      ...flexRow,
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    tab: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    tabActive: {
      backgroundColor: c.primary,
      borderColor: c.primary,
    },
    label: {
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
    labelActive: {
      color: c.primaryForeground,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
  });
}
