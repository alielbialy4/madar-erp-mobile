import React, { useMemo, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { AppInput } from './AppInput';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { AppButton } from './AppButton';

type Props = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  minimumDate?: Date;
  maximumDate?: Date;
};

function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (match) return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return new Date();
}

export function AppDatePicker({ label, value, onChange, error, required, minimumDate, maximumDate }: Props) {
  const c = useColors();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(() => parseIsoDate(value));

  const displayValue = useMemo(() => {
    if (!value) return '';
    const d = parseIsoDate(value);
    return d.toLocaleDateString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric' });
  }, [value]);

  const onNativeChange = (event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setOpen(false);
    if (event.type === 'dismissed' || !selected) return;
    setDraft(selected);
    if (Platform.OS === 'android') onChange(toIsoDate(selected));
  };

  return (
    <View>
      <Pressable onPress={() => { setDraft(parseIsoDate(value)); setOpen(true); }}>
        <View pointerEvents="none">
          <AppInput label={label} value={displayValue || value} placeholder="اختر التاريخ" error={error} required={required} editable={false} />
        </View>
      </Pressable>

      {Platform.OS === 'android' && open ? (
        <DateTimePicker value={draft} mode="date" display="default" onChange={onNativeChange} minimumDate={minimumDate} maximumDate={maximumDate} />
      ) : null}

      {Platform.OS === 'ios' ? (
        <AppBottomSheet visible={open} onClose={() => setOpen(false)} title={label ?? 'اختر التاريخ'}>
          <View style={{ gap: spacing.md }}>
            <DateTimePicker value={draft} mode="date" display="spinner" onChange={onNativeChange} minimumDate={minimumDate} maximumDate={maximumDate} themeVariant={c.background === '#0F172A' ? 'dark' : 'light'} />
            <AppButton title="تأكيد" onPress={() => { onChange(toIsoDate(draft)); setOpen(false); }} />
          </View>
        </AppBottomSheet>
      ) : null}
    </View>
  );
}
