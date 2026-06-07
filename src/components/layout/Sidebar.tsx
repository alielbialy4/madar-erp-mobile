import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from '@/components/ui/AppText';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { MotiView } from 'moti';
import { AppIcon } from '@/components/ui/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppColors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { AppInput } from '@/components/ui/AppInput';
import { slideInX } from '@/utils/animations';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useThemeStore } from '@/store/themeStore';
import { hasFeature, hasPermission } from '@/utils/permissions';
import { glassTokens } from '@/constants/glass';
import {
  buildMobileSidebarMenu,
  type MobileSidebarMenuItem,
} from '@/navigation/buildSidebarMenu';
import { isNavItemActive } from '@/navigation/sidebarNavMap';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import type { NavCatalogEntry } from '@/navigation/navCatalog';
import type { RecentRoute } from '@/services/navigation/recentRoutes';
import { chevronForwardIcon, drawerClosedTranslateX, isRtl } from '@/utils/rtl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(310, SCREEN_WIDTH * 0.84);

type Props = {
  visible: boolean;
  onClose: () => void;
  activeRoute?: string;
  onNavigate: (action: SidebarNavAction) => void;
  recentRoutes?: RecentRoute[];
  catalog?: NavCatalogEntry[];
  onOpenCommandPalette?: () => void;
};

function getMenuKey(item: MobileSidebarMenuItem, index: number): string {
  if (item.type === 'section') return `section:${item.label}:${index}`;
  return item.id ?? `item:${item.label}:${index}`;
}

function hasActiveDescendant(item: MobileSidebarMenuItem, activeRoute?: string): boolean {
  if (isNavItemActive(item, activeRoute)) return true;
  return Boolean(item.subItems?.some((sub) => hasActiveDescendant(sub, activeRoute)));
}

