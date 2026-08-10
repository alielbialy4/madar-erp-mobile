import React, { RefObject } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppScreen } from './AppScreen';
import { AppButton } from '@/components/ui/AppButton';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { AppText as ProductText } from '@/components/ui/AppText';
import { fonts } from '@/constants/fonts';
import { typography } from '@/constants/typography';
import { textLtr, textStart } from '@/constants/layout';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';

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
  saveDisabled?: boolean;
  cancelLabel?: string;
  onCancel?: () => void;
  deleteLabel?: string;
  onDelete?: () => void;
  scroll?: boolean;
  scrollRef?: RefObject<ScrollView | null>;
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
  saveDisabled,
  cancelLabel = 'إلغاء',
  onCancel,
  deleteLabel,
  onDelete,
  scroll = true,
  scrollRef,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const tablet = isProductTablet(getProductLayoutTier(width));
  const tabInset = useTabBarBottomInset(spacing.md);
  const showFooter = Boolean(footer ?? onSave ?? onCancel ?? onDelete);

  return (
    <AppScreen title={title} subtitle={subtitle} onBack={onBack} headerRight={headerRight} scroll={scroll} scrollRef={scrollRef} contentStyle={{ padding: 0, gap: 0 }}>
      <View
        style={[
          styles.formFrame,
          {
            maxWidth: tablet ? 840 : undefined,
            paddingBottom: showFooter ? tabInset + 88 : tabInset,
          },
        ]}
      >
        {(heroTitle || heroSubtitle || heroAmount || heroBadge) ? (
          <View style={[styles.context, { borderBottomColor: c.border }]}>
            <View style={styles.contextCopy}>
              {heroBadge}
              {heroTitle ? <ProductText style={[styles.contextTitle, { color: c.text }]}>{heroTitle}</ProductText> : null}
              {heroSubtitle ? <ProductText style={[styles.contextSubtitle, { color: c.textMuted }]}>{heroSubtitle}</ProductText> : null}
            </View>
            {heroAmount ? <ProductText style={[styles.contextAmount, { color: c.text }]}>{heroAmount}</ProductText> : null}
          </View>
        ) : null}
        {actions ? <View style={styles.contextActions}>{actions}</View> : null}
        <View style={styles.sections}>{children}</View>
      </View>
      {showFooter ? (
        <View style={[styles.footerShell, { borderTopColor: c.border, backgroundColor: c.surface, paddingBottom: tabInset }]}>
          <View style={[styles.footerInner, { maxWidth: tablet ? 840 : undefined }]}>
            {footer ?? (
              <>
                {onDelete ? <AppButton title={deleteLabel ?? 'حذف'} variant="dangerGhost" onPress={onDelete} /> : null}
                <View style={styles.footerPrimaryGroup}>
                  {onCancel ? (
                    <AppButton
                      title={cancelLabel}
                      variant="secondary"
                      onPress={onCancel}
                      style={styles.cancelButton}
                    />
                  ) : null}
                  {onSave ? (
                    <AppButton
                      title={saveLabel}
                      onPress={onSave}
                      loading={saveLoading}
                      disabled={saveDisabled}
                      style={{ flex: 2 }}
                      fullWidth
                    />
                  ) : null}
                </View>
              </>
            )}
          </View>
        </View>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  formFrame: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xl,
  },
  context: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  contextCopy: { flex: 1, minWidth: 0, gap: spacing.xs },
  contextTitle: { ...textStart, fontFamily: fonts.bold, fontSize: typography.sectionTitle },
  contextSubtitle: { ...textStart, fontFamily: fonts.regular, fontSize: typography.small, lineHeight: 20 },
  contextAmount: { ...textLtr, fontFamily: fonts.extraBold, fontSize: typography.metric, lineHeight: 34 },
  contextActions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  sections: { gap: spacing.xl },
  footerShell: {
    position: 'absolute',
    start: 0,
    end: 0,
    bottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  footerInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  footerPrimaryGroup: { flex: 1, flexDirection: 'row', gap: spacing.sm },
  cancelButton: { minWidth: 96, flexShrink: 0 },
});
