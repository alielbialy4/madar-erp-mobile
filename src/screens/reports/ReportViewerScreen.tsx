import React, { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { MoreStackParamList } from '@/types/navigation';
import { BaseReportScreen } from './BaseReportScreen';
import { SavedReportsScreen } from './SavedReportsScreen';

type Props = NativeStackScreenProps<MoreStackParamList, 'ReportViewer'>;

export function ReportViewerScreen({ navigation, route }: Props) {
  useEffect(() => {
    if (route.params.reportId === 'raw-materials') {
      navigation.replace('RawMaterialsReport');
    }
  }, [navigation, route.params.reportId]);

  if (route.params.reportId === 'saved-reports') {
    return <SavedReportsScreen navigation={navigation} />;
  }
  if (route.params.reportId === 'raw-materials') {
    return null;
  }
  return <BaseReportScreen reportId={route.params.reportId} initialFilters={route.params.initialFilters} navigation={navigation} />;
}
