import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import type { AppColors } from '@/constants/colors';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { AppInput } from '@/components/ui/AppInput';
import { slideInX } from '@/utils/animations';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useThemeStore } from '@/store/themeStore';
import { hasFeature, hasPermission } from '@/utils/permissions';
import {
  buildMobileSidebarMenu,
  type MobileSidebarMenuItem,
} from '@/navigation/buildSidebarMenu';
import { sidebarActionKey } from '@/navigation/sidebarNavMap';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import type { NavCatalogEntry } from '@/navigation/navCatalog';
import type { RecentRoute } from '@/services/navigation/recentRoutes';
import { chevronForwardIcon, drawerClosedTranslateX } from '@/utils/rtl';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDEBAR_WIDTH = Math.min(300, SCREEN_WIDTH * 0.82);
const SIDEBAR_MUTED = 'rgba(255,255,255,0.55)';

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
  if (!activeRoute) return false;
  if (item.nav) {
    const key = sidebarActionKey(item.nav);
    if (key === activeRoute) return true;
  }
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
  const styles = useMemo(() => createStyles(c), [c]);
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const viewMode = useBranchStore((state) => state.viewMode);
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const isSuperAdmin = Boolean(user?.is_super_admin);

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

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');
  const closedX = drawerClosedTranslateX(SIDEBAR_WIDTH);
  const slideX = useRef(new Animated.Value(closedX)).current;

  useEffect(() => {
    if (visible) {
      slideInX(slideX, closedX);
    } else {
      slideX.setValue(closedX);
    }
  }, [visible, slideX, closedX]);

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menu;
    const filterTree = (items: MobileSidebarMenuItem[]): MobileSidebarMenuItem[] =>
      items
        .map((item) => {
          if (item.type === 'section') return item;
          const labelMatch = item.label.toLowerCase().includes(q);
          const subs = item.subItems ? filterTree(item.subItems) : undefined;
          if (labelMatch || (subs && subs.length > 0)) {
            return { ...item, subItems: subs };
          }
          return null;
        })
        .filter(Boolean) as MobileSidebarMenuItem[];
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
        if (value && !next[key]) {
          next[key] = true;
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [visible, activeRoute, menu]);

  const toggleGroup = useCallback((key: string) => {
    setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleNavigate = useCallback(
    (action: SidebarNavAction) => {
      onClose();
      onNavigate(action);
    },
    [onClose, onNavigate],
  );

  const recentEntries = useMemo(() => {
    return recentRoutes
      .map((r) => catalog.find((e) => e.id === r.id))
      .filter(Boolean) as NavCatalogEntry[];
  }, [recentRoutes, catalog]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} accessibilityRole="button" accessibilityLabel="إغلاق القائمة" />
        {/* LTR host: swapLeftAndRightInRTL would mirror `right`/`left` otherwise */}
        <View style={styles.drawerHost} pointerEvents="box-none">
          <Animated.View
            style={[
              styles.drawer,
              { paddingTop: insets.top, paddingBottom: insets.bottom, transform: [{ translateX: slideX }] },
            ]}
          >
          <View style={styles.logoArea}>
            <View style={styles.logoMark}>
              <Text style={styles.logoLetter}>M</Text>
            </View>
            <Text style={styles.logoText}>Madar Pos</Text>
            <Pressable onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <MaterialIcons name="close" size={22} color={c.sidebarForeground} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <AppInput
              value={search}
              onChangeText={setSearch}
              placeholder="ابحث عن شاشة..."
              returnKeyType="search"
            />
            {onOpenCommandPalette ? (
              <Pressable style={styles.commandBtn} onPress={onOpenCommandPalette}>
                <MaterialIcons name="travel-explore" size={18} color={c.sidebarForeground} />
                <Text style={styles.commandBtnText}>بحث سريع — كل الشاشات</Text>
              </Pressable>
            ) : null}
          </View>

          <ScrollView style={styles.nav} contentContainerStyle={styles.navContent} showsVerticalScrollIndicator={false}>
            {recentEntries.length > 0 ? (
              <View style={styles.recentBlock}>
                <Text style={styles.recentTitle}>استخدمت مؤخراً</Text>
                {recentEntries.map((entry) => (
                  <SidebarNavItem
                    key={`recent-${entry.id}`}
                    icon={resolveSidebarIcon(entry.icon)}
                    label={entry.label}
                    active={activeRoute === entry.id}
                    onPress={() => handleNavigate(entry.nav)}
                    styles={styles}
                    c={c}
                  />
                ))}
              </View>
            ) : null}

            {filteredMenu.map((entry, index) => (
              <SidebarTreeItem
                key={getMenuKey(entry, index)}
                item={entry}
                menuKey={getMenuKey(entry, index)}
                depth={0}
                activeRoute={activeRoute}
                isOpen={Boolean(openMenus[getMenuKey(entry, index)])}
                onToggle={() => toggleGroup(getMenuKey(entry, index))}
                onNavigate={handleNavigate}
                styles={styles}
                c={c}
              />
            ))}
          </ScrollView>

          <View style={styles.footer}>
            <Text style={styles.footerUser} numberOfLines={1}>
              {user?.name ?? 'المستخدم'}
            </Text>
            <View style={styles.footerActions}>
              <Pressable
                style={styles.footerBtn}
                onPress={() => handleNavigate({ kind: 'more', screen: 'Profile' })}
              >
                <MaterialIcons name="person-outline" size={20} color={c.sidebarForeground} />
              </Pressable>
              <Pressable
                style={styles.footerBtn}
                onPress={() => handleNavigate({ kind: 'more', screen: 'Settings' })}
              >
                <MaterialIcons name="settings" size={20} color={c.sidebarForeground} />
              </Pressable>
              <Pressable style={styles.footerBtn} onPress={toggleTheme}>
                <MaterialIcons
                  name={theme === 'dark' ? 'light-mode' : 'dark-mode'}
                  size={20}
                  color={c.sidebarForeground}
                />
              </Pressable>
              <Pressable style={styles.footerBtn} onPress={() => void logout()}>
                <MaterialIcons name="logout" size={20} color={c.danger} />
              </Pressable>
            </View>
            <View style={styles.versionBadge}>
              <View style={styles.versionDot} />
              <Text style={styles.versionText}>v3.5.0</Text>
            </View>
          </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

function SidebarTreeItem({
  item,
  menuKey,
  depth,
  activeRoute,
  isOpen,
  onToggle,
  onNavigate,
  styles,
  c,
}: {
  item: MobileSidebarMenuItem;
  menuKey: string;
  depth: number;
  activeRoute?: string;
  isOpen: boolean;
  onToggle: () => void;
  onNavigate: (action: SidebarNavAction) => void;
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
}) {
  if (item.type === 'section') {
    return <SidebarSection label={item.label} styles={styles} />;
  }

  const icon = resolveSidebarIcon(item.icon);
  const active = hasActiveDescendant(item, activeRoute);
  const hasChildren = Boolean(item.subItems?.length);

  if (hasChildren) {
    return (
      <View>
        <SidebarNavItem
          icon={icon}
          label={item.label}
          active={active}
          expandable
          expanded={isOpen}
          onPress={onToggle}
          styles={styles}
          c={c}
        />
        {isOpen
          ? item.subItems!.map((sub, idx) => (
              <SidebarTreeItem
                key={`${menuKey}-sub-${idx}`}
                item={sub}
                menuKey={`${menuKey}-sub-${idx}`}
                depth={depth + 1}
                activeRoute={activeRoute}
                isOpen={false}
                onToggle={() => undefined}
                onNavigate={onNavigate}
                styles={styles}
                c={c}
              />
            ))
          : null}
      </View>
    );
  }

  if (!item.nav) return null;

  const leafActive = activeRoute === sidebarActionKey(item.nav);

  return (
    <SidebarNavItem
      icon={icon}
      label={item.label}
      active={leafActive}
      nested={depth > 0}
      onPress={() => onNavigate(item.nav!)}
      styles={styles}
      c={c}
    />
  );
}

function SidebarSection({ label, styles }: { label: string; styles: ReturnType<typeof createStyles> }) {
  return (
    <View style={styles.sectionWrapper}>
      <View style={styles.sectionLine} />
      <Text style={styles.sectionLabel}>{label}</Text>
      <View style={styles.sectionLine} />
    </View>
  );
}

function SidebarNavItem({
  icon,
  label,
  active,
  nested,
  expandable,
  expanded,
  onPress,
  styles,
  c,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active: boolean;
  nested?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  c: AppColors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.itemRow,
        nested ? styles.itemRowNested : undefined,
        active ? styles.itemRowActive : undefined,
        pressed ? styles.itemRowPressed : undefined,
      ]}
    >
      <View style={[styles.itemIconWrap, active ? styles.itemIconWrapActive : undefined]}>
        <MaterialIcons
          name={icon}
          size={20}
          color={active ? c.primaryForeground : SIDEBAR_MUTED}
        />
      </View>
      <Text style={[styles.itemLabel, active ? styles.itemLabelActive : undefined]} numberOfLines={1}>
        {label}
      </Text>
      {expandable ? (
        <MaterialIcons
          name={expanded ? 'expand-less' : chevronForwardIcon()}
          size={20}
          color={SIDEBAR_MUTED}
        />
      ) : active ? (
        <View style={styles.itemActiveBar} />
      ) : null}
    </Pressable>
  );
}

