import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  metaLtr?: boolean;
  badge?: React.ReactNode;
  onPress?: () => void;
  showChevron?: boolean;
};

export function AppListItem({ title, subtitle, meta, metaLtr, badge, onPress, showChevron = !!onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [
        styles.item,
        pressed && onPress ? styles.pressed : undefined,
      ]}
    >
      {badge ? <View style={styles.badgeSlot}>{badge}</View> : null}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.meta, metaLtr ? textLtr : undefined]}>{meta}</Text> : null}
      </View>
      {showChevron && onPress ? (
        <MaterialIcons name={chevronForwardIcon()} size={20} color={colors.textCaption} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
    minHeight: 52,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  badgeSlot: {},
  content: { flex: 1, gap: 2 },
  title: {
    ...textStart,
    color: colors.text,
    fontSize: typography.body,
    fontFamily: fonts.bold,
    fontWeight: '700',
  },
  subtitle: {
    ...textStart,
    color: colors.textMuted,
    fontSize: typography.small,
    fontFamily: fonts.medium,
  },
  meta: {
    ...textStart,
    color: colors.textCaption,
    fontSize: typography.tiny,
    fontFamily: fonts.regular,
  },
});
