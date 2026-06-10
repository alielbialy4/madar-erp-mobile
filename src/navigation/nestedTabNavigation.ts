import { CommonActions, type NavigationState, type PartialState } from '@react-navigation/native';
import { navigationRef, notifyScopeResetListeners } from './navigationRef';

export function getNestedStackIndex(
  state: NavigationState | PartialState<NavigationState> | undefined,
  tabName: string,
): number | null {
  const route = state?.routes.find((r) => r.name === tabName);
  const nested = route?.state;
  if (nested && typeof nested.index === 'number') return nested.index;
  return null;
}

type TabNavigate = {
  getState: () => NavigationState | PartialState<NavigationState>;
  navigate: (name: string, params?: { screen: string }) => void;
};

/** Pops a tab's nested stack to its root screen when depth > 0. Returns true if a pop was dispatched. */
export function popTabStackToRoot(navigation: TabNavigate, tabName: string, rootScreen: string): boolean {
  const index = getNestedStackIndex(navigation.getState(), tabName);
  if (index == null || index <= 0) return false;
  navigation.navigate(tabName, { screen: rootScreen });
  return true;
}

/** Full app navigation reset after global↔branch scope change (mirrors web `window.location.reload`). */
export function resetAppNavigationOnScopeChange(): void {
  if (!navigationRef.isReady()) return;

  navigationRef.dispatch(
    CommonActions.reset({
      index: 0,
      routes: [
        { name: 'DashboardTab' },
        {
          name: 'POSTab',
          state: { index: 0, routes: [{ name: 'POSHome' }] },
        },
        {
          name: 'ProductsTab',
          state: { index: 0, routes: [{ name: 'ProductsHome' }] },
        },
        {
          name: 'SalesTab',
          state: { index: 0, routes: [{ name: 'SalesHome' }] },
        },
        {
          name: 'MoreTab',
          state: { index: 0, routes: [{ name: 'MoreHome' }] },
        },
      ],
    }),
  );

  notifyScopeResetListeners();
}
