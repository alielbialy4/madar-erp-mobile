import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AppBadge } from '@/components/ui';
import { AppIcon } from '@/components/ui/AppIcon';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { createDashboardStyles, type KpiTone } from './dashboardStyles';
import { spacing, radius } from '@/constants/spacing';
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

const TONE_GRADIENTS: Record<KpiTone, [string, string]> = {
  accent: ['#3B82F6', '#8B5CF6'],
  success: ['#10B981', '#06B6D4'],
  info: ['#06B6D4', '#3B82F6'],
  warning: ['#F59E0B', '#EF4444'],
  danger: ['#EF4444', '#F43F5E'],
  neutral: ['#64748B', '#94A3B8'],
};

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
  const grad = TONE_GRADIENTS[iconTone];

  return (
    <View style={ds.sectionBlock}>
      <View style={ds.sectionHeader}>
        <View style={ds.sectionTitleRow}>
          {icon ? (
            <LinearGradient
              colors={grad}
              style={styles.sectionIcon}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <AppIcon name={icon as IconName} size={18} color="#FFFFFF" weight="duotone" />
            </LinearGradient>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
});
