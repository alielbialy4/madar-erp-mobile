import type { NavigatorScreenParams } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { MainTabParamList, MoreStackParamList, ProductsStackParamList } from '@/types/navigation';
import type { SidebarNavAction } from './sidebarNavMap';

export function navigateSidebarAction(
  navigation: BottomTabNavigationProp<MainTabParamList>,
  action: SidebarNavAction,
) {
  if (action.kind === 'tab') {
    if (action.tab === 'ProductsTab') {
      navigation.navigate('ProductsTab', { screen: 'ProductsHome' });
      return;
    }
    navigation.navigate(action.tab);
    return;
  }
  if (action.kind === 'products') {
    const params = { screen: action.screen, params: action.params } as NavigatorScreenParams<ProductsStackParamList>;
    navigation.navigate('ProductsTab', params);
    return;
  }
  const params = { screen: action.screen, params: action.params } as NavigatorScreenParams<MoreStackParamList>;
  navigation.navigate('MoreTab', params);
}
