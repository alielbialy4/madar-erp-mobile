import React from 'react';
import { Modal, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText } from '@/components/ui/AppText';
import { useColors } from '@/hooks/useColors';
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
  variant?: 'primary' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({ visible, title, message, confirmLabel = 'تأكيد', cancelLabel = 'إلغاء', loading, variant = 'danger', onConfirm, onCancel }: Props) {
  const c = useColors();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: c.overlay, justifyContent: 'center', padding: spacing.xl }}>
        <View style={{
          backgroundColor: c.surface,
          borderRadius: radius.xxl,
          padding: spacing.xxl,
          gap: spacing.lg,
        }}>
          <AppText style={{
            color: c.text,
            fontSize: typography.h3,
            fontFamily: fonts.bold,
            fontWeight: '700',
            ...textStart,
          }}>{title}</AppText>
          <AppText style={{
            color: c.textMuted,
            fontSize: typography.body,
            fontFamily: fonts.regular,
            ...textStart,
            lineHeight: 24,
          }}>{message}</AppText>
          <View style={{ ...flexRow, gap: spacing.md, justifyContent: 'flex-end' }}>
            <AppButton title={cancelLabel} onPress={onCancel} variant="outline" style={{ minWidth: 100 }} />
            <AppButton title={confirmLabel} onPress={onConfirm} variant={variant} style={{ minWidth: 100 }} loading={loading} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
