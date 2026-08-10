import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { Text } from '@/components/ui/AppText';
import { AppIcon } from '@/components/ui/AppIcon';
import { DashboardSection } from './DashboardSection';

type AlertItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon?: string;
  tone: 'danger' | 'warning' | 'info';
  meta?: string;
  onPress?: () => void;
};

type Props = {
  alerts: AlertItem[];
};

type IconName = Parameters<typeof AppIcon>[0]['name'];

export function DashboardAlerts({ alerts }: Props) {
  const c = useColors();

  if (!alerts.length) return null;

  return (
    <DashboardSection title="التنبيهات" hint={`${alerts.length} تنبيه يحتاج متابعة`} icon="warning" iconTone="warning">
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        {alerts.map((alert, i) => {
          const fg = alert.tone === 'danger' ? c.danger : alert.tone === 'warning' ? c.warning : c.info;
          const bg = alert.tone === 'danger' ? c.softDanger : alert.tone === 'warning' ? c.softWarning : c.softInfo;
          const isLast = i === alerts.length - 1;

          const inner = (
            <View style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderSubtle }]}>
              <View style={[styles.iconBadge, { backgroundColor: bg }]}> 
                <AppIcon name={(alert.icon ?? 'warning') as IconName} size={18} weight="duotone" color={fg} />
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>{alert.title}</Text>
                {alert.subtitle ? <Text style={[styles.subtitle, { color: c.textMuted }]} numberOfLines={1}>{alert.subtitle}</Text> : null}
              </View>
              {alert.meta ? (
                <View style={[styles.metaPill, { backgroundColor: fg + '15' }]}>
                  <Text style={[styles.metaText, { color: fg }]}>{alert.meta}</Text>
                </View>
              ) : null}
            </View>
          );

          if (alert.onPress) {
            return (
              <Pressable key={alert.id} onPress={alert.onPress} style={({ pressed }) => pressed && { opacity: 0.7 }}>
                {inner}
              </Pressable>
            );
          }
          return <View key={alert.id}>{inner}</View>;
        })}
      </View>
    </DashboardSection>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: typography.small,
    fontFamily: fonts.bold,
    writingDirection: 'rtl',
  },
  subtitle: {
    fontSize: typography.tiny,
    fontFamily: fonts.regular,
    writingDirection: 'rtl',
  },
  metaPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  metaText: {
    fontSize: 11,
    fontFamily: fonts.bold,
  },
});
