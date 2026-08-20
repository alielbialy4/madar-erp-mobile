import React from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import type { MobileSidebarMenuItem } from '@/navigation/buildSidebarMenu';
import { isNavItemActive } from '@/navigation/sidebarNavMap';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { chevronForwardIcon } from '@/utils/rtl';
import { Text } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';

export function getMenuKey(item: MobileSidebarMenuItem, index: number): string {
  if (item.type === 'section') return `section:${item.label}:${index}`;
  return item.id ?? `item:${item.label}:${index}`;
}

export function hasActiveDescendant(item: MobileSidebarMenuItem, activeRoute?: string): boolean {
  if (isNavItemActive(item, activeRoute)) return true;
  return Boolean(item.subItems?.some((sub) => hasActiveDescendant(sub, activeRoute)));
}

export function SidebarSectionHeader({ label, muted }: { label: string; muted: string; border: string }) {
  return (
    <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, paddingBottom: spacing.xs }}>
      <Text style={{ ...textStart, fontSize: 10, letterSpacing: 0.5, fontFamily: fonts.bold, color: muted }}>{label}</Text>
    </View>
  );
}

export function SidebarNavItem({
  icon,
  label,
  active,
  showIndicator = false,
  nested,
  expandable,
  expanded,
  onPress,
  fg,
  muted,
  border: _border,
  accent,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active: boolean;
  showIndicator?: boolean;
  nested?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onPress: () => void;
  fg: string;
  muted: string;
  border: string;
  accent: string;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active, expanded: expandable ? expanded : undefined }}
      style={({ pressed }) => [
        {
          ...flexRow,
          alignItems: 'center',
          gap: spacing.sm,
          minHeight: 44,
          paddingHorizontal: spacing.md,
          paddingVertical: 6,
          borderRadius: radius.lg,
          marginHorizontal: spacing.sm,
          overflow: 'hidden',
          position: 'relative',
        },
        nested ? { marginStart: spacing.lg, minHeight: 40 } : undefined,
        active ? { backgroundColor: c.primarySoftMuted } : undefined,
        pressed ? { backgroundColor: c.surfaceMuted } : undefined,
      ]}
    >
      {showIndicator ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: 8,
            bottom: 8,
            start: 0,
            width: 3,
            borderRadius: 2,
            backgroundColor: accent,
          }}
        />
      ) : null}
      <View
        style={{
          width: 28,
          height: 28,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? c.primarySoftMuted : c.surfaceMuted,
        }}
      >
        <MaterialIcons name={icon} size={16} color={active ? accent : muted} />
      </View>
      <Text
        style={{
          ...textStart,
          flex: 1,
          fontSize: typography.body,
          fontFamily: active ? fonts.bold : fonts.medium,
          color: active ? fg : muted,
        }}
        numberOfLines={1}
      >
        {label}
      </Text>
      {expandable ? (
        <MaterialIcons name={expanded ? 'expand-less' : chevronForwardIcon()} size={18} color={muted} />
      ) : null}
    </Pressable>
  );
}

export function SidebarTree({
  item,
  index,
  depth,
  activeRoute,
  openMenus,
  onToggle,
  onNavigate,
  fg,
  muted,
  border,
  accent,
}: {
  item: MobileSidebarMenuItem;
  index: number;
  depth: number;
  activeRoute?: string;
  openMenus: Record<string, boolean>;
  onToggle: (key: string) => void;
  onNavigate: (action: SidebarNavAction) => void;
  fg: string;
  muted: string;
  border: string;
  accent: string;
}) {
  const menuKey = getMenuKey(item, index);

  if (item.type === 'section') {
    return <SidebarSectionHeader label={item.label} muted={muted} border={border} />;
  }

  const icon = resolveSidebarIcon(item.icon);
  const routeActive = isNavItemActive(item, activeRoute);
  const branchActive = hasActiveDescendant(item, activeRoute);
  const hasChildren = Boolean(item.subItems?.length);
  const isOpen = Boolean(openMenus[menuKey]);

  if (hasChildren) {
    return (
      <View>
        <SidebarNavItem
          icon={icon}
          label={item.label}
          active={branchActive}
          showIndicator={false}
          expandable
          expanded={isOpen}
          onPress={() => onToggle(menuKey)}
          fg={fg}
          muted={muted}
          border={border}
          accent={accent}
        />
        {isOpen
          ? item.subItems!.map((sub, idx) => (
              <SidebarTree
                key={`${menuKey}-sub-${idx}`}
                item={sub}
                index={idx}
                depth={depth + 1}
                activeRoute={activeRoute}
                openMenus={openMenus}
                onToggle={onToggle}
                onNavigate={onNavigate}
                fg={fg}
                muted={muted}
                border={border}
                accent={accent}
              />
            ))
          : null}
      </View>
    );
  }

  if (!item.nav) return null;
  return (
    <SidebarNavItem
      icon={icon}
      label={item.label}
      active={routeActive}
      showIndicator={routeActive}
      nested={depth > 0}
      onPress={() => onNavigate(item.nav!)}
      fg={fg}
      muted={muted}
      border={border}
      accent={accent}
    />
  );
}
