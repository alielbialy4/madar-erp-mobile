import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { createCategoryStyles } from '@/components/categories/categoryStyles';
import { createInventoryUiStyles } from '@/components/inventory/inventoryUiStyles';
import { chevronForwardIcon } from '@/utils/rtl';
import { numberText } from '@/utils/format';
import type { Warehouse } from '@/types/api';

type Props = {
  warehouse: Warehouse;
  canManage: boolean;
  onPress: () => void;
  onBalances: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
};

export function WarehouseListCard({ warehouse, canManage, onPress, onBalances, onEdit, onDelete }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const ui = useMemo(() => createInventoryUiStyles(c), [c]);
  const isActive = warehouse.status !== 'inactive';
  const productCount = Number(warehouse.products_count ?? 0);

  return (
    <View style={styles.categoryCard}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.92 }]}>
        <View style={styles.cardTop}>
          <View style={styles.thumbPlaceholder}>
            <MaterialIcons name="warehouse" size={28} color={c.textCaption} />
          </View>
          <View style={styles.cardBody}>
            <View style={ui.badgeTitleRow}>
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
          <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} />
        </View>
      </Pressable>

      <View style={styles.cardActions}>
        <Pressable onPress={onBalances} style={styles.actionBtn}>
          <MaterialIcons name="inventory-2" size={18} color={c.textMuted} />
          <Text style={styles.actionText}>الأرصدة</Text>
        </Pressable>
        {canManage && onEdit ? (
          <Pressable onPress={onEdit} style={[styles.actionBtn, styles.actionBtnPrimary]}>
            <MaterialIcons name="edit" size={18} color={c.accent} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>تعديل</Text>
          </Pressable>
        ) : null}
        {canManage && onDelete ? (
          <Pressable onPress={onDelete} style={styles.actionBtn}>
            <MaterialIcons name="delete-outline" size={18} color={c.danger} />
            <Text style={[styles.actionText, { color: c.danger }]}>حذف</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
