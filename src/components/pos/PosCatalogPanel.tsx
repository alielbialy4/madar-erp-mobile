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
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/ui/PressableScale';
import { PosFlexGrid, posGridColumns } from '@/components/pos/PosFlexGrid';
import { AppText as Text } from '@/components/ui/AppText';
import { AppBadge, AppButton, AppInput } from '@/components/ui';
import { AppEmptyState } from '@/components/feedback';
import { flexRow, rtlDirection, textStart } from '@/constants/layout';
import { useColors } from '@/hooks/useColors';
import type { AppColors } from '@/constants/colors';
import { radius, spacing } from '@/constants/spacing';
import { typography } from '@/constants/typography';
import { fonts } from '@/constants/fonts';
import type { Product } from '@/types/api';
import { money, numberText } from '@/utils/format';
import { resolveMediaUrl } from '@/utils/media';
import { buildCategoryThumbnailMap } from '@/utils/posCatalogMedia';
import { chevronForwardIcon } from '@/utils/rtl';

type CategoryItem = { id: string; name: string; image?: string | null };

function CatalogCardOverlay() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={[
        'rgba(15,23,42,0.32)',
        'rgba(15,23,42,0.12)',
        'rgba(15,23,42,0.02)',
        'rgba(15,23,42,0.52)',
        'rgba(15,23,42,0.88)',
      ]}
      locations={[0, 0.14, 0.38, 0.68, 1]}
      style={StyleSheet.absoluteFillObject}
    />
  );
}

