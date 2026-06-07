import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { chevronForwardIcon } from '@/utils/rtl';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Text } from '@/components/ui/AppText';
import { createListRowChrome } from '@/styles/listRowChrome';

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
  const chrome = useMemo(() => createListRowChrome(c), [c]);
  const styles = useMemo(() => StyleSheet.create({
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
        chrome.card,
        pressed && onPress ? chrome.cardPressed : undefined,
      ]}
    >
      {leading ? <View>{leading}</View> : null}
      {badge ? <View>{badge}</View> : null}
      <View style={chrome.content}>
        <Text style={styles.titleText} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={styles.subtitleText} numberOfLines={2}>{subtitle}</Text> : null}
        {meta ? <Text style={[styles.metaText, metaLtr ? textLtr : undefined]} numberOfLines={1}>{meta}</Text> : null}
      </View>
      {showChevron && onPress ? (
        <MaterialIcons name={chevronForwardIcon()} size={20} color={c.textCaption} />
      ) : null}
    </Pressable>
  );
}
