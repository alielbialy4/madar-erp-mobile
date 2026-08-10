import { AppBadge } from '@/components/ui';
import { EntityRow } from '@/components/madar';
import { useColors } from '@/hooks/useColors';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { numberText } from '@/utils/format';
import { flexRow, textStart, appWritingDirection } from '@/constants/layout';
import type { Warehouse } from '@/types/api';
import { Text } from '@/components/ui/AppText';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

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
    <EntityRow
      primary={warehouse.name}
      secondary={[warehouse.code ? `كود ${warehouse.code}` : 'بدون كود', warehouse.location].filter(Boolean).join(' · ')}
      meta={[warehouse.branch?.name ? `فرع ${warehouse.branch.name}` : 'غير مرتبط بفرع', productCount > 0 ? `${numberText(productCount)} صنف` : null].filter(Boolean).join(' · ')}
      badgeLabel={isActive ? 'نشط' : 'غير نشط'}
      badgeTone={isActive ? 'success' : 'warning'}
      fallback={<MaterialIcons name="warehouse" size={18} color={c.textCaption} />}
      onPress={onPress}
      onLongPress={handleLongPress}
    />
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
      writingDirection: appWritingDirection,
    },
  });
}
