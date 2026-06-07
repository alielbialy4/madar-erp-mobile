import React from 'react';
import { View } from 'react-native';
import { AppScreen } from './AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { AppText } from '@/components/ui/AppText';
import { createModuleStyles } from '@/styles/createModuleStyles';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';

type Props = {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  heroTitle?: string;
  heroSubtitle?: string;
  heroAmount?: string;
  heroBadge?: React.ReactNode;
  headerRight?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  saveLabel?: string;
  onSave?: () => void;
  saveLoading?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  deleteLabel?: string;
  onDelete?: () => void;
  scroll?: boolean;
};

export function FormScreenLayout({
  title,
  subtitle,
  onBack,
  heroTitle,
  heroSubtitle,
  heroAmount,
  heroBadge,
  headerRight,
  actions,
  children,
  footer,
  saveLabel = 'حفظ',
  onSave,
  saveLoading,
  cancelLabel = 'إلغاء',
  onCancel,
  deleteLabel,
  onDelete,
  scroll = true,
}: Props) {
  const c = useColors();
  const styles = createModuleStyles(c);
  const tabInset = useTabBarBottomInset(spacing.md);
  const showFooter = Boolean(footer ?? onSave ?? onCancel ?? onDelete);

  return (
    <AppScreen title={title} subtitle={subtitle} onBack={onBack} headerRight={headerRight} scroll={scroll} contentStyle={{ padding: 0, gap: 0 }}>
      <View style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.lg, paddingBottom: showFooter ? tabInset + 80 : tabInset }}>
        {(heroTitle || heroSubtitle || heroAmount || heroBadge) ? (
          <View style={styles.detailHero}>
            {heroBadge}
            {heroTitle ? <AppText style={styles.detailAmount}>{heroTitle}</AppText> : null}
            {heroSubtitle ? <AppText style={{ color: c.textMuted }}>{heroSubtitle}</AppText> : null}
            {heroAmount ? <AppText style={{ color: c.accent, fontWeight: '800', fontSize: 18 }}>{heroAmount}</AppText> : null}
          </View>
        ) : null}
        {actions ? <View style={styles.filterRow}>{actions}</View> : null}
        <View style={{ gap: spacing.lg }}>{children}</View>
      </View>
      {showFooter ? (
        <View style={[styles.stickyFooter, { paddingHorizontal: spacing.lg, paddingBottom: tabInset }]}>
          {footer ?? (
            <>
              {onDelete ? <AppButton title={deleteLabel ?? 'حذف'} variant="danger" onPress={onDelete} style={{ flex: 1 }} /> : null}
              {onCancel ? <AppButton title={cancelLabel} variant="secondary" onPress={onCancel} style={{ flex: 1 }} /> : null}
              {onSave ? <AppButton title={saveLabel} onPress={onSave} loading={saveLoading} style={{ flex: 2 }} fullWidth /> : null}
            </>
          )}
        </View>
      ) : null}
    </AppScreen>
  );
}