function availableQty(product: Product): number | null {
  const mode = product.inventory_mode ?? (product.track_inventory === false ? 'non_stock' : 'stock_product');
  if (mode !== 'stock_product') return null;
  const raw = product.branch_available_quantity ?? product.available_quantity ?? product.stock_quantity;
  if (raw === undefined || raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function premiumShadow(c: AppColors) {
  return Platform.select({
    ios: {
      shadowColor: c.shadowMd,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.1,
      shadowRadius: 16,
    },
    android: { elevation: 4 },
    default: { boxShadow: `0 8px 24px ${c.shadow}` } as object,
  });
}

function softGlow(c: AppColors) {
  return Platform.select({
    ios: {
      shadowColor: c.accent,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.22,
      shadowRadius: 10,
    },
    android: { elevation: 6 },
    default: { boxShadow: `0 0 0 1px ${c.accentBorder}, 0 8px 20px ${c.cardGlow}` } as object,
  });
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
  const gridWidth = containerWidth > 0 ? containerWidth : 640;
  const columns = posGridColumns(gridWidth, tablet);

  const isSearching = query.trim().length > 0;
  const showCategoryRoot = showCategoryCards && !isSearching;
  const showExitCategory = !showCategoryRoot && categoryId !== 'all' && Boolean(onExitCategory);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        panel: { flex: 1, minWidth: 0, minHeight: 0, ...rtlDirection },
        headerBlock: { gap: spacing.md, paddingBottom: spacing.md, paddingTop: spacing.sm },
        headerTopRow: { ...flexRow, alignItems: 'center', gap: spacing.sm },
        searchWrap: { flex: 1, minWidth: 0 },
        searchInput: { minHeight: tablet ? 50 : 44 },
        searchIconBox: {
          width: tablet ? 50 : 46,
          height: tablet ? 50 : 46,
          borderRadius: radius.xl,
          backgroundColor: c.surface,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          alignItems: 'center',
          justifyContent: 'center',
          ...premiumShadow(c),
        },
        catalogToolbar: { ...flexRow, alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
        sectionHeadRow: { ...flexRow, alignItems: 'center', gap: spacing.sm, flex: 1, minWidth: 0 },
        sectionTitle: {
          ...textStart,
          flex: 1,
          color: c.text,
          fontSize: tablet ? typography.sectionTitle : typography.cardTitle,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          letterSpacing: -0.3,
        },
        countBadge: {
          fontSize: typography.tiny,
          fontFamily: fonts.bold,
          fontWeight: '700',
          color: c.accent,
          backgroundColor: c.accentSoft,
          paddingHorizontal: spacing.sm,
          paddingVertical: 4,
          borderRadius: radius.pill,
          overflow: 'hidden',
        },
        breadcrumb: { ...textStart, color: c.textCaption, fontSize: typography.tiny, fontFamily: fonts.medium },
        exitCategoryBtn: { flexShrink: 0 },
        chipsScroll: { flexGrow: 0, marginHorizontal: -spacing.xs },
        chipsRow: { ...flexRow, gap: spacing.sm, paddingVertical: spacing.xs, paddingHorizontal: spacing.xs },
        chip: {
          minHeight: 40,
          paddingHorizontal: spacing.lg,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surface,
          justifyContent: 'center',
          ...Platform.select({
            ios: { shadowColor: c.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
            android: { elevation: 1 },
            default: {},
          }),
        },
        chipActive: {
          backgroundColor: c.accent,
          borderColor: c.accent,
          ...Platform.select({
            ios: { shadowColor: c.accent, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8 },
            android: { elevation: 3 },
            default: {},
          }),
        },
        chipText: {
          color: c.textMuted,
          fontFamily: fonts.medium,
          fontWeight: '600',
          fontSize: typography.small,
          writingDirection: 'rtl',
        },
        chipTextActive: {
          color: c.primaryForeground,
          fontFamily: fonts.bold,
          fontWeight: '700',
          writingDirection: 'rtl',
        },
        categoryCard: {
          flex: 1,
          borderRadius: radius.xl,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: c.borderSubtle,
          backgroundColor: c.surface,
          ...premiumShadow(c),
        },
        categoryAccentBar: {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          zIndex: 12,
          backgroundColor: c.accent,
        },
        categoryHero: {
          width: '100%',
          aspectRatio: tablet ? 1.22 : 1.28,
          minHeight: tablet ? 112 : 100,
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: c.surfaceMuted,
        },
        categoryHeroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
        categoryAllBackdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: c.primary,
        },
        categoryAllGlowA: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: c.accent,
          opacity: 0.22,
        },
        categoryAllGlowB: {
          position: 'absolute',
          top: -24,
          right: -24,
          width: 120,
          height: 120,
          borderRadius: 60,
          backgroundColor: 'rgba(255,255,255,0.12)',
        },
        categoryPlaceholderBackdrop: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: c.surfaceElement,
        },
        categoryPlaceholderTint: {
          ...StyleSheet.absoluteFillObject,
          backgroundColor: c.accent,
          opacity: 0.1,
        },
        categoryPlaceholderIconCenter: {
          position: 'absolute',
          top: '26%',
          left: 0,
          right: 0,
          alignItems: 'center',
          zIndex: 1,
        },
        categoryPlaceholderIconWrap: {
          width: 44,
          height: 44,
          borderRadius: radius.lg,
          backgroundColor: 'rgba(255,255,255,0.14)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        categoryPlaceholderLetter: {
          color: '#FFFFFF',
          fontSize: 20,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
        },
        categoryCountPill: {
          position: 'absolute',
          top: spacing.sm + 2,
          right: spacing.sm,
          zIndex: 8,
          ...flexRow,
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 5,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.9)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.55)',
          ...Platform.select({
            ios: {
              shadowColor: '#0C1222',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.12,
              shadowRadius: 6,
            },
            android: { elevation: 3 },
            default: { boxShadow: '0 2px 8px rgba(12,18,34,0.12)' } as object,
          }),
        },
        categoryCountValue: {
          color: c.text,
          fontSize: typography.small,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          writingDirection: 'rtl',
        },
        categoryCountLabel: {
          color: c.textCaption,
          fontSize: typography.tiny,
          fontFamily: fonts.bold,
          fontWeight: '700',
          writingDirection: 'rtl',
        },
        categoryOverlayContent: {
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 6,
          paddingHorizontal: spacing.sm + 2,
          paddingLeft: spacing.xl + 8,
          paddingBottom: spacing.sm + 2,
          paddingTop: spacing.xl,
          gap: 3,
        },
        categoryOverlayName: {
          color: '#FFFFFF',
          fontSize: tablet ? typography.body : typography.small,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          textAlign: 'right',
          writingDirection: 'rtl',
          lineHeight: tablet ? 20 : 18,
          letterSpacing: -0.2,
          textShadowColor: 'rgba(0,0,0,0.55)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 5,
        },
        categoryOverlayMeta: {
          color: 'rgba(255,255,255,0.86)',
          fontSize: typography.tiny,
          fontFamily: fonts.medium,
          fontWeight: '500',
          textAlign: 'right',
          writingDirection: 'rtl',
          textShadowColor: 'rgba(0,0,0,0.45)',
          textShadowOffset: { width: 0, height: 1 },
          textShadowRadius: 4,
        },
        categoryArrowWrap: {
          position: 'absolute',
          left: spacing.sm,
          bottom: spacing.sm + 1,
          zIndex: 7,
          width: 26,
          height: 26,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.18)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.28)',
          alignItems: 'center',
          justifyContent: 'center',
        },
        productCardInCart: {
          borderColor: c.accentBorder,
          ...softGlow(c),
        },
        productAccentInCart: {
          backgroundColor: c.accent,
        },
        productBadgesOverlay: {
          position: 'absolute',
          top: spacing.sm + 2,
          left: spacing.sm,
          zIndex: 8,
          ...flexRow,
          flexWrap: 'wrap',
          gap: spacing.xs,
          maxWidth: '58%',
        },
        productInCartPill: {
          position: 'absolute',
          top: spacing.sm + 2,
          right: spacing.sm,
          zIndex: 8,
          ...flexRow,
          alignItems: 'center',
          gap: 4,
          paddingHorizontal: spacing.sm,
          paddingVertical: 5,
          borderRadius: radius.pill,
          backgroundColor: c.primary,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.35)',
          ...Platform.select({
            ios: {
              shadowColor: '#0C1222',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.18,
              shadowRadius: 6,
            },
            android: { elevation: 3 },
            default: { boxShadow: '0 2px 8px rgba(12,18,34,0.18)' } as object,
          }),
        },
        productInCartValue: {
          color: c.primaryForeground,
          fontSize: typography.small,
          fontFamily: fonts.extraBold,
          fontWeight: '800',
          writingDirection: 'rtl',
        },
        productInCartLabel: {
          color: 'rgba(255,255,255,0.88)',
          fontSize: typography.tiny,
          fontFamily: fonts.bold,
          fontWeight: '700',
          writingDirection: 'rtl',
        },
        productAddFab: {
          position: 'absolute',
          left: spacing.sm,
          bottom: spacing.sm + 1,
          zIndex: 7,
          width: 28,
          height: 28,
          borderRadius: radius.pill,
          backgroundColor: 'rgba(255,255,255,0.92)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.55)',
          alignItems: 'center',
          justifyContent: 'center',
          ...Platform.select({
            ios: {
              shadowColor: '#0C1222',
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.14,
              shadowRadius: 5,
            },
            android: { elevation: 3 },
            default: { boxShadow: '0 2px 6px rgba(12,18,34,0.14)' } as object,
          }),
        },
      }),
    [c, tablet],
  );

  const categoryCards = useMemo(() => [{ id: 'all', name: 'كل المنتجات' }, ...categories], [categories]);
  const categoryThumbnails = useMemo(
    () => buildCategoryThumbnailMap(categories, products),
    [categories, products],
  );
  const productCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const product of products) {
      const id = product.category_id != null ? String(product.category_id) : null;
      if (!id) continue;
      map[id] = (map[id] ?? 0) + 1;
    }
    return map;
  }, [products]);
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
        <MaterialIcons name="qr-code-scanner" size={22} color={c.accent} />
      </View>
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
          renderItem={({ item }) => {
            const isAll = item.id === 'all';
            const thumb = !isAll ? categoryThumbnails[item.id] ?? resolveMediaUrl(item.image) : null;
            const count = isAll ? products.length : productCounts[item.id] ?? 0;
            return (
              <PressableScale
                onPress={() => (isAll ? onShowAllProducts() : onSelectCategory(item.id))}
                pressedScale={0.965}
                style={{ flex: 1 }}
              >
                <View style={styles.categoryCard}>
                  <View style={styles.categoryAccentBar} />
                  <View style={styles.categoryHero}>
                    {isAll ? (
                      <>
                        <View style={styles.categoryAllBackdrop} />
                        <View style={styles.categoryAllGlowA} />
                        <View style={styles.categoryAllGlowB} />
                        <View style={styles.categoryPlaceholderIconCenter}>
                          <View style={styles.categoryPlaceholderIconWrap}>
                            <MaterialIcons name="grid-view" size={24} color="#FFFFFF" />
                          </View>
                        </View>
                      </>
                    ) : thumb ? (
                      <Image source={{ uri: thumb }} style={styles.categoryHeroImage} resizeMode="cover" />
                    ) : (
                      <>
                        <View style={styles.categoryPlaceholderBackdrop} />
                        <View style={styles.categoryPlaceholderTint} />
                        <View style={styles.categoryPlaceholderIconCenter}>
                          <View style={styles.categoryPlaceholderIconWrap}>
                            <Text style={styles.categoryPlaceholderLetter}>{item.name.charAt(0)}</Text>
                          </View>
                        </View>
                      </>
                    )}

                    <CatalogCardOverlay />

                    <View style={styles.categoryCountPill}>
                      <Text style={styles.categoryCountValue}>{numberText(count)}</Text>
                      <Text style={styles.categoryCountLabel}>منتج</Text>
                    </View>

                    <View style={styles.categoryOverlayContent}>
                      <Text style={styles.categoryOverlayName} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.categoryOverlayMeta} numberOfLines={1}>
                        {isAll ? 'تصفح كل المنتجات' : 'تصنيف'}
                      </Text>
                    </View>

                    <View style={styles.categoryArrowWrap}>
                      <MaterialIcons name={chevronForwardIcon()} size={16} color="rgba(255,255,255,0.92)" />
                    </View>
                  </View>
                </View>
              </PressableScale>
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
            message={isSearching ? 'جرّب كلمة أخرى أو امسح البحث للعودة للتصنيفات.' : 'جرّب تصنيفاً آخر أو عدّل البحث.'}
          />
        }
        renderItem={({ item }) => {
          const mode = item.inventory_mode ?? (item.track_inventory === false ? 'non_stock' : 'stock_product');
          const qty = availableQty(item);
          const low = qty !== null && qty <= Number(item.min_stock_alert ?? 0);
          const hasOptions = item.option_groups?.some((g) => g.options && g.options.length > 0);
          const isRecipe = mode === 'recipe_product';
          const thumb = resolveMediaUrl(item.image);
          const inCart = productQuantities[item.id] ?? 0;
          return (
            <PressableScale onPress={() => onProductPress(item)} pressedScale={0.965} style={{ flex: 1 }}>
              <View style={[styles.categoryCard, inCart > 0 ? styles.productCardInCart : undefined]}>
                <View style={[styles.categoryAccentBar, inCart > 0 ? styles.productAccentInCart : undefined]} />
                <View style={styles.categoryHero}>
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.categoryHeroImage} resizeMode="cover" />
                  ) : (
                    <>
                      <View style={styles.categoryPlaceholderBackdrop} />
                      <View style={styles.categoryPlaceholderTint} />
                      <View style={styles.categoryPlaceholderIconCenter}>
                        <View style={styles.categoryPlaceholderIconWrap}>
                          <Text style={styles.categoryPlaceholderLetter}>{item.name.charAt(0)}</Text>
                        </View>
                      </View>
                    </>
                  )}

                  <CatalogCardOverlay />

                  {(low || hasOptions || isRecipe) ? (
                    <View style={styles.productBadgesOverlay}>
                      {isRecipe ? <AppBadge label="وصفة" tone="warning" /> : null}
                      {low ? <AppBadge label="منخفض" tone="warning" /> : null}
                      {hasOptions ? <AppBadge label="خيارات" tone="info" /> : null}
                    </View>
                  ) : null}

                  {inCart > 0 ? (
                    <View style={styles.productInCartPill}>
                      <Text style={styles.productInCartValue}>×{numberText(inCart)}</Text>
                      <Text style={styles.productInCartLabel}>في السلة</Text>
                    </View>
                  ) : qty !== null ? (
                    <View style={styles.categoryCountPill}>
                      <Text style={styles.categoryCountValue}>{numberText(qty)}</Text>
                      <Text style={styles.categoryCountLabel}>متاح</Text>
                    </View>
                  ) : null}

                  <View style={styles.categoryOverlayContent}>
                    <Text style={styles.categoryOverlayName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.categoryOverlayMeta} numberOfLines={1}>
                      {money(item.selling_price)}
                    </Text>
                  </View>

                  <Pressable
                    onPress={() => onProductPress(item)}
                    style={styles.productAddFab}
                    accessibilityLabel="إضافة للسلة"
                  >
                    <MaterialIcons name="add" size={18} color={c.primary} />
                  </Pressable>
                </View>
              </View>
            </PressableScale>
          );
        }}
      />
    </View>
  );
}
