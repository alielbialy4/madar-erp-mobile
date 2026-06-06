import React from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppInput } from './AppInput';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import type { TextInputProps } from 'react-native';

type Props = Omit<TextInputProps, 'value' | 'onChangeText'> & {
  value: string;
  onChangeText: (value: string) => void;
  label?: string;
  compact?: boolean;
};

export function AppSearchField({ value, onChangeText, compact, ...props }: Props) {
  const c = useColors();

  return (
    <View style={{ position: 'relative' }}>
      <AppInput
        prefixIcon="search"
        value={value}
        onChangeText={onChangeText}
        placeholder={props.placeholder ?? 'بحث...'}
        returnKeyType="search"
        style={compact ? { minHeight: 40 } : undefined}
        {...props}
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText('')}
          style={{ position: 'absolute', end: spacing.md, top: compact ? 10 : 12 }}
          accessibilityRole="button"
          accessibilityLabel="مسح البحث"
        >
          <MaterialIcons name="close" size={18} color={c.textCaption} />
        </Pressable>
      ) : null}
    </View>
  );
}
