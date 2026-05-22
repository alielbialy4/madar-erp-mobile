import React from 'react';
import { View } from 'react-native';
import { AppButton, AppInput, AppSectionHeader, AppSelect } from '@/components/ui';
import type { OpeningStockInput, ProductUnitInput } from '@/types/api';

type WarehouseOption = { id: string; name: string };

type Props = {
  value: OpeningStockInput[];
  onChange: (next: OpeningStockInput[]) => void;
  warehouses: WarehouseOption[];
  units: ProductUnitInput[];
};

export function OpeningStockEditor({ value, onChange, warehouses, units }: Props) {
  const rows = value.length > 0 ? value : [{ warehouse_id: warehouses[0]?.id ?? '', quantity: 0, unit_index: 0 }];

  return (
    <View style={{ gap: 10 }}>
      <AppSectionHeader title="مخزون افتتاحي (إنشاء)" />
      {rows.map((row, index) => (
        <View key={index} style={{ gap: 8 }}>
          <AppSelect
            label="المخزن"
            value={row.warehouse_id || null}
            options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
            onChange={(warehouse_id) => {
              const next = [...rows];
              next[index] = { ...next[index], warehouse_id };
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
            <AppSelect
              label="الوحدة"
              value={String(row.unit_index ?? 0)}
              options={units.map((u, i) => ({ label: u.name, value: String(i) }))}
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
  );
}
