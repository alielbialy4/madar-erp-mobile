import React from 'react';
import { Pressable, View, ViewStyle } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { PressableScale } from './PressableScale';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  onPress?: () => void;
  leadingIcon?: keyof typeof MaterialIcons.glyphMap;
  leading?: React.ReactNode;
  badge?: React.ReactNode;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  badgeLabel?: string;
  showChevron?: boolean;
  style?: ViewStyle;
};

export function AppResourceRow({
  title,
  subtitle,
  meta,
  onPress,
  leadingIcon,
  leading,
  badge,
  badgeTone,
  badgeLabel,
  showChevron = Boolean(onPress),
  style,
}: Props) {
  const c = useColors();
  const content = (
    <View
      style={[
        {
          ...flexRow,
          alignItems: 'center',
          gap: spacing.md,
          padding: spacing.md,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surface,
        },
        style,
      ]}
    >
      {leading ?? (leadingIcon ? (
        <View style={{
          width: 40,
          height: 40,
          borderRadius: radius.lg,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c.accentSoft,
        }}>
          <MaterialIcons name={leadingIcon} size={20} color={c.accent} />
        </View>
      ) : null)}
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body }} numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText style={{ ...textStart, color: c.textMuted, fontSize: typography.small }} numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
        {meta ? <AppText style={{ color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.body }}>{meta}</AppText> : null}
        {badge ?? (badgeLabel ? <AppBadge label={badgeLabel} tone={badgeTone} /> : null)}
      </View>
      {showChevron ? <MaterialIcons name="chevron-left" size={20} color={c.textCaption} /> : null}
    </View>
  );

  if (!onPress) return content;
  return <PressableScale onPress={onPress}>{content}</PressableScale>;
}
