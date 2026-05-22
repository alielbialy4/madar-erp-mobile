import React from 'react';
import { View } from 'react-native';
import { AppInput, AppText } from '@/components/ui';
import { spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';

type Props = {
  fromDate: string;
  toDate: string;
  onChangeFrom: (value: string) => void;
  onChangeTo: (value: string) => void;
};

export function ReportDateRangePicker({ fromDate, toDate, onChangeFrom, onChangeTo }: Props) {
  return (
    <View style={{ gap: spacing.md }}>
      <AppText style={textStart}>الفترة</AppText>
      <AppInput label="من تاريخ" value={fromDate} onChangeText={onChangeFrom} placeholder="YYYY-MM-DD" />
      <AppInput label="إلى تاريخ" value={toDate} onChangeText={onChangeTo} placeholder="YYYY-MM-DD" />
    </View>
  );
}
