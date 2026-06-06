import React from 'react';
import { View } from 'react-native';
import type { ApiEnvelope } from '@/types/api';
import { AppScreen } from './AppScreen';
import { AppBadge } from '@/components/ui/AppBadge';
import { AppCard } from '@/components/ui/AppCard';
import { AppSectionHeader } from '@/components/ui/AppSectionHeader';
import { AppText } from '@/components/ui/AppText';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { createModuleStyles } from '@/styles/createModuleStyles';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { asText } from '@/utils/format';

type Field<T> = {
  label: string;
  value: (item: T) => string | number | null | undefined;
  ltr?: boolean;
};

type Section<T> = {
  title: string;
  fields: Field<T>[];
};

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
}: Props<T>) {
  const c = useColors();
  const styles = createModuleStyles(c);
  const { data, loading, error, refresh, refreshing } = useAsyncResource<T>(loader);
  const allSections = sections ?? (fields ? [{ title: 'البيانات', fields }] : []);

  return (
    <AppScreen title={title} onBack={onBack} headerRight={headerRight} onRefresh={refresh} refreshing={refreshing}>
      {loading && !data ? <AppLoadingState /> : null}
      {error && !data ? <AppErrorState message={error} onRetry={refresh} /> : null}
      {data ? (
        <View style={{ gap: spacing.lg }}>
          <View style={styles.detailHero}>
            {badge?.(data) ? <AppBadge {...badge(data)!} /> : null}
            <AppText style={styles.detailAmount}>{heroTitle?.(data) ?? asText(data.name ?? data.invoice_number ?? data.id)}</AppText>
            {heroAmount?.(data) ? <AppText style={{ color: c.textMuted }}>{heroAmount(data)}</AppText> : null}
          </View>
          {actions?.(data, refresh)}
          {allSections.map((section) => (
            <AppCard key={section.title} style={{ gap: spacing.md }}>
              <AppSectionHeader title={section.title} />
              {section.fields.map((field) => (
                <View key={field.label} style={styles.fieldRow}>
                  <AppText style={styles.fieldLabel}>{field.label}</AppText>
                  <AppText style={[styles.fieldValue, field.ltr ? { writingDirection: 'ltr', textAlign: 'left' } : undefined]}>
                    {asText(field.value(data))}
                  </AppText>
                </View>
              ))}
            </AppCard>
          ))}
          {children?.(data, { refresh })}
        </View>
      ) : null}
    </AppScreen>
  );
}
