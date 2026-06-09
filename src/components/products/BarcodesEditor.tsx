import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppButton, AppInput } from '@/components/ui';
import { FormSection } from '@/components/forms/FormSection';
import { generateEan13Barcode } from './productFormUtils';
import { createEditorStyles } from '@/styles/createEditorStyles';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';

type Props = {
  value: string[];
  onChange: (next: string[]) => void;
  embedded?: boolean;
};

export function BarcodesEditor({ value, onChange, embedded }: Props) {
  const c = useColors();
  const styles = useMemo(() => createEditorStyles(c), [c]);
  const rows = value.length > 0 ? value : [''];

  const body = (
    <View style={styles.section}>
      {rows.map((row, index) => (
        <View key={index} style={[styles.row, flexRow, { alignItems: 'center', gap: spacing.sm }]}>
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
          <Pressable
            onPress={() => {
              const next = [...rows];
              next[index] = generateEan13Barcode();
              onChange(next);
            }}
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: c.borderSubtle,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: c.surfaceMuted,
            }}
            accessibilityRole="button"
            accessibilityLabel="توليد باركود"
          >
            <MaterialIcons name="refresh" size={20} color={c.accent} />
          </Pressable>
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

  if (embedded) return body;
  return (
    <FormSection title="الباركودات" icon="qr-code-2">
      {body}
    </FormSection>
  );
}
