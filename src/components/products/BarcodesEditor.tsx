import React from 'react';
import { View } from 'react-native';
import { AppButton, AppInput, AppSectionHeader } from '@/components/ui';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function BarcodesEditor({ value, onChange }: Props) {
  const rows = value.length > 0 ? value : [''];

  return (
    <View style={{ gap: 8 }}>
      <AppSectionHeader title="الباركودات" />
      {rows.map((row, index) => (
        <View key={index} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <AppInput
              value={row}
              onChangeText={(text) => {
                const next = [...rows];
                next[index] = text;
                onChange(next.filter((b, i) => b.trim() || i < next.length - 1));
              }}
              placeholder="باركود"
            />
          </View>
          {rows.length > 1 ? (
            <AppButton
              title="حذف"
              size="sm"
              variant="outline"
              onPress={() => onChange(rows.filter((_, i) => i !== index))}
            />
          ) : null}
        </View>
      ))}
      <AppButton title="إضافة باركود" size="sm" variant="secondary" onPress={() => onChange([...rows, ''])} />
    </View>
  );
}
