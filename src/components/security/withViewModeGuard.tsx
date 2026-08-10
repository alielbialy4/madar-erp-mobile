import React from 'react';
import { ViewModeGuard } from './ViewModeGuard';
import type { ViewMode } from '@/navigation/viewModeRoutePolicy';


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
