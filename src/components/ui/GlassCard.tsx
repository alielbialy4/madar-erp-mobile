import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { glassTokens } from '@/constants/glass';
import { radius } from '@/constants/spacing';
import { MotiView } from 'moti';

type GlassCardVariant = 'surface' | 'elevated' | 'overlay' | 'deep';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  variant?: GlassCardVariant;
  intensity?: number;
  padding?: number;
  radius?: number;
  noShadow?: boolean;
  animated?: boolean;
  delay?: number;
}

export function GlassCard({
  children,
  style,
  variant = 'surface',
  intensity,
  padding = 16,
  radius: cardRadius = radius.card,
  noShadow = false,
  animated = false,
  delay = 0,
}: GlassCardProps) {
  const c = useColors();
  const isDark = c.surface === '#0F172A' || c.text === '#F8FAFC';

  const intensityMap = { surface: 35, elevated: 50, overlay: 70, deep: 90 };
  const blurIntensity = intensity ?? intensityMap[variant];

  const shadowMap = {
    surface: glassTokens.shadow.sm,
    elevated: glassTokens.shadow.md,
    overlay: glassTokens.shadow.lg,
    deep: glassTokens.shadow.xl,
  };
  const shadow = noShadow ? {} : shadowMap[variant];

  const content = (
    <View style={[styles.wrapper, shadow, { borderRadius: cardRadius }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={blurIntensity}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.blur, { borderRadius: cardRadius }]}
        >
          <View
            style={[
              styles.card,
              {
                borderRadius: cardRadius,
                padding,
                backgroundColor: isDark ? 'rgba(30,41,59,0.45)' : 'rgba(255,255,255,0.50)',
                borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.60)',
                borderWidth: StyleSheet.hairlineWidth,
              },
              style as any,
            ]}
          >
            {children}
          </View>
        </BlurView>
      ) : (
        <LinearGradient
          colors={isDark ? ['rgba(30,41,59,0.98)', 'rgba(30,41,59,0.95)'] : ['#FFFFFF', '#FAFBFF']}
          style={[styles.card, { borderRadius: cardRadius, padding, borderWidth: StyleSheet.hairlineWidth, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.04)' }, style as any]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          {children}
        </LinearGradient>
      )}
      {/* Top highlight line for premium glass feel */}
      <View
        style={[
          styles.highlight,
          {
            borderRadius: cardRadius,
            borderTopLeftRadius: cardRadius,
            borderTopRightRadius: cardRadius,
          },
        ]}
      />
    </View>
  );

  if (animated) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: 12, scale: 0.96 }}
        animate={{ opacity: 1, translateY: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 20, stiffness: 180, delay }}
      >
        {content}
      </MotiView>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    overflow: 'hidden',
  },
  blur: {
    overflow: 'hidden',
  },
  card: {
    overflow: 'hidden',
  },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
});
