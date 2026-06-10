import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { chevronForwardIcon } from '@/utils/rtl';
import { numberText } from '@/utils/format';
import { flexRow, textStart } from '@/constants/layout';
import type { Warehouse } from '@/types/api';
import { Text } from '@/components/ui/AppText';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type CardVariant = 'compact' | 'grid';

type Props = {
  warehouse: Warehouse;
  canManage: boolean;
  onPress: () => void;
  onEdit?: () => void;
  variant?: CardVariant;
};

export function WarehouseListCard({ warehouse, canManage, onPress, onEdit, variant = 'compact' }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const extra = useMemo(() => createExtraStyles(c), [c]);
  const isActive = warehouse.status !== 'inactive';
  const productCount = Number(warehouse.products_count ?? 0);
  const handleLongPress = canManage && onEdit ? onEdit : undefined;

  if (variant === 'grid') {
    return (
      <View style={[styles.categoryCard, extra.gridCard]}>
        <Pressable
          onPress={onPress}
          onLongPress={handleLongPress}
          style={({ pressed }) => [extra.gridPressable, pressed && { opacity: 0.92 }]}
        >
          <View style={extra.gridIconWrap}>
            <MaterialIcons name="warehouse" size={32} color={c.textCaption} />
          </View>
          <Text style={extra.gridTitle} numberOfLines={2}>
            {warehouse.name}
          </Text>
          <View style={extra.gridFooter}>
            <AppBadge label={isActive ? 'نشط' : 'غير نشط'} tone={isActive ? 'success' : 'warning'} />
            <Text style={extra.gridQty}>{numberText(productCount)} صنف</Text>
          </View>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.categoryCard}>
      <Pressable
        onPress={onPress}
        onLongPress={handleLongPress}
        style={({ pressed }) => [styles.cardPressable, extra.compactPressable, pressed && { opacity: 0.92 }]}
      >
        <View style={styles.cardTop}>
          <View style={styles.thumbPlaceholder}>
            <MaterialIcons name="warehouse" size={28} color={c.textCaption} />
          </View>
          <View style={styles.cardBody}>
            <View style={extra.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {warehouse.name}
              </Text>
              <AppBadge label={isActive ? 'نشط' : 'غير نشط'} tone={isActive ? 'success' : 'warning'} />
            </View>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {warehouse.code ? `كود: ${warehouse.code}` : 'بدون كود'}
              {warehouse.location ? ` • ${warehouse.location}` : ''}
            </Text>
            <Text style={styles.cardMeta}>
              {warehouse.branch?.name ? `فرع: ${warehouse.branch.name}` : 'غير مرتبط بفرع'}
              {productCount > 0 ? ` • ${numberText(productCount)} صنف` : ''}
            </Text>
          </View>
          <View style={styles.cardChevron}>
            <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

function createExtraStyles(c: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    titleRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    compactPressable: { paddingBottom: spacing.sm },
    gridCard: { flex: 1, marginBottom: 0 },
    gridPressable: { padding: spacing.md, gap: spacing.sm, flex: 1 },
    gridIconWrap: {
      width: '100%',
      height: 96,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
    },
    gridTitle: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.bold,
      fontWeight: '700',
      color: c.text,
      minHeight: 36,
    },
    gridFooter: {
      ...flexRow,
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
    },
    gridQty: {
      fontSize: typography.tiny,
      fontFamily: fonts.medium,
      color: c.textMuted,
      writingDirection: 'rtl',
    },
  });
}
