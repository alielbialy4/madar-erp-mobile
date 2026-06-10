import React, { useMemo } from 'react';
import { View } from 'react-native';
import { AppDatePicker } from './AppDatePicker';
import { AppText } from './AppText';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { parseIsoDateLocal } from '@/utils/dateLocal';

type Props = {
  fromDate: string;
  toDate: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
  title?: string;
};

export function AppDateRangePicker({
  fromDate,
  toDate,
  onChangeFrom,
  onChangeTo,
  title = 'الفترة',
}: Props) {
  const fromParsed = useMemo(() => parseIsoDateLocal(fromDate), [fromDate]);
  const toParsed = useMemo(() => parseIsoDateLocal(toDate), [toDate]);

  return (
    <View style={{ gap: spacing.md }}>
      <AppText style={textStart}>{title}</AppText>
      <AppDatePicker
        label="من تاريخ"
        value={fromDate}
        onChange={onChangeFrom}
        maximumDate={toDate ? toParsed : undefined}
      />
      <AppDatePicker
        label="إلى تاريخ"
        value={toDate}
        onChange={onChangeTo}
        minimumDate={fromDate ? fromParsed : undefined}
      />
    </View>
  );
}
