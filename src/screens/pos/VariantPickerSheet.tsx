import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBottomSheet } from '@/components/layout';
import { AppButton } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader, usePosSheetStyles } from '@/components/pos/posSheetUi';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { Product } from '@/types/api';
import { money } from '@/utils/format';

type ProductVariant = NonNullable<Product['variants']>[number];

type Props = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSelect: (variant: { id: string; name: string }) => void;
};

function variantLabel(variant: ProductVariant): string {
  if (variant.name?.trim()) return variant.name.trim();
  if (variant.sku?.trim()) return variant.sku.trim();
  return String(variant.id).slice(0, 8);
}

function variantPrice(product: Product, variant: ProductVariant): number {
  const base = Number(product.selling_price ?? 0);
  const extra = Number(variant.additional_price ?? 0);
  const value = base + extra;
  return Number.isFinite(value) ? value : 0;
}

export function VariantPickerSheet({ visible, product, onClose, onSelect }: Props) {
  const c = useColors();
  const s = usePosSheetStyles();
  const variants = useMemo(() => product?.variants ?? [], [product?.variants]);

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: spacing.md }}>
        <PosSheetHeader
          title="اختيار المتغير"
          subtitle={product ? `اختر المتغير قبل إضافة «${product.name}» للسلة.` : undefined}
        />
        {variants.map((variant) => {
          const label = variantLabel(variant);
          return (
            <Pressable
              key={String(variant.id)}
              onPress={() => onSelect({ id: String(variant.id), name: label })}
              style={{
                ...flexRow,
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: spacing.md,
                borderRadius: radius.xxl,
                borderWidth: 1,
                borderColor: c.borderSubtle,
                backgroundColor: c.surfaceMuted,
                padding: spacing.md,
              }}
            >
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={{ ...textStart, fontSize: typography.cardTitle, fontFamily: fonts.bold, color: c.text }}>
                  {label}
                </Text>
                {variant.sku ? (
                  <Text style={{ ...textStart, fontSize: typography.tiny, color: c.textMuted }}>
                    SKU: {variant.sku}
                  </Text>
                ) : null}
              </View>
              <Text style={{ fontFamily: fonts.extraBold, fontWeight: '800', color: c.primary }}>
                {product ? money(variantPrice(product, variant)) : money(0)}
              </Text>
              <MaterialIcons name="chevron-left" size={22} color={c.textMuted} />
            </Pressable>
          );
        })}
        {!variants.length ? (
          <View style={s.warningBanner}>
            <Text style={s.warningText}>
              لا توجد بيانات متغيرات في كتالوج نقطة البيع لهذا المنتج. تم تعطيل الإضافة لحين تحديث كاش الكتالوج من الخادم.
            </Text>
          </View>
        ) : null}
        <AppButton title="إلغاء" variant="outline" onPress={onClose} fullWidth />
      </View>
    </AppBottomSheet>
  );
}
