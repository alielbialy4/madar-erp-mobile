import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText } from '@/components/ui/AppText';
import { elevation } from '@/constants/elevation';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { motion } from '@/constants/motion';
import { useColors } from '@/hooks/useColors';

type ToastTone = 'success' | 'error' | 'info' | 'warning';

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

function toneColors(c: ReturnType<typeof useColors>, tone: ToastTone) {
  switch (tone) {
    case 'success':
      return { bg: c.softSuccess, border: c.softSuccessBorder, fg: c.success, icon: 'check-circle' as const };
    case 'error':
      return { bg: c.softDanger, border: c.softDangerBorder, fg: c.danger, icon: 'error-outline' as const };
    case 'warning':
      return { bg: c.softWarning, border: c.softWarningBorder, fg: c.warning, icon: 'warning-amber' as const };
    default:
      return { bg: c.softInfo, border: c.softInfoBorder, fg: c.info, icon: 'info-outline' as const };
  }
}

function ToastView({ item, onDismiss }: { item: ToastItem; onDismiss: (id: number) => void }) {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-12)).current;
  const tone = toneColors(c, item.tone);

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: motion.duration.normal, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, ...motion.spring.snappy, useNativeDriver: true }),
    ]).start();
    const timer = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: motion.duration.fast, useNativeDriver: true }).start(() => onDismiss(item.id));
    }, 3200);
    return () => clearTimeout(timer);
  }, [item.id, onDismiss, opacity, translateY]);

  return (
    <Animated.View
      style={{
        opacity,
        transform: [{ translateY }],
        marginTop: insets.top + spacing.sm,
        marginHorizontal: spacing.lg,
        borderRadius: radius.xl,
        borderWidth: 1,
        borderColor: tone.border,
        backgroundColor: tone.bg,
        padding: spacing.md,
        ...elevation(c, 'md'),
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
      }}
    >
      <MaterialIcons name={tone.icon} size={20} color={tone.fg} />
      <AppText style={{ flex: 1, color: c.text, fontFamily: fonts.medium, fontSize: typography.body }}>{item.message}</AppText>
      {item.actionLabel && item.onAction ? (
        <Pressable onPress={item.onAction} accessibilityRole="button">
          <AppText style={{ color: tone.fg, fontFamily: fonts.bold, fontWeight: '700' }}>{item.actionLabel}</AppText>
        </Pressable>
      ) : null}
    </Animated.View>
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
    setItems((prev) => [...prev.slice(-2), { id, message, tone, actionLabel: action?.label, onAction: action?.onPress }]);
  }, []);

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: (message) => show(message, 'success'),
    error: (message) => show(message, 'error'),
  }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <View pointerEvents="box-none" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999 }}>
        {items.map((item) => (
          <ToastView key={item.id} item={item} onDismiss={dismiss} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}
