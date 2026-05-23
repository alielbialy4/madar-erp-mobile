import React, { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { AppText } from '@/components/ui/AppText';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** When false, backdrop tap and hardware back won't dismiss (e.g. required POS shift). */
  dismissable?: boolean;
  /** Wider sheet for dense layouts like POS tables. */
  size?: 'default' | 'wide';
};

export function AppBottomSheet({ visible, onClose, children, title, dismissable = true, size = 'default' }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isTabletSheet = width >= 900;
  const isWideSheet = size === 'wide';
  const sheetMaxWidth = isWideSheet
    ? Math.min(width - spacing.lg * 2, 1100)
    : isTabletSheet
      ? Math.min(width - spacing.xxl * 2, 760)
      : width;
  const backdrop = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(48)).current;

  useEffect(() => {
    if (visible) {
      backdrop.setValue(0);
      translateY.setValue(48);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 9, tension: 120, useNativeDriver: true }),
      ]).start();
    } else {
      backdrop.setValue(0);
      translateY.setValue(48);
    }
  }, [visible, backdrop, translateY]);

  const handleClose = () => {
    if (!dismissable) return;
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 48, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissable ? handleClose : undefined}
    >
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: c.overlay,
            opacity: backdrop,
          }}
        >
          <Pressable
            style={{ flex: 1 }}
            onPress={dismissable ? handleClose : undefined}
            accessibilityRole="button"
            accessibilityLabel="إغلاق"
          />
        </Animated.View>
        <KeyboardAvoidingView
          style={{ maxHeight: isWideSheet ? '92%' : '86%' }}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{
              transform: [{ translateY }],
              width: isWideSheet || isTabletSheet ? sheetMaxWidth : '100%',
              alignSelf: 'center',
              backgroundColor: c.surface,
              borderTopLeftRadius: radius.xxxl,
              borderTopRightRadius: radius.xxxl,
              paddingHorizontal: spacing.xl,
              paddingTop: spacing.md,
              paddingBottom: Math.max(spacing.xl, insets.bottom),
              ...Platform.select({
                ios: { shadowColor: c.shadowMd, shadowOffset: { width: 0, height: -6 }, shadowOpacity: 1, shadowRadius: 16 },
                android: { elevation: 16 },
                default: {},
              }),
            }}
          >
            {dismissable ? (
              <View style={{
                width: 36, height: 4, borderRadius: 2,
                backgroundColor: c.border, alignSelf: 'center', marginBottom: spacing.lg,
              }} />
            ) : null}
            {title ? (
              <AppText style={{
                ...textStart,
                fontFamily: fonts.bold,
                fontWeight: '700',
                fontSize: typography.sectionTitle,
                color: c.text,
                marginBottom: spacing.md,
              }}>
                {title}
              </AppText>
            ) : null}
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} bounces={false}>
              {children}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}
