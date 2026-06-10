import React, { useMemo } from 'react';
import { ActivityIndicator, Image, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PremiumHeroPanel } from '@/components/layout/PremiumHeroPanel';
import { HeroStatPill } from '@/components/layout/HeroStatPill';
import { HeroActionChip } from '@/components/layout/HeroActionChip';
import { AppBadge } from '@/components/ui';
import { Text } from '@/components/ui/AppText';
import { flexRow, textStart } from '@/constants/layout';
import { spacing, radius } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useColors } from '@/hooks/useColors';
import { resolveMediaUrl } from '@/utils/media';
import { numberText } from '@/utils/format';
import type { Category } from '@/types/api';

type Props = {
  category: Category;
  canManage: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  onProducts?: () => void;
  onRefresh?: () => void;
  isLoading?: boolean;
  loading?: boolean;
};

export function CategoryDetailHero({
  category,
  canManage,
  onEdit,
  onDelete,
  onProducts,
  onRefresh,
  isLoading,
  loading,
}: Props) {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= 900;
  const styles = useMemo(() => createStyles(c, isTablet), [c, isTablet]);
  const thumb = resolveMediaUrl(category.image);
  const showThumbSkeleton = loading && !thumb;
  const isActive = category.active !== false;
  const productCount = Number(category.products_count ?? 0);

  const badgeTone = isActive ? 'success' : 'warning';

  const badges = (
    <>
      <HeroStatPill label="منتجات" value={productCount} compact />
      {category.sort_order != null ? (
        <HeroStatPill label="ترتيب POS" value={category.sort_order} compact />
      ) : null}
    </>
  );

  const actions = (
    <View style={{ ...flexRow, flexWrap: 'wrap', gap: spacing.sm }}>
      {onProducts ? (
        <HeroActionChip label="عرض المنتجات" icon="inventory-2" onPress={onProducts} />
      ) : null}
      {canManage && onEdit ? (
        <HeroActionChip label="تعديل" icon="edit" onPress={onEdit} />
      ) : null}
      {canManage && onDelete ? (
        <HeroActionChip label="حذف" icon="delete-outline" onPress={onDelete} />
      ) : null}
      {onRefresh ? (
        <Pressable
          onPress={onRefresh}
          disabled={isLoading}
          style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.85 }]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <MaterialIcons name="refresh" size={18} color={c.accent} />
          )}
        </Pressable>
      ) : null}
    </View>
  );

  const thumbBlock = showThumbSkeleton ? (
    <View style={[styles.thumb, styles.thumbSkeleton]} />
  ) : thumb ? (
    <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
  ) : (
    <View style={[styles.thumb, styles.thumbPlaceholder]}>
      <MaterialIcons name="category" size={isTablet ? 40 : 32} color={c.textCaption} />
    </View>
  );

  const rail = (
    <View style={{ width: '100%', gap: spacing.md }}>
      <View style={styles.identityRow}>
        {thumbBlock}
        <View style={styles.identityText}>
          <View style={{ ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' }}>
            <Text style={styles.name} numberOfLines={2}>
              {category.name}
            </Text>
            <AppBadge label={isActive ? 'نشط' : 'غير نشط'} tone={badgeTone} />
          </View>
          {category.description?.trim() ? (
            <Text style={styles.desc} numberOfLines={3}>
              {category.description.trim()}
            </Text>
          ) : (
            <Text style={styles.descMuted}>بدون وصف</Text>
          )}
        </View>
      </View>
      {actions}
    </View>
  );

  return (
    <PremiumHeroPanel
      eyebrow="التصنيف"
      title={category.name}
      subtitle={`${numberText(productCount)} منتج في هذا التصنيف`}
      badges={badges}
      rail={rail}
      compact={!isTablet}
      edgeInset={false}
    />
  );
}

function createStyles(c: ReturnType<typeof useColors>, isTablet: boolean) {
  return StyleSheet.create({
    identityRow: { ...flexRow, alignItems: 'flex-start', gap: spacing.md },
    thumb: {
      width: isTablet ? 88 : 72,
      height: isTablet ? 88 : 72,
      borderRadius: radius.xl,
    },
    thumbPlaceholder: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.borderSubtle,
    },
    thumbSkeleton: { backgroundColor: c.surfaceMuted },
    identityText: { flex: 1, minWidth: 0, gap: spacing.xs },
    name: {
      ...textStart,
      flex: 1,
      fontSize: isTablet ? typography.pageTitle : typography.sectionTitle,
      fontFamily: fonts.extraBold,
      fontWeight: '800',
      color: c.text,
    },
    desc: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.regular,
      color: c.textMuted,
      lineHeight: 20,
    },
    descMuted: {
      ...textStart,
      fontSize: typography.small,
      fontFamily: fonts.regular,
      color: c.textCaption,
    },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.borderSubtle,
      backgroundColor: c.surface,
    },
  });
}
