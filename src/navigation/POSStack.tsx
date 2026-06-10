import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { POSScreen } from '@/screens/pos/POSScreen';
import { TableOrderScreen } from '@/screens/dining/TableOrderScreen';
import { WaiterPosScreen } from '@/screens/dining/WaiterPosScreen';
import type { POSStackParamList } from '@/types/navigation';
import { rtlStackScreenOptions } from './rtlScreenOptions';
import { withViewModeGuard } from '@/components/security/withViewModeGuard';
import { getAllowedModesForPosScreen } from './viewModeRoutePolicy';

const Stack = createNativeStackNavigator<POSStackParamList>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function guardPosScreen<K extends keyof POSStackParamList>(
  screen: K,
  Component: React.ComponentType<any>,
): React.ComponentType<any> {
  return withViewModeGuard(Component, getAllowedModesForPosScreen(screen));
}

export function POSStack() {
  return (
    <Stack.Navigator screenOptions={rtlStackScreenOptions}>
      <Stack.Screen name="POSHome" component={guardPosScreen('POSHome', POSScreen)} />
      <Stack.Screen name="DiningTableOrder" component={guardPosScreen('DiningTableOrder', TableOrderScreen)} />
      <Stack.Screen name="WaiterPos" component={guardPosScreen('WaiterPos', WaiterPosScreen)} />
    </Stack.Navigator>
  );
}
