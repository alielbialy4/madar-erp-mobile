import React from 'react';
import { View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';

export function AppDivider({ style }: { style?: any }) {
  const c = useColors();
  return <View style={[{ height: 1, backgroundColor: c.borderSubtle, marginVertical: spacing.sm }, style]} />;
}
