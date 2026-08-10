import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBadge } from '@/components/ui';
import { AppIcon } from '@/components/ui/AppIcon';
import { MadarSection } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles, type KpiTone } from './dashboardStyles';
import { Text } from '@/components/ui/AppText';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  hint?: string;
  icon?: string;
  iconTone?: KpiTone;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
};

type IconName = Parameters<typeof AppIcon>[0]['name'];

export function DashboardSection({
  title,
  hint,
  icon,
  badge,
  badgeTone = 'neutral',
  children,
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const action = badge ? <AppBadge label={badge} tone={badgeTone} /> : null;

  return (
    <MadarSection title={title} action={action} style={ds.sectionBlock}>
      {hint || icon ? (
        <View style={styles.metaRow}>
          {icon ? <AppIcon name={icon as IconName} size={16} color={c.textMuted} weight="regular" /> : null}
          {hint ? <Text style={[ds.sectionHint, { flex: 1 }]}>{hint}</Text> : null}
        </View>
      ) : null}
      {children}
    </MadarSection>
  );
}

const styles = StyleSheet.create({
  metaRow: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxs,
  },
});
