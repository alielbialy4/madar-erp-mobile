import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { AppBadge } from '@/components/ui/AppBadge';
import { FinancialValue } from './FinancialValue';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { textStyle } from '@/constants/textStyles';
import type { ComponentProps } from 'react';

type BadgeTone = NonNullable<ComponentProps<typeof AppBadge>['tone']>;

type Props = {
  title: string;
  subtitle?: string;
  statusLabel?: string;
  statusTone?: BadgeTone;
  amount?: string | number;
  currency?: string;
  meta?: string;
};

/** Transaction document identity header */
export function DocumentHeader({
  title,
  subtitle,
  statusLabel,
  statusTone,
  amount,
  currency,
  meta,
}: Props) {
  const c = useColors();
  return (
    <View style={styles.root}>
      <View style={styles.top}>
        <View style={styles.identity}>
          <AppText style={[textStyle('entityTitle'), { color: c.text }]} numberOfLines={2}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText style={[textStyle('rowSecondary'), { color: c.textMuted }]} numberOfLines={1}>
              {subtitle}
            </AppText>
          ) : null}
          {meta ? (
            <AppText style={[textStyle('metadata'), { color: c.textCaption }]} numberOfLines={1}>
              {meta}
            </AppText>
          ) : null}
        </View>
        {statusLabel ? <AppBadge label={statusLabel} tone={statusTone} /> : null}
      </View>
      {amount != null ? (
        <FinancialValue amount={amount} currency={currency} level="large" align="start" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md },
  top: { ...flexRow, alignItems: 'flex-start', gap: spacing.md },
  identity: { flex: 1, gap: 4 },
});