export function Sidebar({
  visible,
  onClose,
  activeRoute,
  onNavigate,
  recentRoutes = [],
  catalog = [],
  onOpenCommandPalette,
}: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const viewMode = useBranchStore((state) => state.viewMode);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const menu = useMemo(
    () => buildMobileSidebarMenu(isSuperAdmin, (perm) => hasPermission(user, perm), viewMode, (feature) => hasFeature(user, feature)),
    [isSuperAdmin, user, viewMode],
  );

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const closedX = drawerClosedTranslateX(SIDEBAR_WIDTH);
  const slideX = useRef(new Animated.Value(closedX)).current;

  useEffect(() => {
    if (visible) { slideInX(slideX, closedX); } else { slideX.setValue(closedX); }
  }, [visible, slideX, closedX]);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menu;
    const filterTree = (items: MobileSidebarMenuItem[]): MobileSidebarMenuItem[] =>
      items.map((item) => {
        if (item.type === 'section') return item;
        const labelMatch = item.label.toLowerCase().includes(q);
        const subs = item.subItems ? filterTree(item.subItems) : undefined;
        if (labelMatch || (subs && subs.length > 0)) return { ...item, subItems: subs };
        return null;
      }).filter(Boolean) as MobileSidebarMenuItem[];
    return filterTree(menu);
  }, [menu, search]);

  useEffect(() => {
    if (!visible) return;
    const defaults: Record<string, boolean> = {};
    menu.forEach((item, index) => {
      if (item.subItems?.length && hasActiveDescendant(item, activeRoute)) {
        defaults[getMenuKey(item, index)] = true;
      }
    });
    setOpenMenus((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const [key, value] of Object.entries(defaults)) {
        if (value && !next[key]) { next[key] = true; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [visible, activeRoute, menu]);

  const toggleGroup = useCallback((key: string) => { setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] })); }, []);
  const handleNavigate = useCallback((action: SidebarNavAction) => { onClose(); onNavigate(action); }, [onClose, onNavigate]);

  const recentEntries = useMemo(() => {
    return recentRoutes.map((r) => catalog.find((e) => e.id === r.id)).filter(Boolean) as NavCatalogEntry[];
  }, [recentRoutes, catalog]);

  const fg = c.sidebarForeground;
  const muted = 'rgba(255,255,255,0.55)';
  const border = 'rgba(255,255,255,0.08)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={onClose} />
        <View style={[StyleSheet.absoluteFill, { direction: 'ltr', zIndex: 2 }]} pointerEvents="box-none">
          <Animated.View style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: SIDEBAR_WIDTH,
            direction: 'rtl',
            borderTopLeftRadius: radius.xxxl, borderBottomLeftRadius: radius.xxxl,
            overflow: 'hidden', elevation: 16,
            shadowColor: '#000', shadowOffset: { width: -4, height: 0 }, shadowOpacity: 0.3, shadowRadius: 20,
            paddingTop: insets.top, paddingBottom: insets.bottom,
            transform: [{ translateX: slideX }],
          }}>
            <BlurView intensity={60} tint="dark" style={{ flex: 1 }}>
              <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.35)' }}>

                <View style={{ height: 60, ...flexRow, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border }}>
                  <View style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <BrandLogo height={34} inverted />
                  </View>
                  <Text style={{ color: fg, fontSize: 16, fontFamily: fonts.bold, flex: 1 }}>Madar POS</Text>
                  <Pressable onPress={onClose} style={{ width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.08)' }} hitSlop={8}>
                    <AppIcon name="x" size={18} color={fg} />
                  </Pressable>
                </View>

                <View style={{ paddingHorizontal: spacing.lg, paddingBottom: spacing.sm, gap: spacing.sm }}>
                  <AppInput value={search} onChangeText={setSearch} placeholder="ابحث عن شاشة..." returnKeyType="search" />
                  {onOpenCommandPalette ? (
                    <Pressable style={({ pressed }) => [{ ...flexRow, alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: border, backgroundColor: 'rgba(255,255,255,0.06)' }, pressed && { opacity: 0.7 }]} onPress={onOpenCommandPalette}>
                      <AppIcon name="magnifying-glass" size={16} color={fg} />
                      <Text style={{ ...textStart, flex: 1, fontSize: typography.caption, fontFamily: fonts.medium, color: muted }}>بحث سريع — كل الشاشات</Text>
                    </Pressable>
                  ) : null}
                </View>

                <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: spacing.sm, paddingBottom: spacing.xxxl }} showsVerticalScrollIndicator={false}>
                  {recentEntries.length > 0 ? (
                    <View style={{ paddingBottom: spacing.md, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: border, marginBottom: spacing.sm }}>
                      <Text style={{ ...textStart, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs, fontSize: 11, fontFamily: fonts.bold, color: muted, letterSpacing: 0.5 }}>استخدمت مؤخراً</Text>
                      {recentEntries.map((entry, idx) => (
                        <MotiView key={`recent-${entry.id}`} from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: idx * 40, type: 'spring', damping: 20 }}>
                          <DrawerNavItem icon={resolveSidebarIcon(entry.icon)} label={entry.label} active={activeRoute === entry.id} onPress={() => handleNavigate(entry.nav)} fg={fg} muted={muted} border={border} accentColor={c.accent} />
                        </MotiView>
                      ))}
                    </View>
                  ) : null}
                  {filteredMenu.map((entry, index) => (
                    <MotiView key={getMenuKey(entry, index)} from={{ opacity: 0, translateX: 20 }} animate={{ opacity: 1, translateX: 0 }} transition={{ delay: index * 30, type: 'spring', damping: 20 }}>
                      <DrawerTreeItem item={entry} menuKey={getMenuKey(entry, index)} depth={0} activeRoute={activeRoute} isOpen={Boolean(openMenus[getMenuKey(entry, index)])} onToggle={() => toggleGroup(getMenuKey(entry, index))} onNavigate={handleNavigate} fg={fg} muted={muted} border={border} accentColor={c.accent} />
                    </MotiView>
                  ))}
                </ScrollView>

                <View style={{ borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: border, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm, backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <Text style={{ ...textStart, fontSize: typography.caption, fontFamily: fonts.bold, color: fg }} numberOfLines={1}>{user?.name ?? 'المستخدم'}</Text>
                  <View style={{ ...flexRow, gap: spacing.sm }}>
                    <Pressable style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.7 }]} onPress={() => handleNavigate({ kind: 'more', screen: 'Profile' })}>
                      <AppIcon name="user" size={18} color={fg} />
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.7 }]} onPress={() => handleNavigate({ kind: 'more', screen: 'Settings' })}>
                      <AppIcon name="gear" size={18} color={fg} />
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.footerBtn, pressed && { opacity: 0.7 }]} onPress={toggleTheme}>
                      <AppIcon name={theme === 'dark' ? 'sun' : 'moon'} size={18} color={fg} />
                    </Pressable>
                    <Pressable style={({ pressed }) => [styles.footerBtn, { backgroundColor: 'rgba(239,68,68,0.12)' }, pressed && { opacity: 0.7 }]} onPress={() => void logout()}>
                      <AppIcon name="sign-out" size={18} color="#EF4444" />
                    </Pressable>
                  </View>
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  footerBtn: {
    width: 40, height: 40, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});

