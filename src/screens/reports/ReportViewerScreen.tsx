import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { BaseReportScreen } from './BaseReportScreen';

type Props = NativeStackScreenProps<MoreStackParamList, 'ReportViewer'>;

export function ReportViewerScreen({ navigation, route }: Props) {
  return <BaseReportScreen reportId={route.params.reportId} navigation={navigation} />;
}
