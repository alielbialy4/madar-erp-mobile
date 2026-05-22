import React from 'react';
import { FlatList, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { pressScale } from '@/utils/animations';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppInput } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, textStart } from '@/constants/layout';
import { colors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';

type CategoryItem = { id: string; name: string };

function availableQty(product: Product): number | null {
  const raw = product.branch_available_quantity ?? product.available_quantity ?? product.stock_quantity;
  if (raw === undefined || raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  categories: CategoryItem[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
  showCategoryCards: boolean;
  onShowCategoryCards: () => void;
  onShowAllProducts: () => void;
  onSelectCategory: (id: string) => void;
  products: Product[];
  onProductPress: (product: Product) => void;
  loading?: boolean;
};

export function PosCatalogPanel({
  query,
  onQueryChange,
  categories,
  categoryId,
  onCategoryChange,
  showCategoryCards,
  onShowCategoryCards,
  onShowAllProducts,
  onSelectCategory,
  products,
  onProductPress,
}: Props) {
  const { width } = useWindowDimensions();
  const columns = useResponsiveColumns(2, 3, 4);
  const productWidth = Math.max(120, (width * 0.55 - spacing.lg * 2 - spacing.md * (columns - 1)) / columns);

  const categoryCards = [{ id: 'all', name: 'كل المنتجات' }, ...categories];

  return (
    <View style={styles.panel}>
      <View style={styles.searchRow}>
        <AppInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="بحث باسم المنتج أو الباركود..."
          style={styles.searchInput}
        />
      </View>

      {showCategoryCards ? (
        <>
          <View style={styles.sectionHead}>
            {!showCategoryCards ? (
              <Pressable onPress={onShowCategoryCards}>
                <Text style={styles.backLink}>→ التصنيفات</Text>
              </Pressable>
            ) : null}
            <Text style={styles.sectionTitle}>التصنيفات</Text>
            <Text style={styles.countBadge}>{numberText(categories.length)}</Text>
          </View>
          <FlatList
            data={categoryCards}
            keyExtractor={(item) => item.id}
            numColumns={columns >= 3 ? 3 : 2}
            columnWrapperStyle={styles.categoryRow}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<AppEmptyState title="لا توجد تصنيفات" />}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => (item.id === 'all' ? onShowAllProducts() : onSelectCategory(item.id))}
                style={styles.categoryCard}
              >
                <View style={styles.categoryIcon}>
                  <Text style={styles.categoryIconText}>{item.name.charAt(0)}</Text>
                </View>
                <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
              </Pressable>
            )}
          />
        </>
      ) : (
        <>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={[{ id: 'all', name: 'الكل' }, ...categories]}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onCategoryChange(item.id)}
                style={[styles.chip, categoryId === item.id ? styles.chipActive : undefined]}
              >
                <Text style={[styles.chipText, categoryId === item.id ? styles.chipTextActive : undefined]}>{item.name}</Text>
              </Pressable>
            )}
            ItemSeparatorComponent={() => <View style={{ width: spacing.sm }} />}
            contentContainerStyle={styles.chipsList}
          />
          <FlatList
            key={columns}
            data={products}
            numColumns={columns}
            keyExtractor={(item) => String(item.id)}
            columnWrapperStyle={columns > 1 ? styles.productRow : undefined}
            contentContainerStyle={styles.list}
            ListEmptyComponent={<AppEmptyState title="لا توجد منتجات" />}
            renderItem={({ item }) => {
              const qty = availableQty(item);
              const low = qty !== null && qty <= Number(item.min_stock_alert ?? 0);
              const hasOptions = item.option_groups?.some((g) => g.options && g.options.length > 0);
              return (
                <Pressable
                  onPress={() => onProductPress(item)}
                  style={({ pressed }) => [
                    styles.productCard,
                    { width: productWidth },
                    pressed ? [styles.productCardPressed, pressScale(true)] : undefined,
                  ]}
                >
                  <View style={styles.productImage}>
                    <Text style={styles.productImageText}>{item.name.charAt(0)}</Text>
                  </View>
                  {(low || hasOptions) ? (
                    <View style={styles.productBadges}>
                      {low ? <AppBadge label="منخفض" tone="warning" /> : null}
                      {hasOptions ? <AppBadge label="خيارات" tone="info" /> : null}
                    </View>
                  ) : null}
                  <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.productPrice}>{money(item.selling_price)}</Text>
                  <Text style={styles.productMeta}>{qty === null ? 'غير محدد' : `المتاح: ${numberText(qty)}`}</Text>
                </Pressable>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { flex: 1, gap: spacing.md, minWidth: 0 },
  searchRow: {},
  searchInput: { minHeight: 38 },
  sectionHead: { ...flexRow, alignItems: 'center', gap: spacing.sm },
  backLink: { ...textStart, color: colors.accent, fontSize: typography.small, fontFamily: fonts.bold, fontWeight: '700' },
  sectionTitle: { ...textStart, flex: 1, color: colors.text, fontSize: typography.cardTitle, fontFamily: fonts.bold, fontWeight: '700' },
  countBadge: {
    fontSize: typography.tiny,
    fontFamily: fonts.bold,
    fontWeight: '700',
    color: colors.textMuted,
    backgroundColor: colors.surfaceMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  list: { paddingBottom: spacing.xl, gap: spacing.md },
  categoryRow: { gap: spacing.md },
  categoryCard: {
    flex: 1,
    minHeight: 120,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xxl,
    padding: spacing.md,
    gap: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.xl,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryIconText: { color: colors.accent, fontSize: typography.sectionTitle, fontFamily: fonts.extraBold, fontWeight: '800' },
  categoryName: { ...textStart, color: colors.text, fontSize: typography.cardTitle, fontFamily: fonts.bold, textAlign: 'center' },
  chipsList: { paddingVertical: spacing.xs },
  chip: {
    minHeight: 34,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
  chipText: { color: colors.text, fontWeight: '600', fontSize: typography.small },
  chipTextActive: { color: colors.accent, fontWeight: '800' },
  productRow: { gap: spacing.md },
  productCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    borderRadius: radius.xxl,
    padding: spacing.md,
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  productCardPressed: {
    borderColor: colors.accentBorder,
    backgroundColor: colors.softPrimary,
  },
  productImage: {
    height: 68,
    borderRadius: radius.xl,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  productImageText: { color: colors.textCaption, fontSize: 26, fontFamily: fonts.extraBold },
  productBadges: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs },
  productName: { ...textStart, color: colors.text, fontSize: typography.posProductName, fontFamily: fonts.bold, fontWeight: '700' },
  productPrice: { ...textStart, color: colors.text, fontSize: typography.posPrice, fontFamily: fonts.extraBold, fontWeight: '800' },
  productMeta: { ...textStart, color: colors.textMuted, fontSize: typography.tiny, fontFamily: fonts.regular },
});
