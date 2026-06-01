import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppLoadingState } from '@/components/feedback';
import { PosCatalogPanel } from '@/components/pos/PosCatalogPanel';
import { WaiterCartPanel } from '@/components/waiter/WaiterCartPanel';
import { VariantPickerSheet } from '@/screens/pos/VariantPickerSheet';
import { ModifierPickerSheet } from '@/screens/pos/ModifierPickerSheet';
import { UnitPickerSheet } from '@/components/waiter/UnitPickerSheet';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useColors } from '@/hooks/useColors';
import { flexRow } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { fonts } from '@/constants/fonts';
import { usePosStore } from '@/store/posStore';
import type { CartLine } from '@/store/posStore';
import type { CartLineSelectedOption, Product } from '@/types/api';

type ProductVariantSelection = { id: string; name?: string | null };

type Tab = 'catalog' | 'cart';

type Props = {
  visible: boolean;
  mode: 'create' | 'add';
  tableName: string;
  busy: boolean;
  cart: CartLine[];
  onAddProduct: (
    product: Product,
    selectedOptions?: CartLineSelectedOption[],
    variant?: { id: string; name?: string | null } | null,
    unitId?: number | null,
  ) => void;
  onUpdateQty: (lineKey: string, delta: number) => void;
  onRemoveLine: (lineKey: string) => void;
  onLineNotesChange: (lineKey: string, notes: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function productHasOptions(product: Product | null): boolean {
  return Boolean(product?.option_groups?.some((g) => g.options && g.options.length > 0));
}

function productHasVariants(product: Product | null): boolean {
  return Boolean(product?.variants?.length);
}

export function WaiterOrderPickerSheet({
  visible,
  mode,
  tableName,
  busy,
  cart,
  onAddProduct,
  onUpdateQty,
  onRemoveLine,
  onLineNotesChange,
  onClose,
  onSubmit,
}: Props) {
  const c = useColors();
  const { height } = useWindowDimensions();
  const catalogHeight = Math.min(height * 0.5, 440);

  const products = usePosStore((s) => s.products);
  const categories = usePosStore((s) => s.categories);
  const catalogLoading = usePosStore((s) => s.loading);
  const loadCatalog = usePosStore((s) => s.loadCatalog);

  const [mobileTab, setMobileTab] = useState<Tab>('catalog');
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [showCategoryCards, setShowCategoryCards] = useState(true);
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);

  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [modifierVariant, setModifierVariant] = useState<ProductVariantSelection | null>(null);
  const [modifierOpen, setModifierOpen] = useState(false);
  const [unitPickProduct, setUnitPickProduct] = useState<Product | null>(null);
  const [unitPickOpen, setUnitPickOpen] = useState(false);
  const [pendingUnitId, setPendingUnitId] = useState<number | null>(null);

  const debouncedQuery = useDebouncedValue(query);
  const prevCartCount = useRef(0);

  useEffect(() => {
    if (!visible) return;
    void loadCatalog();
    setMobileTab('catalog');
    setQuery('');
    setCategoryId('all');
    setShowCategoryCards(true);
  }, [visible, loadCatalog]);

  const cartItemCount = cart.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    if (!visible) return;
    if (cartItemCount > prevCartCount.current) {
      setMobileTab('cart');
    }
    prevCartCount.current = cartItemCount;
  }, [cartItemCount, visible]);

  useEffect(() => {
    if (!visible) prevCartCount.current = 0;
  }, [visible]);

  const filteredProducts = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const browsingCategoryId = showCategoryCards && q ? 'all' : categoryId;
    return products.filter((product) => {
      const matchesCategory =
        browsingCategoryId === 'all' ||
        String(product.category_id ?? product.category?.id ?? '') === browsingCategoryId;
      const haystack = `${product.name} ${product.barcode ?? ''} ${(product.barcodes ?? []).join(' ')}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [categoryId, debouncedQuery, products, showCategoryCards]);

  const categoryItems = useMemo(
    () => categories.map((cat) => ({ id: String(cat.id), name: cat.name, image: cat.image ?? null })),
    [categories],
  );

  const productQuantities = useMemo(() => {
    const map: Record<number, number> = {};
    for (const line of cart) {
      map[line.product_id] = (map[line.product_id] ?? 0) + line.quantity;
    }
    return map;
  }, [cart]);

  const activeCategoryName = useMemo(() => {
    if (categoryId === 'all') return null;
    return categoryItems.find((cat) => cat.id === categoryId)?.name ?? null;
  }, [categoryId, categoryItems]);

  const refreshCatalog = async () => {
    setCatalogRefreshing(true);
    try {
      await loadCatalog();
    } finally {
      setCatalogRefreshing(false);
    }
  };

  const proceedWithProduct = useCallback(
    (product: Product, unitId: number | null) => {
      setPendingUnitId(unitId);
      if (productHasVariants(product)) {
        setVariantProduct(product);
        setVariantOpen(true);
        return;
      }
      if (productHasOptions(product)) {
        setModifierProduct(product);
        setModifierVariant(null);
        setModifierOpen(true);
        return;
      }
      onAddProduct(product, undefined, null, unitId);
      setPendingUnitId(null);
    },
    [onAddProduct],
  );

  const handleProductPress = useCallback(
    (product: Product) => {
      const units = product.units ?? [];
      if (units.length > 1) {
        setUnitPickProduct(product);
        setUnitPickOpen(true);
        return;
      }
      const defaultUnit = units.find((u) => u.is_base)?.id ?? units[0]?.id ?? null;
      proceedWithProduct(product, defaultUnit != null ? Number(defaultUnit) : null);
    },
    [proceedWithProduct],
  );

  const handleVariantSelect = useCallback(
    (variant: ProductVariantSelection) => {
      if (!variantProduct) return;
      const product = variantProduct;
      const unitId = pendingUnitId;
      setVariantOpen(false);
      setVariantProduct(null);
      if (productHasOptions(product)) {
        setModifierProduct(product);
        setModifierVariant(variant);
        setModifierOpen(true);
        return;
      }
      onAddProduct(product, undefined, variant, unitId);
      setPendingUnitId(null);
    },
    [onAddProduct, pendingUnitId, variantProduct],
  );

  const handleModifierConfirm = useCallback(
    (options: CartLineSelectedOption[]) => {
      if (modifierProduct) onAddProduct(modifierProduct, options, modifierVariant, pendingUnitId);
      setModifierOpen(false);
      setModifierProduct(null);
      setModifierVariant(null);
      setPendingUnitId(null);
    },
    [onAddProduct, modifierProduct, modifierVariant, pendingUnitId],
  );

  const title = mode === 'create' ? `طلب جديد — ${tableName}` : `إضافة أصناف — ${tableName}`;

  return (
    <>
      <AppBottomSheet visible={visible} onClose={onClose} size="wide">
        <View style={{ gap: spacing.md, minHeight: Math.min(height * 0.78, 720) }}>
          <AppSectionHeader title={title} />

          <View style={[flexRow, styles.tabs, { backgroundColor: c.surfaceMuted, borderColor: c.borderSubtle }]}>
            <Pressable
              onPress={() => setMobileTab('catalog')}
              style={[styles.tab, mobileTab === 'catalog' && { backgroundColor: c.surface }]}
            >
              <Text style={{ fontFamily: fonts.bold, color: mobileTab === 'catalog' ? c.accent : c.textMuted }}>
                الأصناف
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMobileTab('cart')}
              style={[styles.tab, mobileTab === 'cart' && { backgroundColor: c.surface }]}
            >
              <Text style={{ fontFamily: fonts.bold, color: mobileTab === 'cart' ? c.accent : c.textMuted }}>
                السلة{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
              </Text>
            </Pressable>
          </View>

          {mobileTab === 'catalog' ? (
            catalogLoading && products.length === 0 ? (
              <AppLoadingState />
            ) : (
              <View style={{ height: catalogHeight }}>
                <PosCatalogPanel
                  query={query}
                  onQueryChange={setQuery}
                  categories={categoryItems}
                  categoryId={categoryId}
                  onCategoryChange={setCategoryId}
                  showCategoryCards={showCategoryCards}
                  onShowCategoryCards={() => {
                    setShowCategoryCards(true);
                    setCategoryId('all');
                  }}
                  onShowAllProducts={() => {
                    setShowCategoryCards(false);
                    setCategoryId('all');
                  }}
                  onSelectCategory={(id) => {
                    setCategoryId(id);
                    setShowCategoryCards(false);
                    setQuery('');
                  }}
                  products={filteredProducts}
                  productQuantities={productQuantities}
                  onProductPress={handleProductPress}
                  refreshing={catalogRefreshing}
                  onRefresh={() => void refreshCatalog()}
                  onExitCategory={() => {
                    setShowCategoryCards(true);
                    setCategoryId('all');
                  }}
                  activeCategoryName={activeCategoryName}
                />
              </View>
            )
          ) : (
            <View style={{ flex: 1, minHeight: 280 }}>
              <WaiterCartPanel
                lines={cart}
                products={products}
                onUpdateQty={onUpdateQty}
                onRemoveLine={onRemoveLine}
                onLineNotesChange={onLineNotesChange}
              />
            </View>
          )}

          <View style={[flexRow, { gap: spacing.sm }]}>
            <AppButton title="إلغاء" variant="outline" onPress={onClose} style={{ flex: 1 }} />
            <AppButton
              title={mode === 'create' ? 'إنشاء وإرسال للمطبخ' : 'إضافة للطلب'}
              onPress={onSubmit}
              loading={busy}
              disabled={cart.length === 0}
              style={{ flex: 2 }}
            />
          </View>
        </View>
      </AppBottomSheet>

      <VariantPickerSheet
        visible={variantOpen}
        product={variantProduct}
        onClose={() => {
          setVariantOpen(false);
          setVariantProduct(null);
        }}
        onSelect={handleVariantSelect}
      />
      <ModifierPickerSheet
        visible={modifierOpen}
        product={modifierProduct}
        onClose={() => {
          setModifierOpen(false);
          setModifierProduct(null);
          setModifierVariant(null);
          setPendingUnitId(null);
        }}
        onConfirm={handleModifierConfirm}
      />
      <UnitPickerSheet
        visible={unitPickOpen}
        product={unitPickProduct}
        onClose={() => {
          setUnitPickOpen(false);
          setUnitPickProduct(null);
        }}
        onSelect={(unitId) => {
          const product = unitPickProduct;
          setUnitPickOpen(false);
          setUnitPickProduct(null);
          if (product) proceedWithProduct(product, unitId);
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  tabs: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
});
