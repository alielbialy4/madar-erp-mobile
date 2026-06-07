import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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

const TONE_GRADIENTS: Record<string, [string, string]> = {
  danger: ['#EF4444', '#F43F5E'],
  warning: ['#F59E0B', '#F97316'],
  info: ['#3B82F6', '#06B6D4'],
};

const TONE_FG: Record<string, string> = {
  danger: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',
};

type IconName = Parameters<typeof AppIcon>[0]['name'];

export function DashboardAlerts({ alerts }: Props) {
  const c = useColors();

  if (!alerts.length) return null;

  return (
    <DashboardSection title="التنبيهات" hint={`${alerts.length} تنبيه يحتاج متابعة`} icon="warning" iconTone="warning">
      <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
        {alerts.map((alert, i) => {
          const grad = TONE_GRADIENTS[alert.tone];
          const fg = TONE_FG[alert.tone];
          const isLast = i === alerts.length - 1;

          const inner = (
            <View style={[styles.row, !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderSubtle }]}>
              <LinearGradient
                colors={grad}
                style={styles.iconBadge}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <AppIcon name={(alert.icon ?? 'warning') as IconName} size={18} weight="duotone" color="#FFFFFF" />
              </LinearGradient>
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
    borderRadius: radius.xxl,
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
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 3,
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
