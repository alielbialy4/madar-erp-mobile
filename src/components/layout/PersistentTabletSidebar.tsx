import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { sidebarAreaRtl } from '@/constants/layout';
import { SIDEBAR_WIDTH } from '@/constants/sidebarLayout';
import { useColors } from '@/hooks/useColors';
import { SidebarPanel } from './SidebarPanel';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';

type Props = {
  activeRoute?: string;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
};

export function PersistentTabletSidebar({
  activeRoute,
  onNavigate,
  onOpenCommandPalette,
}: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  if (width < 900) return null;

  return (
    <View
      style={{
        ...sidebarAreaRtl,
        width: SIDEBAR_WIDTH,
        backgroundColor: c.surface,
        borderLeftWidth: 1,
        borderLeftColor: c.borderSubtle,
        paddingTop: insets.top,
        paddingBottom: insets.bottom,
      }}
    >
      <SidebarPanel
        activeRoute={activeRoute}
        onNavigate={onNavigate}
        onOpenCommandPalette={onOpenCommandPalette}
      />
    </View>
  );
}
