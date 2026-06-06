import React from 'react';
import { View } from 'react-native';
import { AppScreen } from './AppScreen';
import { ModuleHero } from './ModuleHero';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  children: React.ReactNode;
  filters?: React.ReactNode;
  exportActions?: React.ReactNode;
  headerRight?: React.ReactNode;
};

export function ReportScreenLayout({ title, subtitle, onBack, children, filters, exportActions, headerRight }: Props) {
  return (
    <AppScreen title={title} subtitle={subtitle} onBack={onBack} headerRight={headerRight} scroll contentStyle={{ padding: 0, gap: spacing.md }}>
      <View style={{ paddingHorizontal: spacing.lg, gap: spacing.lg }}>
        <ModuleHero eyebrow="التقارير" title={title} subtitle={subtitle} compact actions={exportActions} />
        {filters}
        {children}
      </View>
    </AppScreen>
  );
}
