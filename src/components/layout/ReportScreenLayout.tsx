import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppScreen } from './AppScreen';
import { ModuleHeader } from './ModuleHeader';
import { spacing } from '@/constants/spacing';
import { useColors } from '@/hooks/useColors';
import { getProductLayoutTier, productContentMaxWidth } from '@/constants/productLayout';

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
  const c = useColors();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => StyleSheet.create({
    frame: {
      width: '100%',
      maxWidth: productContentMaxWidth(getProductLayoutTier(width)),
      alignSelf: 'center',
      gap: spacing.lg,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxxl,
    },
    filterBar: {
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    content: { gap: spacing.xl },
  }), [c.border, width]);

  return (
    <AppScreen title="التقارير" onBack={onBack} headerRight={headerRight} scroll contentStyle={{ padding: 0 }}>
      <View style={styles.frame}>
        <ModuleHeader eyebrow="سياق التقرير" title={title} subtitle={subtitle} compact actions={exportActions} />
        {filters ? <View style={styles.filterBar}>{filters}</View> : null}
        <View style={styles.content}>{children}</View>
      </View>
    </AppScreen>
  );
}
