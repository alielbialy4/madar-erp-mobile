# POS Gaps

Web: `front/src/pages/POS/` · Mobile: `madar-erp-mobile/src/screens/pos/`, `store/posStore.ts`, `api/pos.ts`

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| POS catalog pull | `hooks/usePosCatalog.ts` | `GET /pos/catalog` (via sync) | Complete | `posStore.loadCatalog`, `api/pos.ts` | — | P3 | Offline cache via `catalogCache` |
| Category sidebar / drawer | `CategorySidebar`, `PosCategoryDrawer` | — | Partial | `POSScreen` category chips | Weak UI/UX | P2 | No drawer layout on tablet |
| Product search | `usePosSearch`, `POSSearchBar` | — | Partial | Catalog search in `POSScreen` | Weak UI/UX | P2 | NEEDS VERIFICATION barcode scan |
| Product grid / cards | `ProductGrid`, `CategoryGrid` | — | Partial | `PosCatalogPanel` | Weak UI/UX | P2 | Images added per implementation report |
| Modifiers / options | `ModifierPickerDialog` | — | Partial | `ModifierPickerSheet` | Missing validation | P1 | Required modifier enforcement NEEDS VERIFICATION |
| Variant picker | `VariantPickerDialog` | — | Missing | — | Missing modal | P1 | Web variant flow |
| Cart lines | `useCartLines` | — | Complete | `posStore` cart | — | P3 | |
| Quantity controls | Order panel | — | Complete | Cart UI | — | P3 | |
| Per-line discount | `DiscountChips` | — | Partial | Line `discount` field | NEEDS VERIFICATION | P2 | |
| Manual order discount | Payment flow | sale payload | Partial | `manualDiscount` in checkout | — | P2 | |
| Item notes | Order panel | — | Partial | `notes` on `CartLine` | NEEDS VERIFICATION | P2 | |
| Customer selection | `useCartCustomer`, header | customers API | Complete | Customer picker sheet | — | P3 | |
| Quick customer create | `QuickCustomerModal` | `POST /customers` | Partial | NEEDS VERIFICATION in POS | Missing modal | P2 | |
| Wallet payment | `useCartPayment` | wallet balance | Complete | `paymentType wallet` | — | P3 | Balance check in `PosCheckoutSheet` |
| Loyalty redemption | `useCartPayment` | `loyalty_points_redeemed` | Complete | `PosCheckoutSheet`, `posStore.submitSale` | — | P3 | Offline blocked with Arabic message |
| Split payment | Payment modal | split lines | Complete | `SplitPaymentSheet` | — | P3 | |
| Gift card payment | Payment modal | gift card API | Complete | `PosCheckoutSheet`, post-sale `giftCardsAPI.redeem` | — | P3 | Not a sale `payment_type`; redeem after sale |
| Coupons apply | `useCartCoupon` | `couponsAPI.validate` | Partial | Online validate only | Missing offline support | P1 | No `validateCouponOffline` |
| Coupon offline revalidate | `revalidateAppliedCoupon` | sync | Missing | — | Missing offline support | P1 | |
| Promotions (local engine) | `localPromotionEngine.ts` | — | Missing | — | Missing feature | P2 | |
| Active shift gate | `OpenShiftModal` | `shiftsAPI` | Partial | Shift checked NEEDS VERIFICATION | Missing modal | P1 | Web blocks POS without shift |
| Open / close shift from POS | `CloseShiftModal`, toolbar | shifts | Partial | User goes to `ShiftManagement` | Missing modal | P2 | |
| Shift summary modal | `ShiftSummaryModal` | shift summary | Partial | `ShiftScreen` print action | Weak UI/UX | P2 | No in-POS modal; print from shifts screen |
| Cash movement | `CashMovementModal` | `cashMovementsAPI` | Missing | — | Missing modal | P2 | |
| Held carts | `HoldCartModal` | local/branch storage | Complete | `HoldCartsSheet`, `holdCartService` | — | P3 | Online API + local AsyncStorage offline |
| Dining tables in POS | `TablesView` | `diningTablesAPI` | Missing | Separate `Dining` screen | Missing screen | P1 | Merge/transfer in POS |
| Table merge | `TablesView` | `mergeOrder` | Partial | `TableOrderScreen` | Wrong UX | P1 | Not in POS flow |
| Table transfer | `TablesView` | transfer API | Partial | `TableOrderScreen` | Wrong UX | P1 | |
| Bill split | `billSplit` API usage | `billSplitAPI` | Missing | — | Missing API client | P2 | Web-only API module |
| Sales modal (in-POS history) | `SalesModal` | sales list | Missing | `SalesTab` separate | Missing screen | P2 | |
| Returns from POS | `ReturnsScreen`, `RefundModal` | refunds | Partial | `Refunds` + `SaleDetail` | Missing modal | P2 | |
| Offline checkout queue | `useCartPayment` + sync | `POST /sync/offline-orders` | Partial | `offlineCheckout`, `posOrders` | Missing conflict UI | P1 | `client_order_id` in types |
| Offline catalog | `offlineBootstrap` | cache | Partial | `catalogCache` | — | P2 | |
| Receipt print | print service | print endpoint | Partial | `printEngine`, queue | Missing silent print | P1 | See doc 13 |
| Kitchen print routing | kitchen routing | — | Partial | `offline/kitchenRouting` | NEEDS VERIFICATION | P1 | Enqueued on offline save |
| Delivery order type | Payment modal | deliveries | NEEDS VERIFICATION | — | — | P2 | |
| Layaway payment type | Payment modal | layaway | Missing | — | Missing action | P1 | |
| Employee selector on POS | `POSHeader` | — | Missing | — | Missing filter | P2 | Multi-cashier |
| POS refunds print | `RefundModal` | — | Partial | — | Missing print support | P2 | |

## API references

- Web: `front/src/api/sync.ts`, `front/src/pages/POS/hooks/useCartPayment.ts`
- Mobile: `madar-erp-mobile/src/api/pos.ts`, `madar-erp-mobile/src/store/posStore.ts`

## Lockdown Pass 2 Update — 2026-05-23

- Implemented quick customer create in `QuickCustomerSheet` with real POS customer API and selection after create.
- Implemented variant picker in `VariantPickerSheet`; `posStore` now preserves `variant_id` and variant-aware cart line identity through checkout, held carts, and offline receipts.
- Implemented in-POS cash movement in `CashMovementSheet` with active-shift gate, confirmation, loading lock, and backend error display.
- Implemented POS tables bridge in `PosTablesSheet`: loads branch tables, opens table order, and syncs the active POS cart to table draft while online.
- Implemented failed offline order conflict details in `SyncStatusScreen`, including coupon snapshot/server reason, retry, and guarded clear.
- Remaining POS status: code complete for Pass 2 blockers; physical checkout/offline/printer QA is **NOT TESTED**.
