import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppButton, AppInput } from '@/components/ui';
import { FormSection, SwitchRow } from '@/components/forms/FormSection';
import type { ProductUnitInput } from '@/types/api';
import { useColors } from '@/hooks/useColors';
import { createEditorStyles } from '@/styles/createEditorStyles';

type Props = {
  value: ProductUnitInput[];
  onChange: (next: ProductUnitInput[]) => void;
  embedded?: boolean;
};

const defaultUnit = (): ProductUnitInput => ({
  name: 'قطعة',
  factor_to_base: 1,
  is_base: true,
});

export function UnitsEditor({ value, onChange, embedded }: Props) {
  const c = useColors();
  const styles = useMemo(() => createEditorStyles(c), [c]);
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

  const body = (
    <View style={styles.section}>
      {rows.map((unit, index) => (
        <View
          key={index}
          style={[
            styles.row,
            unit.is_base ? { borderColor: c.accentBorder, backgroundColor: c.softPrimary } : undefined,
          ]}
        >
          {unit.is_base ? (
            <Text style={{ color: c.accent, fontWeight: '700' }}>الوحدة الأساسية</Text>
          ) : null}
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
          <SwitchRow
            label="وحدة أساسية"
            value={unit.is_base}
            onValueChange={(is_base) => update(index, { is_base })}
          />
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

  if (embedded) return body;
  return (
    <FormSection title="الوحدات" icon="straighten">
      {body}
    </FormSection>
  );
}
