import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { BaseReportScreen } from './BaseReportScreen';
import { SavedReportsScreen } from './SavedReportsScreen';

type Props = NativeStackScreenProps<MoreStackParamList, 'ReportViewer'>;

export function ReportViewerScreen({ navigation, route }: Props) {
  if (route.params.reportId === 'saved-reports') {
    return <SavedReportsScreen navigation={navigation} />;
  }
  return <BaseReportScreen reportId={route.params.reportId} initialFilters={route.params.initialFilters} navigation={navigation} />;
}
