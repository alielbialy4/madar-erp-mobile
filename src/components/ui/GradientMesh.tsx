import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';

interface GradientMeshProps {
  style?: ViewStyle | ViewStyle[];
  variant?: 'default' | 'subtle' | 'dark' | 'pos';
  children?: React.ReactNode;
}

export function GradientMesh({ style, variant = 'default', children }: GradientMeshProps) {
  const c = useColors();

  const colors = {
    default: [c.meshGradient1, c.meshGradient2, c.meshGradient3],
    subtle: [c.background, c.surfaceMuted, c.background],
    dark: [c.gradientStart, c.gradientEnd, '#0B1120'],
    pos: [c.meshGradient2, c.meshGradient1, c.surfaceMuted],
  }[variant];

  return (
    <LinearGradient
      colors={colors as [string, string, ...string[]]}
      style={[StyleSheet.absoluteFill, style]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {children}
    </LinearGradient>
  );
}
