import React from 'react';
import { StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import type { ApiEnvelope } from '@/types/api';
import { AppScreen } from '@/components/layout';
import { AppBadge, AppCard, AppSectionHeader } from '@/components/ui';
import { AppErrorState, AppLoadingState } from '@/components/feedback';
import { useAsyncResource } from '@/hooks/useAsyncResource';
import { colors } from '@/constants/colors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { asText } from '@/utils/format';

type Field<T> = {
  label: string;
  value: (item: T) => string | number | null | undefined;
  ltr?: boolean;
};

type Props<T extends Record<string, unknown>> = {
  title: string;
  loader: () => Promise<ApiEnvelope<T>>;
  fields: Field<T>[];
  onBack?: () => void;
  badge?: (item: T) => { label: string; tone?: 'default' | 'success' | 'warning' | 'danger' | 'info' } | undefined;
  children?: (item: T, actions: { refresh: () => void }) => React.ReactNode;
};

export function DetailScreen<T extends Record<string, unknown>>({ title, loader, fields, onBack, badge, children }: Props<T>) {
  const { data, loading, error, refresh, refreshing } = useAsyncResource<T>(loader);

  return (
    <AppScreen title={title} onBack={onBack} refreshing={refreshing} onRefresh={refresh}>
      {loading && !data ? <AppLoadingState /> : null}
      {error && !data ? <AppErrorState message={error} onRetry={refresh} /> : null}
      {data ? (
        <>
          <AppCard style={styles.headerCard}>
            <View style={styles.badgeRow}>{badge?.(data) ? <AppBadge {...badge(data)!} /> : null}</View>
            <Text style={styles.mainTitle}>{asText(data.name ?? data.invoice_number ?? data.id)}</Text>
          </AppCard>
          <AppCard style={styles.card}>
            <AppSectionHeader title="البيانات" />
            {fields.map((field) => (
              <View key={field.label} style={styles.fieldRow}>
                <Text style={[styles.value, field.ltr ? styles.ltr : undefined]}>{asText(field.value(data))}</Text>
                <Text style={styles.label}>{field.label}</Text>
              </View>
            ))}
          </AppCard>
          {children?.(data, { refresh })}
        </>
      ) : null}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerCard: { gap: spacing.sm },
  badgeRow: { ...flexRow },
  mainTitle: { color: colors.text, fontSize: typography.h2, fontWeight: '900', ...textStart },
  card: { gap: spacing.md },
  fieldRow: { ...flexRow, alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: spacing.sm },
  label: { color: colors.textMuted, fontSize: typography.small, ...textStart, minWidth: 112 },
  value: { color: colors.text, fontSize: typography.body, fontWeight: '700', ...textStart, flex: 1 },
  ltr: { writingDirection: 'ltr', textAlign: 'left' },
});
