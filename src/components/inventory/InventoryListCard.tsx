import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { chevronForwardIcon } from '@/utils/rtl';
import { flexRow, textStart } from '@/constants/layout';
import type { InventoryCardModel } from './inventoryRowUtils';
import { Text } from '@/components/ui/AppText';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type CardVariant = 'compact' | 'grid';

type Props = InventoryCardModel & {
  icon?: React.ComponentProps<typeof MaterialIcons>['name'];
  onPress?: () => void;
  variant?: CardVariant;
};

export function InventoryListCard({
  title,
  subtitle,
  meta,
  badgeLabel,
  badgeTone,
  icon = 'inventory-2',
  onPress,
  variant = 'compact',
}: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const extra = useMemo(() => createExtraStyles(c), [c]);

  if (variant === 'grid') {
    return (
      <View style={[styles.categoryCard, extra.gridCard]}>
        <Pressable
          onPress={onPress}
          disabled={!onPress}
          style={({ pressed }) => [extra.gridPressable, pressed && onPress && { opacity: 0.92 }]}
        >
          <View style={extra.gridIconWrap}>
            <MaterialIcons name={icon} size={28} color={c.textCaption} />
          </View>
          <Text style={extra.gridTitle} numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={extra.gridSubtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
          <View style={extra.gridFooter}>
            {badgeLabel ? <AppBadge label={badgeLabel} tone={badgeTone ?? 'default'} /> : <View />}
            {meta ? <Text style={extra.gridMeta}>{meta}</Text> : null}
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.categoryCard}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        style={({ pressed }) => [styles.cardPressable, extra.compactPressable, pressed && onPress && { opacity: 0.92 }]}
      >
        <View style={styles.cardTop}>
          <View style={styles.thumbPlaceholder}>
            <MaterialIcons name={icon} size={28} color={c.textCaption} />
          </View>
          <View style={styles.cardBody}>
            <View style={extra.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {title}
              </Text>
              {badgeLabel ? <AppBadge label={badgeLabel} tone={badgeTone ?? 'default'} /> : null}
            </View>
            {subtitle ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {subtitle}
              </Text>
            ) : null}
            {meta ? <Text style={styles.cardMeta}>{meta}</Text> : null}
          </View>
          {onPress ? (
            <View style={styles.cardChevron}>
              <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
            </View>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}

function createExtraStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    compactPressable: { paddingBottom: spacing.sm },
    gridCard: { flex: 1, marginBottom: 0 },
    gridPressable: { padding: spacing.md, gap: spacing.sm, flex: 1 },
    gridIconWrap: {
      width: '100%',
      height: 72,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    gridTitle: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      minHeight: 36,
    },
    gridSubtitle: {
      ...textStart,
      fontSize: typography.tiny,
      color: c.textMuted,
    },
    gridFooter: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    gridMeta: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
    },
  });
}
