import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { AppButton } from '@/components/ui';

type Props = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: 'primary' | 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', loading, variant = 'danger', onConfirm, onCancel }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.actions}>
            <AppButton title={cancelLabel} onPress={onCancel} variant="outline" style={styles.action} />
            <AppButton title={confirmLabel} onPress={onConfirm} variant={variant} style={styles.action} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', padding: spacing.xl },
  dialog: {
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    padding: spacing.xxl,
    gap: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: typography.h3,
    fontFamily: fonts.bold,
    fontWeight: '700',
    ...textStart,
  },
  message: {
    color: colors.textMuted,
    fontSize: typography.body,
    fontFamily: fonts.regular,
    ...textStart,
    lineHeight: 24,
  },
  actions: { ...flexRow, gap: spacing.md, justifyContent: 'flex-end' },
  action: { minWidth: 100 },
});
