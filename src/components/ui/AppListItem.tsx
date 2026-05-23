import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/AppText';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  metaLtr?: boolean;
  badge?: React.ReactNode;
  leading?: React.ReactNode;
  onPress?: () => void;
  onPressIn?: () => void;
  onLongPress?: () => void;
  showChevron?: boolean;
};

export function AppListItem({
  title,
  subtitle,
  meta,
  metaLtr,
  badge,
  leading,
  onPress,
  onPressIn,
  onLongPress,
  showChevron = !!onPress,
}: Props) {
  const c = useColors();
  const styles = useMemo(() => StyleSheet.create({
    item: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: c.borderSubtle,
      minHeight: 48,
      backgroundColor: c.surface,
    },
    pressed: { backgroundColor: c.surfaceMuted },
    leadingSlot: {},
    badgeSlot: {},
    content: { flex: 1, gap: 2 },
    titleText: {
      ...textStart,
      color: c.text,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      fontWeight: '700',
    },
    subtitleText: {
      ...textStart,
      color: c.textMuted,
      fontSize: typography.small,
      fontFamily: fonts.medium,
    },
    metaText: {
      ...textStart,
      color: c.textCaption,
      fontSize: typography.tiny,
      fontFamily: fonts.regular,
    },
  }), [c]);

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onLongPress={onLongPress}
      disabled={!onPress && !onPressIn && !onLongPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.item,
        pressed && onPress ? styles.pressed : undefined,
      ]}
    >
      {leading ? <View style={styles.leadingSlot}>{leading}</View> : null}
      {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
      <View style={styles.content}>
        <Text style={styles.titleText}>{title}</Text>
        {subtitle ? <Text style={styles.subtitleText}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.metaText, metaLtr ? textLtr : undefined]}>{meta}</Text> : null}
      </View>
      {showChevron && onPress ? (
        <MaterialIcons name={chevronForwardIcon()} size={20} color={c.textCaption} />
      ) : null}
    </Pressable>
  );
}
