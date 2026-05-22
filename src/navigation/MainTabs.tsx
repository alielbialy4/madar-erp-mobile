import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DashboardScreen } from '@/screens/dashboard/DashboardScreen';
import { POSStack } from './POSStack';
import { ProductsStack } from './ProductsStack';
import { SalesStack } from './SalesStack';
import { MoreStack } from './MoreStack';
import { Sidebar } from '@/components/layout/Sidebar';
import { Navbar } from '@/components/layout/Navbar';
import { PremiumBottomNav } from '@/components/navigation/PremiumBottomNav';
import { CommandPalette } from '@/components/navigation/CommandPalette';
import { navigateSidebarAction } from './sidebarNavigation';
import { sidebarActionKey } from './sidebarNavMap';
import type { SidebarNavAction } from './sidebarNavMap';
import { buildMobileSidebarMenu } from './buildSidebarMenu';
import { flattenNavCatalog } from './navCatalog';
import { NavShellProvider } from './NavShellContext';
import { pushRecentRoute, getRecentRoutes, type RecentRoute } from '@/services/navigation/recentRoutes';
import { rootRtl, screenRtl } from '@/constants/layout';
import {
  BOTTOM_NAV_HEIGHT,
  TAB_BAR_FLOAT_GAP,
  TAB_BAR_MIN_BOTTOM_INSET,
} from '@/constants/tabBar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { hasFeature, hasPermission } from '@/utils/permissions';
import type { MainTabParamList } from '@/types/navigation';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NavCatalogEntry } from './navCatalog';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const sceneBottomPad =
    BOTTOM_NAV_HEIGHT + TAB_BAR_FLOAT_GAP + Math.max(insets.bottom, TAB_BAR_MIN_BOTTOM_INSET);
  const user = useAuthStore((s) => s.user);
  const viewMode = useBranchStore((s) => s.viewMode);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [activeSidebarRoute, setActiveSidebarRoute] = useState<string>('DashboardTab');
  const [recentRoutes, setRecentRoutes] = useState<RecentRoute[]>([]);
  const tabNavigationRef = useRef<BottomTabNavigationProp<MainTabParamList> | null>(null);

  const menu = useMemo(
    () =>
      buildMobileSidebarMenu(
        isSuperAdmin,
        (perm) => hasPermission(user, perm),
        viewMode,
        (feature) => hasFeature(user, feature),
      ),
    [isSuperAdmin, user, viewMode],
  );

  const catalog = useMemo(() => flattenNavCatalog(menu), [menu]);

  const loadRecent = useCallback(async () => {
    setRecentRoutes(await getRecentRoutes());
  }, []);

  useEffect(() => {
    if (sidebarOpen) void loadRecent();
  }, [sidebarOpen, loadRecent]);

  const recordRecent = useCallback(
    (action: SidebarNavAction) => {
      const id = sidebarActionKey(action);
      const entry = catalog.find((e) => e.id === id);
      const label = entry?.label ?? id;
      void pushRecentRoute(id, label).then(() => loadRecent());
    },
    [catalog, loadRecent],
  );

  const handleSidebarNavigate = useCallback(
    (action: SidebarNavAction) => {
      setSidebarOpen(false);
      setCommandOpen(false);
      setActiveSidebarRoute(sidebarActionKey(action));
      recordRecent(action);
      const navigation = tabNavigationRef.current;
      if (!navigation) return;
      navigateSidebarAction(navigation, action);
    },
    [recordRecent],
  );

  const handleCatalogSelect = useCallback(
    (entry: NavCatalogEntry) => {
      handleSidebarNavigate(entry.nav);
    },
    [handleSidebarNavigate],
  );

  const tabScreenListeners = useCallback(
    ({ navigation, route }: { navigation: BottomTabNavigationProp<MainTabParamList>; route: { name: string } }) => ({
      focus: () => {
        tabNavigationRef.current = navigation;
        if (route.name !== 'MoreTab' && route.name !== 'ProductsTab') {
          setActiveSidebarRoute(route.name);
        }
      },
    }),
    [],
  );

  const shellActions = useMemo(
    () => ({
      openDrawer: () => setSidebarOpen(true),
      openCommandPalette: () => setCommandOpen(true),
    }),
    [],
  );

  return (
    <NavShellProvider value={shellActions}>
      <View style={[styles.shell, rootRtl, screenRtl, { backgroundColor: c.background }]}>
        <Navbar
          onMenuPress={() => setSidebarOpen(true)}
          onNavigate={handleSidebarNavigate}
          onOpenCommandPalette={() => setCommandOpen(true)}
        />
        <Tab.Navigator
          screenListeners={tabScreenListeners}
          tabBar={(props) => (
            <View style={styles.tabBarOverlay} pointerEvents="box-none">
              <PremiumBottomNav {...props} />
            </View>
          )}
          screenOptions={{
            headerShown: false,
            tabBarShowLabel: false,
            tabBarHideOnKeyboard: true,
            sceneStyle: { paddingBottom: sceneBottomPad },
          }}
        >
          <Tab.Screen name="DashboardTab" component={DashboardScreen} options={{ tabBarLabel: 'الرئيسية' }} />
          <Tab.Screen name="POSTab" component={POSStack} options={{ tabBarLabel: 'نقطة البيع' }} />
          <Tab.Screen name="ProductsTab" component={ProductsStack} options={{ tabBarLabel: 'المنتجات' }} />
          <Tab.Screen name="SalesTab" component={SalesStack} options={{ tabBarLabel: 'المبيعات' }} />
          <Tab.Screen name="MoreTab" component={MoreStack} options={{ tabBarLabel: 'المزيد' }} />
        </Tab.Navigator>
        <Sidebar
          visible={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          activeRoute={activeSidebarRoute}
          onNavigate={handleSidebarNavigate}
          recentRoutes={recentRoutes}
          catalog={catalog}
          onOpenCommandPalette={() => {
            setSidebarOpen(false);
            setCommandOpen(true);
          }}
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
  /** Custom tabBar ignores tabBarStyle — must overlay, not reserve a gray layout slot */
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
