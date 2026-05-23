import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { POSScreen } from '@/screens/pos/POSScreen';
import { TableOrderScreen } from '@/screens/dining/TableOrderScreen';
import { WaiterPosScreen } from '@/screens/dining/WaiterPosScreen';
import type { POSStackParamList } from '@/types/navigation';
import { rtlStackScreenOptions } from './rtlScreenOptions';

const Stack = createNativeStackNavigator<POSStackParamList>();

export function POSStack() {
  return (
    <Stack.Navigator screenOptions={rtlStackScreenOptions}>
      <Stack.Screen name="POSHome" component={POSScreen} />
      <Stack.Screen name="DiningTableOrder" component={TableOrderScreen} />
      <Stack.Screen name="WaiterPos" component={WaiterPosScreen} />
    </Stack.Navigator>
  );
}