function createStyles(c: AppColors) {
  const fg = c.sidebarForeground;
  const muted = 'rgba(255,255,255,0.55)';
  const border = 'rgba(255,255,255,0.08)';

  return StyleSheet.create({
    overlay: { flex: 1 },
    backdrop: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: c.overlay,
    },
    drawerHost: {
      ...StyleSheet.absoluteFillObject,
      direction: 'ltr',
      zIndex: 2,
    },
    drawer: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      width: SIDEBAR_WIDTH,
      direction: 'rtl',
      backgroundColor: c.sidebar,
      borderTopLeftRadius: radius.xxxl,
      borderBottomLeftRadius: radius.xxxl,
      overflow: 'hidden',
      elevation: 8,
    },
    logoArea: {
      height: 68,
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: border,
    },
    closeBtn: {
      marginStart: 'auto',
      width: 36,
      height: 36,
      alignItems: 'center',
      justifyContent: 'center',
    },
    searchWrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    commandBtn: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: border,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    commandBtnText: {
      ...textStart,
      flex: 1,
      fontSize: typography.small,
      fontFamily: fonts.medium,
      color: fg,
    },
    logoMark: {
      width: 40,
      height: 40,
      borderRadius: radius.xl,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    logoLetter: {
      color: c.primaryForeground,
      fontSize: typography.sectionTitle,
      fontFamily: fonts.extraBold,
    },
    logoText: {
      color: fg,
      fontSize: 15,
      fontFamily: fonts.bold,
    },
    nav: { flex: 1 },
    navContent: {
      paddingVertical: spacing.sm,
      paddingBottom: spacing.xxxl,
    },
    recentBlock: {
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: border,
      marginBottom: spacing.sm,
    },
    recentTitle: {
      ...textStart,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xs,
      fontSize: 11,
      fontFamily: fonts.bold,
      color: muted,
    },
    footer: {
      borderTopWidth: 1,
      borderTopColor: border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    footerUser: {
      ...textStart,
      fontSize: typography.body,
      fontFamily: fonts.bold,
      color: fg,
    },
    footerActions: {
      ...flexRow,
      gap: spacing.sm,
    },
    footerBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    versionBadge: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'center',
      borderWidth: 1,
      borderColor: border,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      backgroundColor: 'rgba(255,255,255,0.04)',
    },
    versionDot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: muted,
    },
    versionText: {
      fontSize: 11,
      fontFamily: fonts.medium,
      color: muted,
    },
    sectionWrapper: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.lg,
      paddingBottom: spacing.xs,
    },
    sectionLine: { flex: 1, height: 1, backgroundColor: border },
    sectionLabel: {
      fontSize: 11,
      fontFamily: fonts.bold,
      color: muted,
    },
    itemRow: {
      ...flexRow,
      alignItems: 'center',
      gap: spacing.md,
      minHeight: 44,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.xl,
      marginHorizontal: spacing.sm,
      borderStartWidth: 2,
      borderStartColor: 'transparent',
    },
    itemRowNested: {
      marginStart: spacing.lg,
      minHeight: 40,
    },
    itemRowActive: {
      backgroundColor: 'rgba(255,255,255,0.10)',
      borderStartColor: c.brandAccent,
    },
    itemRowPressed: {
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    itemIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    itemIconWrapActive: {
      backgroundColor: 'rgba(37, 99, 235, 0.28)',
    },
    itemLabel: {
      ...textStart,
      flex: 1,
      fontSize: typography.body,
      fontFamily: fonts.medium,
      color: muted,
    },
    itemLabelActive: {
      color: fg,
      fontFamily: fonts.bold,
    },
    itemActiveBar: {
      width: 3,
      height: 20,
      borderRadius: 2,
      backgroundColor: c.brandAccent,
    },
  });
}
