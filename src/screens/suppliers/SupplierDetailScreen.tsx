import React, { useEffect } from 'react';
import { AppLoadingState } from '@/components/feedback';
import { AppScreen } from '@/components/layout';

/** يحوّل الروابط القديمة إلى تقرير المورد (مطابق للويب `/suppliers/report/:id`). */
export function SupplierDetailScreen({ route, navigation }: { route: any; navigation: any }) {
  const { id, name } = route.params ?? {};

  useEffect(() => {
    if (id != null) {
      navigation.replace('SupplierReport', { id, name });
    } else {
      navigation.goBack();
    }
  }, [id, name, navigation]);

  return (
    <AppScreen title="تقرير المورد" onBack={navigation.goBack}>
      <AppLoadingState />
    </AppScreen>
  );
}
