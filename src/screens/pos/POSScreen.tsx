import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, StyleSheet, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppBottomSheet } from '@/components/layout';
import { AppButton, AppListItem, AppSectionHeader } from '@/components/ui';
import { AppText as Text } from '@/components/ui/AppText';
import { AppEmptyState, AppErrorState, AppLoadingState } from '@/components/feedback';
import {
  PosCatalogPanel,
  PosOrderPanel,
  PosTopBar,
} from '@/components/pos';
import { PosTabletScreen } from './PosTabletScreen';
import { OfflinePrintIndicators } from '@/components/printing/OfflinePrintIndicators';
import { useColors } from '@/hooks/useColors';
import { fonts } from '@/constants/fonts';
import { rootRtl, textStart } from '@/constants/layout';
import { responsive } from '@/constants/responsive';
import { spacing } from '@/constants/spacing';
import { useTabBarBottomInset } from '@/hooks/useTabBarBottomInset';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { couponsAPI } from '@/api/coupons';
import { revalidateAppliedCoupon, validateCouponOffline } from '@/api/couponOffline';
import { giftCardsAPI } from '@/api/giftCards';
import { shiftsAPI } from '@/api/shifts';
import { vaultsAPI } from '@/api/vaults';
import { walletAPI } from '@/api/wallet';
import { useAuthStore } from '@/store/authStore';
import { useBranchStore } from '@/store/branchStore';
import { useNetworkStore } from '@/store/networkStore';
import { cartTotals, usePosStore } from '@/store/posStore';
import type { ActiveShift, CartLineSelectedOption, Customer, Coupon, Product, PosCheckoutPaymentType, Vault, LayawayTerms } from '@/types/api';
import { computePosCheckoutTotals, posAllowsCoupon, posAllowsDiscount, type PosOrderType } from '@/utils/posTotals';
import { money } from '@/utils/format';
import { normalizeApiError } from '@/utils/errors';
import { ModifierPickerSheet } from './ModifierPickerSheet';
import { SplitPaymentSheet, SplitLine } from './SplitPaymentSheet';
import { CheckoutReviewSheet } from './CheckoutReviewSheet';
import { PosCheckoutSheet } from './PosCheckoutSheet';
import { HoldCartsSheet } from './HoldCartsSheet';
import { VariantPickerSheet } from './VariantPickerSheet';
import { QuickCustomerSheet } from './QuickCustomerSheet';
import { CashMovementSheet } from './CashMovementSheet';
import { PosTablesSheet } from './PosTablesSheet';
import { isKitchenPrintEnabled, printKitchenFromCart } from '@/services/pos/posKitchenPrint';

type ProductVariantSelection = { id: string; name?: string | null };
type SelectedPosTable = {
  id: string;
  name?: string | null;
  number?: string | null;
  hallName?: string | null;
  activeOrderId?: number | string | null;
};

function productHasOptions(product: Product | null): boolean {
  return Boolean(product?.option_groups?.some((g) => g.options && g.options.length > 0));
}

function productHasVariants(product: Product | null): boolean {
  return Boolean(product?.variants?.length);
}

