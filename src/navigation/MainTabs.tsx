import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { POSStack } from './POSStack';
import { ProductsStack } from './ProductsStack';
import { SalesStack } from './SalesStack';
import { MoreStack } from './MoreStack';
import { Sidebar } from '@/components/layout/Sidebar';
import { PersistentTabletSidebar } from '@/components/layout/PersistentTabletSidebar';
import { Navbar } from '@/components/layout/Navbar';
import { ImmersiveExitChip } from '@/components/layout/header';
import { PremiumBottomNav } from '@/components/navigation/PremiumBottomNav';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { navigateSidebarAction } from './sidebarNavigation';
import { sidebarActionKey } from './sidebarNavMap';
import type { SidebarNavAction } from './sidebarNavMap';
import { buildMobileSidebarMenu } from './buildSidebarMenu';
import { findCatalogEntry, flattenNavCatalog } from './navCatalog';
import { NavShellProvider } from './NavShellContext';
import { isPosFullscreen } from './posFullscreen';
import { contentAreaRtl, flexRow, tabletShellRow } from '@/constants/layout';
import {
  BOTTOM_NAV_HEIGHT,
  TAB_BAR_FLOAT_GAP,
  TAB_BAR_MIN_BOTTOM_INSET,
} from '@/constants/tabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useImmersiveStore } from '@/store/immersiveStore';
import { useLocaleStore } from '@/store/localeStore';
import { hasFeature, hasPermission } from '@/utils/permissions';
import type { MainTabParamList } from '@/types/navigation';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NavCatalogEntry } from './navCatalog';
import { popTabStackToRoot } from './nestedTabNavigation';
import { registerScopeResetListener } from './navigationRef';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const sceneBottomPad = isTablet ? 0 : BOTTOM_NAV_HEIGHT + TAB_BAR_FLOAT_GAP + Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET);
  const user = useAuthStore((s) => s.user);
  const viewMode = useBranchStore((s) => s.viewMode);
  const language = useLocaleStore((s) => s.language);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tabletSidebarCollapsed, setTabletSidebarCollapsed] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeSidebarRoute, setActiveSidebarRoute] = useState<string>('DashboardTab');
  const [activeTab, setActiveTab] = useState<keyof MainTabParamList>('DashboardTab');
  const tabNavigationRef = useRef<BottomTabNavigationProp<MainTabParamList> | null>(null);

  const posFullscreen = isPosFullscreen(activeTab);
  const immersive = useImmersiveStore((s) => s.enabled);
  const hideNavbar = posFullscreen || immersive;
  const showTabletSidebar = isTablet && !posFullscreen && !immersive && !tabletSidebarCollapsed;

  useEffect(() => {
    return registerScopeResetListener(() => {
      setActiveSidebarRoute('DashboardTab');
      setActiveTab('DashboardTab');
    });
  }, []);

  useEffect(() => {
    if (!isTablet) setTabletSidebarCollapsed(false);
  }, [isTablet]);

  useEffect(() => {
    if (showTabletSidebar) setSidebarOpen(false);
  }, [showTabletSidebar]);

  const menu = useMemo(
    () => buildMobileSidebarMenu(isSuperAdmin, (perm) => hasPermission(user, perm), viewMode, (feature) => hasFeature(user, feature)),
    [isSuperAdmin, user, viewMode, language],
  );

  const catalog = useMemo(() => flattenNavCatalog(menu), [menu]);

  const handleSidebarNavigate = React.useCallback(
    (action: SidebarNavAction) => {
      setSidebarOpen(false);
      setCommandOpen(false);
      const entry = findCatalogEntry(catalog, action);
      setActiveSidebarRoute(entry?.id ?? sidebarActionKey(action));
      const navigation = tabNavigationRef.current;
      if (!navigation) return;
      navigateSidebarAction(navigation, action);
    },
    [catalog],
  );

  const handleCatalogSelect = React.useCallback(
    (entry: NavCatalogEntry) => { handleSidebarNavigate(entry.nav); },
    [handleSidebarNavigate],
  );

  const tabScreenListeners = React.useCallback(
    ({ navigation, route }: { navigation: BottomTabNavigationProp<MainTabParamList>; route: { name: string } }) => ({
      focus: () => {
        tabNavigationRef.current = navigation;
        setActiveTab(route.name as keyof MainTabParamList);
        if (route.name !== 'MoreTab' && route.name !== 'ProductsTab') {
          setActiveSidebarRoute(route.name);
        }
      },
    }),
    [],
  );

  const shellActions = useMemo(
    () => ({
      openDrawer: () => {
        if (isTablet) {
          setTabletSidebarCollapsed(false);
          setSidebarOpen(false);
        } else {
          setSidebarOpen(true);
        }
      },
      openCommandPalette: () => setCommandOpen(true),
      navigate: (action: SidebarNavAction) => {
        handleSidebarNavigate(action);
      },
    }),
    [handleSidebarNavigate, isTablet],
  );

  const handleMenuPress = React.useCallback(() => {
    if (isTablet) {
      setTabletSidebarCollapsed((collapsed) => !collapsed);
      setSidebarOpen(false);
      return;
    }
    setSidebarOpen(true);
  }, [isTablet]);

  return (
    <NavShellProvider value={shellActions}>
      <View style={[styles.shell, { backgroundColor: c.background }]}>
        <View style={showTabletSidebar ? styles.tabletShellRow : styles.mainRow}>
          <View style={[styles.mainContent, showTabletSidebar ? contentAreaRtl : undefined]}>
            {!hideNavbar ? (
              <Navbar
                onMenuPress={handleMenuPress}
                onNavigate={handleSidebarNavigate}
                onOpenCommandPalette={() => setCommandOpen(true)}
                activeTab={activeTab}
                menuAccessibilityLabel={
                  isTablet
                    ? tabletSidebarCollapsed
                      ? 'إظهار القائمة الجانبية'
                      : 'إخفاء القائمة الجانبية'
                    : 'فتح القائمة'
                }
              />
            ) : null}
            <ImmersiveExitChip />
            <Tab.Navigator
          screenListeners={tabScreenListeners}
          tabBar={isTablet ? () => null : (props) => (
            <View style={styles.tabBarOverlay} pointerEvents="box-none">
              <PremiumBottomNav {...props} />
            </View>
          )}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarHideOnKeyboard: true,
            lazy: true,
            freezeOnBlur: true,
            sceneStyle: { flex: 1, minHeight: 0, paddingBottom: sceneBottomPad },
          }}
          detachInactiveScreens
        >
          <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'الرئيسية' }} />
          <Tab.Screen name="POSTab" component={POSStack} options={{ tabBarLabel: 'نقطة البيع' }} />
          <Tab.Screen name="ProductsTab" component={ProductsStack} options={{ tabBarLabel: 'المنتجات' }} />
          <Tab.Screen name="SalesTab" component={SalesStack} options={{ tabBarLabel: 'المبيعات' }} />
          <Tab.Screen
            name="MoreTab"
            component={MoreStack}
            options={{ tabBarLabel: 'المزيد' }}
            listeners={({ navigation }) => ({
              tabPress: () => {
                popTabStackToRoot(navigation, 'MoreTab', 'MoreHome');
              },
            })}
          />
            </Tab.Navigator>
          </View>
          {showTabletSidebar ? (
            <PersistentTabletSidebar
              activeRoute={activeSidebarRoute}
              onNavigate={handleSidebarNavigate}
              onOpenCommandPalette={() => setCommandOpen(true)}
            />
          ) : null}
        </View>
        <Sidebar
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeRoute={activeSidebarRoute}
          onNavigate={handleSidebarNavigate}
          onOpenCommandPalette={() => { setSidebarOpen(false); setCommandOpen(true); }}
        />
        <CommandPalette
          visible={commandOpen}
          onClose={() => setCommandOpen(false)}
          entries={catalog}
          onSelect={handleCatalogSelect}
        />
      </View>
    </NavShellProvider>
  );
}

const styles = StyleSheet.create({
  shell: { flex: 1, overflow: 'visible' },
  mainRow: { flex: 1, ...flexRow, minHeight: 0 },
  tabletShellRow,
  mainContent: { flex: 1, minWidth: 0, minHeight: 0 },
  tabBarOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    elevation: 0,
    shadowOpacity: 0,
    zIndex: 100,
  },
});
