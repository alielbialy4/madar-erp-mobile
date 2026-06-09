import React, { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { PosCatalogPanel, PosOrderPanel, PosTabletSplit, PosTabletTopBar } from '@/components/pos';
import { OfflinePrintIndicators } from '@/components/printing/OfflinePrintIndicators';
import { useColors } from '@/hooks/useColors';
import { spacing } from '@/constants/spacing';
import type { Branch, Product } from '@/types/api';
import type { CartLine } from '@/store/posStore';

type CategoryItem = { id: string; name: string; image?: string | null };

type CartPanelProps = {
  cart: CartLine[];
  effectiveTotal: number;
  subtotal: number;
  selectedTableId?: string | null;
  selectedTableName?: string | null;
  onSelectTakeaway: () => void;
  onSelectDineIn: () => void;
  orderModeDisabled?: boolean;
  shiftError: string | null;
  hasShift: boolean;
  pendingCount: number;
  selectedCustomerName?: string | null;
  taxLabel?: string | null;
  serviceChargeLabel?: string | null;
  deliveryFeeLabel?: string | null;
  splitPaid?: number | null;
  splitRemaining?: number | null;
  onSelectCustomer: () => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onSaveHoldCart?: () => void;
  onOpenHoldCarts?: () => void;
  onCashMovement?: () => void;
  onOpenTables?: () => void;
  onUpdateQty: (lineKey: string, delta: number) => void;
  onRemoveLine: (lineKey: string) => void;
  onPrintKitchen?: () => void;
  kitchenPrintEnabled?: boolean;
};

type Props = {
  shiftLabel: string;
  hasShift?: boolean;
  cashierName?: string | null;
  lastSyncedLabel?: string | null;
  onExitPos: () => void;
  onCashMovement: () => void;
  onOpenTables: () => void;
  onOpenHoldCarts?: () => void;
  onSaveHoldCart?: () => void;
  onShiftSummary?: () => void;
  onCloseShift?: () => void;
  onOpenDrawer?: () => void;
  openDrawerBusy?: boolean;
  posNotice: string | null;
  activeBranch: Branch | null;
  loading: boolean;
  products: Product[];
  error: string | null;
  onRetryCatalog: () => void;
  query: string;
  onQueryChange: (v: string) => void;
  categories: CategoryItem[];
  categoryId: string;
  onCategoryChange: (id: string) => void;
  showCategoryCards: boolean;
  onShowCategoryCards: () => void;
  onShowAllProducts: () => void;
  onSelectCategory: (id: string) => void;
  onExitCategory: () => void;
  activeCategoryName: string | null;
  filteredProducts: Product[];
  productQuantities?: Record<number, number>;
  onProductPress: (product: Product) => void;
  catalogRefreshing: boolean;
  onRefreshCatalog: () => void;
  cartPanelProps: CartPanelProps;
};

export function PosTabletScreen({
  shiftLabel,
  hasShift,
  cashierName,
  lastSyncedLabel,
  onExitPos,
  onCashMovement,
  onOpenTables,
  onOpenHoldCarts,
  onSaveHoldCart,
  onShiftSummary,
  onCloseShift,
  onOpenDrawer,
  openDrawerBusy,
  posNotice,
  activeBranch,
  loading,
  products,
  error,
  onRetryCatalog,
  query,
  onQueryChange,
  categories,
  categoryId,
  onCategoryChange,
  showCategoryCards,
  onShowCategoryCards,
  onShowAllProducts,
  onSelectCategory,
  onExitCategory,
  activeCategoryName,
  filteredProducts,
  productQuantities,
  onProductPress,
  catalogRefreshing,
  onRefreshCatalog,
  cartPanelProps,
}: Props) {
  const c = useColors();
  const [catalogWidth, setCatalogWidth] = useState(0);

  const handleCatalogWidthChange = useCallback((width: number) => {
    setCatalogWidth((prev) => (prev === width ? prev : width));
  }, []);

  return (
    <>
      <PosTabletTopBar
        shiftLabel={shiftLabel}
        hasShift={hasShift}
        cashierName={cashierName}
        lastSyncedLabel={lastSyncedLabel}
        onExitPos={onExitPos}
        onCashMovement={onCashMovement}
        onOpenTables={onOpenTables}
        onOpenHoldCarts={onOpenHoldCarts}
        onSaveHoldCart={onSaveHoldCart}
        onShiftSummary={onShiftSummary}
        onCloseShift={onCloseShift}
        onOpenDrawer={onOpenDrawer}
        openDrawerBusy={openDrawerBusy}
      />

      <View style={styles.offlineTablet}>
        <OfflinePrintIndicators compact />
      </View>

      {posNotice ? (
        <Text style={[styles.noticeText, { color: c.info, backgroundColor: c.softInfo }]}>{posNotice}</Text>
      ) : null}

      {!activeBranch ? (
        <View style={styles.centered}>
          <AppEmptyState title="اختر فرعاً أولاً" message="نقطة البيع تحتاج فرعاً نشطاً." />
        </View>
      ) : loading && products.length === 0 ? (
        <View style={styles.centered}>
          <AppLoadingState variant="skeleton" skeletonRows={6} />
        </View>
      ) : error && products.length === 0 ? (
        <View style={styles.centered}>
          <AppErrorState
            title="تعذر تحميل كتالوج البيع"
            message={error}
            onRetry={onRetryCatalog}
            retryLabel="إعادة تحميل الكتالوج"
          />
        </View>
      ) : (
        <View style={styles.workspace}>
          <PosTabletSplit
            onCatalogWidthChange={handleCatalogWidthChange}
            cart={<PosOrderPanel variant="tablet" {...cartPanelProps} />}
            catalog={
              <PosCatalogPanel
                variant="tablet"
                containerWidth={catalogWidth}
                query={query}
                onQueryChange={onQueryChange}
                categories={categories}
                categoryId={categoryId}
                onCategoryChange={onCategoryChange}
                showCategoryCards={showCategoryCards}
                onShowCategoryCards={onShowCategoryCards}
                onShowAllProducts={onShowAllProducts}
                onSelectCategory={onSelectCategory}
                onExitCategory={onExitCategory}
                activeCategoryName={activeCategoryName}
                products={filteredProducts}
                productQuantities={productQuantities}
                onProductPress={onProductPress}
                refreshing={catalogRefreshing}
                onRefresh={() => void onRefreshCatalog()}
              />
            }
          />
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  workspace: { flex: 1, minHeight: 0 },
  centered: { flex: 1, minHeight: 0, padding: spacing.lg, justifyContent: 'center' },
  offlineTablet: { paddingHorizontal: spacing.md },
  noticeText: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontWeight: '700',
    fontSize: 12,
    writingDirection: 'rtl',
    textAlign: 'right',
  },
});
