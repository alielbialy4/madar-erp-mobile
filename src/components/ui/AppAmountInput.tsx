import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppInput } from './AppInput';
import { money } from '@/utils/format';
import { textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';

type Props = {
  label?: string;
  value: string;
  onChangeText: (value: string) => void;
  error?: string;
  required?: boolean;
};

export function AppAmountInput({ label, value, onChangeText, error, required }: Props) {
  const c = useColors();
  const numeric = value.replace(/[^\d.]/g, '');

  return (
    <View style={{ gap: 4 }}>
      <AppInput
        label={label}
        value={numeric}
        onChangeText={(text) => onChangeText(text.replace(/[^\d.]/g, ''))}
        keyboardType="decimal-pad"
        error={error}
        required={required}
      />
      {numeric ? (
        <AppText style={{ ...textStart, color: c.textMuted, fontSize: typography.tiny }}>
          {money(Number(numeric) || 0)}
        </AppText>
      ) : null}
    </View>
  );
}

type DateProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
};

export function AppDatePicker({ label, value, onChange, error, required }: DateProps) {
  return (
    <AppInput
      label={label}
      value={value}
      onChangeText={onChange}
      placeholder="YYYY-MM-DD"
      error={error}
      required={required}
    />
  );
}
