import React, { useMemo } from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { createDashboardStyles, type KpiTone } from './dashboardStyles';
import { Text } from '@/components/ui/AppText';

type Props = {
  title: string;
  hint?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconTone?: KpiTone;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  children: React.ReactNode;
};

const TONE_BG: Record<KpiTone, keyof AppColors> = {
  accent: 'softPrimary',
  success: 'softSuccess',
  info: 'softInfo',
  warning: 'softWarning',
  danger: 'softDanger',
  neutral: 'surfaceMuted',
};

const TONE_FG: Record<KpiTone, keyof AppColors> = {
  accent: 'accent',
  success: 'success',
  info: 'info',
  warning: 'warning',
  danger: 'danger',
  neutral: 'textMuted',
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

  return (
    <View style={ds.sectionBlock}>
      <View style={ds.sectionHeader}>
        <View style={ds.sectionTitleRow}>
          {icon ? (
            <View style={[ds.sectionIcon, { backgroundColor: c[TONE_BG[iconTone]] }]}>
              <MaterialIcons name={icon} size={20} color={c[TONE_FG[iconTone]]} />
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
