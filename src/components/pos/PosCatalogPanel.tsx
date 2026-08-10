import React, { useMemo } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PosFlexGrid, posGridColumns } from '@/components/pos/PosFlexGrid';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppButton, AppSearchField } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, rtlDirection, textLtr, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';
import { unitSellingPrice } from '@/utils/posUnitPrice';
import { resolveMediaUrl } from '@/utils/media';
import { buildCategoryThumbnailMap } from '@/utils/posCatalogMedia';
import { chevronForwardIcon } from '@/utils/rtl';

type CategoryItem = { id: string; name: string; image?: string | null };

function availableQty(product: Product): number | null {
  const mode = product.inventory_mode ?? (product.track_inventory === false ? 'non_stock' : 'stock_product');
  if (mode !== 'stock_product') return null;
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
  productQuantities?: Record<number, number>;
  onProductPress: (product: Product) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onExitCategory?: () => void;
  activeCategoryName?: string | null;
  variant?: 'default' | 'tablet';
  containerWidth?: number;
};

export function PosCatalogPanel({
  query,
  onQueryChange,
  categories,
  categoryId,
  onCategoryChange,
  showCategoryCards,
  onShowAllProducts,
  onSelectCategory,
  products,
  productQuantities = {},
  onProductPress,
  refreshing,
  onRefresh,
  onExitCategory,
  activeCategoryName,
  variant = 'default',
  containerWidth = 0,
}: Props) {
  const c = useColors();
  const tablet = variant === 'tablet';
  const styles = useMemo(() => createStyles(c, tablet), [c, tablet]);
  const gridWidth = containerWidth > 0 ? containerWidth : 640;
  const columns = posGridColumns(gridWidth, tablet);
  const isSearching = query.trim().length > 0;
  const showCategoryRoot = showCategoryCards && !isSearching;
  const showExitCategory = !showCategoryRoot && categoryId !== 'all' && Boolean(onExitCategory);

  const categoryCards = useMemo(() => [{ id: 'all', name: 'كل المنتجات' }, ...categories], [categories]);
  const categoryThumbnails = useMemo(() => buildCategoryThumbnailMap(categories, products), [categories, products]);
  const productCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const product of products) {
      const id = product.category_id != null ? String(product.category_id) : null;
      if (id) map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  }, [products]);
  const chipItems = useMemo(() => [{ id: 'all', name: 'الكل' }, ...categories], [categories]);
  const browseTitle = isSearching ? 'نتائج البحث' : activeCategoryName ?? (categoryId === 'all' ? 'كل المنتجات' : 'المنتجات');

  const searchHeader = (
    <View style={styles.searchRow}>
      <View style={styles.searchSlot}>
        <AppSearchField
          value={query}
          onChangeText={onQueryChange}
          placeholder="بحث باسم المنتج أو الباركود..."
          compact
        />
      </View>
      <View style={styles.scanButton} accessibilityLabel="قراءة باركود">
        <MaterialIcons name="qr-code-scanner" size={22} color={c.textMuted} />
      </View>
    </View>
  );

  const sectionHeading = (title: string, count: number) => (
    <View style={styles.sectionHeading}>
      <View style={styles.sectionCopy}>
        <Text style={styles.sectionTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.sectionMeta}>{numberText(count)} عنصر</Text>
      </View>
      {showExitCategory ? (
        <AppButton title="التصنيفات" variant="outline" size="sm" onPress={onExitCategory} />
      ) : null}
    </View>
  );

  const categoryHeader = (
    <View style={styles.headerBlock}>
      {searchHeader}
      {sectionHeading('التصنيفات', categoryCards.length)}
    </View>
  );

  const productHeader = (
    <View style={styles.headerBlock}>
      {searchHeader}
      {sectionHeading(browseTitle, products.length)}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} nestedScrollEnabled>
        <View style={[styles.chipsRow, rtlDirection]}>
          {chipItems.map((item) => {
            const active = categoryId === item.id;
            return (
              <Pressable
                key={item.id}
                onPress={() => onCategoryChange(item.id)}
                style={[styles.chip, active && styles.chipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );

  if (showCategoryRoot) {
    return (
      <View style={styles.panel}>
        <PosFlexGrid
          data={categoryCards}
          columns={columns}
          containerWidth={gridWidth}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={categoryHeader}
          ListEmptyComponent={<AppEmptyState title="لا توجد تصنيفات" message="لا توجد أقسام متاحة في هذا الفرع." />}
          renderItem={({ item }) => {
            const all = item.id === 'all';
            const thumb = all ? null : categoryThumbnails[item.id] ?? resolveMediaUrl(item.image);
            const count = all ? products.length : productCounts[item.id] ?? 0;
            return (
              <Pressable
                onPress={() => (all ? onShowAllProducts() : onSelectCategory(item.id))}
                style={({ pressed }) => [styles.categoryTile, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}، ${numberText(count)} منتج`}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.categoryThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.categoryThumbPlaceholder}>
                    <MaterialIcons name={all ? 'apps' : 'category'} size={22} color={c.textMuted} />
                  </View>
                )}
                <View style={styles.categoryBody}>
                  <Text style={styles.categoryName} numberOfLines={2}>{item.name}</Text>
                  <Text style={styles.categoryCount}>{numberText(count)} منتج</Text>
                </View>
                <MaterialIcons name={chevronForwardIcon()} size={18} color={c.textCaption} />
              </Pressable>
            );
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <PosFlexGrid
        data={products}
        columns={columns}
        containerWidth={gridWidth}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={productHeader}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <AppEmptyState
            title={isSearching ? 'لا توجد منتجات مطابقة' : 'لا توجد منتجات'}
            message={isSearching ? 'جرّب كلمة أخرى أو امسح البحث.' : 'جرّب تصنيفاً آخر أو عدّل البحث.'}
          />
        }
        renderItem={({ item }) => {
          const mode = item.inventory_mode ?? (item.track_inventory === false ? 'non_stock' : 'stock_product');
          const qty = availableQty(item);
          const low = qty !== null && qty <= Number(item.min_stock_alert ?? 0);
          const hasOptions = Boolean(item.option_groups?.some((group) => group.options?.length));
          const recipe = mode === 'recipe_product';
          const thumb = resolveMediaUrl(item.image);
          const inCart = productQuantities[item.id] ?? 0;

          return (
            <Pressable
              onPress={() => onProductPress(item)}
              style={({ pressed }) => [styles.productTile, inCart > 0 && styles.productTileSelected, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`${item.name}، ${money(unitSellingPrice(item))}${inCart ? `، ${numberText(inCart)} في السلة` : ''}`}
            >
              <View style={styles.productTop}>
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.productThumb} resizeMode="cover" />
                ) : (
                  <View style={styles.productThumbPlaceholder}>
                    <Text style={styles.productLetter}>{item.name.charAt(0)}</Text>
                  </View>
                )}
                <View style={styles.productState}>
                  {inCart > 0 ? <AppBadge label={`×${numberText(inCart)} في السلة`} tone="info" /> : null}
                  {low ? <AppBadge label="مخزون منخفض" tone="warning" /> : null}
                  {!low && recipe ? <AppBadge label="وصفة" tone="warning" /> : null}
                  {!low && !recipe && hasOptions ? <AppBadge label="خيارات" tone="neutral" /> : null}
                </View>
              </View>
              <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
              <View style={styles.productFooter}>
                <View style={styles.productValue}>
                  <Text style={styles.productPrice} numberOfLines={1}>{money(unitSellingPrice(item))}</Text>
                  <Text style={styles.productQty} numberOfLines={1}>
                    {qty == null ? 'غير مخزني' : `${numberText(qty)} متاح`}
                  </Text>
                </View>
                <View style={[styles.addMark, inCart > 0 && styles.addMarkActive]}>
                  <MaterialIcons name={inCart > 0 ? 'add-shopping-cart' : 'add'} size={18} color={inCart > 0 ? c.primaryForeground : c.text} />
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </View>
  );
}

function createStyles(c: AppColors, tablet: boolean) {
  return StyleSheet.create({
    panel: { flex: 1, minWidth: 0, minHeight: 0, ...rtlDirection },
    headerBlock: { gap: spacing.md, paddingTop: spacing.sm, paddingBottom: spacing.md },
    searchRow: { ...flexRow, alignItems: 'center', gap: spacing.sm },
    searchSlot: { flex: 1, minWidth: 0 },
    scanButton: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    sectionHeading: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
    sectionCopy: { flex: 1, minWidth: 0, gap: 2 },
    sectionTitle: { ...textStart, color: c.text, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: tablet ? typography.sectionTitle : typography.cardTitle },
    sectionMeta: { ...textStart, color: c.textCaption, fontFamily: fonts.medium, fontSize: typography.caption },
    chipsRow: { ...flexRow, gap: spacing.sm, paddingVertical: spacing.xs },
    chip: {
      minHeight: 36,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
    },
    chipActive: { backgroundColor: c.primary, borderColor: c.primary },
    chipText: { color: c.textMuted, fontFamily: fonts.medium, fontSize: typography.small, writingDirection: 'rtl' },
    chipTextActive: { color: c.primaryForeground, fontFamily: fonts.bold, fontWeight: '700' },
    categoryTile: {
      ...flexRow,
      minHeight: tablet ? 94 : 88,
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    categoryThumb: { width: tablet ? 48 : 42, height: tablet ? 48 : 42, borderRadius: radius.md },
    categoryThumbPlaceholder: { width: tablet ? 48 : 42, height: tablet ? 48 : 42, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceMuted },
    categoryBody: { flex: 1, minWidth: 0, gap: 3 },
    categoryName: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small, lineHeight: 18 },
    categoryCount: { ...textStart, color: c.textCaption, fontFamily: fonts.medium, fontSize: typography.micro },
    productTile: {
      minHeight: tablet ? 164 : 150,
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.border,
      backgroundColor: c.surface,
      overflow: 'hidden',
    },
    productTileSelected: { borderColor: c.accentBorder, backgroundColor: c.accentSoft },
    productTop: { ...flexRow, alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
    productThumb: { width: 48, height: 48, borderRadius: radius.md },
    productThumbPlaceholder: { width: 48, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceMuted },
    productLetter: { color: c.textMuted, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.cardTitle },
    productState: { flex: 1, minWidth: 0, alignItems: 'flex-start', gap: spacing.xs },
    productName: { ...textStart, color: c.text, fontFamily: fonts.bold, fontWeight: '700', fontSize: typography.small, lineHeight: 19, minHeight: 38 },
    productFooter: { ...flexRow, alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm, marginTop: 'auto' },
    productValue: { flex: 1, minWidth: 0, gap: 2 },
    productPrice: { ...textLtr, color: c.text, fontFamily: fonts.extraBold, fontWeight: '800', fontSize: typography.body },
    productQty: { ...textStart, color: c.textCaption, fontFamily: fonts.medium, fontSize: typography.micro },
    addMark: { width: 32, height: 32, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', backgroundColor: c.surfaceMuted },
    addMarkActive: { backgroundColor: c.primary },
    pressed: { opacity: 0.78 },
  });
}
