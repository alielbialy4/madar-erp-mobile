import React from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { resolveSidebarIcon } from '@/constants/sidebarIcons';
import type { MobileSidebarMenuItem } from '@/navigation/buildSidebarMenu';
import { sidebarActionKey } from '@/navigation/sidebarNavMap';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { chevronForwardIcon } from '@/utils/rtl';

export function getMenuKey(item: MobileSidebarMenuItem, index: number): string {
  if (item.type === 'section') return `section:${item.label}:${index}`;
  return item.id ?? `item:${item.label}:${index}`;
}

export function hasActiveDescendant(item: MobileSidebarMenuItem, activeRoute?: string): boolean {
  if (!activeRoute) return false;
  if (item.nav) {
    const key = sidebarActionKey(item.nav);
    if (key === activeRoute) return true;
  }
  return Boolean(item.subItems?.some((sub) => hasActiveDescendant(sub, activeRoute)));
}

export function SidebarSectionHeader({ label, muted, border }: { label: string; muted: string; border: string }) {
  return (
    <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.xs }}>
      <View style={{ flex: 1, height: 1, backgroundColor: border }} />
      <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: muted }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: border }} />
    </View>
  );
}

export function SidebarNavItem({
  icon,
  label,
  active,
  nested,
  expandable,
  expanded,
  onPress,
  fg,
  muted,
  border,
  accent,
}: {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  active: boolean;
  nested?: boolean;
  expandable?: boolean;
  expanded?: boolean;
  onPress: () => void;
  fg: string;
  muted: string;
  border: string;
  accent: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          ...flexRow,
          alignItems: 'center',
          gap: spacing.md,
          minHeight: 44,
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.xl,
          marginHorizontal: spacing.sm,
          borderStartWidth: 3,
          borderStartColor: 'transparent',
        },
        nested ? { marginStart: spacing.lg, minHeight: 40 } : undefined,
        active ? { backgroundColor: 'rgba(255,255,255,0.1)', borderStartColor: accent } : undefined,
        pressed ? { backgroundColor: 'rgba(255,255,255,0.06)' } : undefined,
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.md,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? 'rgba(51, 102, 255, 0.28)' : 'rgba(255,255,255,0.04)',
        }}
      >
        <MaterialIcons name={icon} size={18} color={active ? fg : muted} />
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
      ) : active ? (
        <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: accent }} />
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
  const active = hasActiveDescendant(item, activeRoute);
  const hasChildren = Boolean(item.subItems?.length);
  const isOpen = Boolean(openMenus[menuKey]);

  if (hasChildren) {
    return (
      <View>
        <SidebarNavItem
          icon={icon}
          label={item.label}
          active={active}
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
      active={activeRoute === sidebarActionKey(item.nav)}
      nested={depth > 0}
      onPress={() => onNavigate(item.nav!)}
      fg={fg}
      muted={muted}
      border={border}
      accent={accent}
    />
  );
}
