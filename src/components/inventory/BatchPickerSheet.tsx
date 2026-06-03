import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppLoadingState, AppEmptyState } from '@/components/feedback';
import { AppText } from '@/components/ui/AppText';
import { PosSheetHeader } from '@/components/pos/posSheetUi';
import { flexRow, textStart } from '@/constants/layout';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import {
  fetchBalancesForProductInWarehouse,
  formatLotLabel,
  type InventoryLotSelection,
} from '@/services/inventory/inventoryLots';
import { normalizeApiError } from '@/utils/errors';

type Props = {
  visible: boolean;
  warehouseId: string;
  productId: number;
  productName?: string;
  onClose: () => void;
  onSelect: (lot: InventoryLotSelection) => void;
};

export function BatchPickerSheet({
  visible,
  warehouseId,
  productId,
  productName,
  onClose,
  onSelect,
}: Props) {
  const c = useColors();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lots, setLots] = useState<InventoryLotSelection[]>([]);

  const load = useCallback(async () => {
    if (!warehouseId || !productId) return;
    setLoading(true);
    setError(null);
    try {
      const rows = await fetchBalancesForProductInWarehouse(warehouseId, productId);
      setLots(rows);
    } catch (err) {
      setError(normalizeApiError(err).message);
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [warehouseId, productId]);

  useEffect(() => {
    if (visible && warehouseId && productId) {
      void load();
    }
  }, [visible, warehouseId, productId, load]);

  return (
    <AppBottomSheet visible={visible} onClose={onClose}>
      <View style={{ gap: spacing.md }}>
        <PosSheetHeader
          title="اختيار الدفعة / المتغير"
          subtitle={productName ? `أرصدة «${productName}» في المخزن` : undefined}
        />
        {loading ? <AppLoadingState /> : null}
        {!loading && error ? (
          <AppEmptyState title="تعذّر التحميل" message={error} />
        ) : null}
        {!loading && !error && lots.length === 0 ? (
          <AppEmptyState title="لا توجد أرصدة" message="لا يوجد رصيد لهذا المنتج في المخزن المحدد." />
        ) : null}
        {!loading && !error
          ? lots.map((lot, index) => (
              <Pressable
                key={`${lot.variant_id ?? ''}-${lot.batch_id ?? ''}-${index}`}
                onPress={() => onSelect(lot)}
                style={{
                  ...flexRow,
                  alignItems: 'center',
                  borderRadius: radius.xxl,
                  borderWidth: 1,
                  borderColor: c.borderSubtle,
                  backgroundColor: c.surfaceMuted,
                  padding: spacing.md,
                }}
              >
                <AppText
                  style={{
                    ...textStart,
                    flex: 1,
                    fontSize: typography.cardTitle,
                    fontFamily: fonts.medium,
                    color: c.text,
                  }}
                >
                  {formatLotLabel(lot)}
                </AppText>
              </Pressable>
            ))
          : null}
      </View>
    </AppBottomSheet>
  );
}
