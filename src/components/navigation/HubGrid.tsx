import React, { useMemo } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge, AppText as Text } from '@/components/ui';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import type { MoreHubItem } from '@/navigation/moreModuleHub';
import type { AppColors } from '@/constants/colors';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { chevronForwardIcon } from '@/utils/rtl';
import { getStatusStyle } from '@/constants/statusColors';

type Props = {
  items: MoreHubItem[];
  columns: number;
  onItemPress: (item: MoreHubItem) => void;
};

export function HubGrid({ items, columns, onItemPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.grid}>
      {items.map((item) => {
        const icon = resolveSidebarIcon(item.icon);
        const disabled = !item.nav || item.disabled;
        const tone = getStatusStyle(c, disabled ? 'cancelled' : 'active');

        return (
          <Pressable
            key={item.id}
            onPress={disabled ? undefined : () => onItemPress(item)}
            style={({ pressed }) => [
              styles.card,
              columns >= 4 ? styles.cardQuarter : columns >= 3 ? styles.cardThird : styles.cardHalf,
              disabled ? styles.cardDisabled : undefined,
              pressed && !disabled ? styles.cardPressed : undefined,
            ]}
            accessibilityState={{ disabled }}
          >
            <View style={[styles.cardIcon, { backgroundColor: tone.bg }, disabled && styles.cardIconDisabled]}>
              <MaterialIcons name={icon} size={22} color={disabled ? c.textCaption : tone.fg} />
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
              {!disabled ? <MaterialIcons name={chevronForwardIcon()} size={18} color={c.textCaption} /> : null}
            </View>
            {item.disabledReason ? (
              <Text style={styles.cardLock} numberOfLines={2}>
                {item.disabledReason}
              </Text>
            ) : null}
          </Pressable>
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
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.md,
      minHeight: 128,
      gap: spacing.xs,
      alignItems: 'flex-start',
    },
    cardHalf: { width: '48%', maxWidth: '48%' },
    cardThird: { width: '31.5%', maxWidth: '31.5%' },
    cardQuarter: { width: '23.5%', maxWidth: '23.5%' },
    cardPressed: { backgroundColor: c.surfaceMuted },
    cardDisabled: { opacity: 0.55 },
    cardIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardIconDisabled: { backgroundColor: c.surfaceMuted },
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
