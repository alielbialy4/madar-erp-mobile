import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { flexRow, textStart } from '@/constants/layout';
import { AppText as Text } from '@/components/ui/AppText';
import type { CartLineSelectedOption, Product } from '@/types/api';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppCard, AppSectionHeader } from '@/components/ui';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { money } from '@/utils/format';

type Props = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (options: CartLineSelectedOption[]) => void;
};

export function ModifierPickerSheet({ visible, product, onClose, onConfirm }: Props) {
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const activeGroups = useMemo(() => {
    if (!product?.option_groups) return [];
    return product.option_groups.filter((g) => g.options && g.options.length > 0);
  }, [product]);

  const toggleSingle = (groupId: number, optionId: number) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      return { ...prev, [groupId]: current.includes(optionId) ? [] : [optionId] };
    });
    setErrors([]);
  };

  const toggleMultiple = (groupId: number, optionId: number) => {
    setSelected((prev) => {
      const current = prev[groupId] ?? [];
      return { ...prev, [groupId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId] };
    });
    setErrors([]);
  };

  const validate = (): string[] => {
    const msgs: string[] = [];
    for (const group of activeGroups) {
      if (group.is_required && (!selected[group.id] || selected[group.id].length === 0)) {
        msgs.push(`"${group.title}" مطلوب`);
      }
      if (group.selection_type === 'single' && (selected[group.id]?.length ?? 0) > 1) {
        msgs.push(`"${group.title}" يمكن اختيار خيار واحد فقط`);
      }
    }
    return msgs;
  };

  const handleConfirm = () => {
    const validationErrors = validate();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    const result: CartLineSelectedOption[] = activeGroups
      .filter((g) => selected[g.id] && selected[g.id].length > 0)
      .map((g) => ({
        product_option_group_id: g.id,
        group_title: g.title,
        pricing_type: g.pricing_type,
        group_price: g.group_price ? Number(g.group_price) : undefined,
        options: selected[g.id].map((oid) => {
          const opt = g.options!.find((o) => o.id === oid)!;
          return {
            product_option_id: opt.id,
            name: opt.name,
            option_price: Number(opt.price ?? 0),
            applied_price: g.pricing_type === 'group_price' ? 0 : Number(opt.price ?? 0),
          };
        }),
      }));
    onConfirm(result);
    setSelected({});
    setErrors([]);
  };

  const handleClose = () => {
    setSelected({});
    setErrors([]);
    onClose();
  };

  return (
    <AppBottomSheet visible={visible} onClose={handleClose}>
      <View style={styles.container}>
        <AppSectionHeader title={`خيارات: ${product?.name ?? ''}`} />
        {errors.length > 0 ? (
          <View style={styles.errorBox}>
            {errors.map((e, i) => <Text key={i} style={styles.errorText}>{e}</Text>)}
          </View>
        ) : null}
        <FlatList
          data={activeGroups}
          keyExtractor={(g) => String(g.id)}
          renderItem={({ item: group }) => (
            <AppCard style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <Text style={styles.groupTitle}>{group.title}</Text>
                {group.is_required ? <Text style={styles.requiredBadge}>مطلوب</Text> : null}
                <Text style={styles.groupType}>{group.selection_type === 'single' ? 'اختيار واحد' : 'اختيارات متعددة'}</Text>
              </View>
              <View style={styles.optionsWrap}>
                {group.options!.map((opt) => {
                  const isSelected = (selected[group.id] ?? []).includes(opt.id);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() => group.selection_type === 'single' ? toggleSingle(group.id, opt.id) : toggleMultiple(group.id, opt.id)}
                      style={[styles.optionChip, isSelected ? styles.optionSelected : undefined]}
                    >
                      <Text style={[styles.optionText, isSelected ? styles.optionTextSelected : undefined]}>
                        {opt.name} {Number(opt.price ?? 0) > 0 ? `(+${money(opt.price)})` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </AppCard>
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>لا توجد خيارات لهذا المنتج</Text>}
        />
        <View style={styles.actions}>
          <AppButton title="إضافة للسلة" onPress={handleConfirm} style={{ flex: 1 }} />
          <AppButton title="إلغاء" variant="outline" onPress={handleClose} style={{ flex: 1 }} />
        </View>
      </View>
    </AppBottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md, maxHeight: '80%' },
  groupCard: { gap: spacing.sm },
  groupHeader: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  groupTitle: { fontSize: typography.body, fontWeight: '900', color: colors.text },
  requiredBadge: { fontSize: typography.tiny, color: colors.danger, fontWeight: '800' },
  groupType: { fontSize: typography.tiny, color: colors.textMuted },
  optionsWrap: { ...flexRow, flexWrap: 'wrap', gap: spacing.sm },
  optionChip: { minHeight: 38, paddingHorizontal: spacing.lg, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, justifyContent: 'center' },
  optionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  optionText: { fontSize: typography.small, color: colors.text, fontWeight: '700' },
  optionTextSelected: { color: colors.primaryForeground },
  errorBox: { backgroundColor: colors.softDanger, borderRadius: radius.xl, padding: spacing.md, gap: spacing.xs },
  errorText: { color: colors.danger, fontSize: typography.small, ...textStart, fontWeight: '700' },
  emptyText: { color: colors.textMuted, ...textStart, paddingVertical: spacing.lg },
  actions: { ...flexRow, gap: spacing.md, paddingTop: spacing.md },
});
