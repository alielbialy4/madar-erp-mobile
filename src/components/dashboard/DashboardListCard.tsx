import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppBadge } from '@/components/ui';
import { AppIcon } from '@/components/ui/AppIcon';
import { useColors } from '@/hooks/useColors';
import { createDashboardStyles } from './dashboardStyles';
import { DashboardSection } from './DashboardSection';
import type { KpiTone } from './dashboardStyles';
import { Text } from '@/components/ui/AppText';

type IconName = Parameters<typeof AppIcon>[0]['name'];

export type ListItem = {
  id: string;
  title: string;
  subtitle?: string;
  meta?: string;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  icon?: string;
  iconTone?: KpiTone;
};

type Props = {
  title: string;
  hint?: string;
  sectionIcon?: string;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  items: ListItem[];
  emptyMessage: string;
};

export function DashboardListCard({
  title,
  hint,
  sectionIcon = 'list-bullets',
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
            const iconFg = c[tone === 'accent' ? 'accent' : tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : tone === 'danger' ? 'danger' : 'textMuted'];
            const isLast = index === Math.min(items.length, 8) - 1;
            return (
              <View
                key={item.id}
                style={[ds.listRow, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={[ds.listRowIcon, { backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderSubtle }]}>
                  <AppIcon name={(item.icon ?? 'circle') as IconName} size={20} color={iconFg} />
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
