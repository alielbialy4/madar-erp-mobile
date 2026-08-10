import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { AppSearchField } from './AppSearchField';
import { AppText } from './AppText';
import { textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';

export type PickerOption = { label: string; value: string };

type Props = {
  label?: string;
  value: string | null;
  options: PickerOption[];
  onChange: (value: string | null) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  searchable?: boolean;
  disabled?: boolean;
};

export function AppPicker({ label, value, options, onChange, placeholder = 'اختر...', required, error, searchable = options.length > 5, disabled = false }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((opt) => opt.value === value);
  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
          <AppText style={{ color: c.text, fontSize: typography.label, fontFamily: fonts.medium, fontWeight: '600' }}>{label}</AppText>
          {required ? <AppText style={{ color: c.danger, fontSize: typography.label }}>*</AppText> : null}
        </View>
      ) : null}
      <Pressable
        onPress={() => setOpen(true)}
        disabled={disabled}
        accessibilityState={{ disabled }}
        style={{
          minHeight: 44,
          borderWidth: 1,
          borderColor: error ? c.danger : c.borderSubtle,
          borderRadius: radius.md,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          backgroundColor: c.surface,
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
          opacity: disabled ? 0.55 : 1,
        }}
        accessibilityRole="button"
      >
        <AppText style={{ ...textStart, flex: 1, color: selected ? c.text : c.textCaption, fontSize: typography.body }}>
          {selected?.label ?? placeholder}
        </AppText>
        <MaterialIcons name="expand-more" size={22} color={c.textCaption} />
      </Pressable>
      {error ? <AppText style={{ color: c.danger, fontSize: typography.tiny }}>{error}</AppText> : null}

      <AppBottomSheet visible={open} onClose={() => { setOpen(false); setQuery(''); }} title={label ?? placeholder}>
        {searchable ? <AppSearchField value={query} onChangeText={setQuery} compact placeholder="بحث..." /> : null}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.value}
          keyboardShouldPersistTaps="handled"
          style={{ maxHeight: 360 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => {
                onChange(item.value);
                setOpen(false);
                setQuery('');
              }}
              style={{
                paddingVertical: spacing.md,
                paddingHorizontal: spacing.sm,
                borderRadius: 0,
                borderBottomWidth: 1,
                borderBottomColor: c.border,
                backgroundColor: item.value === value ? c.accentSoft : 'transparent',
              }}
            >
              <AppText style={{ ...textStart, color: c.text, fontWeight: item.value === value ? '700' : '500' }}>{item.label}</AppText>
            </Pressable>
          )}
        />
      </AppBottomSheet>
    </View>
  );
}
