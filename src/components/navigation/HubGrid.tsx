import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { AppBadge, AppText as Text } from '@/components/ui';
import { AppIcon } from '@/components/ui/AppIcon';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import type { MoreHubItem } from '@/navigation/moreModuleHub';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type Props = {
  items: MoreHubItem[];
  columns: number;
  onItemPress: (item: MoreHubItem) => void;
};

type IconName = Parameters<typeof AppIcon>[0]['name'];

const GRADIENT_PRESETS: [string, string][] = [
  ['#3B82F6', '#8B5CF6'],
  ['#10B981', '#06B6D4'],
  ['#F59E0B', '#EF4444'],
  ['#8B5CF6', '#EC4899'],
  ['#06B6D4', '#3B82F6'],
  ['#EC4899', '#F59E0B'],
  ['#14B8A6', '#10B981'],
  ['#6366F1', '#8B5CF6'],
];

export function HubGrid({ items, columns, onItemPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.grid}>
      {items.map((item, index) => {
        const icon = resolveSidebarIcon(item.icon);
        const disabled = !item.nav || item.disabled;
        const gradColors = GRADIENT_PRESETS[index % GRADIENT_PRESETS.length];

        return (
          <MotiView
            key={item.id}
            from={{ opacity: 0, scale: 0.92, translateY: 10 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            transition={{ delay: index * 40, type: 'spring', damping: 18, stiffness: 120 }}
            style={[
              columns >= 4 ? styles.cardQuarter : columns >= 3 ? styles.cardThird : styles.cardHalf,
            ]}
          >
            <Pressable
              onPress={disabled ? undefined : () => onItemPress(item)}
              style={({ pressed }) => [
                styles.card,
                disabled ? styles.cardDisabled : undefined,
                pressed && !disabled ? { transform: [{ scale: 0.97 }] } : undefined,
              ]}
              accessibilityState={{ disabled }}
            >
              <View style={styles.cardHeader}>
                <LinearGradient
                  colors={disabled ? ['#94A3B8', '#CBD5E1'] : gradColors}
                  style={styles.iconBadge}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <AppIcon name={icon as IconName} size={22} weight="duotone" color="#FFFFFF" />
                </LinearGradient>
              </View>
              <Text style={[styles.cardTitle, disabled && styles.cardTitleDisabled]} numberOfLines={2}>
                {item.label}
              </Text>
              {item.description ? (
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}
              <View style={styles.cardFooter}>
                {item.badge ? <AppBadge label={item.badge} tone="info" /> : <View />}
                {!disabled ? <AppIcon name="arrow-right" size={16} color={c.textCaption} /> : null}
              </View>
              {item.disabledReason ? (
                <Text style={styles.cardLock} numberOfLines={2}>
                  {item.disabledReason}
                </Text>
              ) : null}
            </Pressable>
          </MotiView>
        );
      })}
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    grid: {
      ...flexRow,
      flexWrap: 'wrap',
      gap: spacing.md,
      justifyContent: 'flex-start',
      alignItems: 'stretch',
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.xxl,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      minHeight: 140,
      gap: spacing.xs,
      alignItems: 'flex-start',
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardHalf: { width: '48%', maxWidth: '48%' },
    cardThird: { width: '31.5%', maxWidth: '31.5%' },
    cardQuarter: { width: '23.5%', maxWidth: '23.5%' },
    cardDisabled: { opacity: 0.5 },
    cardHeader: {
      marginBottom: spacing.xs,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    cardTitle: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: c.text,
    },
    cardTitleDisabled: { color: c.textCaption },
    cardDesc: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
      lineHeight: 16,
    },
    cardFooter: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      width: '100%',
      marginTop: 'auto' as const,
    },
    cardLock: {
      ...textStart,
      fontSize: 10,
      color: c.warning,
      fontFamily: fonts.medium,
    },
  });
}
