import React from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from './AppText';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { chevronForwardIcon } from '@/utils/rtl';

type Props = {
  title: string;
  subtitle?: string;
  meta?: string;
  metaLtr?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
  right?: React.ReactNode;
  onPress?: () => void;
  style?: any;
};

export function AppListCard({ title, subtitle, meta, metaLtr, icon, right, onPress, style }: Props) {
  const c = useColors();

  const content = (
    <>
      {icon ? (
        <View style={{ width: 44, height: 44, borderRadius: radius.lg, backgroundColor: c.softPrimary, alignItems: 'center', justifyContent: 'center' }}>
          <MaterialIcons name={icon} size={22} color={c.accent} />
        </View>
      ) : null}
      <View style={{ flex: 1, gap: 4 }}>
        <AppText style={{ ...textStart, fontSize: typography.body, fontFamily: fonts.bold, fontWeight: '700', color: c.text }} numberOfLines={2}>{title}</AppText>
        {subtitle ? <AppText style={{ ...textStart, fontSize: typography.label, color: c.textMuted }} numberOfLines={2}>{subtitle}</AppText> : null}
        {meta ? <AppText style={{ ...textStart, ...(metaLtr ? textLtr : {}), fontSize: typography.tiny, fontFamily: fonts.medium, color: c.textCaption }} numberOfLines={1}>{meta}</AppText> : null}
      </View>
      {right ?? (onPress ? <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} /> : null)}
    </>
  );

  if (!onPress) {
    return <View style={[{ ...flexRow, alignItems: 'center', gap: spacing.md, backgroundColor: c.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: c.borderSubtle, padding: spacing.lg, minHeight: 72 }, style]}>{content}</View>;
  }

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ ...flexRow, alignItems: 'center', gap: spacing.md, backgroundColor: pressed ? c.surfaceMuted : c.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: c.borderSubtle, padding: spacing.lg, minHeight: 72 }, style]}>
      {content}
    </Pressable>
  );
}
