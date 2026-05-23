import React, { useMemo } from 'react';
import { Image, Pressable, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { numberText } from '@/utils/format';
import { chevronForwardIcon } from '@/utils/rtl';
import type { Category } from '@/types/api';
import { createCategoryStyles } from './categoryStyles';
import { Text } from '@/components/ui/AppText';

type Props = {
  category: Category;
  canManage: boolean;
  onPress: () => void;
  onProducts: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function CategoryListCard({ category, canManage, onPress, onProducts, onEdit, onDelete }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const thumb = resolveMediaUrl(category.image);
  const isActive = category.active !== false;
  const productCount = Number(category.products_count ?? 0);

  return (
    <View style={styles.categoryCard}>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.cardPressable, pressed && { opacity: 0.92 }]}>
        <View style={styles.cardTop}>
          {thumb ? (
            <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <View style={styles.thumbPlaceholder}>
              <MaterialIcons name="category" size={28} color={c.textCaption} />
            </View>
          )}
          <View style={styles.cardBody}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {category.name}
            </Text>
            {category.description ? (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {category.description}
              </Text>
            ) : (
              <Text style={styles.cardDesc}>بدون وصف</Text>
            )}
            <Text style={styles.cardMeta}>{numberText(productCount)} منتج في هذا التصنيف</Text>
          </View>
          <AppBadge label={isActive ? 'نشط' : 'غير نشط'} tone={isActive ? 'success' : 'warning'} />
          {canManage ? <MaterialIcons name={chevronForwardIcon()} size={22} color={c.textCaption} /> : null}
        </View>

        <View style={styles.cardActions}>
          <Pressable
            onPress={onProducts}
            style={({ pressed }) => [styles.actionBtn, styles.actionBtnPrimary, pressed && { opacity: 0.88 }]}
          >
            <MaterialIcons name="inventory-2" size={18} color={c.accent} />
            <Text style={[styles.actionText, styles.actionTextPrimary]}>المنتجات</Text>
          </Pressable>
          {canManage ? (
            <>
              <Pressable onPress={onEdit} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }]}>
                <MaterialIcons name="edit" size={18} color={c.textMuted} />
                <Text style={styles.actionText}>تعديل</Text>
              </Pressable>
              <Pressable onPress={onDelete} style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.88 }]}>
                <MaterialIcons name="delete-outline" size={18} color={c.danger} />
                <Text style={[styles.actionText, { color: c.danger }]}>حذف</Text>
              </Pressable>
            </>
          ) : null}
        </View>
      </Pressable>
    </View>
  );
}
