import React, { useEffect, useRef } from 'react';
import { Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
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
};

export function AppBottomSheet({ visible, onClose, children, title }: Props) {
  const c = useColors();
  const insets = useSafeAreaInsets();
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
    Animated.parallel([
      Animated.timing(backdrop, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 48, duration: 180, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
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
          <Pressable style={{ flex: 1 }} onPress={handleClose} accessibilityRole="button" accessibilityLabel="إغلاق" />
        </Animated.View>
        <KeyboardAvoidingView
          style={{ maxHeight: '86%' }}
          behavior={Platform.select({ ios: 'padding', android: undefined })}
          pointerEvents="box-none"
        >
          <Animated.View
            style={{
              transform: [{ translateY }],
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
            <View style={{
              width: 36, height: 4, borderRadius: 2,
              backgroundColor: c.border, alignSelf: 'center', marginBottom: spacing.lg,
            }} />
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