export function POSScreen({ navigation }: { navigation: any }) {
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
  const coupons = usePosStore((state) => state.coupons);
  const promotions = usePosStore((state) => state.promotions);
  const deliveryZones = usePosStore((state) => state.deliveryZones);
  const catalogSettings = usePosStore((state) => state.catalogSettings);
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
  const [layawayTermMonths, setLayawayTermMonths] = useState('');
  const [layawayMarkupPercent, setLayawayMarkupPercent] = useState('0');
  const [layawayFirstDueDate, setLayawayFirstDueDate] = useState('');
  const [needsDelivery, setNeedsDelivery] = useState(false);
  const [deliveryZoneId, setDeliveryZoneId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [checkoutMessage, setCheckoutMessage] = useState<string | null>(null);
  const [posNotice, setPosNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [shift, setShift] = useState<ActiveShift | null>(null);
  const [shiftError, setShiftError] = useState<string | null>(null);
  const [modifierProduct, setModifierProduct] = useState<Product | null>(null);
  const [modifierVariant, setModifierVariant] = useState<ProductVariantSelection | null>(null);
  const [modifierOpen, setModifierOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variantOpen, setVariantOpen] = useState(false);
  const [quickCustomerOpen, setQuickCustomerOpen] = useState(false);
  const [cashMovementOpen, setCashMovementOpen] = useState(false);
  const [tablesOpen, setTablesOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState<SelectedPosTable | null>(null);
  const [splitOpen, setSplitOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [splitLines, setSplitLines] = useState<SplitLine[]>([]);
  const [vaults, setVaults] = useState<Vault[]>([]);

  const debouncedQuery = useDebouncedValue(query);
  const totals = useMemo(() => cartTotals(cart), [cart]);
  const orderType: PosOrderType = selectedTable ? 'dine_in' : needsDelivery ? 'delivery' : 'takeaway';
  const selectedTableName = selectedTable
    ? selectedTable.name ?? (selectedTable.number ? `طاولة ${selectedTable.number}` : `طاولة ${selectedTable.id}`)
    : null;
  const orderTypeLabel =
    orderType === 'dine_in' ? 'صالة' : orderType === 'delivery' ? 'توصيل' : 'تيك أواي';
  const allowManualDiscount = posAllowsDiscount(catalogSettings);
  const allowCoupons = posAllowsCoupon(catalogSettings);
  const deliveryFee = useMemo(() => {
    if (selectedTable || !needsDelivery || !deliveryZoneId) return 0;
    const zone = deliveryZones.find((z) => String(z.id) === deliveryZoneId);
    return zone ? Number(zone.delivery_fee ?? 0) || 0 : 0;
  }, [selectedTable, needsDelivery, deliveryZoneId, deliveryZones]);
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

  const checkoutTotals = useMemo(
    () =>
      computePosCheckoutTotals({
        lines: cart,
        products,
        promotions,
        settings: catalogSettings,
        branchId: activeBranch?.id ?? null,
        manualDiscount: manualDiscountAmount,
        couponDiscount: appliedCoupon?.discount ?? 0,
        loyaltyDiscount,
        orderType,
        deliveryFee,
      }),
    [
      cart,
      products,
      promotions,
      catalogSettings,
      activeBranch?.id,
      manualDiscountAmount,
      appliedCoupon,
      loyaltyDiscount,
      orderType,
      deliveryFee,
    ],
  );

  const effectiveTotal = checkoutTotals.total;

  const cartItemCount = useMemo(() => cart.reduce((sum, line) => sum + line.quantity, 0), [cart]);
  const productQuantities = useMemo(
    () =>
      cart.reduce<Record<number, number>>((acc, line) => {
        acc[line.product_id] = (acc[line.product_id] ?? 0) + line.quantity;
        return acc;
      }, {}),
    [cart],
  );
  const prevCartCount = useRef(0);
  const [catalogRefreshing, setCatalogRefreshing] = useState(false);
  const [cartPulse, setCartPulse] = useState(false);

  useEffect(() => {
    void loadCatalog();
  }, [activeBranch?.id, loadCatalog]);

  const refreshShift = useCallback(async () => {
    if (!activeBranch?.id) {
      setShift(null);
      return;
    }
    try {
      const response = await shiftsAPI.current(activeBranch.id);
      setShift((response.data as ActiveShift | null) ?? null);
      setShiftError(null);
    } catch (err) {
      setShiftError(normalizeApiError(err).message);
    }
  }, [activeBranch?.id]);

  useEffect(() => {
    let mounted = true;
    void refreshShift().finally(() => {
      if (!mounted) return;
    });
    return () => {
      mounted = false;
    };
  }, [refreshShift]);

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
    const browsingCategoryId = showCategoryCards && q ? 'all' : categoryId;
    return products.filter((product) => {
      const matchesCategory =
        browsingCategoryId === 'all' || String(product.category_id ?? product.category?.id ?? '') === browsingCategoryId;
      const haystack = `${product.name} ${product.barcode ?? ''} ${(product.barcodes ?? []).join(' ')}`.toLowerCase();
      return matchesCategory && (!q || haystack.includes(q));
    });
  }, [categoryId, debouncedQuery, products, showCategoryCards]);

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
  const promotionLabel =
    checkoutTotals.promotionDiscount > 0
      ? `عروض: -${money(checkoutTotals.promotionDiscount)}`
      : null;
  const serviceChargeLabel =
    checkoutTotals.serviceCharge > 0
      ? `${checkoutTotals.serviceChargeLabel}: ${money(checkoutTotals.serviceCharge)}`
      : null;
  const deliveryFeeLabel =
    checkoutTotals.deliveryFee > 0 ? `رسوم التوصيل: ${money(checkoutTotals.deliveryFee)}` : null;
  const taxLabel = checkoutTotals.tax > 0 ? `الضريبة: ${money(checkoutTotals.tax)}` : null;

  const handleProductPress = (product: Product) => {
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
    addProduct(product);
  };

  const handleVariantSelect = (variant: ProductVariantSelection) => {
    if (!variantProduct) return;
    const product = variantProduct;
    setVariantOpen(false);
    setVariantProduct(null);
    if (productHasOptions(product)) {
      setModifierProduct(product);
      setModifierVariant(variant);
      setModifierOpen(true);
      return;
    }
    addProduct(product, undefined, variant);
  };

  const handleModifierConfirm = (options: CartLineSelectedOption[]) => {
    if (modifierProduct) addProduct(modifierProduct, options, modifierVariant);
    setModifierOpen(false);
    setModifierProduct(null);
    setModifierVariant(null);
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    if (!allowCoupons) {
      setCouponMessage('الكوبونات غير مفعلة في إعدادات هذا الفرع.');
      return;
    }
    setCouponMessage(null);
    const cartTotal = Math.max(0, checkoutTotals.gross - checkoutTotals.promotionDiscount - manualDiscountAmount);
    if (!isOnline) {
      const offline = validateCouponOffline(coupons, couponCode, cartTotal, activeBranch?.id ?? null);
      if (offline) {
        setAppliedCoupon(offline);
        setCouponMessage(`تم تطبيق الكوبون (بدون اتصال). الخصم: ${money(offline.discount)}`);
      } else {
        setCouponMessage('الكوبون غير صالح أو منتهي أو لا ينطبق على هذا المبلغ.');
      }
      return;
    }
    try {
      const response = await couponsAPI.validate({
        code: couponCode.trim(),
        cart_total: cartTotal,
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

  useEffect(() => {
    if (!appliedCoupon) return;
    const cartTotal = Math.max(0, checkoutTotals.gross - checkoutTotals.promotionDiscount - manualDiscountAmount);
    let cancelled = false;
    void (async () => {
      const next = await revalidateAppliedCoupon(appliedCoupon, {
        cartTotal,
        customerId: selectedCustomer?.id ?? null,
        branchId: activeBranch?.id ?? null,
        online: isOnline,
        coupons,
        validateOnline: async (params) => {
          const res = await couponsAPI.validate(params);
          return res as { status?: string; data?: { coupon?: Coupon; discount?: number } | null; message?: string };
        },
      });
      if (cancelled) return;
      if (!next) {
        setAppliedCoupon(null);
        setCouponMessage('لم يعد الكوبون المطبّق صالحاً لهذا المبلغ.');
      } else if (next.discount !== appliedCoupon.discount) {
        setAppliedCoupon(next);
        setCouponMessage(`تم تحديث خصم الكوبون: ${money(next.discount)}`);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [totals.total, manualDiscountAmount, checkoutTotals.gross, checkoutTotals.promotionDiscount, isOnline, selectedCustomer?.id, activeBranch?.id, coupons, appliedCoupon?.coupon.code]);

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponMessage(null);
  };

  const salePaymentType = useMemo((): 'cash' | 'card' | 'credit' | 'split' | 'wallet' | 'layaway' => {
    if (paymentType === 'gift_card') {
      const remainder = appliedGiftCard ? Math.max(0, effectiveTotal - appliedGiftCard.amount) : effectiveTotal;
      return remainder > 0.01 ? 'cash' : 'cash';
    }
    if (paymentType === 'split') return 'split';
    if (paymentType === 'layaway') return 'layaway';
    return paymentType as 'cash' | 'card' | 'credit' | 'wallet';
  }, [paymentType, appliedGiftCard, effectiveTotal]);

  const buildLayawayTerms = useCallback((): LayawayTerms | null => {
    if (paymentType !== 'layaway') return null;
    const termMonths = parseInt(layawayTermMonths, 10);
    if (!Number.isFinite(termMonths) || termMonths < 1) return null;
    if (!layawayFirstDueDate.trim()) return null;
    return {
      base_total: checkoutTotals.totalBeforeLoyalty,
      markup_percent: parseFloat(layawayMarkupPercent) || 0,
      term_months: termMonths,
      down_payment_amount: Number(paid) || 0,
      first_due_date: layawayFirstDueDate.trim(),
    };
  }, [paymentType, layawayTermMonths, layawayMarkupPercent, layawayFirstDueDate, paid, checkoutTotals.totalBeforeLoyalty]);

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
    if (submitting) return;
    setCheckoutMessage(null);
    if (!shift) {
      setCheckoutMessage('يجب فتح وردية قبل إتمام البيع.');
      return;
    }
    if (!isOnline && selectedTable) {
      setCheckoutMessage('طلب الطاولة يحتاج اتصالاً بالخادم لحفظ حالة الطاولة ومنع تكرار الطلب.');
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
    if (paymentType === 'layaway') {
      if (!selectedCustomer) {
        setCheckoutMessage('التقسيط يتطلب اختيار عميل.');
        return;
      }
      if (!isOnline) {
        setCheckoutMessage('بيع التقسيط يحتاج اتصالاً بالخادم.');
        return;
      }
      const terms = buildLayawayTerms();
      if (!terms) {
        setCheckoutMessage('أكمل شروط التقسيط (الأقساط، التاريخ، الدفعة المقدمة).');
        return;
      }
    }
    setSubmitting(true);
    const giftAmount = paymentType === 'gift_card' && appliedGiftCard ? appliedGiftCard.amount : 0;
    const cashDue = Math.max(0, effectiveTotal - giftAmount);
    const paidAmount =
      paymentType === 'layaway'
        ? Number(paid) || 0
        : paymentType === 'gift_card'
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
        layawayTerms: buildLayawayTerms(),
        orderType,
        deliveryFee: needsDelivery ? deliveryFee : 0,
        deliveryAddress: needsDelivery ? deliveryAddress.trim() : undefined,
        deliveryPhone: needsDelivery ? deliveryPhone.trim() : undefined,
        deliveryZoneId: needsDelivery ? deliveryZoneId || null : null,
        diningTableId: selectedTable?.id ?? null,
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
      setLayawayTermMonths('');
      setLayawayMarkupPercent('0');
      setLayawayFirstDueDate('');
      setNeedsDelivery(false);
      setSelectedTable(null);
      setDeliveryZoneId('');
      setDeliveryAddress('');
      setDeliveryPhone('');
      setSplitLines([]);
      setLoyaltyPointsInput('');
      setGiftCardCode('');
      setAppliedGiftCard(null);
      setGiftCardMessage(null);
      setPaymentType('cash');
    }
  };

  const openCheckout = () => {
    if (!shift) {
      setPosNotice('يجب فتح وردية قبل إتمام البيع.');
      return;
    }
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

  const handleExitCategory = useCallback(() => {
    setShowCategoryCards(true);
    setCategoryId('all');
    setQuery('');
  }, []);

  const handleCategoryChange = useCallback((id: string) => {
    setCategoryId(id);
    setShowCategoryCards(false);
  }, []);

  const activeCategoryName = useMemo(() => {
    if (showCategoryCards || categoryId === 'all') return null;
    return categoryItems.find((cat) => cat.id === categoryId)?.name ?? null;
  }, [showCategoryCards, categoryId, categoryItems]);

  const handleExitPos = useCallback(() => {
    const hasCartItems = cart.length > 0;
    const title = 'خروج من نقطة البيع';
    const message = hasCartItems
      ? 'توجد منتجات في السلة. هل تريد الخروج من نقطة البيع؟'
      : 'هل تريد الخروج من شاشة نقطة البيع؟';

    Alert.alert(title, message, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'خروج',
        style: 'destructive',
        onPress: () => {
          const parent = navigation.getParent?.();
          if (parent?.navigate) {
            parent.navigate('DashboardTab');
            return;
          }
          if (navigation.canGoBack?.()) {
            navigation.goBack();
          }
        },
      },
    ]);
  }, [cart.length, navigation]);

  const showCatalog = isTablet || mobileTab === 'catalog';
  const showCart = isTablet || mobileTab === 'cart';
  const kitchenPrintEnabled = useMemo(() => isKitchenPrintEnabled(catalogSettings), [catalogSettings]);
  const splitPaid = useMemo(() => splitLines.reduce((sum, line) => sum + (parseFloat(line.amount) || 0), 0), [splitLines]);
  const splitRemaining = Math.max(0, effectiveTotal - splitPaid);

  const handlePrintKitchen = useCallback(async () => {
    if (!activeBranch?.id) {
      setPosNotice('اختر فرعاً أولاً.');
      return;
    }
    try {
      const result = await printKitchenFromCart({
        cart,
        products,
        branchId: activeBranch.id,
        tableName: selectedTableName,
      });
      setPosNotice(result.message);
    } catch (err) {
      setPosNotice(normalizeApiError(err).message);
    }
  }, [activeBranch?.id, cart, products, selectedTableName]);

  const cartPanelProps = {
    cart,
    effectiveTotal,
    subtotal: totals.subtotal,
    branchName: activeBranch?.name ?? null,
    orderTypeLabel,
    shiftError,
    hasShift: !!shift,
    pendingCount: pendingOrders.length,
    selectedCustomerName: selectedCustomer?.name ?? null,
    selectedTableName,
    walletText,
    couponLabel,
    manualDiscountLabel: manualDiscountAmount > 0 ? `خصم يدوي: -${money(manualDiscountAmount)}` : null,
    promotionLabel,
    taxLabel,
    serviceChargeLabel,
    deliveryFeeLabel,
    loyaltyLabel: loyaltyDiscount > 0 ? `نقاط ولاء: -${money(loyaltyDiscount)}` : null,
    giftCardLabel: appliedGiftCard ? `بطاقة هدايا: -${money(appliedGiftCard.amount)}` : null,
    splitPaid: paymentType === 'split' && splitLines.length > 0 ? splitPaid : null,
    splitRemaining: paymentType === 'split' && splitLines.length > 0 ? splitRemaining : null,
    onSelectCustomer: () => setCustomerOpen(true),
    onClearCart: clearCart,
    onCheckout: openCheckout,
    onSaveHoldCart: openSaveHoldCart,
    onOpenHoldCarts: openHoldCartsList,
    onCashMovement: () => setCashMovementOpen(true),
    onOpenTables: () => setTablesOpen(true),
    onUpdateQty: updateQuantity,
    onRemoveLine: removeLine,
    onPrintKitchen: kitchenPrintEnabled ? () => void handlePrintKitchen() : undefined,
    kitchenPrintEnabled,
  };

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: isTablet ? c.surfaceMuted : c.background }, rootRtl]}
      edges={isTablet ? ['top', 'left', 'right', 'bottom'] : ['top', 'left', 'right']}
    >
      {isTablet ? (
        <PosTabletScreen
          shiftLabel={shiftLabel}
          cashierName={user?.name}
          lastSyncedLabel={lastSyncedLabel}
          onExitPos={handleExitPos}
          onSaveHoldCart={openSaveHoldCart}
          onOpenHoldCarts={openHoldCartsList}
          onCashMovement={() => setCashMovementOpen(true)}
          onOpenTables={() => setTablesOpen(true)}
          posNotice={posNotice}
          activeBranch={activeBranch}
          loading={loading}
          products={products}
          error={error}
          onRetryCatalog={loadCatalog}
          query={query}
          onQueryChange={setQuery}
          categories={categoryItems}
          categoryId={categoryId}
          onCategoryChange={handleCategoryChange}
          showCategoryCards={showCategoryCards}
          onShowCategoryCards={handleExitCategory}
          onShowAllProducts={() => {
            setCategoryId('all');
            setShowCategoryCards(false);
          }}
          onSelectCategory={(id) => {
            setCategoryId(id);
            setShowCategoryCards(false);
          }}
          onExitCategory={handleExitCategory}
          activeCategoryName={activeCategoryName}
          filteredProducts={filteredProducts}
          productQuantities={productQuantities}
          onProductPress={handleProductPress}
          catalogRefreshing={catalogRefreshing}
          onRefreshCatalog={refreshCatalog}
          cartPanelProps={cartPanelProps}
        />
      ) : (
        <>
          <PosTopBar
            mobileTab={mobileTab}
            onMobileTabChange={setMobileTab}
            cartCount={cartItemCount}
            cartPulse={cartPulse}
            shiftLabel={shiftLabel}
            cashierName={user?.name}
            lastSyncedLabel={lastSyncedLabel}
            showMobileTabs
          />
          <OfflinePrintIndicators compact />
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
              <AppErrorState message={error} onRetry={loadCatalog} />
            </View>
          ) : (
        <View style={[styles.workspace, { paddingBottom: tabBarInset }]}>
          {showCart ? (
            <View style={[styles.cartCol, styles.fullCol]}>
              <PosOrderPanel
                {...cartPanelProps}
              />
            </View>
          ) : null}
          {showCatalog ? (
            <View style={[styles.catalogCol, styles.fullCol]}>
              <PosCatalogPanel
                query={query}
                onQueryChange={setQuery}
                categories={categoryItems}
                categoryId={categoryId}
                onCategoryChange={handleCategoryChange}
                showCategoryCards={showCategoryCards}
                onShowCategoryCards={handleExitCategory}
                onShowAllProducts={() => {
                  setCategoryId('all');
                  setShowCategoryCards(false);
                }}
                onSelectCategory={(id) => {
                  setCategoryId(id);
                  setShowCategoryCards(false);
                }}
                onExitCategory={handleExitCategory}
                activeCategoryName={activeCategoryName}
                onOpenTables={() => setTablesOpen(true)}
                products={filteredProducts}
                productQuantities={productQuantities}
                onProductPress={handleProductPress}
                refreshing={catalogRefreshing}
                onRefresh={() => void refreshCatalog()}
              />
            </View>
          ) : null}
        </View>
          )}
        </>
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
        onPaymentTypeChange={(value) => {
          setPaymentType(value);
          if (value === 'layaway') setPaid('0');
        }}
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
        selectedTableName={selectedTableName}
        vaultsEmpty={vaults.length === 0}
        onOpenSplit={() => setSplitOpen(true)}
        onReview={() => setReviewOpen(true)}
        splitLinesCount={splitLines.length}
        layawayTermMonths={layawayTermMonths}
        onLayawayTermMonthsChange={setLayawayTermMonths}
        layawayMarkupPercent={layawayMarkupPercent}
        onLayawayMarkupPercentChange={setLayawayMarkupPercent}
        layawayFirstDueDate={layawayFirstDueDate}
        onLayawayFirstDueDateChange={setLayawayFirstDueDate}
        needsDelivery={needsDelivery}
        onNeedsDeliveryChange={(value) => {
          if (value) setSelectedTable(null);
          setNeedsDelivery(value);
          if (!value) {
            setDeliveryZoneId('');
            setDeliveryAddress('');
            setDeliveryPhone('');
          }
        }}
        deliveryZones={deliveryZones}
        deliveryZoneId={deliveryZoneId}
        onDeliveryZoneChange={setDeliveryZoneId}
        deliveryAddress={deliveryAddress}
        onDeliveryAddressChange={setDeliveryAddress}
        deliveryPhone={deliveryPhone}
        onDeliveryPhoneChange={setDeliveryPhone}
        deliveryFee={deliveryFee}
      />

      <CheckoutReviewSheet
        visible={reviewOpen}
        cart={cart}
        subtotal={checkoutTotals.gross}
        discount={checkoutTotals.invoiceDiscount}
        total={checkoutTotals.totalBeforeLoyalty}
        coupon={appliedCoupon}
        promotionDiscount={checkoutTotals.promotionDiscount}
        tax={checkoutTotals.tax}
        serviceCharge={checkoutTotals.serviceCharge}
        deliveryFee={checkoutTotals.deliveryFee}
        loyaltyDiscount={loyaltyDiscount}
        loyaltyPointsRedeemed={loyaltyPointsNum}
        giftCard={appliedGiftCard}
        paymentType={paymentType}
        paid={Number(paid || effectiveTotal)}
        customerName={selectedCustomer?.name ?? null}
        tableName={selectedTableName}
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
          setModifierVariant(null);
        }}
        onConfirm={handleModifierConfirm}
      />

      <VariantPickerSheet
        visible={variantOpen}
        product={variantProduct}
        onClose={() => {
          setVariantOpen(false);
          setVariantProduct(null);
        }}
        onSelect={handleVariantSelect}
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
          <AppButton
            title="إضافة عميل سريع"
            variant="secondary"
            onPress={() => {
              setCustomerOpen(false);
              setQuickCustomerOpen(true);
            }}
            fullWidth
          />
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

      <QuickCustomerSheet
        visible={quickCustomerOpen}
        branchId={activeBranch?.id ?? null}
        onClose={() => setQuickCustomerOpen(false)}
        onCreated={(customer) => {
          setCustomer(customer);
          setQuickCustomerOpen(false);
          setPosNotice('تم إضافة العميل واختياره في الطلب.');
          void loadCatalog();
        }}
      />

      <CashMovementSheet
        visible={cashMovementOpen}
        shift={shift}
        onClose={() => setCashMovementOpen(false)}
        onSuccess={() => {
          setPosNotice('تم تسجيل الحركة النقدية.');
          void refreshShift();
        }}
      />

      <PosTablesSheet
        visible={tablesOpen}
        branchId={activeBranch?.id ?? null}
        isOnline={isOnline}
        cart={cart}
        total={effectiveTotal}
        customer={selectedCustomer}
        selectedTableId={selectedTable?.id ?? null}
        onClose={() => setTablesOpen(false)}
        onSelectTable={(table) => {
          setSelectedTable(table);
          setNeedsDelivery(false);
          setPosNotice(`تم اختيار ${table.name ?? 'الطاولة'} للطلب الحالي.`);
        }}
        onLinked={(table) => {
          setSelectedTable(table);
          clearCart();
          setManualDiscount('');
          setCouponCode('');
          setCouponMessage(null);
          setNeedsDelivery(false);
          setPosNotice('تم ربط السلة بالطاولة.');
        }}
        onOpenTable={(table) => {
          navigation.navigate('DiningTableOrder', { tableId: table.id, tableName: table.name });
        }}
      />
    </SafeAreaView>
  );
}

function PosCustomerList({ customers, onSelect, onClear }: { customers: Customer[]; onSelect: (c: Customer) => void; onClear: () => void }) {
  const visibleCustomers = customers.slice(0, 80);
  return (
    <View style={{ gap: spacing.sm }}>
      {visibleCustomers.length > 0 ? (
        visibleCustomers.map((item) => (
          <AppListItem
            key={String(item.id)}
            title={item.name}
            subtitle={item.phone ?? undefined}
            meta={item.wallet_balance != null ? `محفظة: ${money(item.wallet_balance)}` : undefined}
            onPress={() => onSelect(item)}
          />
        ))
      ) : (
        <AppEmptyState title="لا يوجد عملاء في الكاش" />
      )}
      <AppButton title="بيع بدون عميل" variant="outline" onPress={onClear} size="sm" fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, minHeight: 0 },
  centered: { flex: 1, minHeight: 0, padding: spacing.lg, justifyContent: 'center' },
  workspace: { flex: 1, minHeight: 0, padding: spacing.md, gap: spacing.md },
  catalogCol: { flex: 1, minWidth: 0 },
  cartCol: { flex: 1, minWidth: 0 },
  fullCol: { flex: 1 },
  offlineTablet: { paddingHorizontal: spacing.md },
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
