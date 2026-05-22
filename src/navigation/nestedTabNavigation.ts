import type { NavigationState, PartialState } from '@react-navigation/native';

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
