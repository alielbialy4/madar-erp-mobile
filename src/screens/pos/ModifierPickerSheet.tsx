import React, { useMemo, useState } from 'react';
import { FlatList, Image, Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppText as Text } from '@/components/ui/AppText';
import type { CartLineSelectedOption, Product } from '@/types/api';
import { AppBottomSheet } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { useColors } from '@/hooks/useColors';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { money } from '@/utils/format';
import { resolveMediaUrl } from '@/utils/media';

type Props = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onConfirm: (options: CartLineSelectedOption[]) => void;
};

export function ModifierPickerSheet({ visible, product, onClose, onConfirm }: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const [selected, setSelected] = useState<Record<number, number[]>>({});
  const [errors, setErrors] = useState<string[]>([]);

  const activeGroups = useMemo(() => {
    if (!product?.option_groups) return [];
    return product.option_groups.filter((g) => g.options && g.options.length > 0);
  }, [product]);

  const thumb = product?.image ? resolveMediaUrl(product.image) : null;

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
      return {
        ...prev,
        [groupId]: current.includes(optionId) ? current.filter((id) => id !== optionId) : [...current, optionId],
      };
    });
    setErrors([]);
  };

  const validate = (): string[] => {
    const msgs: string[] = [];
    for (const group of activeGroups) {
      if (group.is_required && (!selected[group.id] || selected[group.id].length === 0)) {
        msgs.push(`«${group.title}» مطلوب — اختر خياراً واحداً على الأقل`);
      }
      if (group.selection_type === 'single' && (selected[group.id]?.length ?? 0) > 1) {
        msgs.push(`«${group.title}» — اختيار واحد فقط`);
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
      <View style={{ gap: spacing.md, maxHeight: '82%' }}>
        {product ? (
          <View style={[flexRow, { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm }]}>
            {thumb ? (
              <Image source={{ uri: thumb }} style={{ width: 56, height: 56, borderRadius: radius.xl }} resizeMode="cover" />
            ) : (
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: radius.xl,
                  backgroundColor: c.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MaterialIcons name="fastfood" size={28} color={c.textCaption} />
              </View>
            )}
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ ...textStart, fontSize: typography.sectionTitle, fontFamily: fonts.bold, color: c.text }}>
                {product.name}
              </Text>
              <Text style={{ ...textStart, fontSize: typography.small, fontFamily: fonts.medium, color: c.textMuted }}>
                {money(product.selling_price)} · اختر الخيارات
              </Text>
            </View>
          </View>
        ) : (
          <PosSheetHeader title="خيارات المنتج" />
        )}

        {errors.length > 0 ? (
          <View style={s.errorBanner}>
            {errors.map((e, i) => (
              <Text key={i} style={s.errorText}>
                {e}
              </Text>
            ))}
          </View>
        ) : null}

        <FlatList
          data={activeGroups}
          keyExtractor={(g) => String(g.id)}
          style={{ maxHeight: 360 }}
          contentContainerStyle={{ gap: spacing.md, paddingBottom: spacing.md }}
          renderItem={({ item: group }) => (
            <View style={s.sectionCard}>
              <View style={[flexRow, { alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }]}>
                <Text style={{ fontSize: typography.body, fontFamily: fonts.bold, color: c.text, ...textStart }}>
                  {group.title}
                </Text>
                {group.is_required ? (
                  <View style={{ paddingHorizontal: 8, paddingVertical: 2, borderRadius: radius.pill, backgroundColor: c.softDanger }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.bold, color: c.danger }}>مطلوب</Text>
                  </View>
                ) : (
                  <Text style={{ fontSize: typography.tiny, color: c.textCaption }}>اختياري</Text>
                )}
                <Text style={{ fontSize: typography.tiny, color: c.textMuted }}>
                  {group.selection_type === 'single' ? 'اختيار واحد' : 'متعدد'}
                </Text>
              </View>
              <View style={[flexRow, { flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }]}>
                {group.options!.map((opt) => {
                  const isSelected = (selected[group.id] ?? []).includes(opt.id);
                  const priceDelta = Number(opt.price ?? 0);
                  return (
                    <Pressable
                      key={opt.id}
                      onPress={() =>
                        group.selection_type === 'single'
                          ? toggleSingle(group.id, opt.id)
                          : toggleMultiple(group.id, opt.id)
                      }
                      style={{
                        minHeight: 44,
                        paddingHorizontal: spacing.lg,
                        paddingVertical: spacing.sm,
                        borderRadius: radius.pill,
                        borderWidth: 1.5,
                        borderColor: isSelected ? c.primary : c.border,
                        backgroundColor: isSelected ? c.softPrimary : c.surface,
                        ...flexRow,
                        alignItems: 'center',
                        gap: spacing.xs,
                      }}
                    >
                      {isSelected ? <MaterialIcons name="check-circle" size={16} color={c.primary} /> : null}
                      <Text
                        style={{
                          fontSize: typography.small,
                          fontFamily: fonts.bold,
                          color: isSelected ? c.primary : c.text,
                          writingDirection: 'rtl',
                        }}
                      >
                        {opt.name}
                        {priceDelta > 0 ? ` (+${money(priceDelta)})` : ''}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ ...textStart, color: c.textMuted, paddingVertical: spacing.lg }}>لا توجد خيارات لهذا المنتج</Text>
          }
        />

        <View style={s.stickyFooter}>
          <AppButton title="إضافة إلى السلة" onPress={handleConfirm} size="lg" fullWidth />
          <AppButton title="إلغاء" variant="outline" onPress={handleClose} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
