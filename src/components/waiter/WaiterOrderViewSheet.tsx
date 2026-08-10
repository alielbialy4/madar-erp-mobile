import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppButton } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { money, numberText } from '@/utils/format';

import { getOrderStatusStyle } from '@/constants/statusColors';

type OrderItem = {
  id?: number;
  quantity?: number;
  unit_price?: number;
  subtotal?: number;
  notes?: string | null;
  kitchen_status?: string;
  product?: { name?: string };
};

const STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  served: 'تم التقديم',
  completed: 'مكتمل',
  cancelled: 'ملغى',
};

type Props = {
  tableName: string;
  order: Record<string, unknown>;
  busy: boolean;
  canSettle: boolean;
  onClose: () => void;
  onStartAdd: () => void;
  onSendKitchen: () => void;
  onSettle: () => void;
  onOpenTableOrder: () => void;
};

export function WaiterOrderViewSheet({
  tableName,
  order,
  busy,
  canSettle,
  onClose,
  onStartAdd,
  onSendKitchen,
  onSettle,
  onOpenTableOrder,
}: Props) {
  const c = useColors();
  const items = useMemo(() => (order.items as OrderItem[] | undefined) ?? [], [order.items]);
  const status = String(order.status ?? 'pending');
  const statusTheme = getOrderStatusStyle(c, status);
  const itemCount = useMemo(
    () => items.reduce((sum, it) => sum + Number(it.quantity ?? 0), 0),
    [items],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.head, { borderColor: c.borderSubtle, backgroundColor: c.surface }]}>
        <View style={styles.headTop}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <View style={styles.headLabel}>
              <MaterialIcons name="receipt-long" size={14} color={c.primary} />
              <Text style={[styles.headLabelText, { color: c.textMuted }]}>تفاصيل الطلب</Text>
            </View>
            <Text style={[styles.totalValue, { color: c.text }]}>{money(order.total ?? 0)}</Text>
            <View style={[styles.tableBadge, { backgroundColor: c.primarySoftMuted, borderColor: c.primarySoftBorder }]}>
              <MaterialIcons name="table-restaurant" size={12} color={c.primary} />
              <Text style={[styles.tableBadgeText, { color: c.primary }]} numberOfLines={1}>
                {tableName}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} style={[styles.closeBtn, { borderColor: c.borderSubtle }]}>
            <MaterialIcons name="close" size={20} color={c.textMuted} />
          </Pressable>
        </View>
        <View style={[styles.metaRow, { borderTopColor: c.borderSubtle }]}>
          <Text style={[styles.orderId, { color: c.textMuted }]}>#{numberText(order.id)}</Text>
          <View style={[styles.statusPill, { backgroundColor: statusTheme.bg, borderColor: statusTheme.border }]}>
            <Text style={[styles.statusText, { color: statusTheme.fg }]}>
              {STATUS_LABELS[status] ?? status}
            </Text>
          </View>
          <View style={[styles.countPill, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}>
            <Text style={[styles.countText, { color: c.text }]}>{numberText(itemCount)} صنف</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.linesScroll} contentContainerStyle={styles.linesInner}>
        {items.length === 0 ? (
          <Text style={{ textAlign: 'center', color: c.textMuted, paddingVertical: spacing.xl }}>
            لا توجد أصناف
          </Text>
        ) : (
          items.map((it, i) => {
            const qty = Number(it.quantity ?? 0);
            const lineTotal = Number(it.subtotal ?? qty * Number(it.unit_price ?? 0));
            return (
              <View
                key={String(it.id ?? i)}
                style={[styles.lineCard, { borderColor: c.borderSubtle, backgroundColor: c.surface }]}
              >
                <View style={[styles.lineQtyBadge, { backgroundColor: c.primary }]}>
                  <Text style={[styles.lineQtyText, { color: c.primaryForeground }]}>{numberText(qty)}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.lineRow}>
                    <Text style={[styles.lineName, { color: c.text }]} numberOfLines={2}>
                      {it.product?.name ?? 'صنف'}
                    </Text>
                    <Text style={[styles.linePrice, { color: c.text }]}>{money(lineTotal)}</Text>
                  </View>
                  {it.notes ? (
                    <Text style={[styles.lineNotes, { color: c.textMuted }]}>{it.notes}</Text>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <View style={[styles.summary, { borderColor: c.borderSubtle, backgroundColor: c.surfaceMuted }]}>
        <View style={styles.summaryRow}>
          <Text style={{ color: c.textMuted, fontFamily: fonts.medium }}>الإجمالي</Text>
          <Text style={[styles.summaryTotal, { color: c.text }]}>{money(order.total ?? 0)}</Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.actionRow}>
          <AppButton
            title="إضافة أصناف"
            variant="outline"
            onPress={onStartAdd}
            disabled={busy}
            style={styles.halfBtn}
          />
          <AppButton
            title="إرسال للمطبخ"
            variant="secondary"
            onPress={onSendKitchen}
            loading={busy}
            style={styles.halfBtn}
          />
        </View>
        {canSettle ? (
          <AppButton title="تحصيل" onPress={onSettle} loading={busy} fullWidth />
        ) : null}
        <AppButton title="تسوية من شاشة الطاولة" variant="ghost" onPress={onOpenTableOrder} fullWidth />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.md, maxHeight: '85%' },
  head: { borderRadius: radius.xl, borderWidth: 1, overflow: 'hidden' },
  headTop: { ...flexRow, alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md },
  headLabel: { ...flexRow, alignItems: 'center', gap: 4, marginBottom: 4 },
  headLabelText: { fontSize: typography.tiny, fontFamily: fonts.bold },
  totalValue: { fontSize: 28, fontFamily: fonts.extraBold, ...textStart },
  tableBadge: {
    ...flexRow,
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  tableBadgeText: { fontSize: typography.tiny, fontFamily: fonts.bold, maxWidth: 200 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaRow: {
    ...flexRow,
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
  },
  orderId: { fontSize: typography.tiny, fontFamily: fonts.bold },
  statusPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  statusText: { fontSize: 10, fontFamily: fonts.bold },
  countPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  countText: { fontSize: 10, fontFamily: fonts.bold },
  linesScroll: { maxHeight: 280 },
  linesInner: { gap: spacing.xs, paddingVertical: spacing.xs },
  lineCard: {
    ...flexRow,
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  lineQtyBadge: {
    minWidth: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: radius.md,
    marginTop: 2,
  },
  lineQtyText: {
    fontSize: typography.small,
    fontFamily: fonts.extraBold,
    textAlign: 'center',
  },
  lineRow: { ...flexRow, justifyContent: 'space-between', gap: spacing.sm },
  lineName: { flex: 1, fontSize: typography.small, fontFamily: fonts.bold, ...textStart },
  linePrice: { fontSize: typography.small, fontFamily: fonts.extraBold },
  lineNotes: { fontSize: typography.tiny, fontFamily: fonts.medium, marginTop: 4, ...textStart },
  summary: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  summaryRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center' },
  summaryTotal: { fontSize: typography.sectionTitle, fontFamily: fonts.extraBold },
  actions: { gap: spacing.sm, paddingTop: spacing.xs },
  actionRow: { ...flexRow, gap: spacing.sm },
  halfBtn: { flex: 1 },
});
