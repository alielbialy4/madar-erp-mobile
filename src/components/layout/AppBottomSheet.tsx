import React, { useEffect, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { AppText } from '@/components/ui/AppText';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';

type Props = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  /** Optional custom header content, rendered below the grab handle. */
  headerContent?: React.ReactNode;
  /** Optional sticky content rendered after the scrollable body. */
  footer?: React.ReactNode;
  /** Turn off the outer scroll view when the content owns its scrolling (e.g. a FlatList). */
  scrollable?: boolean;
  /** Let the sheet occupy its full size limit so internal scroll regions can fill the body. */
  fillHeight?: boolean;
  /** Override the shell's horizontal padding for custom layouts. */
  horizontalPadding?: number;
  /** Override the shell's bottom padding, for footers that handle safe-area insets themselves. */
  bottomPadding?: number;
  /** When false, backdrop tap and hardware back won't dismiss (e.g. required POS shift). */
  dismissable?: boolean;
  /** Wider sheet for dense layouts; fullscreen for shift summary / close flows. */
  size?: 'default' | 'form' | 'wide' | 'fullscreen';
};

const SHEET_KEYBOARD_OFFSET = 12;

/** Inset around near-fullscreen sheets so POS remains visible behind the modal. */
const FULLSCREEN_INSET_SIDE = spacing.lg;
const FULLSCREEN_INSET_TOP = spacing.xl;
const FULLSCREEN_INSET_BOTTOM = spacing.md;

export function AppBottomSheet({
  visible,
  onClose,
  children,
  title,
  subtitle,
  headerContent,
  footer,
  dismissable = true,
  scrollable = true,
  fillHeight = false,
  horizontalPadding,
  bottomPadding,
  size = 'default',
}: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTabletSheet = width >= 600;
  const isFullscreen = size === 'fullscreen';
  const isWideSheet = size === 'wide';
  const isFormSheet = size === 'form';
  const fullscreenInsetSide = isTabletSheet ? spacing.xxl : FULLSCREEN_INSET_SIDE;
  const fullscreenInsetTop = isTabletSheet ? spacing.xxxl : FULLSCREEN_INSET_TOP;
  const sheetMaxWidth = isFullscreen
    ? width - fullscreenInsetSide * 2
    : isWideSheet
      ? Math.min(width - spacing.lg * 2, 1100)
      : isTabletSheet
        ? Math.min(width - spacing.xxl * 2, 760)
        : width;
  const [backdrop] = useState(() => new Animated.Value(0));
  const [translateY] = useState(() => new Animated.Value(48));

  useEffect(() => {
    if (visible) {
      backdrop.setValue(0);
      translateY.setValue(isFullscreen ? 20 : 48);
      Animated.parallel([
        Animated.timing(backdrop, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 9, tension: 120, useNativeDriver: true }),
      ]).start();
    } else {
      backdrop.setValue(0);
      translateY.setValue(isFullscreen ? 20 : 48);
    }
  }, [visible, backdrop, translateY, isFullscreen]);

  const handleClose = () => {
    if (!dismissable) return;
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: isFullscreen ? 20 : 48, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  const sheetMaxHeight = isFullscreen ? '100%' : isWideSheet || isFormSheet ? '92%' : '86%';
  const sheetMinHeight = isFormSheet ? Math.min(height * 0.46, 420) : undefined;
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 20 : 0);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={dismissable ? handleClose : undefined}
    >
      <RtlModalRoot style={{ flex: 1, justifyContent: isFullscreen ? 'center' : 'flex-end' }}>
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
          style={
            isFullscreen
              ? {
                  flex: 1,
                  marginTop: fullscreenInsetTop + insets.top,
                  marginBottom: FULLSCREEN_INSET_BOTTOM + insets.bottom,
                  marginHorizontal: fullscreenInsetSide,
                }
              : fillHeight
                ? { height: sheetMaxHeight }
                : { maxHeight: sheetMaxHeight }
          }
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.bottom + SHEET_KEYBOARD_OFFSET : 0}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{
              transform: [{ translateY }],
              width: isFullscreen ? '100%' : isWideSheet || isTabletSheet ? sheetMaxWidth : '100%',
              alignSelf: 'center',
              flex: isFullscreen || fillHeight ? 1 : undefined,
              minHeight: sheetMinHeight,
              maxHeight: sheetMaxHeight,
              backgroundColor: c.surface,
              ...(isFullscreen
                ? { borderRadius: radius.xl }
                : { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }),
              paddingHorizontal: horizontalPadding ?? (isFullscreen ? spacing.lg : spacing.xl),
              paddingTop: spacing.md,
              paddingBottom: bottomPadding ?? Math.max(spacing.xl, safeBottom + spacing.sm),
              borderWidth: isFullscreen ? StyleSheet.hairlineWidth : 0,
              borderTopWidth: StyleSheet.hairlineWidth,
              borderColor: c.borderSubtle,
              overflow: 'hidden',
            }}
          >
            {dismissable && !isFullscreen ? (
              <View style={{
                width: 36, height: 4, borderRadius: 2,
                backgroundColor: c.border, alignSelf: 'center', marginBottom: spacing.lg,
              }} />
            ) : null}
            {headerContent}
            {!headerContent && (title || subtitle) ? (
              <View style={{ marginBottom: spacing.md, gap: spacing.xs }}>
                {title ? (
                  <AppText
                    style={{
                      ...textStart,
                      fontFamily: fonts.bold,
                      fontWeight: '700',
                      fontSize: typography.sectionTitle,
                      color: c.text,
                    }}
                  >
                    {title}
                  </AppText>
                ) : null}
                {subtitle ? (
                  <AppText
                    style={{
                      ...textStart,
                      fontFamily: fonts.medium,
                      fontWeight: '500',
                      fontSize: typography.small,
                      color: c.textMuted,
                    }}
                  >
                    {subtitle}
                  </AppText>
                ) : null}
              </View>
            ) : null}
            {scrollable ? (
              <ScrollView
                style={{
                  flex: fillHeight || isFullscreen ? 1 : undefined,
                  flexGrow: isFullscreen || Boolean(footer) ? 1 : 0,
                  flexShrink: 1,
                }}
                contentContainerStyle={{
                  paddingBottom: spacing.md,
                  gap: spacing.md,
                  flexGrow: isFullscreen ? 1 : undefined,
                }}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                showsVerticalScrollIndicator={isFullscreen}
                bounces={isFullscreen}
                nestedScrollEnabled
              >
                {children}
              </ScrollView>
            ) : (
              <View style={{ flex: 1, minHeight: 0 }}>{children}</View>
            )}
            {footer}
          </Animated.View>
        </KeyboardAvoidingView>
      </RtlModalRoot>
    </Modal>
  );
}
