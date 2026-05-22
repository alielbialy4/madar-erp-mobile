import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppInput } from '@/components/ui/AppInput';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useThemeStore } from '@/store/themeStore';
import { hasFeature, hasPermission } from '@/utils/permissions';
import { buildMobileSidebarMenu, type MobileSidebarMenuItem } from '@/navigation/buildSidebarMenu';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import type { NavCatalogEntry } from '@/navigation/navCatalog';
import type { RecentRoute } from '@/services/navigation/recentRoutes';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { SidebarNavItem, SidebarTree } from './sidebarParts';

const TABLET_SIDEBAR_WIDTH = 280;
const SIDEBAR_MUTED = 'rgba(255,255,255,0.52)';

type Props = {
  activeRoute?: string;
  onNavigate: (action: SidebarNavAction) => void;
  recentRoutes?: RecentRoute[];
  catalog?: NavCatalogEntry[];
  onOpenCommandPalette?: () => void;
};

export function PersistentTabletSidebar({
  activeRoute,
  onNavigate,
  recentRoutes = [],
  catalog = [],
  onOpenCommandPalette,
}: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const viewMode = useBranchStore((s) => s.viewMode);
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isSuperAdmin = Boolean(user?.is_super_admin);

  const menu = useMemo(
    () => buildMobileSidebarMenu(isSuperAdmin, (perm) => hasPermission(user, perm), viewMode, (feature) => hasFeature(user, feature)),
    [isSuperAdmin, user, viewMode],
  );

  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const filteredMenu = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return menu;
    const filterTree = (items: MobileSidebarMenuItem[]): MobileSidebarMenuItem[] =>
      items
        .map((item) => {
          if (item.type === 'section') return item;
          const labelMatch = item.label.toLowerCase().includes(q);
          const subs = item.subItems ? filterTree(item.subItems) : undefined;
          if (labelMatch || (subs && subs.length > 0)) return { ...item, subItems: subs };
          return null;
        })
        .filter(Boolean) as MobileSidebarMenuItem[];
    return filterTree(menu);
  }, [menu, search]);

  const recentEntries = useMemo(
    () => recentRoutes.map((r) => catalog.find((e) => e.id === r.id)).filter(Boolean) as NavCatalogEntry[],
    [recentRoutes, catalog],
  );

  const fg = c.sidebarForeground;
  const muted = SIDEBAR_MUTED;
  const border = 'rgba(255,255,255,0.08)';

  const handleNavigate = useCallback((action: SidebarNavAction) => onNavigate(action), [onNavigate]);
  const toggleGroup = useCallback((key: string) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] })), []);

  if (width < 900) return null;

  return (
    <View
      style={{
        width: TABLET_SIDEBAR_WIDTH,
        backgroundColor: c.sidebar,
        borderStartWidth: 1,
        borderStartColor: border,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <BrandLogo height={36} inverted />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ color: fg, fontSize: 15, fontFamily: fonts.bold }} numberOfLines={1}>
            Madar ERP
          </Text>
          <Text style={{ color: muted, fontSize: 10, fontFamily: fonts.medium }} numberOfLines={1}>
            {viewMode === 'global' ? 'عرض عام' : 'تشغيل الفرع'}
          </Text>
        </View>
      </View>

      <View style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm }}>
        <AppInput value={search} onChangeText={setSearch} placeholder="ابحث في الوحدات..." returnKeyType="search" />
        {onOpenCommandPalette ? (
          <SidebarNavItem
            icon="travel-explore"
            label="بحث سريع"
            active={false}
            onPress={onOpenCommandPalette}
            fg={fg}
            muted={muted}
            border={border}
            accent={c.brandAccent}
          />
        ) : null}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {recentEntries.length > 0 ? (
          <View style={{ marginBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: border, paddingBottom: spacing.sm }}>
            <Text style={styles.sectionMuted}>استخدمت مؤخراً</Text>
            {recentEntries.map((entry) => (
              <SidebarNavItem
                key={`recent-${entry.id}`}
                icon={resolveSidebarIcon(entry.icon)}
                label={entry.label}
                active={activeRoute === entry.id}
                onPress={() => handleNavigate(entry.nav)}
                fg={fg}
                muted={muted}
                border={border}
                accent={c.brandAccent}
              />
            ))}
          </View>
        ) : null}
        {filteredMenu.map((entry, index) => (
          <SidebarTree
            key={`${entry.id ?? entry.label}-${index}`}
            item={entry}
            index={index}
            depth={0}
            activeRoute={activeRoute}
            openMenus={openMenus}
            onToggle={toggleGroup}
            onNavigate={handleNavigate}
            fg={fg}
            muted={muted}
            border={border}
            accent={c.brandAccent}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: border }]}>
        <Text style={{ ...textStart, fontSize: typography.caption, fontFamily: fonts.bold, color: fg }} numberOfLines={1}>
          {user?.name ?? 'المستخدم'}
        </Text>
        <View style={[flexRow, { gap: spacing.xs, marginTop: spacing.sm }]}>
          <FooterIcon icon="person-outline" fg={fg} onPress={() => handleNavigate({ kind: 'more', screen: 'Profile' })} />
          <FooterIcon icon="settings" fg={fg} onPress={() => handleNavigate({ kind: 'more', screen: 'Settings' })} />
          <FooterIcon icon={theme === 'dark' ? 'light-mode' : 'dark-mode'} fg={fg} onPress={toggleTheme} />
          <FooterIcon icon="logout" fg={c.danger} onPress={() => void logout()} />
        </View>
      </View>
    </View>
  );
}

function FooterIcon({
  icon,
  fg,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  fg: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.footerBtn}>
      <MaterialIcons name={icon} size={18} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  brandRow: { ...flexRow, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  brandMark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  sectionMuted: { ...textStart, paddingHorizontal: spacing.lg, paddingBottom: spacing.xs, fontSize: 10, fontFamily: fonts.bold, color: SIDEBAR_MUTED },
  footer: { borderTopWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footerBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