function DrawerTreeItem({ item, menuKey, depth, activeRoute, isOpen, onToggle, onNavigate, fg, muted, border, accentColor }: {
  item: MobileSidebarMenuItem; menuKey: string; depth: number; activeRoute?: string; isOpen: boolean;
  onToggle: () => void; onNavigate: (action: SidebarNavAction) => void;
  fg: string; muted: string; border: string; accentColor: string;
}) {
  if (item.type === 'section') {
    return (
      <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs }}>
        <View style={{ flex: 1, height: 1, backgroundColor: border }} />
        <Text style={{ fontSize: 11, fontFamily: fonts.bold, color: muted, letterSpacing: 0.5 }}>{item.label}</Text>
        <View style={{ flex: 1, height: 1, backgroundColor: border }} />
      </View>
    );
  }

  const icon = resolveSidebarIcon(item.icon);
  const active = hasActiveDescendant(item, activeRoute);
  const hasChildren = Boolean(item.subItems?.length);

  if (hasChildren) {
    return (
      <View>
        <DrawerNavItem icon={icon} label={item.label} active={active} expandable expanded={isOpen} onPress={onToggle} fg={fg} muted={muted} border={border} accentColor={accentColor} />
        {isOpen ? item.subItems!.map((sub, idx) => (
          <DrawerTreeItem key={`${menuKey}-sub-${idx}`} item={sub} menuKey={`${menuKey}-sub-${idx}`} depth={depth + 1} activeRoute={activeRoute} isOpen={false} onToggle={() => undefined} onNavigate={onNavigate} fg={fg} muted={muted} border={border} accentColor={accentColor} />
        )) : null}
      </View>
    );
  }

  if (!item.nav) return null;
  return <DrawerNavItem icon={icon} label={item.label} active={isNavItemActive(item, activeRoute)} nested={depth > 0} onPress={() => onNavigate(item.nav!)} fg={fg} muted={muted} border={border} accentColor={accentColor} />;
}

type IconName = Parameters<typeof AppIcon>[0]['name'];

function DrawerNavItem({ icon, label, active, nested, expandable, expanded, onPress, fg, muted, border, accentColor }: {
  icon: string; label: string; active: boolean; nested?: boolean;
  expandable?: boolean; expanded?: boolean; onPress: () => void;
  fg: string; muted: string; border: string; accentColor: string;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [
      { ...flexRow, alignItems: 'center', gap: spacing.md, minHeight: 44, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.xl, marginHorizontal: spacing.sm },
      nested ? { marginStart: spacing.lg, minHeight: 40 } : undefined,
      active ? { backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: StyleSheet.hairlineWidth, borderColor: 'rgba(255,255,255,0.10)' } : undefined,
      pressed ? { backgroundColor: 'rgba(255,255,255,0.06)' } : undefined,
    ]}>
      <View style={{
        width: 32, height: 32, borderRadius: 12,
        alignItems: 'center', justifyContent: 'center',
        backgroundColor: active ? `${accentColor}33` : 'rgba(255,255,255,0.04)',
      }}>
        <AppIcon name={icon as IconName} size={18} weight={active ? 'fill' : undefined} color={active ? accentColor : fg} />
      </View>
      <Text style={{ ...textStart, flex: 1, fontSize: typography.body, fontFamily: active ? fonts.bold : fonts.medium, color: active ? fg : muted }} numberOfLines={1}>{label}</Text>
      {expandable ? <AppIcon name={expanded ? 'caret-up' : (isRtl ? 'caret-left' : 'caret-right')} size={16} color={muted} /> : active ? <View style={{ width: 3, height: 18, borderRadius: 2, backgroundColor: accentColor }} /> : null}
    </Pressable>
  );
}
