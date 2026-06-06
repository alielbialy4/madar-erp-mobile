import React from 'react';
import { View } from 'react-native';
import { AppBottomSheet } from '@/components/layout/AppBottomSheet';
import { spacing } from '@/constants/spacing';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function SheetFormLayout({ visible, onClose, title, children, footer }: Props) {
  return (
    <AppBottomSheet visible={visible} onClose={onClose} title={title}>
      <View style={{ gap: spacing.lg, paddingBottom: spacing.md }}>
        {children}
        {footer}
      </View>
    </AppBottomSheet>
  );
}
