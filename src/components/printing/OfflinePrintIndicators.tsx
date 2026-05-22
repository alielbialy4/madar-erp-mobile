import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge } from '@/components/ui';
import { flexRow, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { useNetworkStore } from '@/store/networkStore';
import { usePosStore } from '@/store/posStore';
import { usePrintStore } from '@/store/printStore';
import { countByStatus } from '@/services/offline/posOrders';
import { numberText } from '@/utils/format';

export function OfflinePrintIndicators({ compact }: { compact?: boolean }) {
  const c = useColors();
  const isOnline = useNetworkStore((s) => s.isOnline);
  const pendingOrders = usePosStore((s) => s.pendingOrders);
  const printPending = usePrintStore((s) => s.pendingCount);
  const printFailed = usePrintStore((s) => s.failedCount);
  const lastError = usePrintStore((s) => s.diagnostics.last_error);
  const refreshPrint = usePrintStore((s) => s.refresh);

  useEffect(() => {
    void refreshPrint();
  }, [refreshPrint]);

  const syncCounts = countByStatus(pendingOrders);
  const showOffline = !isOnline;
  const showSync = syncCounts.pending > 0 || syncCounts.failed > 0;
  const showPrint = printPending > 0 || printFailed > 0 || !!lastError;

  if (!showOffline && !showSync && !showPrint) return null;

  return (
    <View style={[styles.wrap, compact && styles.compact, { backgroundColor: c.softWarning }]}>
      {showOffline ? (
        <Text style={[styles.line, { color: c.warning }, textStart]}>غير متصل — وضع نقطة البيع المحلي متاح عند وجود كتالوج مخزّن</Text>
      ) : null}
      {syncCounts.pending > 0 ? (
        <Text style={[styles.line, { color: c.text }, textStart]}>مزامنة معلقة: {numberText(syncCounts.pending)}</Text>
      ) : null}
      {syncCounts.failed > 0 ? (
        <View style={[flexRow, styles.row]}>
          <AppBadge label={`فشلت المزامنة: ${numberText(syncCounts.failed)}`} tone="danger" />
        </View>
      ) : null}
      {printPending > 0 ? (
        <Text style={[styles.line, { color: c.text }, textStart]}>طباعة معلقة: {numberText(printPending)}</Text>
      ) : null}
      {printFailed > 0 ? (
        <Text style={[styles.line, { color: c.danger }, textStart]}>فشلت الطباعة: {numberText(printFailed)} — يمكنك إعادة المحاولة</Text>
      ) : null}
      {lastError ? (
        <Text style={[styles.line, { color: c.danger }, textStart]} numberOfLines={compact ? 1 : 3}>
          {lastError}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, gap: spacing.xs },
  compact: { paddingVertical: spacing.xs },
  line: { fontSize: typography.small, fontWeight: '700' },
  row: { gap: spacing.sm, alignItems: 'center' },
});
