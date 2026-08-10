import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text } from '@/components/ui/AppText';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
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
import { hasActiveDescendant, getMenuKey, SidebarNavItem, SidebarTree } from './sidebarParts';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { BrandLogo } from '@/components/brand/BrandLogo';
import { useAppDialog } from '@/components/feedback';
import { useTranslation } from 'react-i18next';

export type SidebarPanelProps = {
  activeRoute?: string;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
  headerRight?: React.ReactNode;
  /** Expand groups containing the active route (drawer open). */
  expandActiveGroups?: boolean;
};

export function SidebarPanel({
  activeRoute,
  onNavigate,
  onOpenCommandPalette,
  headerRight,
  expandActiveGroups = false,
}: SidebarPanelProps) {
  const c = useColors();
  const { t } = useTranslation();
  const dialog = useAppDialog();
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

  useEffect(() => {
    if (!expandActiveGroups) return;
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
  }, [expandActiveGroups, activeRoute, menu]);

  const fg = c.text;
  const muted = c.textMuted;
  const border = c.borderSubtle;
  const accent = c.primary;

  const handleNavigate = useCallback((action: SidebarNavAction) => onNavigate(action), [onNavigate]);
  const toggleGroup = useCallback((key: string) => setOpenMenus((prev) => ({ ...prev, [key]: !prev[key] })), []);

  return (
    <View style={[styles.root, { backgroundColor: c.surface }]}> 
      <View style={styles.brandRow}>
        <View style={styles.brandMark}>
          <BrandLogo height={32} />
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ ...textStart, color: fg, fontSize: 15, fontFamily: fonts.bold }} numberOfLines={1}>
            Madar ERP
          </Text>
          <Text style={{ ...textStart, color: muted, fontSize: 10, fontFamily: fonts.medium }} numberOfLines={1}>
            {viewMode === 'global' ? 'عرض عام' : 'تشغيل الفرع'}
          </Text>
        </View>
        {headerRight}
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
            accent={accent}
          />
        ) : null}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
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
            accent={accent}
          />
        ))}
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: border }]}>
        <Text style={{ ...textStart, fontSize: typography.caption, fontFamily: fonts.bold, color: fg }} numberOfLines={1}>
          {user?.name ?? 'المستخدم'}
        </Text>
        <View style={[flexRow, { gap: spacing.xs, marginTop: spacing.sm }]}>
          <FooterIcon icon="person-outline" fg={fg} bg={c.surfaceMuted} border={border} onPress={() => handleNavigate({ kind: 'more', screen: 'Profile' })} />
          <FooterIcon icon="settings" fg={fg} bg={c.surfaceMuted} border={border} onPress={() => handleNavigate({ kind: 'more', screen: 'Settings' })} />
          <FooterIcon icon={theme === 'dark' ? 'light-mode' : 'dark-mode'} fg={fg} bg={c.surfaceMuted} border={border} onPress={toggleTheme} />
          <FooterIcon
            icon="logout"
            fg={c.danger}
            bg={c.surfaceMuted}
            border={border}
            onPress={() => {
              void dialog
                .confirm({
                  title: t('header.logout'),
                  message: t('header.logout'),
                  confirmLabel: t('header.logout'),
                  cancelLabel: t('header.cancel'),
                  destructive: true,
                  icon: 'logout',
                })
                .then((ok) => {
                  if (ok) void logout();
                });
            }}
          />
        </View>
      </View>
    </View>
  );
}

function FooterIcon({
  icon,
  fg,
  bg,
  border,
  onPress,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  fg: string;
  bg: string;
  border: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.footerBtn, { backgroundColor: bg, borderColor: border }]}> 
      <MaterialIcons name={icon} size={18} color={fg} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brandRow: { ...flexRow, alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  brandMark: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  footer: { borderTopWidth: 1, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  footerBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
