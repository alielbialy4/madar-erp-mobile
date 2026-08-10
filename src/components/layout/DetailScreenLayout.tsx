import React from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ApiEnvelope } from '@/types/api';
import { AppScreen } from './AppScreen';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppText } from '@/components/ui/AppText';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useColors } from '@/hooks/useColors';
import { flexRow, textLtr, textStart } from '@/constants/layout';
import { fonts } from '@/constants/fonts';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { getProductLayoutTier, isProductTablet } from '@/constants/productLayout';
import { asText } from '@/utils/format';

type Field<T> = {
  label: string;
  value: (item: T) => string | number | null | undefined;
  ltr?: boolean;
};

type Section<T> = { title: string; fields: Field<T>[] };

type Props<T extends Record<string, unknown>> = {
  title: string;
  loader: () => Promise<ApiEnvelope<T>>;
  sections?: Section<T>[];
  fields?: Field<T>[];
  onBack?: () => void;
  headerRight?: React.ReactNode;
  badge?: (item: T) => { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' } | undefined;
  heroTitle?: (item: T) => string;
  heroAmount?: (item: T) => string | undefined;
  actions?: (item: T, refresh: () => void) => React.ReactNode;
  children?: (item: T, actions: { refresh: () => void }) => React.ReactNode;
  /** Pane mode inside MasterDetailLayout — no stack header chrome. */
  embedded?: boolean;
};

export function DetailScreenLayout<T extends Record<string, unknown>>({
  title,
  loader,
  sections,
  fields,
  onBack,
  headerRight,
  badge,
  heroTitle,
  heroAmount,
  actions,
  children,
  embedded = false,
}: Props<T>) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const tablet = isProductTablet(getProductLayoutTier(width));
  const { data, loading, error, refresh, refreshing } = useAsyncResource<T>(loader);
  const allSections = sections ?? (fields ? [{ title: 'البيانات', fields }] : []);
  const actionContent = data ? actions?.(data, refresh) : null;

  const body = (
    <>
      {loading && !data ? <AppLoadingState /> : null}
      {error && !data ? <AppErrorState message={error} onRetry={refresh} /> : null}
      {data ? (
        <View style={[styles.frame, { maxWidth: embedded ? undefined : tablet ? 960 : undefined }]}>
          <View style={[styles.identity, { borderBottomColor: c.border }]}>
            <View style={styles.identityCopy}>
              {badge?.(data) ? <View style={styles.badgeSlot}><AppBadge {...badge(data)!} /></View> : null}
              <AppText style={[styles.identityTitle, { color: c.text }]}>
                {heroTitle?.(data) ?? asText(data.name ?? data.invoice_number ?? data.id)}
              </AppText>
            </View>
            {heroAmount?.(data) ? (
              <AppText style={[styles.primaryValue, { color: c.text }]}>{heroAmount(data)}</AppText>
            ) : null}
          </View>

          {actionContent ? <View style={styles.actions}>{actionContent}</View> : null}

          {allSections.map((section) => (
            <View key={section.title} style={[styles.section, { backgroundColor: c.surface, borderColor: c.borderSubtle }]}>
              <AppText style={[styles.sectionTitle, { color: c.text }]}>{section.title}</AppText>
              <View>
                {section.fields.map((field, index) => (
                  <View
                    key={field.label}
                    style={[
                      styles.fieldRow,
                      index < section.fields.length - 1 && { borderBottomColor: c.borderSubtle, borderBottomWidth: StyleSheet.hairlineWidth },
                    ]}
                  >
                    <AppText style={[styles.fieldLabel, { color: c.textMuted }]}>{field.label}</AppText>
                    <AppText style={[styles.fieldValue, { color: c.text }, field.ltr ? textLtr : undefined]}>
                      {asText(field.value(data))}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          ))}

          {children?.(data, { refresh })}
        </View>
      ) : null}
    </>
  );

  return (
    <AppScreen
      title={title}
      onBack={embedded ? undefined : onBack}
      headerRight={embedded ? undefined : headerRight}
      onRefresh={refresh}
      refreshing={refreshing}
      noHeader={embedded}
      safeEdges={embedded ? [] : undefined}
      contentStyle={embedded ? { padding: spacing.md, paddingTop: spacing.sm } : undefined}
    >
      {body}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  frame: { width: '100%', alignSelf: 'center', gap: spacing.lg },
  identity: {
    ...flexRow,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  identityCopy: { flex: 1, minWidth: 0, gap: spacing.sm },
  badgeSlot: { alignSelf: 'flex-start' },
  identityTitle: {
    ...textStart,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    fontSize: typography.pageTitle,
    lineHeight: 32,
  },
  primaryValue: {
    ...textLtr,
    fontFamily: fonts.extraBold,
    fontWeight: '800',
    fontSize: typography.metric,
    lineHeight: 34,
  },
  actions: { ...flexRow, alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  section: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
  },
  sectionTitle: {
    ...textStart,
    fontFamily: fonts.bold,
    fontWeight: '700',
    fontSize: typography.cardTitle,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  fieldRow: {
    ...flexRow,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  fieldLabel: { ...textStart, fontFamily: fonts.regular, fontSize: typography.small, minWidth: 104 },
  fieldValue: { ...textStart, flex: 1, fontFamily: fonts.bold, fontSize: typography.body },
});
