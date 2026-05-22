import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { PosCatalogPanel, PosOrderPanel, PosTopBar } from '@/components/pos';
import { OfflinePrintIndicators } from '@/components/printing/OfflinePrintIndicators';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { rootRtl, textStart } from '@/constants/layout';
import { responsive } from '@/constants/responsive';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { couponsAPI } from '@/api/coupons';
import { giftCardsAPI } from '@/api/giftCards';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { walletAPI } from '@/api/wallet';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { cartTotals, usePosStore } from '@/store/posStore';
import type { ActiveShift, CartLineSelectedOption, Customer, Product, PosCheckoutPaymentType, Vault } from '@/types/api';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { ModifierPickerSheet } from './ModifierPickerSheet';
import { SplitPaymentSheet, SplitLine } from './SplitPaymentSheet';
import { CheckoutReviewSheet } from './CheckoutReviewSheet';
import { PosCheckoutSheet } from './PosCheckoutSheet';
import { HoldCartsSheet } from './HoldCartsSheet';

export function POSScreen() {
  const c = useColors();
  const { width } = useWindowDimensions();
  const isTablet = width >= responsive.tabletMinSplit;
  const tabBarInset = useTabBarBottomInset(spacing.sm);
  const user = useAuthStore((s) => s.user);
  const activeBranch = useBranchStore((state) => state.activeBranch);
  const products = usePosStore((state) => state.products);
  const categories = usePosStore((state) => state.categories);
  const customers = usePosStore((state) => state.customers);
  const cart = usePosStore((state) => state.cart);
  const loading = usePosStore((state) => state.loading);
  const error = usePosStore((state) => state.error);
  const lastSyncedAt = usePosStore((state) => state.lastSyncedAt);
  const pendingOrders = usePosStore((state) => state.pendingOrders);
  const selectedCustomer = usePosStore((state) => state.selectedCustomer);
  const walletBalance = usePosStore((state) => state.walletBalance);
  const pointsBalance = usePosStore((state) => state.pointsBalance);
  const appliedCoupon = usePosStore((state) => state.appliedCoupon);
  const loadCatalog = usePosStore((state) => state.loadCatalog);
  const addProduct = usePosStore((state) => state.addProduct);
  const updateQuantity = usePosStore((state) => state.updateQuantity);
  const removeLine = usePosStore((state) => state.removeLine);
  const clearCart = usePosStore((state) => state.clearCart);
  const setCustomer = usePosStore((state) => state.setCustomer);
  const submitSale = usePosStore((state) => state.submitSale);
  const setWalletBalance = usePosStore((state) => state.setWalletBalance);
  const setPointsBalance = usePosStore((state) => state.setPointsBalance);
  const setAppliedCoupon = usePosStore((state) => state.setAppliedCoupon);
  const catalogSettings = usePosStore((state) => state.catalogSettings);
  const restoreCartFromHold = usePosStore((state) => state.restoreCartFromHold);

  const isOnline = useNetworkStore((s) => s.isOnline);

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [showCategoryCards, setShowCategoryCards] = useState(true);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [paid, setPaid] = useState('');
  const [paymentType, setPaymentType] = useState<PosCheckoutPaymentType>('cash');
  const [loyaltyPointsInput, setLoyaltyPointsInput] = useState('');
  const [giftCardCode, setGiftCardCode] = useState('');
  const [giftCardMessage, setGiftCardMessage] = useState<string | null>(null);
  const [appliedGiftCard, setAppliedGiftCard] = useState<{ id: number; code: string; balance: number; amount: number } | null>(null);
  const [holdCartsOpen, setHoldCartsOpen] = useState(false);
  const [holdCartsMode, setHoldCartsMode] = useState<'list' | 'save'>('list');
  const [notes, setNotes] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [manualDiscount, setManualDiscount] = useState('');
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [posNotice, setPosNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [modifierOpen, setModifierOpen] = useState(false);
  const [splitOpen, setSplitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLine[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);

  const debouncedQuery = useDebouncedValue(query);
  const totals = useMemo(() => cartTotals(cart), [cart]);
  const branchSettings = activeBranch?.settings ?? {};
  const allowManualDiscount = branchSettings.allow_pos_discount !== false;
  const allowCoupons = branchSettings.allow_pos_coupon !== false;
  const manualDiscountAmount = useMemo(() => {
    const value = Number(manualDiscount) || 0;
    if (!allowManualDiscount) return 0;
    return Math.min(Math.max(value, 0), totals.total);
  }, [allowManualDiscount, manualDiscount, totals.total]);
  const loyaltyEgpPerPoint = useMemo(() => {
    const raw = catalogSettings?.loyalty_egp_per_point_redeem;
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? n : 0.5;
  }, [catalogSettings]);

  const loyaltyPointsNum = useMemo(() => {
    const n = parseInt(loyaltyPointsInput, 10);
    return Number.isFinite(n) && n > 0 ? n : 0;
  }, [loyaltyPointsInput]);

  const loyaltyDiscount = useMemo(() => {
    if (!isOnline || loyaltyPointsNum <= 0) return 0;
    return Math.round(loyaltyPointsNum * loyaltyEgpPerPoint * 100) / 100;
  }, [isOnline, loyaltyPointsNum, loyaltyEgpPerPoint]);

  const effectiveTotal = useMemo(() => {
    const couponDiscount = appliedCoupon?.discount ?? 0;
    const beforeLoyalty = Math.max(0, totals.total - manualDiscountAmount - couponDiscount);
    return Math.max(0, beforeLoyalty - loyaltyDiscount);
  }, [totals.total, manualDiscountAmount, appliedCoupon, loyaltyDiscount]);

  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const prevCartCount = useRef(0);
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  useEffect(() => {
    void loadCatalog();
  }, [activeBranch?.id, loadCatalog]);

  useEffect(() => {
    let mounted = true;
    async function loadShift() {
      if (!activeBranch?.id) {
        setShift(null);
        return;
      }
      try {
        const response = await shiftsAPI.current(activeBranch.id);
        if (mounted) {
          setShift((response.data as ActiveShift | null) ?? null);
          setShiftError(null);
        }
      } catch (err) {
        if (mounted) setShiftError(normalizeApiError(err).message);
      }
    }
    void loadShift();
    return () => {
      mounted = false;
    };
  }, [activeBranch?.id]);

  useEffect(() => {
    let mounted = true;
    async function loadVaults() {
      if (!activeBranch?.id) {
        setVaults([]);
        return;
      }
      try {
        const response = await vaultsAPI.list({ active_only: true, branch_id: activeBranch.id });
        if (mounted) {
          const rows = Array.isArray(response.data) ? response.data : [];
          setVaults(rows as Vault[]);
        }
      } catch {
        if (mounted) setVaults([]);
      }
    }
    void loadVaults();
    return () => {
      mounted = false;
    };
  }, [activeBranch?.id]);

  useEffect(() => {
    if (selectedCustomer?.id) {
      walletAPI
        .getBalance(selectedCustomer.id)
        .then((res) => {
          const d = res.data as any;
          setWalletBalance(Number(d?.wallet_balance ?? d?.balance ?? 0));
          setPointsBalance(Number(d?.points_balance ?? 0));
        })
        .catch(() => {
          setWalletBalance(null);
          setPointsBalance(null);
        });
    } else {
      setWalletBalance(null);
      setPointsBalance(null);
    }
  }, [selectedCustomer?.id, setWalletBalance, setPointsBalance]);

  useEffect(() => {
    if (cartItemCount > prevCartCount.current) {
      setCartPulse(true);
      const t = setTimeout(() => setCartPulse(false), 400);
      if (!isTablet) setMobileTab('cart');
      prevCartCount.current = cartItemCount;
      return () => clearTimeout(t);
    }
    prevCartCount.current = cartItemCount;
  }, [cartItemCount, isTablet]);

  const refreshCatalog = async () => {
    setCatalogRefreshing(true);
    try {
      await loadCatalog();
    } finally {
      setCatalogRefreshing(false);
    }
  };

  const filteredProducts = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        categoryId === 'all' || String(product.category_id ?? product.category?.id ?? '') === categoryId;
      const haystack = `${product.name} ${product.barcode ?? ''} ${(product.barcodes ?? []).join(' ')}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [categoryId, debouncedQuery, products]);

  const categoryItems = useMemo(
    () => categories.map((cat) => ({ id: String(cat.id), name: cat.name })),
    [categories],
  );

  const lastSyncedLabel = lastSyncedAt
    ? new Date(lastSyncedAt).toLocaleString('ar-EG-u-nu-latn')
    : null;

  const shiftLabel = shift ? 'وردية نشطة' : 'لا توجد وردية';

  const walletText =
    selectedCustomer && walletBalance !== null
      ? `رصيد المحفظة: ${money(walletBalance)}${pointsBalance != null && pointsBalance > 0 ? ` | نقاط: ${pointsBalance}` : ''}`
      : null;

  const couponLabel = appliedCoupon
    ? `كوبون ${appliedCoupon.coupon.code}: -${money(appliedCoupon.discount)}`
    : null;

  const handleProductPress = (product: Product) => {
    if (product.option_groups?.some((g) => g.options && g.options.length > 0)) {
      setModifierProduct(product);
      setModifierOpen(true);
      return;
    }
    addProduct(product);
  };

  const handleModifierConfirm = (options: CartLineSelectedOption[]) => {
    if (modifierProduct) addProduct(modifierProduct, options);
    setModifierOpen(false);
    setModifierProduct(null);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!allowCoupons) {
      setCouponMessage('الكوبونات غير مفعلة في إعدادات هذا الفرع.');
      return;
    }
    setCouponMessage(null);
    try {
      const response = await couponsAPI.validate({
        code: couponCode.trim(),
        cart_total: Math.max(0, totals.total - manualDiscountAmount),
        customer_id: selectedCustomer?.id ?? null,
        branch_id: activeBranch?.id ?? null,
      });
      if (response.status === 'success') {
        const coupon = (response.data as any)?.coupon;
        const discount = Number((response.data as any)?.discount ?? 0);
        if (coupon && discount > 0) {
          setAppliedCoupon({ coupon, discount });
          setCouponMessage(`تم تطبيق الكوبون. الخصم: ${money(discount)}`);
        } else {
          setCouponMessage(response.message || 'الكوبون صالح');
        }
      } else {
        setCouponMessage(response.message || 'الكوبون غير صالح');
      }
    } catch (err) {
      setCouponMessage(normalizeApiError(err).message);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const salePaymentType = useMemo((): 'cash' | 'card' | 'credit' | 'split' | 'wallet' => {
    if (paymentType === 'gift_card') {
      const remainder = appliedGiftCard ? Math.max(0, effectiveTotal - appliedGiftCard.amount) : effectiveTotal;
      return remainder > 0.01 ? 'cash' : 'cash';
    }
    if (paymentType === 'split') return 'split';
    return paymentType as 'cash' | 'card' | 'credit' | 'wallet';
  }, [paymentType, appliedGiftCard, effectiveTotal]);

  const validateGiftCard = async () => {
    if (!isOnline) {
      setGiftCardMessage('الدفع ببطاقة الهدايا يحتاج اتصالاً بالخادم للتحقق من الرصيد.');
      return;
    }
    const code = giftCardCode.trim();
    if (!code) return;
    setGiftCardMessage(null);
    try {
      const res = await giftCardsAPI.check(code);
      const data = res.data as { id?: number; balance?: number; code?: string; status?: string } | null;
      if (res.status !== 'success' || !data?.id) {
        setGiftCardMessage(res.message || 'بطاقة الهدايا غير صالحة');
        return;
      }
      const balance = Number(data.balance ?? 0);
      if (balance <= 0) {
        setGiftCardMessage('رصيد البطاقة غير كافٍ');
        return;
      }
      const amount = Math.min(balance, effectiveTotal);
      setAppliedGiftCard({ id: data.id, code: String(data.code ?? code), balance, amount });
      setGiftCardMessage(`رصيد البطاقة: ${money(balance)}`);
      const remainder = Math.max(0, effectiveTotal - amount);
      if (remainder > 0.01) setPaid(String(remainder));
      else setPaid('0');
    } catch (err) {
      setGiftCardMessage(normalizeApiError(err).message);
    }
  };

  const handleCheckout = async () => {
    setCheckoutMessage(null);
    if (!shift) {
      setCheckoutMessage('يجب فتح وردية قبل إتمام البيع.');
      return;
    }
    if (!isOnline && loyaltyPointsNum > 0) {
      setCheckoutMessage('استبدال النقاط يحتاج اتصالاً بالخادم للتحقق من الرصيد.');
      return;
    }
    if (loyaltyPointsNum > 0 && pointsBalance != null && loyaltyPointsNum > pointsBalance) {
      setCheckoutMessage('النقاط أكثر من الرصيد المتاح');
      return;
    }
    if (paymentType === 'gift_card') {
      if (!isOnline) {
        setCheckoutMessage('الدفع ببطاقة الهدايا يحتاج اتصالاً بالخادم للتحقق من الرصيد.');
        return;
      }
      if (!appliedGiftCard) {
        setCheckoutMessage('تحقق من بطاقة الهدايا أولاً');
        return;
      }
    }
    setSubmitting(true);
    const giftAmount = paymentType === 'gift_card' && appliedGiftCard ? appliedGiftCard.amount : 0;
    const cashDue = Math.max(0, effectiveTotal - giftAmount);
    const paidAmount =
      paymentType === 'gift_card'
        ? cashDue > 0.01
          ? Number(paid || cashDue)
          : 0
        : Number(paid || effectiveTotal);
    const result = await submitSale(
      salePaymentType,
      paidAmount,
      notes,
      salePaymentType === 'split' ? splitLines : undefined,
      appliedCoupon ? { coupon_id: appliedCoupon.coupon.id, coupon_discount: appliedCoupon.discount } : undefined,
      manualDiscountAmount,
      {
        loyaltyPointsRedeemed: loyaltyPointsNum > 0 ? loyaltyPointsNum : undefined,
        loyaltyDiscount: loyaltyDiscount > 0 ? loyaltyDiscount : undefined,
        giftCard:
          paymentType === 'gift_card' && appliedGiftCard
            ? { id: appliedGiftCard.id, code: appliedGiftCard.code, amount: appliedGiftCard.amount }
            : undefined,
      },
    );
    setSubmitting(false);
    setCheckoutMessage(result.message);
    if (result.ok || result.queued) {
      setPosNotice(result.message);
      setCheckoutOpen(false);
      setReviewOpen(false);
      setPaid('');
      setNotes('');
      setCouponCode('');
      setManualDiscount('');
      setAppliedCoupon(null);
      setCouponMessage(null);
      setSplitLines([]);
      setLoyaltyPointsInput('');
      setGiftCardCode('');
      setAppliedGiftCard(null);
      setGiftCardMessage(null);
      setPaymentType('cash');
    }
  };

  const openCheckout = () => {
    if (!shift) return;
    setPaid(String(effectiveTotal));
    setCheckoutOpen(true);
  };

  const openSaveHoldCart = () => {
    if (cart.length === 0) {
      Alert.alert('حفظ السلة', 'السلة فارغة');
      return;
    }
    setHoldCartsMode('save');
    setHoldCartsOpen(true);
  };

  const openHoldCartsList = () => {
    setHoldCartsMode('list');
    setHoldCartsOpen(true);
  };

  const showCatalog = isTablet || mobileTab === 'catalog';
  const showCart = isTablet || mobileTab === 'cart';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: c.background }, rootRtl]} edges={['top', 'left', 'right']}>
      <PosTopBar
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        cartCount={cartItemCount}
        cartPulse={cartPulse}
        shiftLabel={shiftLabel}
        cashierName={user?.name}
        lastSyncedLabel={lastSyncedLabel}
        showMobileTabs={!isTablet}
      />

      <OfflinePrintIndicators compact />
      {posNotice ? <Text style={[styles.noticeText, { color: c.info, backgroundColor: c.softInfo }]}>{posNotice}</Text> : null}

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
          <AppErrorState message={error} onRetry={loadCatalog} />
        </View>
      ) : (
        <View
          style={[
            styles.workspace,
            isTablet ? styles.workspaceTablet : undefined,
            !isTablet ? { paddingBottom: tabBarInset } : undefined,
          ]}
        >
          {showCatalog ? (
            <View style={[styles.catalogCol, isTablet ? styles.catalogColTablet : styles.fullCol]}>
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
                  setCategoryId('all');
                  setShowCategoryCards(false);
                }}
                onSelectCategory={(id) => {
                  setCategoryId(id);
                  setShowCategoryCards(false);
                }}
                products={filteredProducts}
                onProductPress={handleProductPress}
                loading={loading}
                refreshing={catalogRefreshing}
                onRefresh={() => void refreshCatalog()}
              />
            </View>
          ) : null}
          {showCart ? (
            <View style={[styles.cartCol, isTablet ? styles.cartColTablet : styles.fullCol]}>
              <PosOrderPanel
                cart={cart}
                effectiveTotal={effectiveTotal}
                subtotal={totals.subtotal}
                shiftError={shiftError}
                hasShift={!!shift}
                pendingCount={pendingOrders.length}
                selectedCustomerName={selectedCustomer?.name ?? null}
                walletText={walletText}
                couponLabel={couponLabel}
                onSelectCustomer={() => setCustomerOpen(true)}
                onClearCart={clearCart}
                onCheckout={openCheckout}
                onSaveHoldCart={openSaveHoldCart}
                onOpenHoldCarts={openHoldCartsList}
                onUpdateQty={updateQuantity}
                onRemoveLine={removeLine}
              />
            </View>
          ) : null}
        </View>
      )}

      <PosCheckoutSheet
        visible={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        amountDue={effectiveTotal}
        walletText={walletText}
        walletBalance={walletBalance}
        pointsBalance={pointsBalance}
        loyaltyEgpPerPoint={loyaltyEgpPerPoint}
        loyaltyPointsInput={loyaltyPointsInput}
        onLoyaltyPointsInputChange={setLoyaltyPointsInput}
        loyaltyDiscount={loyaltyDiscount}
        loyaltyBlockedOffline={!isOnline}
        isOnline={isOnline}
        paymentType={paymentType}
        onPaymentTypeChange={setPaymentType}
        paid={paid}
        onPaidChange={setPaid}
        allowManualDiscount={allowManualDiscount}
        manualDiscount={manualDiscount}
        onManualDiscountChange={setManualDiscount}
        allowCoupons={allowCoupons}
        couponCode={couponCode}
        onCouponCodeChange={setCouponCode}
        appliedCoupon={appliedCoupon}
        onValidateCoupon={() => void validateCoupon()}
        onRemoveCoupon={removeCoupon}
        couponMessage={couponMessage}
        giftCardCode={giftCardCode}
        onGiftCardCodeChange={setGiftCardCode}
        onValidateGiftCard={() => void validateGiftCard()}
        onClearGiftCard={() => {
          setAppliedGiftCard(null);
          setGiftCardMessage(null);
        }}
        appliedGiftCard={appliedGiftCard}
        giftCardMessage={giftCardMessage}
        notes={notes}
        onNotesChange={setNotes}
        checkoutMessage={checkoutMessage}
        hasCustomer={!!selectedCustomer}
        vaultsEmpty={vaults.length === 0}
        onOpenSplit={() => setSplitOpen(true)}
        onReview={() => setReviewOpen(true)}
        splitLinesCount={splitLines.length}
      />

      <CheckoutReviewSheet
        visible={reviewOpen}
        cart={cart}
        subtotal={totals.subtotal}
        discount={totals.discount + manualDiscountAmount}
        total={Math.max(0, totals.total - manualDiscountAmount)}
        coupon={appliedCoupon}
        loyaltyDiscount={loyaltyDiscount}
        loyaltyPointsRedeemed={loyaltyPointsNum}
        giftCard={appliedGiftCard}
        paymentType={paymentType}
        paid={Number(paid || effectiveTotal)}
        customerName={selectedCustomer?.name ?? null}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleCheckout}
        loading={submitting}
      />

      <HoldCartsSheet
        visible={holdCartsOpen}
        onClose={() => setHoldCartsOpen(false)}
        initialMode={holdCartsMode}
        cart={cart}
        customer={selectedCustomer}
        manualDiscount={manualDiscountAmount}
        appliedCoupon={appliedCoupon}
        cartTotal={effectiveTotal}
        onRestore={(data) => {
          restoreCartFromHold(data.lines, data.customer, data.manualDiscount, data.appliedCoupon);
          setManualDiscount(String(data.manualDiscount || ''));
          setHoldCartsOpen(false);
        }}
      />

      <ModifierPickerSheet
        visible={modifierOpen}
        product={modifierProduct}
        onClose={() => {
          setModifierOpen(false);
          setModifierProduct(null);
        }}
        onConfirm={handleModifierConfirm}
      />

      <SplitPaymentSheet
        visible={splitOpen}
        totalDue={effectiveTotal}
        vaults={vaults}
        hasCustomer={!!selectedCustomer}
        onClose={() => setSplitOpen(false)}
        onConfirm={(lines) => {
          setSplitLines(lines);
          setSplitOpen(false);
        }}
      />

      <AppBottomSheet visible={customerOpen} onClose={() => setCustomerOpen(false)}>
        <View style={styles.sheet}>
          <AppSectionHeader title="اختيار عميل" />
          <PosCustomerList
            customers={customers}
            onSelect={(c) => {
              setCustomer(c);
              setCustomerOpen(false);
            }}
            onClear={() => {
              setCustomer(null);
              setCustomerOpen(false);
            }}
          />
        </View>
      </AppBottomSheet>
    </SafeAreaView>
  );
}

function PosCustomerList({ customers, onSelect, onClear }: { customers: Customer[]; onSelect: (c: Customer) => void; onClear: () => void }) {
  return (
    <>
      <FlatList
        data={customers.slice(0, 80)}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<AppEmptyState title="لا يوجد عملاء في الكاش" />}
        renderItem={({ item }) => (
          <AppListItem
            title={item.name}
            subtitle={item.phone ?? undefined}
            meta={item.wallet_balance != null ? `محفظة: ${money(item.wallet_balance)}` : undefined}
            onPress={() => onSelect(item)}
          />
        )}
      />
      <AppButton title="بيع بدون عميل" variant="outline" onPress={onClear} size="sm" fullWidth />
    </>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  centered: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  workspace: { flex: 1, padding: spacing.md, gap: spacing.md },
  workspaceTablet: { flexDirection: 'row', alignItems: 'stretch' },
  catalogCol: { flex: 1, minWidth: 0 },
  catalogColTablet: { flex: 1 },
  cartCol: { flex: 1, minWidth: 0 },
  cartColTablet: { width: 400, maxWidth: 440, flexGrow: 0, flexShrink: 0 },
  fullCol: { flex: 1 },
  sheet: { gap: spacing.md },
  walletInfo: { ...textStart, fontSize: 12, fontFamily: fonts.bold, fontWeight: '700' },
  errorText: { ...textStart, fontWeight: '700', fontSize: 13, fontFamily: fonts.bold },
  couponRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  couponApplied: { ...textStart, fontWeight: '700', fontFamily: fonts.bold },
  sheetMsg: { ...textStart, fontWeight: '600', fontSize: 13, fontFamily: fonts.medium },
  noticeText: {
    ...textStart,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontWeight: '700',
    fontSize: 12,
    fontFamily: fonts.bold,
  },
});
