import React, { useMemo } from 'react';
import { View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from './dashboardStyles';
import { DashboardSection } from './DashboardSection';
import type { KpiTone } from './dashboardStyles';
import { Text } from '@/components/ui/AppText';

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: keyof typeof MaterialIcons.glyphMap;
  iconTone?: KpiTone;
};

type Props = {
  title: string;
  hint?: string;
  sectionIcon?: keyof typeof MaterialIcons.glyphMap;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  items: ListItem[];
  emptyMessage: string;
};

export function DashboardListCard({
  title,
  hint,
  sectionIcon = 'list-alt',
  badge,
  badgeTone = 'neutral',
  items,
  emptyMessage,
}: Props) {
  const c = useColors();
  const ds = useMemo(() => createDashboardStyles(c), [c]);

  return (
    <DashboardSection
      title={title}
      hint={hint}
      icon={sectionIcon}
      badge={badge}
      badgeTone={badgeTone}
    >
      <View style={ds.surfaceCard}>
        {items.length === 0 ? (
          <View style={ds.emptyBox}>
            <Text style={ds.emptyText}>{emptyMessage}</Text>
          </View>
        ) : (
          items.slice(0, 8).map((item, index) => {
            const tone = item.iconTone ?? 'neutral';
            const iconBg = c[tone === 'accent' ? 'softPrimary' : tone === 'success' ? 'softSuccess' : tone === 'warning' ? 'softWarning' : tone === 'danger' ? 'softDanger' : 'surfaceMuted'];
            const iconFg = c[tone === 'accent' ? 'accent' : tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'textMuted'];
            const isLast = index === Math.min(items.length, 8) - 1;
            return (
              <View
                key={item.id}
                style={[ds.listRow, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={[ds.listRowIcon, { backgroundColor: iconBg }]}>
                  <MaterialIcons name={item.icon ?? 'circle'} size={20} color={iconFg} />
                </View>
                <View style={ds.listRowBody}>
                  <Text style={ds.listRowTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.subtitle ? (
                    <Text style={ds.listRowSub} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  ) : null}
                </View>
                {item.meta ? <Text style={ds.listRowMeta}>{item.meta}</Text> : null}
                {item.badge ? <AppBadge label={item.badge} tone={item.badgeTone ?? 'neutral'} /> : null}
              </View>
            );
          })
        )}
      </View>
    </DashboardSection>
  );
}
