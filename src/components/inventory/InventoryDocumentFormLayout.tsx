import React from 'react';
import { View } from 'react-native';
import { FormScreenLayout } from '@/components/layout';
import { InventoryScopeBanner } from '@/components/inventory/InventoryScopeBanner';
import { spacing } from '@/constants/spacing';

type Props = {
  title: string;
  onBack: () => void;
  onSave?: () => void;
  saveLoading?: boolean;
  saveLabel?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  children: React.ReactNode;
};

export function InventoryDocumentFormLayout({
  title,
  onBack,
  onSave,
  saveLoading,
  saveLabel,
  heroTitle,
  heroSubtitle,
  children,
}: Props) {
  return (
    <FormScreenLayout
      title={title}
      onBack={onBack}
      onSave={onSave}
      saveLoading={saveLoading}
      saveLabel={saveLabel}
      heroTitle={heroTitle}
      heroSubtitle={heroSubtitle}
    >
      <View style={{ gap: spacing.md }}>
        <InventoryScopeBanner />
        {children}
      </View>
    </FormScreenLayout>
  );
}
