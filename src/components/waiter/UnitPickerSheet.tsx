import React from 'react';
import { Pressable, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppText as Text } from '@/components/ui/AppText';
import { PosSheetHeader } from '@/components/pos/posSheetUi';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import type { Product } from '@/types/api';
import { money } from '@/utils/format';
import { unitSellingPrice } from '@/utils/posUnitPrice';

type Props = {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onSelect: (unitId: number) => void;
};

export function UnitPickerSheet({ visible, product, onClose, onSelect }: Props) {
  const c = useColors();
  const units = product?.units?.filter((u) => u.name) ?? [];

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: spacing.md }}>
        <PosSheetHeader
          title="اختيار الوحدة"
          subtitle={product ? `اختر وحدة البيع لـ «${product.name}»` : undefined}
        />
        {units.map((unit) => {
          const price = product ? unitSellingPrice(product, null, unit.id) : 0;
          return (
            <Pressable
              key={String(unit.id)}
              onPress={() => onSelect(Number(unit.id))}
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
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={{ ...textStart, fontSize: typography.cardTitle, fontFamily: fonts.bold, color: c.text }}>
                  {unit.name}
                </Text>
                <Text style={{ ...textStart, fontSize: typography.tiny, color: c.textMuted }}>{money(price)}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </AppBottomSheet>
  );
}
