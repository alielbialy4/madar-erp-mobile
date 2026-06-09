import React, { useRef, useCallback } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { flexRow } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { AppText } from './AppText';

export function AppChip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: React.ReactNode }) {
  const c = useColors();
  const scaleRef = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    if (onPress) {
      Animated.spring(scaleRef, { toValue: 0.94, friction: 5, tension: 200, useNativeDriver: true }).start();
    }
  }, [onPress, scaleRef]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleRef, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [scaleRef]);

  const Wrapper = onPress ? Pressable : View;

  return (
    <Animated.View style={{ transform: [{ scale: scaleRef }] }}>
      <Wrapper
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={{
          ...flexRow,
          alignItems: 'center',
          gap: spacing.xs,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: active ? c.accent : c.border,
          backgroundColor: active ? c.accentSoft : c.surface,
        }}
      >
        {icon}
        <AppText style={{
          fontSize: 12,
          fontFamily: active ? 'Tajawal_700Bold' : 'Tajawal_500Medium',
          fontWeight: active ? '700' : '500',
          color: active ? c.accent : c.textMuted,
          writingDirection: 'rtl',
        }}>
          {label}
        </AppText>
      </Wrapper>
    </Animated.View>
  );
}
