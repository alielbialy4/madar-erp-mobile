import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { AppBadge } from '@/components/ui';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { numberText } from '@/utils/format';
import { chevronForwardIcon } from '@/utils/rtl';
import { flexRow, textStart } from '@/constants/layout';
import type { Category } from '@/types/api';
import { createCategoryStyles } from './categoryStyles';
import { Text } from '@/components/ui/AppText';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';

type CardVariant = 'compact' | 'grid';

type Props = {
  category: Category;
  canManage: boolean;
  onPress: () => void;
  onEdit?: () => void;
  variant?: CardVariant;
};

export function CategoryListCard({ category, canManage, onPress, onEdit, variant = 'compact' }: Props) {
  const c = useColors();
  const styles = useMemo(() => createCategoryStyles(c), [c]);
  const extra = useMemo(() => createExtraStyles(c), [c]);
  const thumb = resolveMediaUrl(category.image);
  const isActive = category.active !== false;
  const productCount = Number(category.products_count ?? 0);
  const handleLongPress = canManage && onEdit ? onEdit : undefined;

  const badgeTone = isActive ? 'success' : 'warning';

  if (variant === 'grid') {
    return (
      <View style={[styles.categoryCard, extra.gridCard]}>
        <Pressable
          onPress={onPress}
          onLongPress={handleLongPress}
          style={({ pressed }) => [extra.gridPressable, pressed && { opacity: 0.92 }]}
        >
          {thumb ? (
            <Image source={{ uri: thumb }} style={extra.gridThumb} resizeMode="cover" />
          ) : (
            <View style={extra.gridThumbPlaceholder}>
              <MaterialIcons name="category" size={32} color={c.textCaption} />
            </View>
          )}
          <Text style={extra.gridTitle} numberOfLines={2}>
            {category.name}
          </Text>
          <View style={extra.gridFooter}>
            <AppBadge label={isActive ? 'نشط' : 'غير نشط'} tone={badgeTone} />
            <Text style={extra.gridQty}>{numberText(productCount)} منتج</Text>
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
          {thumb ? (
            <Image source={{ uri: thumb }} style={[styles.thumb, extra.compactThumb]} resizeMode="cover" />
          ) : (
            <View style={[styles.thumbPlaceholder, extra.compactThumb]}>
              <MaterialIcons name="category" size={22} color={c.textCaption} />
            </View>
          )}
          <View style={styles.cardBody}>
            <View style={extra.titleRow}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {category.name}
              </Text>
              <AppBadge label={isActive ? 'نشط' : 'غير نشط'} tone={badgeTone} />
            </View>
            <Text style={styles.cardDesc} numberOfLines={1}>
              {category.description?.trim() || 'بدون وصف'}
              {` • ${numberText(productCount)} منتج`}
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
    compactThumb: { width: 48, height: 48, borderRadius: radius.md },
    gridCard: { flex: 1, marginBottom: 0 },
    gridPressable: { padding: spacing.md, gap: spacing.sm, flex: 1 },
    gridThumb: { width: '100%', height: 96, borderRadius: radius.lg },
    gridThumbPlaceholder: {
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
