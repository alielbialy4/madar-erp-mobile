import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { AnimatePresence, MotiView } from 'moti';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { motion } from '@/constants/motion';
import {
  TOAST_ACTION_BG,
  TOAST_ACTION_BORDER,
  TOAST_ACTION_FG,
  TOAST_DURATION_MS,
  TOAST_ICON_CIRCLE,
  TOAST_MAX_VISIBLE,
  TOAST_MESSAGE_COLOR,
  TOAST_SHELL,
  TOAST_STACK_OFFSET,
  toastToneStyle,
  type ToastTone,
} from '@/constants/toastTheme';
import { useColors } from '@/hooks/useColors';
import { hapticError, hapticLight, hapticSuccess, hapticWarning } from '@/utils/haptics';

type ToastItem = {
  id: number;
  message: string;
  tone: ToastTone;
  actionLabel?: string;
  onAction?: () => void;
};

type ToastContextValue = {
  show: (message: string, tone?: ToastTone, action?: { label: string; onPress: () => void }) => void;
  success: (message: string) => void;
  error: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within AppToastProvider');
  return ctx;
}

function fireHaptic(tone: ToastTone) {
  switch (tone) {
    case 'success':
      void hapticSuccess();
      break;
    case 'error':
      void hapticError();
      break;
    case 'warning':
      void hapticWarning();
      break;
    default:
      void hapticLight();
  }
}

function PremiumToastPill({
  item,
  stackIndex,
  onDismiss,
}: {
  item: ToastItem;
  stackIndex: number;
  onDismiss: (id: number) => void;
}) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const tone = toastToneStyle(c, item.tone);
  const [visible, setVisible] = useState(true);
  const dismissedRef = useRef(false);

  const dragY = useSharedValue(0);
  const progress = useSharedValue(1);

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;
    setVisible(false);
  }, []);

  const finishDismiss = useCallback(() => {
    onDismiss(item.id);
  }, [item.id, onDismiss]);

  useEffect(() => {
    fireHaptic(item.tone);
    progress.value = withTiming(0, { duration: TOAST_DURATION_MS });
    const timer = setTimeout(() => dismiss(), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [item.id, item.tone, dismiss, progress]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .onUpdate((e) => {
          if (e.translationY < 0) {
            dragY.value = e.translationY;
          }
        })
        .onEnd((e) => {
          if (e.translationY < -40 || e.velocityY < -500) {
            runOnJS(dismiss)();
          } else {
            dragY.value = withSpring(0, { damping: 18, stiffness: 220 });
          }
        }),
    [dismiss, dragY],
  );

  const dragStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: progress.value }],
  }));

  return (
    <AnimatePresence onExitComplete={finishDismiss}>
      {visible ? (
        <MotiView
          key={item.id}
          from={{ opacity: 0, translateY: -16, scale: 0.94 }}
          animate={{ opacity: 1, translateY: 0, scale: 1 }}
          exit={{ opacity: 0, translateY: -20, scale: 0.96 }}
          transition={{ type: 'spring', ...motion.spring.snappy }}
          style={{
            marginTop:
              (stackIndex === 0 ? insets.top + spacing.sm : spacing.sm) +
              stackIndex * TOAST_STACK_OFFSET,
            marginHorizontal: spacing.lg,
            alignSelf: 'stretch',
          }}
        >
          <GestureDetector gesture={pan}>
            <Animated.View style={dragStyle}>
              <View
                style={[
                  styles.pill,
                  {
                    borderColor: TOAST_SHELL.borderColor,
                    backgroundColor: TOAST_SHELL.backgroundColor,
                    shadowColor: TOAST_SHELL.shadowColor,
                    shadowOffset: TOAST_SHELL.shadowOffset,
                    shadowOpacity: TOAST_SHELL.shadowOpacity,
                    shadowRadius: TOAST_SHELL.shadowRadius,
                    elevation: TOAST_SHELL.elevation,
                    borderStartWidth: 3,
                    borderStartColor: tone.accent,
                  },
                ]}
              >
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: TOAST_ICON_CIRCLE.backgroundColor,
                      borderColor: TOAST_ICON_CIRCLE.borderColor,
                    },
                  ]}
                >
                  <MaterialIcons name={tone.icon} size={18} color={tone.accent} />
                </View>

                <AppText style={[styles.message, textStart]} numberOfLines={4}>
                  {item.message}
                </AppText>

                {item.actionLabel && item.onAction ? (
                  <Pressable
                    onPress={() => {
                      item.onAction?.();
                      dismiss();
                    }}
                    style={({ pressed }) => [
                      styles.actionChip,
                      pressed && { opacity: 0.85, transform: [{ scale: 0.96 }] },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={item.actionLabel}
                  >
                    <AppText style={styles.actionLabel} numberOfLines={1}>
                      {item.actionLabel}
                    </AppText>
                  </Pressable>
                ) : null}
              </View>

              <View style={styles.progressTrack}>
                <Animated.View
                  style={[styles.progressFill, { backgroundColor: tone.accent }, progressStyle]}
                />
              </View>
            </Animated.View>
          </GestureDetector>
        </MotiView>
      ) : null}
    </AnimatePresence>
  );
}

export function AppToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const show = useCallback((message: string, tone: ToastTone = 'info', action?: { label: string; onPress: () => void }) => {
    const id = ++idRef.current;
    setItems((prev) => [
      ...prev.slice(-(TOAST_MAX_VISIBLE - 1)),
      { id, message, tone, actionLabel: action?.label, onAction: action?.onPress },
    ]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      show,
      success: (message) => show(message, 'success'),
      error: (message) => show(message, 'error'),
    }),
    [show],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={styles.overlay}>
        {items.map((item, index) => (
          <PremiumToastPill key={item.id} item={item} stackIndex={index} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  pill: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    overflow: 'hidden',
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  message: {
    flex: 1,
    minWidth: 0,
    color: TOAST_MESSAGE_COLOR,
    fontFamily: fonts.medium,
    fontSize: typography.body,
    lineHeight: typography.body * 1.35,
  },
  actionChip: {
    flexShrink: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.xl,
    backgroundColor: TOAST_ACTION_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: TOAST_ACTION_BORDER,
    maxWidth: 120,
  },
  actionLabel: {
    color: TOAST_ACTION_FG,
    fontFamily: fonts.bold,
    fontSize: typography.tiny,
  },
  progressTrack: {
    height: 2,
    marginTop: spacing.xs,
    marginHorizontal: spacing.md,
    borderRadius: radius.pill,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  progressFill: {
    height: '100%',
    width: '100%',
    borderRadius: radius.pill,
    alignSelf: 'flex-end',
  },
});
