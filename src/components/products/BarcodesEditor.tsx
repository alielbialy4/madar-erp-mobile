import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppButton, AppInput } from '@/components/ui';
import { FormSection } from '@/components/forms/FormSection';
import { createEditorStyles } from '@/styles/createEditorStyles';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
};

export function BarcodesEditor({ value, onChange }: Props) {
  const c = useColors();
  const styles = useMemo(() => createEditorStyles(c), [c]);
  const rows = value.length > 0 ? value : [''];

  return (
    <FormSection title="الباركودات" icon="qr-code-2">
      <View style={styles.section}>
        {rows.map((row, index) => (
          <View key={index} style={[styles.row, flexRow, { alignItems: 'center' }]}>
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
    </FormSection>
  );
}
