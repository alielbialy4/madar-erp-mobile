import React, { useMemo } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { PressableScale } from '@/components/ui/PressableScale';
import { PosFlexGrid, posGridColumns } from '@/components/pos/PosFlexGrid';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppButton, AppInput } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';
import { resolveMediaUrl } from '@/utils/media';

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
  productQuantities?: Record<number, number>;
  onProductPress: (product: Product) => void;
  refreshing?: boolean;
  onRefresh?: () => void;
  onExitCategory?: () => void;
  activeCategoryName?: string | null;
  onOpenTables?: () => void;
  variant?: 'default' | 'tablet';
  /** Measured catalog pane width from PosTabletSplit. */
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
  onOpenTables,
  variant = 'default',
  containerWidth = 0,
}: Props) {
  const c = useColors();
  const tablet = variant === 'tablet';
  const gridWidth = containerWidth > 0 ? containerWidth : 640;
  const columns = posGridColumns(gridWidth, tablet);

  const isSearching = query.trim().length > 0;
  const showCategoryRoot = showCategoryCards && !isSearching;
  const inProductBrowse = !showCategoryRoot;
  const showExitCategory = inProductBrowse && categoryId !== 'all' && Boolean(onExitCategory);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        panel: { flex: 1, minWidth: 0, minHeight: 0, ...rtlDirection },
        headerBlock: { gap: spacing.md, paddingBottom: spacing.sm, paddingTop: spacing.sm },
        headerTopRow: { ...flexRow, alignItems: 'center', gap: spacing.sm },
        searchWrap: { flex: 1, minWidth: 0 },
        searchInput: { minHeight: tablet ? 48 : 40 },
        searchIconBox: {
          width: tablet ? 48 : 44,
          height: tablet ? 48 : 44,
          borderRadius: radius.lg,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
        },
        tablesBtn: { flexShrink: 0 },
        catalogToolbar: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
        sectionHeadRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
        sectionTitle: {
          ...textStart,
          flex: 1,
          color: c.text,
          fontSize: tablet ? typography.sectionTitle : typography.cardTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
        },
        countBadge: {
          fontSize: typography.tiny,
          fontFamily: fonts.bold,
          fontWeight: '700',
          color: c.textMuted,
          backgroundColor: c.surfaceMuted,
          paddingHorizontal: spacing.sm,
          paddingVertical: 2,
          borderRadius: radius.pill,
        },
        breadcrumb: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.medium },
        exitCategoryBtn: { flexShrink: 0 },
        chipsScroll: { flexGrow: 0 },
        chipsRow: { ...flexRow, gap: spacing.sm, paddingVertical: spacing.xs },
        chip: {
          minHeight: 38,
          paddingHorizontal: spacing.md,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: c.surface,
          justifyContent: 'center',
        },
        chipActive: { backgroundColor: c.accentSoft, borderColor: c.accentBorder },
        chipText: { color: c.text, fontFamily: fonts.medium, fontWeight: '600', fontSize: typography.small, writingDirection: 'rtl' },
        chipTextActive: { color: c.accent, fontFamily: fonts.bold, fontWeight: '700', writingDirection: 'rtl' },
        categoryCard: {
          minHeight: tablet ? 112 : 118,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          borderRadius: radius.sm,
          padding: spacing.md,
          gap: spacing.sm,
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
            android: { elevation: 1 },
            default: {},
          }),
        },
        categoryIcon: {
          width: 52,
          height: 52,
          borderRadius: radius.sm,
          backgroundColor: c.accentSoft,
          alignItems: 'center',
          justifyContent: 'center',
        },
        categoryIconText: { color: c.accent, fontSize: typography.sectionTitle, fontFamily: fonts.extraBold, fontWeight: '800' },
        categoryName: {
          ...textStart,
          color: c.text,
          fontSize: typography.cardTitle,
          fontFamily: fonts.bold,
          fontWeight: '700',
          textAlign: 'center',
          writingDirection: 'rtl',
        },
        productCardInner: {
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          borderRadius: radius.sm,
          padding: tablet ? spacing.sm : spacing.md,
          gap: spacing.sm,
          height: '100%',
        },
        productImage: {
          height: tablet ? 76 : 72,
          borderRadius: radius.sm,
          backgroundColor: c.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        },
        productImagePhoto: { width: '100%', height: '100%' },
        productImageText: { color: c.textCaption, fontSize: 26, fontFamily: fonts.extraBold },
        productBadges: { ...flexRow, flexWrap: 'wrap', gap: spacing.xs },
        productImageBadge: {
          position: 'absolute',
          top: spacing.sm,
          right: spacing.sm,
          minWidth: 34,
          minHeight: 28,
          paddingHorizontal: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        productImageBadgeText: {
          color: c.primaryForeground,
          fontSize: typography.tiny,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          writingDirection: 'rtl',
        },
        productName: { ...textStart, color: c.text, fontSize: typography.cardTitle, fontFamily: fonts.bold, fontWeight: '700' },
        productPriceRow: { ...flexRow, alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
        productPrice: { ...textStart, color: c.primary, fontSize: typography.posPrice, fontFamily: fonts.extraBold, fontWeight: '800' },
        addBtn: {
          width: 44,
          height: 44,
          borderRadius: radius.sm,
          backgroundColor: c.accent,
          alignItems: 'center',
          justifyContent: 'center',
        },
        productMeta: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.regular },
        stockRow: { ...flexRow, justifyContent: 'space-between', alignItems: 'center', gap: spacing.xs },
        stockText: { ...textStart, color: c.textMuted, fontSize: typography.tiny, fontFamily: fonts.bold, fontWeight: '700' },
        inCartText: { color: c.accent, fontSize: typography.tiny, fontFamily: fonts.extraBold, fontWeight: '800', writingDirection: 'rtl' },
      }),
    [c, tablet],
  );

  const categoryCards = useMemo(() => [{ id: 'all', name: 'كل المنتجات' }, ...categories], [categories]);
  const chipItems = useMemo(() => [{ id: 'all', name: 'الكل' }, ...categories], [categories]);
  const browseTitle = isSearching ? 'نتائج البحث' : activeCategoryName ?? (categoryId === 'all' ? 'كل المنتجات' : 'المنتجات');

  const searchHeader = (
    <View style={styles.headerTopRow}>
      <View style={styles.searchWrap}>
        <AppInput
          value={query}
          onChangeText={onQueryChange}
          placeholder="بحث باسم المنتج أو الباركود..."
          style={styles.searchInput}
        />
      </View>
      <View style={styles.searchIconBox} accessibilityLabel="بحث وباركود">
        <MaterialIcons name="qr-code-scanner" size={22} color={c.textMuted} />
      </View>
      {tablet && onOpenTables ? (
        <AppButton title="الطاولات" variant="secondary" size="sm" onPress={onOpenTables} style={styles.tablesBtn} />
      ) : null}
    </View>
  );

  const categoryHeader = (
    <View style={styles.headerBlock}>
      {searchHeader}
      <View style={styles.sectionHeadRow}>
        <Text style={styles.sectionTitle}>التصنيفات</Text>
        <Text style={styles.countBadge}>{numberText(categories.length)}</Text>
      </View>
    </View>
  );

  const productHeader = (
    <View style={styles.headerBlock}>
      {searchHeader}
      <View style={styles.catalogToolbar}>
        {showExitCategory ? (
          <AppButton
            title="الخروج من التصنيف"
            variant="outline"
            size="sm"
            onPress={onExitCategory}
            style={styles.exitCategoryBtn}
          />
        ) : null}
        <View style={{ flex: 1, minWidth: 0, gap: spacing.xs }}>
          {showExitCategory && activeCategoryName ? (
            <Text style={styles.breadcrumb} numberOfLines={1}>
              التصنيفات / {activeCategoryName}
            </Text>
          ) : null}
          <View style={styles.sectionHeadRow}>
            <Text style={styles.sectionTitle} numberOfLines={1}>
              {browseTitle}
            </Text>
            <Text style={styles.countBadge}>{numberText(products.length)}</Text>
          </View>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsScroll} nestedScrollEnabled>
        <View style={[styles.chipsRow, rtlDirection]}>
          {chipItems.map((item) => (
            <Pressable
              key={item.id}
              onPress={() => onCategoryChange(item.id)}
              style={[styles.chip, categoryId === item.id ? styles.chipActive : undefined]}
            >
              <Text style={[styles.chipText, categoryId === item.id ? styles.chipTextActive : undefined]}>{item.name}</Text>
            </Pressable>
          ))}
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
          renderItem={({ item }) => (
            <Pressable
              onPress={() => (item.id === 'all' ? onShowAllProducts() : onSelectCategory(item.id))}
              style={styles.categoryCard}
            >
              <View style={styles.categoryIcon}>
                <Text style={styles.categoryIconText}>{item.name.charAt(0)}</Text>
              </View>
              <Text style={styles.categoryName} numberOfLines={2}>
                {item.name}
              </Text>
            </Pressable>
          )}
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
            message={isSearching ? 'جرّب كلمة أخرى أو امسح البحث للعودة للتصنيفات.' : 'جرّب تصنيفاً آخر أو عدّل البحث.'}
          />
        }
        renderItem={({ item }) => {
          const qty = availableQty(item);
          const low = qty !== null && qty <= Number(item.min_stock_alert ?? 0);
          const hasOptions = item.option_groups?.some((g) => g.options && g.options.length > 0);
          const thumb = resolveMediaUrl(item.image);
          const inCart = productQuantities[item.id] ?? 0;
          return (
            <PressableScale onPress={() => onProductPress(item)} pressedScale={0.97} style={{ flex: 1 }}>
              <View style={styles.productCardInner}>
                <View style={styles.productImage}>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.productImagePhoto} resizeMode="cover" />
                  ) : (
                    <Text style={styles.productImageText}>{item.name.charAt(0)}</Text>
                  )}
                  {inCart > 0 ? (
                    <View style={styles.productImageBadge}>
                      <Text style={styles.productImageBadgeText}>×{numberText(inCart)}</Text>
                    </View>
                  ) : null}
                </View>
                {(low || hasOptions) ? (
                  <View style={styles.productBadges}>
                    {low ? <AppBadge label="منخفض" tone="warning" /> : null}
                    {hasOptions ? <AppBadge label="خيارات" tone="info" /> : null}
                  </View>
                ) : null}
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                <View style={styles.productPriceRow}>
                  <Text style={styles.productPrice}>{money(item.selling_price)}</Text>
                  <Pressable onPress={() => onProductPress(item)} style={styles.addBtn} accessibilityLabel="إضافة للسلة">
                    <MaterialIcons name="add" size={22} color="#FFFFFF" />
                  </Pressable>
                </View>
                <View style={styles.stockRow}>
                  <Text style={styles.stockText}>{qty === null ? 'المتاح: غير محدد' : `المتاح: ${numberText(qty)}`}</Text>
                  {inCart > 0 ? <Text style={styles.inCartText}>في السلة: {numberText(inCart)}</Text> : null}
                </View>
              </View>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}
