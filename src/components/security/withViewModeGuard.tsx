import React from 'react';
import { ViewModeGuard } from './ViewModeGuard';
import type { ViewMode } from '@/navigation/viewModeRoutePolicy';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function withViewModeGuard(
  Screen: React.ComponentType<any>,
  allowedModes: ViewMode[],
): React.ComponentType<any> {
  const Wrapped = (props: any) => (
    <ViewModeGuard allowedModes={allowedModes}>
      <Screen {...props} />
    </ViewModeGuard>
  );
  Wrapped.displayName = `ViewModeGuard(${Screen.displayName ?? Screen.name ?? 'Screen'})`;
  return Wrapped;
}
