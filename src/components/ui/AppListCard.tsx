import React from 'react';
import { Pressable, StyleSheet, View, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from './AppText';
import { colors } from '@/constants/colors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { pressScale } from '@/utils/animations';
import { chevronForwardIcon } from '@/utils/rtl';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  metaLtr?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
};

export function AppListCard({ title, subtitle, meta, metaLtr, icon, right, onPress, style }: Props) {
  const content = (
    <>
      {icon ? (
        <View style={styles.iconWell}>
          <MaterialIcons name={icon} size={22} color={colors.accent} />
        </View>
      ) : null}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.meta, metaLtr ? textLtr : undefined]} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {right ?? (onPress ? <MaterialIcons name={chevronForwardIcon()} size={22} color={colors.textCaption} /> : null)}
    </>
  );

  if (!onPress) {
    return <View style={[styles.card, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed ? [styles.pressed, pressScale(true)] : undefined, style]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    padding: spacing.lg,
    minHeight: 72,
  },
  pressed: { backgroundColor: colors.surfaceMuted },
  iconWell: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: colors.softPrimary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, gap: 4 },
  title: {
    ...textStart,
    fontSize: typography.body,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.text,
  },
  subtitle: {
    ...textStart,
    fontSize: typography.small,
    color: colors.textMuted,
  },
  meta: {
    ...textStart,
    fontSize: typography.tiny,
    fontFamily: fonts.medium,
    color: colors.textCaption,
  },
});
