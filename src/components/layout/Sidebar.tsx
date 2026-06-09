import React, { useCallback, useEffect, useRef } from 'react';
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
import { radius } from '@/constants/spacing';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';
import { slideInX } from '@/utils/animations';
import { useColors } from '@/hooks/useColors';
import { SIDEBAR_WIDTH } from '@/constants/sidebarLayout';
import { SidebarPanel } from './SidebarPanel';
import type { SidebarNavAction } from '@/navigation/sidebarNavMap';
import { drawerClosedTranslateX } from '@/utils/rtl';

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
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const closedX = drawerClosedTranslateX(SIDEBAR_WIDTH);
  const slideX = useRef(new Animated.Value(closedX)).current;
  const drawerLeft = screenWidth - SIDEBAR_WIDTH;

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
            width: SIDEBAR_WIDTH,
            borderTopLeftRadius: radius.xxxl,
            borderBottomLeftRadius: radius.xxxl,
            overflow: 'hidden',
            elevation: 16,
            shadowColor: '#000',
            shadowOffset: { width: -4, height: 0 },
            shadowOpacity: 0.3,
            shadowRadius: 20,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
            transform: [{ translateX: slideX }],
          }}
        >
          <View style={{ flex: 1, ...sidebarAreaRtl, backgroundColor: c.sidebar }}>
            <SidebarPanel
              activeRoute={activeRoute}
              onNavigate={handleNavigate}
              onOpenCommandPalette={onOpenCommandPalette ? handleOpenCommandPalette : undefined}
              expandActiveGroups={visible}
              headerRight={
                <Pressable
                  onPress={onClose}
                  style={styles.closeBtn}
                  hitSlop={8}
                >
                  <MaterialIcons name="close" size={20} color={c.sidebarForeground} />
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
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
