import React, { useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import { AppInput } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { cartLineKey, cartTotals, type CartLine } from '@/store/posStore';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';

type Props = {
  lines: CartLine[];
  products: Product[];
  onUpdateQty: (lineKey: string, delta: number) => void;
  onRemoveLine: (lineKey: string) => void;
  onLineNotesChange: (lineKey: string, notes: string) => void;
};

function formatLineOptions(line: CartLine): string | null {
  const groups = line.selected_options ?? [];
  if (groups.length === 0) return null;
  return groups
    .map((g) => `${g.group_title}: ${g.options.map((o) => o.name).join('، ')}`)
    .join(' · ');
}

export function WaiterCartPanel({ lines, products, onUpdateQty, onRemoveLine, onLineNotesChange }: Props) {
  const c = useColors();
  const { total } = useMemo(() => cartTotals(lines), [lines]);
  const itemCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  if (lines.length === 0) {
    return (
      <AppEmptyState
        title="السلة فارغة"
        message="اختر من التصنيفات أو ابحث عن منتج لإضافته"
      />
    );
  }

  return (
    <View style={[styles.wrap, rtlDirection]}>
      <View style={[styles.summary, { backgroundColor: c.accentSoft, borderColor: c.accentBorder }]}>
        <Text style={[styles.summaryLabel, { color: c.textMuted }]}>الإجمالي</Text>
        <Text style={[styles.summaryValue, { color: c.text }]}>
          {money(total)} · {numberText(itemCount)} صنف
        </Text>
      </View>
      <FlatList
        data={lines}
        keyExtractor={(line) => cartLineKey(line)}
        style={styles.list}
        contentContainerStyle={{ gap: spacing.sm, paddingBottom: spacing.md }}
        renderItem={({ item: line, index }) => {
          const key = cartLineKey(line);
          const optionsLabel = formatLineOptions(line);
          const unitName =
            line.unit_id != null
              ? products
                  .find((p) => Number(p.id) === Number(line.product_id))
                  ?.units?.find((u) => Number(u.id) === Number(line.unit_id))?.name
              : null;
          const lineTotal =
            line.quantity *
            (line.unit_price +
              (line.selected_options ?? []).reduce((sum, group) => {
                if (group.pricing_type === 'group_price') return sum + (Number(group.group_price) || 0);
                return sum + group.options.reduce((s, o) => s + (Number(o.option_price) || 0), 0);
              }, 0));

          return (
            <View style={[styles.lineCard, { borderColor: c.borderSubtle, backgroundColor: c.surface }]}>
              <View style={[flexRow, { alignItems: 'flex-start', gap: spacing.sm }]}>
                <View style={[styles.indexBadge, { backgroundColor: c.surfaceMuted }]}>
                  <Text style={{ fontFamily: fonts.bold, color: c.text }}>{index + 1}</Text>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.lineName, textStart, { color: c.text }]}>{line.product_name}</Text>
                  {unitName ? (
                    <Text style={[styles.meta, textStart, { color: c.textMuted }]}>{unitName}</Text>
                  ) : null}
                  {line.variant_name ? (
                    <Text style={[styles.meta, textStart, { color: c.textMuted }]}>{line.variant_name}</Text>
                  ) : null}
                  {optionsLabel ? (
                    <Text style={[styles.meta, textStart, { color: c.textCaption }]}>{optionsLabel}</Text>
                  ) : null}
                  <AppInput
                    value={line.notes ?? ''}
                    onChangeText={(v) => onLineNotesChange(key, v)}
                    placeholder="ملاحظات"
                    style={{ marginTop: spacing.xs }}
                  />
                </View>
                <View style={{ alignItems: 'flex-end', gap: spacing.xs }}>
                  <Text style={{ fontFamily: fonts.bold, color: c.text }}>{money(lineTotal)}</Text>
                  <View style={[flexRow, { gap: 4, alignItems: 'center' }]}>
                    <Pressable
                      onPress={() => onUpdateQty(key, -1)}
                      style={[styles.qtyBtn, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
                    >
                      <MaterialIcons name="remove" size={18} color={c.text} />
                    </Pressable>
                    <Text style={{ minWidth: 28, textAlign: 'center', fontFamily: fonts.bold }}>{line.quantity}</Text>
                    <Pressable
                      onPress={() => onUpdateQty(key, 1)}
                      style={[styles.qtyBtn, { borderColor: c.accentBorder, backgroundColor: c.accentSoft }]}
                    >
                      <MaterialIcons name="add" size={18} color={c.accent} />
                    </Pressable>
                    <Pressable onPress={() => onRemoveLine(key)} hitSlop={8}>
                      <MaterialIcons name="delete-outline" size={22} color={c.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, minHeight: 200 },
  summary: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: 4,
  },
  summaryLabel: { fontSize: typography.tiny, fontFamily: fonts.medium },
  summaryValue: { fontSize: typography.sectionTitle, fontFamily: fonts.extraBold, fontWeight: '800' },
  list: { flex: 1 },
  lineCard: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md },
  indexBadge: {
    width: 28,
    height: 28,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lineName: { fontSize: typography.body, fontFamily: fonts.bold, fontWeight: '700' },
  meta: { fontSize: typography.tiny, marginTop: 2 },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
