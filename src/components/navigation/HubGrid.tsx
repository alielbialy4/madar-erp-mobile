import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
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

/**
 * A module hub is a navigation index, not a marketing gallery. Keep every
 * destination in one scannable ledger with a stable icon/title/description axis.
 */
export function HubGrid({ items, columns, onItemPress }: Props) {
  const c = useColors();
  const styles = useMemo(() => createStyles(c, columns >= 3), [c, columns]);

  return (
    <View style={styles.list}>
      {items.map((item, index) => {
        const icon = resolveSidebarIcon(item.icon);
        const disabled = !item.nav || item.disabled;

        return (
          <Pressable
            key={item.id}
            onPress={disabled ? undefined : () => onItemPress(item)}
            style={({ pressed }) => [
              styles.row,
              index < items.length - 1 && styles.rowDivider,
              disabled && styles.rowDisabled,
              pressed && !disabled && styles.rowPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={item.label}
            accessibilityState={{ disabled }}
          >
            <View style={styles.iconBox}>
              <AppIcon name={icon as IconName} size={20} weight="duotone" color={disabled ? c.textCaption : c.textMuted} />
            </View>
            <View style={styles.copy}>
              <View style={styles.titleRow}>
                <Text style={[styles.title, disabled && styles.titleDisabled]} numberOfLines={1}>
                  {item.label}
                </Text>
                {item.badge ? <AppBadge label={item.badge} tone="neutral" /> : null}
              </View>
              {item.description ? <Text style={styles.description} numberOfLines={1}>{item.description}</Text> : null}
              {item.disabledReason ? <Text style={styles.disabledReason} numberOfLines={1}>{item.disabledReason}</Text> : null}
            </View>
            {!disabled ? <AppIcon name="arrow-left" size={17} color={c.textCaption} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: AppColors, wide: boolean) {
  return StyleSheet.create({
    list: {
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      borderRadius: radius.md,
      overflow: 'hidden',
    },
    row: {
      ...flexRow,
      minHeight: wide ? 56 : 52,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      backgroundColor: c.surface,
    },
    rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.borderSubtle },
    rowPressed: { backgroundColor: c.surfaceMuted },
    rowDisabled: { opacity: 0.52 },
    iconBox: {
      width: 28,
      height: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0, gap: 2 },
    titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    title: { ...textStart, flexShrink: 1, color: c.text, fontFamily: fonts.medium, fontWeight: '600', fontSize: typography.rowPrimary },
    titleDisabled: { color: c.textCaption },
    description: { ...textStart, color: c.textMuted, fontFamily: fonts.regular, fontSize: typography.metadata },
    disabledReason: { ...textStart, color: c.warning, fontFamily: fonts.medium, fontSize: typography.micro },
  });
}
