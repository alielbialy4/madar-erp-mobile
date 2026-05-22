import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppInput, AppListItem, AppSectionHeader, AppSelect } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import { PosCatalogPanel, PosOrderPanel, PosTopBar } from '@/components/pos';
import { colors } from '@/constants/colors';
import { rootRtl, textStart } from '@/constants/layout';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { couponsAPI } from '@/api/coupons';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { walletAPI } from '@/api/wallet';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { cartTotals, usePosStore } from '@/store/posStore';
import type { ActiveShift, CartLineSelectedOption, Customer, Product, SalePayload, Vault } from '@/types/api';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { ModifierPickerSheet } from './ModifierPickerSheet';
import { SplitPaymentSheet, SplitLine } from './SplitPaymentSheet';
import { CheckoutReviewSheet } from './CheckoutReviewSheet';

const TABLET_MIN = 900;

export function POSScreen() {
  const { width } = useWindowDimensions();
  const isTablet = width >= TABLET_MIN;
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

  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [showCategoryCards, setShowCategoryCards] = useState(true);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [customerOpen, setCustomerOpen] = useState(false);
  const [paid, setPaid] = useState('');
  const [paymentType, setPaymentType] = useState<SalePayload['payment_type']>('cash');
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
  const effectiveTotal = useMemo(() => {
    const couponDiscount = appliedCoupon?.discount ?? 0;
    return Math.max(0, totals.total - manualDiscountAmount - couponDiscount);
  }, [totals.total, manualDiscountAmount, appliedCoupon]);

  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const prevCartCount = useRef(0);

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
    if (!isTablet && cartItemCount > prevCartCount.current) {
      setMobileTab('cart');
    }
    prevCartCount.current = cartItemCount;
  }, [cartItemCount, isTablet]);

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

  const handleCheckout = async () => {
    setCheckoutMessage(null);
    if (!shift) {
      setCheckoutMessage('يجب فتح وردية قبل إتمام البيع.');
      return;
    }
    setSubmitting(true);
    const paidAmount = Number(paid || effectiveTotal);
    const result = await submitSale(
      paymentType,
      paidAmount,
      notes,
      paymentType === 'split' ? splitLines : undefined,
      appliedCoupon ? { coupon_id: appliedCoupon.coupon.id, coupon_discount: appliedCoupon.discount } : undefined,
      manualDiscountAmount,
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
    }
  };

  const openCheckout = () => {
    if (!shift) return;
    setPaid(String(effectiveTotal));
    setCheckoutOpen(true);
  };

  const showCatalog = isTablet || mobileTab === 'catalog';
  const showCart = isTablet || mobileTab === 'cart';

  return (
    <SafeAreaView style={[styles.safe, rootRtl]} edges={['top', 'left', 'right']}>
      <PosTopBar
        mobileTab={mobileTab}
        onMobileTabChange={setMobileTab}
        cartCount={cartItemCount}
        shiftLabel={shiftLabel}
        cashierName={user?.name}
        lastSyncedLabel={lastSyncedLabel}
        showMobileTabs={!isTablet}
      />

      {posNotice ? <Text style={styles.noticeText}>{posNotice}</Text> : null}

      {!activeBranch ? (
        <View style={styles.centered}>
          <AppEmptyState title="اختر فرعاً أولاً" message="نقطة البيع تحتاج فرعاً نشطاً." />
        </View>
      ) : loading && products.length === 0 ? (
        <View style={styles.centered}>
          <AppLoadingState />
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
                onUpdateQty={updateQuantity}
                onRemoveLine={removeLine}
              />
            </View>
          ) : null}
        </View>
      )}

      <AppBottomSheet visible={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        <View style={styles.sheet}>
          <AppSectionHeader title="إتمام البيع" />
          {walletText ? <Text style={styles.walletInfo}>{walletText}</Text> : null}
          <AppSelect
            label="طريقة الدفع"
            variant="solid"
            value={paymentType}
            onChange={(value) => setPaymentType(value as SalePayload['payment_type'])}
            options={[
              { label: 'نقدي', value: 'cash' },
              { label: 'بطاقة', value: 'card' },
              { label: 'آجل', value: 'credit' },
              ...(selectedCustomer ? [{ label: 'محفظة', value: 'wallet' }] : []),
              { label: 'مقسم', value: 'split' },
            ]}
          />
          {paymentType === 'wallet' && walletBalance !== null && walletBalance < effectiveTotal ? (
            <Text style={styles.errorText}>رصيد المحفظة غير كافٍ ({money(walletBalance)})</Text>
          ) : null}
          {paymentType !== 'split' ? (
            <AppInput label="المدفوع" keyboardType="numeric" value={paid} onChangeText={setPaid} />
          ) : null}
          {paymentType === 'split' ? (
            <>
              {vaults.length === 0 ? <Text style={styles.errorText}>لا توجد خزنة متاحة للدفع المقسم.</Text> : null}
              <AppButton title="تفعيل الدفع المقسم" variant="secondary" onPress={() => setSplitOpen(true)} disabled={vaults.length === 0} />
            </>
          ) : null}
          {allowManualDiscount ? (
            <AppInput label="خصم يدوي" keyboardType="numeric" value={manualDiscount} onChangeText={setManualDiscount} placeholder="0.00" />
          ) : (
            <Text style={styles.sheetMsg}>الخصم اليدوي غير مفعل في إعدادات هذا الفرع.</Text>
          )}
          {allowCoupons ? (
            <>
              <AppInput label="كوبون" value={couponCode} onChangeText={setCouponCode} placeholder="أدخل كود الكوبون" />
              {!appliedCoupon ? (
                <AppButton title="تحقق من الكوبون" variant="outline" onPress={validateCoupon} disabled={!couponCode.trim()} size="sm" />
              ) : (
                <View style={styles.couponRow}>
                  <Text style={styles.couponApplied}>{appliedCoupon.coupon.code}: -{money(appliedCoupon.discount)}</Text>
                  <AppButton title="إزالة" variant="ghost" onPress={removeCoupon} size="sm" />
                </View>
              )}
            </>
          ) : (
            <Text style={styles.sheetMsg}>الكوبونات غير مفعلة في إعدادات هذا الفرع.</Text>
          )}
          {couponMessage ? <Text style={styles.sheetMsg}>{couponMessage}</Text> : null}
          <AppInput label="ملاحظات" value={notes} onChangeText={setNotes} multiline />
          {checkoutMessage ? <Text style={styles.sheetMsg}>{checkoutMessage}</Text> : null}
          <AppButton
            title="مراجعة الطلب"
            onPress={() => setReviewOpen(true)}
            disabled={paymentType === 'split' && splitLines.length === 0}
            size="lg"
            fullWidth
          />
        </View>
      </AppBottomSheet>

      <CheckoutReviewSheet
        visible={reviewOpen}
        cart={cart}
        subtotal={totals.subtotal}
        discount={totals.discount + manualDiscountAmount}
        total={Math.max(0, totals.total - manualDiscountAmount)}
        coupon={appliedCoupon}
        paymentType={paymentType}
        paid={Number(paid || effectiveTotal)}
        customerName={selectedCustomer?.name ?? null}
        onClose={() => setReviewOpen(false)}
        onConfirm={handleCheckout}
        loading={submitting}
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
  safe: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, padding: spacing.lg, justifyContent: 'center' },
  workspace: { flex: 1, padding: spacing.md, gap: spacing.md },
  workspaceTablet: { flexDirection: 'row', alignItems: 'stretch' },
  catalogCol: { flex: 1, minWidth: 0 },
  catalogColTablet: { flex: 1 },
  cartCol: { flex: 1, minWidth: 0 },
  cartColTablet: { width: 400, maxWidth: 440, flexGrow: 0, flexShrink: 0 },
  fullCol: { flex: 1 },
  sheet: { gap: spacing.md },
  walletInfo: { ...textStart, color: colors.info, fontSize: 12, fontWeight: '700' },
  errorText: { ...textStart, color: colors.danger, fontWeight: '700', fontSize: 13 },
  couponRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  couponApplied: { ...textStart, color: colors.success, fontWeight: '700' },
  sheetMsg: { ...textStart, color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  noticeText: {
    ...textStart,
    color: colors.info,
    backgroundColor: colors.softInfo,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    fontWeight: '700',
    fontSize: 12,
  },
});
