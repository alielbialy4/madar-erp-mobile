import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppBadge } from '@/components/ui';
import { AppIcon } from '@/components/ui/AppIcon';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles, KPI_TONE_STYLES, type KpiTone } from './dashboardStyles';
import { Text } from '@/components/ui/AppText';

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
  iconTone = 'accent',
  badge,
  badgeTone = 'neutral',
  children,
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);
  const toneStyle = KPI_TONE_STYLES[iconTone];
  const iconColor = c[toneStyle.icon as keyof typeof c] as string;

  return (
    <View style={ds.sectionBlock}>
      <View style={ds.sectionHeader}>
        <View style={ds.sectionTitleRow}>
          {icon ? (
            <View style={[styles.sectionIcon, { backgroundColor: c.surfaceMuted }]}>
              <AppIcon name={icon as IconName} size={18} color={iconColor} weight="regular" />
            </View>
          ) : null}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={ds.sectionTitle}>{title}</Text>
            {hint ? <Text style={ds.sectionHint}>{hint}</Text> : null}
          </View>
        </View>
        {badge ? <AppBadge label={badge} tone={badgeTone} /> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
