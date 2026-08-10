import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton, AppInput, AppPicker } from '@/components/ui';
import { FormSection } from '@/components/forms/FormSection';
import { OPENING_STOCK_HELPER_AR } from './productFormLabels';
import { AppText as Text } from '@/components/ui/AppText';
import type { OpeningStockInput, ProductUnitInput } from '@/types/api';
import { createEditorStyles } from '@/styles/createEditorStyles';
import { useColors } from '@/hooks/useColors';
import { typography } from '@/constants/typography';
import { appTextAlignStart } from '@/constants/layout';

type WarehouseOption = { id: string; name: string };

type Props = {
  value: OpeningStockInput[];
  onChange: (next: OpeningStockInput[]) => void;
  warehouses: WarehouseOption[];
  units: ProductUnitInput[];
  embedded?: boolean;
};

export function OpeningStockEditor({ value, onChange, warehouses, units, embedded }: Props) {
  const c = useColors();
  const styles = useMemo(() => createEditorStyles(c), [c]);
  const rows = value.length > 0 ? value : [{ warehouse_id: warehouses[0]?.id ?? '', quantity: 0, unit_index: 0 }];

  const warehouseOptions = warehouses.map((w) => ({ label: w.name, value: w.id }));
  const unitOptions = units.map((u, i) => ({ label: u.name, value: String(i) }));

  const body = (
    <View style={styles.section}>
      <Text style={{ color: c.textMuted, fontSize: typography.tiny, textAlign: appTextAlignStart }}>{OPENING_STOCK_HELPER_AR}</Text>
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
  );

  if (embedded) return body;
  return (
    <FormSection title="مخزون افتتاحي" subtitle="يُطبّق عند إنشاء المنتج فقط" icon="inventory-2">
      {body}
    </FormSection>
  );
}
