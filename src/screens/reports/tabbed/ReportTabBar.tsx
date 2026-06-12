import React from 'react';
import { Pressable, ScrollView } from 'react-native';
import { AppText } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
};

export function ReportTabBar({ tabs, activeTab, onTabChange }: Props) {
  const c = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ ...flexRow, gap: spacing.sm, paddingVertical: spacing.sm }}>
      {tabs.map((tab) => {
        const active = tab.id === activeTab;
        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.sm,
              borderRadius: 999,
              backgroundColor: active ? c.accent : c.surfaceMuted,
            }}
          >
            <AppText style={{ color: active ? c.onPrimary : c.text, fontWeight: '700' }}>{tab.label}</AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
