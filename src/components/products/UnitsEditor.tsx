import React from 'react';
import { Switch, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput, AppSectionHeader } from '@/components/ui';
import type { ProductUnitInput } from '@/types/api';
import { useColors } from '@/hooks/useColors';

type Props = {
  value: ProductUnitInput[];
  onChange: (next: ProductUnitInput[]) => void;
};

const defaultUnit = (): ProductUnitInput => ({
  name: 'قطعة',
  factor_to_base: 1,
  is_base: true,
});

export function UnitsEditor({ value, onChange }: Props) {
  const c = useColors();
  const rows = value.length > 0 ? value : [defaultUnit()];

  const update = (index: number, patch: Partial<ProductUnitInput>) => {
    const next = rows.map((u, i) => (i === index ? { ...u, ...patch } : u));
    if (patch.is_base) {
      next.forEach((u, i) => {
        next[i] = { ...u, is_base: i === index };
      });
    }
    onChange(next);
  };

  return (
    <View style={{ gap: 10 }}>
      <AppSectionHeader title="الوحدات" />
      {rows.map((unit, index) => (
        <View key={index} style={{ gap: 8, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: c.border }}>
          <AppInput label="اسم الوحدة" value={unit.name} onChangeText={(name) => update(index, { name })} />
          <AppInput
            label="معامل التحويل"
            value={String(unit.factor_to_base)}
            onChangeText={(t) => update(index, { factor_to_base: Number(t) || 1 })}
            keyboardType="decimal-pad"
          />
          <AppInput
            label="باركود الوحدة"
            value={unit.barcode ?? ''}
            onChangeText={(barcode) => update(index, { barcode })}
          />
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ color: c.text }}>وحدة أساسية</Text>
            <Switch value={unit.is_base} onValueChange={(is_base) => update(index, { is_base })} />
          </View>
          {rows.length > 1 ? (
            <AppButton title="حذف الوحدة" size="sm" variant="outline" onPress={() => onChange(rows.filter((_, i) => i !== index))} />
          ) : null}
        </View>
      ))}
      <AppButton
        title="إضافة وحدة"
        size="sm"
        variant="secondary"
        onPress={() => onChange([...rows, { name: '', factor_to_base: 1, is_base: false }])}
      />
    </View>
  );
}
