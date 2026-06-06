import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton, AppInput, AppPicker } from '@/components/ui';
import { FormSection } from '@/components/forms/FormSection';
import type { OpeningStockInput, ProductUnitInput } from '@/types/api';
import { createEditorStyles } from '@/styles/createEditorStyles';
import { useColors } from '@/hooks/useColors';

type WarehouseOption = { id: string; name: string };

type Props = {
  value: OpeningStockInput[];
  onChange: (next: OpeningStockInput[]) => void;
  warehouses: WarehouseOption[];
  units: ProductUnitInput[];
};

export function OpeningStockEditor({ value, onChange, warehouses, units }: Props) {
  const c = useColors();
  const styles = useMemo(() => createEditorStyles(c), [c]);
  const rows = value.length > 0 ? value : [{ warehouse_id: warehouses[0]?.id ?? '', quantity: 0, unit_index: 0 }];

  const warehouseOptions = warehouses.map((w) => ({ label: w.name, value: w.id }));
  const unitOptions = units.map((u, i) => ({ label: u.name, value: String(i) }));

  return (
    <FormSection title="مخزون افتتاحي" subtitle="يُطبّق عند إنشاء المنتج فقط" icon="inventory-2">
      <View style={styles.section}>
        {rows.map((row, index) => (
          <View key={index} style={styles.row}>
            <AppPicker
              label="المخزن"
              value={row.warehouse_id || null}
              options={warehouseOptions}
              onChange={(warehouse_id) => {
                const next = [...rows];
                next[index] = { ...next[index], warehouse_id: warehouse_id ?? '' };
                onChange(next);
              }}
            />
            <AppInput
              label="الكمية"
              value={String(row.quantity)}
              onChangeText={(t) => {
                const next = [...rows];
                next[index] = { ...next[index], quantity: Number(t) || 0 };
                onChange(next);
              }}
              keyboardType="decimal-pad"
            />
            {units.length > 1 ? (
              <AppPicker
                label="الوحدة"
                value={String(row.unit_index ?? 0)}
                options={unitOptions}
                onChange={(v) => {
                  const next = [...rows];
                  next[index] = { ...next[index], unit_index: Number(v) };
                  onChange(next);
                }}
              />
            ) : null}
          </View>
        ))}
        <AppButton
          title="إضافة صف مخزون"
          size="sm"
          variant="secondary"
          onPress={() => onChange([...rows, { warehouse_id: warehouses[0]?.id ?? '', quantity: 0 }])}
        />
      </View>
    </FormSection>
  );
}
