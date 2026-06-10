import React from 'react';
import { AppBanner } from '@/components/feedback';
import { useInventoryScope } from '@/hooks/useInventoryScope';

type Props = {
  variant?: 'general' | 'directory';
};

export function InventoryScopeBanner({ variant = 'general' }: Props) {
  const { isGlobalView, scopeHint, directoryReadOnlyHint } = useInventoryScope();
  const message = variant === 'directory' && !isGlobalView ? directoryReadOnlyHint : scopeHint;
  if (!message) return null;
  return (
    <AppBanner
      tone={isGlobalView ? 'info' : 'warning'}
      message={message}
    />
  );
}
