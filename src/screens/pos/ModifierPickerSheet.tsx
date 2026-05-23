import React, { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, View } from 'react-native';
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
import { money, numberText } from '@/utils/format';
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

  useEffect(() => {
    if (!visible) return;
    setSelected({});
    setErrors([]);
  }, [product?.id, visible]);

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
      <View style={{ gap: spacing.md }}>
        {product ? (
          <View
            style={[
              flexRow,
              {
                alignItems: 'center',
                gap: spacing.md,
                padding: spacing.sm,
                borderRadius: radius.xxl,
                backgroundColor: c.surfaceMuted,
                borderWidth: 1,
                borderColor: c.borderSubtle,
              },
            ]}
          >
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

        <View style={{ gap: spacing.md }}>
          {activeGroups.length > 0 ? (
            activeGroups.map((group) => {
              const groupSelection = selected[group.id] ?? [];
              return (
                <View key={group.id} style={[s.sectionCard, { backgroundColor: c.surface }]}>
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
                    {groupSelection.length > 0 ? (
                      <Text style={{ fontSize: typography.tiny, fontFamily: fonts.bold, color: c.accent }}>
                        محدد: {numberText(groupSelection.length)}
                      </Text>
                    ) : null}
                  </View>
                  {group.pricing_type === 'group_price' && Number(group.group_price ?? 0) > 0 ? (
                    <Text style={{ ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.medium }}>
                      سعر المجموعة: {money(group.group_price)}
                    </Text>
                  ) : null}
                  <View style={[flexRow, { flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm }]}>
                    {group.options!.map((opt) => {
                      const isSelected = groupSelection.includes(opt.id);
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
                            minWidth: 112,
                            flexGrow: 1,
                            flexBasis: '46%',
                            paddingHorizontal: spacing.md,
                            paddingVertical: spacing.sm,
                            borderRadius: radius.lg,
                            borderWidth: 1.5,
                            borderColor: isSelected ? c.accent : c.border,
                            backgroundColor: isSelected ? c.accentSoft : c.surfaceMuted,
                            ...flexRow,
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: spacing.sm,
                          }}
                        >
                          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                            <Text
                              style={{
                                fontSize: typography.small,
                                fontFamily: fonts.bold,
                                color: isSelected ? c.accent : c.text,
                                writingDirection: 'rtl',
                              }}
                              numberOfLines={2}
                            >
                              {opt.name}
                            </Text>
                            {priceDelta > 0 && group.pricing_type !== 'group_price' ? (
                              <Text style={{ ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.medium }}>
                                +{money(priceDelta)}
                              </Text>
                            ) : null}
                          </View>
                          <MaterialIcons
                            name={isSelected ? 'check-circle' : 'radio-button-unchecked'}
                            size={20}
                            color={isSelected ? c.accent : c.textCaption}
                          />
                        </Pressable>
                      );
                    })}
                  </View>
                </View>
              );
            })
          ) : (
            <Text style={{ ...textStart, color: c.textMuted, paddingVertical: spacing.lg }}>لا توجد خيارات لهذا المنتج</Text>
          )}
        </View>

        <View style={s.stickyFooter}>
          <AppButton title="إضافة إلى السلة" onPress={handleConfirm} size="lg" fullWidth />
          <AppButton title="إلغاء" variant="outline" onPress={handleClose} fullWidth />
        </View>
      </View>
    </AppBottomSheet>
  );
}
