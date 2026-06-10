import React from 'react';
import { type RouteProp, useRoute } from '@react-navigation/native';
import { ViewModeGuard } from '@/components/security/ViewModeGuard';
import { withViewModeGuard } from '@/components/security/withViewModeGuard';
import { getAllowedModesForMoreScreen, getAllowedModesForWebRoute } from './viewModeRoutePolicy';
import type { MoreStackParamList } from '@/types/navigation';
import { ParityModuleScreen } from '@/screens/shared/ParityModuleScreen';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function guardMoreScreen<K extends keyof MoreStackParamList>(
  screen: K,
  Component: React.ComponentType<any>,
): React.ComponentType<any> {
  const modes = getAllowedModesForMoreScreen(screen);
  if (modes.length === 2) return Component;
  return withViewModeGuard(Component, modes);
}

type ParityModuleProps = React.ComponentProps<typeof ParityModuleScreen>;

export function GuardedParityModuleScreen(props: ParityModuleProps) {
  const route = useRoute<RouteProp<MoreStackParamList, 'ParityModule'>>();
  const modes = getAllowedModesForWebRoute(route.params.webRoute);
  return (
    <ViewModeGuard allowedModes={modes}>
      <ParityModuleScreen {...props} />
    </ViewModeGuard>
  );
}
