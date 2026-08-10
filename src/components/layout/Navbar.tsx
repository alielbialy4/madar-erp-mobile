import React from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { BranchSwitcher } from '@/components/layout/BranchSwitcher';
import { HeaderEndTools, HeaderGhostIcon } from '@/components/layout/header';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { HEADER_CHROME } from '@/constants/headerChrome';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';

type Props = {
  onMenuPress: () => void;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
  menuAccessibilityLabel?: string;
  activeTab?: string;
};

export function Navbar({
  onMenuPress,
  onNavigate,
  onOpenCommandPalette,
  menuAccessibilityLabel,
  activeTab,
}: Props) {
  const { t } = useTranslation();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tier = getProductLayoutTier(width);
  const tablet = isProductTablet(tier);
  const compact = tier === 'compactPhone' || tier === 'phone';
  /** Narrow phones: icon. Tablets / large phones: pill (must not shrink into sync). */
  const branchDensity = compact ? 'icon' : 'pill';
  const gap = tablet ? HEADER_CHROME.gapTablet : HEADER_CHROME.gapPhone;

  return (
    <View
      style={[
        styles.root,
        {
          paddingTop: insets.top,
          paddingHorizontal: tablet
            ? HEADER_CHROME.horizontalPaddingTablet
            : HEADER_CHROME.horizontalPaddingPhone,
          backgroundColor: c.surfaceHeader,
          borderBottomColor: c.borderSubtle,
        },
      ]}
    >
      <View style={[styles.row, { gap }]}>
        <View style={[styles.startCluster, { gap }]}>
          <HeaderGhostIcon
            label={menuAccessibilityLabel ?? t('header.openMenu')}
            icon="menu"
            onPress={onMenuPress}
          />
          <HeaderGhostIcon
            label={t('Home')}
            icon="home"
            selected={activeTab === 'DashboardTab'}
            onPress={() => onNavigate({ kind: 'tab', tab: 'DashboardTab' })}
          />
          <HeaderGhostIcon
            label={t('POS title')}
            icon="point-of-sale"
            selected={activeTab === 'POSTab'}
            onPress={() => onNavigate({ kind: 'tab', tab: 'POSTab' })}
          />
        </View>

        <View style={[styles.endCluster, { gap }]}>
          {/* shrink-0: branch must never collapse into the status/sync chip */}
          <View
            style={[
              styles.branchWrap,
              branchDensity === 'icon' ? styles.branchWrapIcon : styles.branchWrapPill,
            ]}
          >
            <BranchSwitcher density={branchDensity} />
          </View>

          {/* Scroll when tools don't fit — prevents overlap onto the branch control */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            style={styles.toolsScroll}
            contentContainerStyle={styles.toolsScrollContent}
          >
            <HeaderEndTools
              onNavigate={onNavigate}
              onOpenCommandPalette={onOpenCommandPalette}
              compact={tier !== 'largeTablet'}
              showLabels={tier === 'largeTablet'}
              showSeparators={tier === 'largeTablet'}
              include={
                tablet
                  ? undefined
                  : {
                      language: false,
                      theme: false,
                      fullscreen: false,
                    }
              }
            />
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderBottomWidth: StyleSheet.hairlineWidth, zIndex: 30 },
  row: {
    ...flexRow,
    minHeight: HEADER_CHROME.rowHeight,
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
  },
  startCluster: {
    ...flexRow,
    alignItems: 'center',
    flexShrink: 0,
  },
  endCluster: {
    ...flexRow,
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    flexShrink: 1,
    justifyContent: 'flex-end',
  },
  branchWrap: {
    flexGrow: 0,
    flexShrink: 0,
    zIndex: 2,
  },
  branchWrapIcon: {
    width: HEADER_CHROME.iconOnlySize,
    height: HEADER_CHROME.iconOnlySize,
  },
  branchWrapPill: {
    maxWidth: HEADER_CHROME.pillMaxWidth,
    flexShrink: 0,
  },
  toolsScroll: {
    flexGrow: 0,
    flexShrink: 1,
    minWidth: 0,
  },
  toolsScrollContent: {
    ...flexRow,
    alignItems: 'center',
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
});
