import React, { useRef, useCallback } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { textStart } from '@/constants/layout';
import { AppText } from './AppText';
import { AppBadge } from './AppBadge';

type Props = {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
  badge?: string;
  badgeTone?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  onPress?: () => void;
  disabled?: boolean;
};

export function ModuleCard({ title, subtitle, icon, iconColor, iconBg, badge, badgeTone, onPress, disabled }: Props) {
  const c = useColors();
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (onPress && !disabled) {
      Animated.spring(scaleRef, { toValue: 0.96, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
  }, [onPress, disabled, scaleRef]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleRef]);

  const content = (
    <View style={{
      backgroundColor: disabled ? c.surfaceMuted : c.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: c.borderSubtle,
      padding: spacing.lg,
      gap: spacing.sm,
      flex: 1,
      minHeight: 100,
      opacity: disabled ? 0.5 : 1,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{
          width: 44,
          height: 44,
          borderRadius: radius.lg,
          backgroundColor: iconBg ?? c.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {icon}
        </View>
        {badge ? <AppBadge label={badge} tone={badgeTone ?? 'neutral'} /> : null}
      </View>
      <AppText style={{
        color: c.text,
        fontSize: typography.label,
        fontFamily: fonts.bold,
        fontWeight: '700',
        ...textStart,
      }} numberOfLines={1}>
        {title}
      </AppText>
      {subtitle ? (
        <AppText style={{
          color: c.textCaption,
          fontSize: typography.micro,
          fontFamily: fonts.regular,
          ...textStart,
          lineHeight: 16,
        }} numberOfLines={2}>
          {subtitle}
        </AppText>
      ) : null}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <Animated.View style={{ flex: 1, transform: [{ scale: scaleRef }] }}>
        <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          {content}
        </Pressable>
      </Animated.View>
    );
  }

  return <Animated.View style={{ flex: 1, transform: [{ scale: scaleRef }] }}>{content}</Animated.View>;
}
