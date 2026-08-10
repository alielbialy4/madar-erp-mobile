import React, { useEffect, useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { MotiView } from '@/lib/moti';
import { AppText } from '@/components/ui/AppText';
import { AppButton } from '@/components/ui';
import { RtlModalRoot } from '@/components/layout/RtlModalRoot';
import { ALERT_DIALOG } from '@/constants/alertChrome';
import {
  DIALOG_GLYPH_SIZE,
  DIALOG_ICON_SIZE,
  dialogCardStyle,
  dialogToneStyle,
  type DialogIconName,
  type DialogTone,
} from '@/constants/dialogTheme';
import { flexRow, textStart } from '@/constants/layout';
import { motion } from '@/constants/motion';
import { radius, spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { hapticError, hapticLight, hapticWarning } from '@/utils/haptics';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  /** @deprecated Prefer `tone`. Kept for existing call sites. */
  variant?: 'primary' | 'danger';
  tone?: DialogTone;
  icon?: DialogIconName;
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

function resolveTone(tone: DialogTone | undefined, variant: 'primary' | 'danger' | undefined): DialogTone {
  if (tone) return tone;
  if (variant === 'danger') return 'danger';
  return 'primary';
}

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'إلغاء',
  loading,
  variant = 'danger',
  tone,
  icon,
  hideCancel = false,
  onConfirm,
  onCancel,
}: Props) {
  const c = useColors();
  const { height } = useWindowDimensions();
  const resolvedTone = resolveTone(tone, variant);
  const toneStyle = useMemo(() => dialogToneStyle(c, resolvedTone), [c, resolvedTone]);
  const cardStyle = useMemo(() => dialogCardStyle(c), [c]);
  const iconName = icon ?? toneStyle.defaultIcon;
  const showCancel = !hideCancel && typeof onCancel === 'function';
  const busy = Boolean(loading);
  const maxBodyHeight = Math.max(80, Math.min(200, height * 0.28));

  useEffect(() => {
    if (!visible) return;
    if (resolvedTone === 'danger') void hapticError();
    else if (resolvedTone === 'warning') void hapticWarning();
    else void hapticLight();
  }, [visible, resolvedTone]);

  const handleCancel = () => {
    if (busy) return;
    onCancel?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleCancel}>
      <RtlModalRoot style={styles.overlayRoot}>
        <Pressable
          style={[styles.backdrop, { backgroundColor: c.overlay }]}
          onPress={showCancel ? handleCancel : undefined}
          accessibilityRole="button"
          accessibilityLabel={showCancel ? cancelLabel : undefined}
        />
        <MotiView
          from={{ opacity: 0, scale: 0.96, translateY: 8 }}
          animate={{ opacity: 1, scale: 1, translateY: 0 }}
          transition={{ type: 'spring', ...motion.spring.snappy }}
          style={[cardStyle, styles.card]}
        >
          <View accessibilityRole="alert" style={styles.content}>
            <View style={styles.headerRow}>
              <View style={[styles.iconCircle, { backgroundColor: toneStyle.softBg, borderColor: toneStyle.softBorder }]}>
                <MaterialIcons name={iconName} size={DIALOG_GLYPH_SIZE} color={toneStyle.accent} />
              </View>
              <View style={styles.copy}>
                <AppText style={[styles.title, { color: c.text }]}>{title}</AppText>
                <ScrollView style={{ maxHeight: maxBodyHeight }} bounces={false} showsVerticalScrollIndicator={false}>
                  <AppText style={[styles.message, { color: c.textMuted }]}>{message}</AppText>
                </ScrollView>
              </View>
            </View>

            <View style={[styles.actions, !showCancel && styles.actionsSingle]}>
              {showCancel ? (
                <AppButton
                  title={cancelLabel}
                  onPress={handleCancel}
                  variant="outline"
                  size="sm"
                  disabled={busy}
                  style={styles.actionBtn}
                />
              ) : null}
              <AppButton
                title={confirmLabel}
                onPress={onConfirm}
                variant={toneStyle.confirmVariant}
                size="sm"
                loading={busy}
                disabled={busy}
                style={styles.actionBtn}
              />
            </View>
          </View>
        </MotiView>
      </RtlModalRoot>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: ALERT_DIALOG.screenInset,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    zIndex: 1,
  },
  content: {
    gap: ALERT_DIALOG.gap,
  },
  headerRow: {
    ...flexRow,
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  iconCircle: {
    width: DIALOG_ICON_SIZE,
    height: DIALOG_ICON_SIZE,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: spacing.sm,
    paddingTop: 2,
  },
  title: {
    fontSize: ALERT_DIALOG.titleSize,
    fontFamily: fonts.bold,
    fontWeight: '700',
    lineHeight: 26,
    ...textStart,
  },
  message: {
    fontSize: ALERT_DIALOG.messageSize,
    fontFamily: fonts.regular,
    lineHeight: ALERT_DIALOG.messageLineHeight,
    ...textStart,
  },
  actions: {
    ...flexRow,
    alignItems: 'center',
    gap: spacing.md,
    justifyContent: 'flex-end',
    flexWrap: 'nowrap',
    marginTop: spacing.sm,
  },
  actionsSingle: {
    justifyContent: 'flex-end',
  },
  actionBtn: {
    minWidth: ALERT_DIALOG.actionMinWidth,
    minHeight: ALERT_DIALOG.actionMinHeight,
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    paddingVertical: 0,
  },
});
