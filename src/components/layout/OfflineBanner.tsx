import React from 'react';
import { AppBanner } from '@/components/feedback/AppBanner';
import { useNetworkStore } from '@/store/networkStore';

export function OfflineBanner() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  if (isOnline) return null;
  return (
    <AppBanner
      tone="warning"
      icon="wifi-off"
      message="لا يوجد اتصال بالإنترنت — البيانات المخزنة قيد الاستخدام"
    />
  );
}
