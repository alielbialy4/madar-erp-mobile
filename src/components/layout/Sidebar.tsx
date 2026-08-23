import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { drawerShellLtr, sidebarAreaRtl } from '@/constants/layout';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';
import { slideInX } from '@/utils/animations';
import { useColors } from '@/hooks/useColors';
import { radius } from '@/constants/spacing';
import { elevation } from '@/constants/elevation';
import { drawerWidthForScreen } from '@/constants/sidebarLayout';
import { SidebarPanel } from './SidebarPanel';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { drawerClosedTranslateX } from '@/utils/rtl';
import { useTranslation } from 'react-i18next';

type Props = {
  visible: boolean;
  onClose: () => void;
  activeRoute?: string;
  onNavigate: (action: SidebarNavAction) => void;
  onOpenCommandPalette?: () => void;
};

export function Sidebar({
  visible,
  onClose,
  activeRoute,
  onNavigate,
  onOpenCommandPalette,
}: Props) {
  const c = useColors();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const drawerWidth = drawerWidthForScreen(screenWidth);
  const closedX = drawerClosedTranslateX(drawerWidth);
  const slideX = useRef(new Animated.Value(closedX)).current;
  const drawerLeft = screenWidth - drawerWidth;
  const panelElevation = useMemo(() => elevation(c, 'lg'), [c]);

  useEffect(() => {
    if (visible) {
      slideInX(slideX, closedX);
    } else {
      slideX.setValue(closedX);
    }
  }, [visible, slideX, closedX]);

  const handleNavigate = useCallback(
    (action: SidebarNavAction) => {
      onClose();
      onNavigate(action);
    },
    [onClose, onNavigate],
  );

  const handleOpenCommandPalette = useCallback(() => {
    onClose();
    onOpenCommandPalette?.();
  }, [onClose, onOpenCommandPalette]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <RtlModalRoot style={drawerShellLtr}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c.overlay }]} onPress={onClose} />
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: drawerLeft,
            bottom: 0,
            width: drawerWidth,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX: slideX }],
            backgroundColor: c.surface,
            borderTopLeftRadius: radius.xxl,
            borderBottomLeftRadius: radius.xxl,
            ...panelElevation,
          }}
        >
          <View
            style={{
              flex: 1,
              overflow: 'hidden',
              borderTopLeftRadius: radius.xxl,
              borderBottomLeftRadius: radius.xxl,
              ...sidebarAreaRtl,
              backgroundColor: c.surface,
            }}
          >
            <SidebarPanel
              activeRoute={activeRoute}
              onNavigate={handleNavigate}
              onOpenCommandPalette={onOpenCommandPalette ? handleOpenCommandPalette : undefined}
              expandActiveGroups={visible}
              headerRight={
                <Pressable
                  onPress={onClose}
                  accessibilityRole="button"
                  accessibilityLabel={t('Close')}
                  style={[styles.closeBtn, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={20} color={c.text} />
                </Pressable>
              }
            />
          </View>
        </Animated.View>
      </RtlModalRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
  },
});
