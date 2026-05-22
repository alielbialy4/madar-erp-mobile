import React from 'react';
import { AppCard, AppSectionHeader } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';

export function ActionUnavailable({ message = 'هذه الميزة غير متاحة حالياً' }: { message?: string }) {
  return (
    <AppCard>
      <AppSectionHeader title="تنبيه" />
      <AppEmptyState title="لا يمكن تنفيذ هذه العملية حالياً" message={message} />
    </AppCard>
  );
}
