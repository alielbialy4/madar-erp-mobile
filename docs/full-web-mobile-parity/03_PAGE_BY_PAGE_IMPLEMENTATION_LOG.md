# Page-by-Page Implementation Log

## 2026-05-23 Pass

### Navigation and API Baseline

- Read existing audit docs under `docs/mobile-gap-audit/`.
- Reviewed `front/src/Routes/index.tsx`, all nested route files, and `front/src/Layouts/buildSidebarMenu.ts`.
- Reviewed current mobile navigation: `MoreStack`, `MainTabs`, stack types, sidebar nav map, more hub.
- Confirmed many old audit P0s were already fixed in current code: report viewer routes, waiter POS, kitchen stations, print jobs, delivery finance screens, inventory write flows, purchases edit, marketing CRUD, gift card detail.

### Implemented: Sales by Product

- Web source: `front/src/pages/Sales/products/index.tsx`.
- Web behavior: loads completed sales, flattens sale items, filters by date and search, allows full refund from row.
- Mobile implementation: `src/screens/sales/SalesByProductScreen.tsx`.
- API: reused `salesAPI.getAll` and `salesAPI.refund`.
- Mobile behavior: product-line cards, date filter bottom sheet, search, sale detail jump, full-refund confirmation and refresh.

### Implemented: Layaway

- Web source: `front/src/pages/Sales/LayawayList.tsx`, `front/src/api/layaway.ts`.
- Web behavior: plans list, schedule modal, record payment, pay installment.
- Mobile implementation: `src/screens/sales/LayawayScreen.tsx`.
- API: added `src/api/layaway.ts`.
- Mobile behavior: plan cards, schedule bottom sheet, payment bottom sheet, confirmation before posting.

### Implemented: Supplier Payments Route

- Web source: `front/src/pages/Purchases/Payments/SupplierPaymentsList.tsx`.
- Web behavior: list/filter/summary/create payment/mixed settlement/print.
- Mobile implementation: `src/screens/suppliers/SupplierPaymentsScreen.tsx`.
- API: tightened `src/api/supplierPayments.ts`.
- Mobile behavior: summary cards and payment voucher list. Global create/mixed settlement is disabled with explanation and route to supplier detail, because it is a high-risk multi-entity finance operation.

### Implemented: Payments Ledger

- Web source: `front/src/pages/Payments/index.tsx`, `front/src/api/payments.ts`.
- Web behavior: safe totals, invoice/phone/date filters, ledger table.
- Mobile implementation: `src/screens/settings/PaymentsLedgerScreen.tsx`.
- API: added `src/api/payments.ts`.
- Mobile behavior: grand total card, filters bottom sheet, payment cards, pagination via existing list hook.

### Implemented: Vault Transactions

- Web source: `front/src/pages/Vaults/VaultTransactions.tsx`, `VaultTransactionDetails.tsx`, `front/src/api/vaults.ts`.
- Mobile implementation: `src/screens/vaults/VaultTransactionsScreen.tsx`, `src/screens/vaults/VaultTransactionDetailScreen.tsx`.
- API: typed transaction list/detail in `src/api/vaults.ts`.
- Mobile behavior: search, list cards, detail screen.

### Implemented: Delivery Finance Driver Detail

- Web source: `front/src/pages/DeliveryFinance/DriverDetail.tsx`.
- Mobile implementation: `src/screens/delivery/DeliveryFinanceDriverDetailScreen.tsx`.
- API: typed `deliveryFinanceAPI.driverDetail`.
- Mobile behavior: driver info, outstanding KPIs, outstanding deliveries, recent settlements, alerts. Liabilities rows now navigate to detail.

### Implemented: Barcode Print Disabled State

- Web source: `front/src/pages/BarcodePrint/index.tsx`.
- Mobile implementation: `src/screens/products/BarcodePrintInfoScreen.tsx`.
- Behavior: polished disabled/read-only state explaining why browser label printing is not yet safe on mobile; links to products and printer profiles.

### Implemented: Customer Detail Critical Actions

- Web source: `front/src/pages/Customers/CustomerProfile.tsx`, `front/src/pages/Customers/components/WalletModal.tsx`.
- Mobile implementation: `src/screens/customers/CustomerDetailScreen.tsx`.
- API: added wallet transaction client in `src/api/wallet.ts`.
- Mobile behavior: basic customer edit, wallet ledger, guarded wallet deposit/withdraw with active-shift check, confirmation, backend error display, and refresh.
- Remaining: additional phone CRUD, address advanced CRUD, customer sales/delivery tabs, and loyalty ledger.

## Validation So Far

- `npm run typecheck`: PASS after implementation fixes.

## 2026-05-23 Pass 2

### Implemented: POS Remaining Web Modals/Actions

- Web sources: `QuickCustomerModal`, `VariantPickerDialog`, `CashMovementModal`, `TablesView`.
- Mobile implementation:
  - `QuickCustomerSheet`: creates POS customer with real API, selects created customer, surfaces validation/backend errors.
  - `VariantPickerSheet`: selects product variant before modifiers/add-to-cart.
  - `posStore`: variant-aware cart identity, quantity/delete, hold-cart payload and sale payload preserve `variant_id`.
  - `CashMovementSheet`: active-shift cash-in/cash-out with confirmation, loading lock, backend errors.
  - `PosTablesSheet`: loads `/pos/tables`, opens table order, and syncs current POS cart as table draft when online.
  - `SyncStatusScreen`: failed offline order details with coupon snapshot/server reason, retry, and guarded clear.

### Implemented: Reports Remaining Depth

- Web source: `Reports/Saved/SavedReports.tsx`, `Reports/list/index.tsx`.
- Mobile implementation:
  - `SavedReportsScreen`: list/run/delete saved reports with confirmation and stored filters when mapped.
  - `reportsAPI.savedDelete`.
  - `LegacyReportsScreen`: added the web `comprehensive` legacy tab.
- Native export remains disabled on iOS/Android because the project lacks file save/share dependencies; the UI states this instead of faking export.

### Implemented: Kitchen Ticket Preview

- Web source: `KitchenTicketPrint.tsx`.
- Mobile implementation: `KitchenTicketPreviewScreen`.
- Route wiring: `MoreStack`, navigation types, links from kitchen order and print jobs.
- Print behavior: uses local kitchen printer profiles and print queue; no fake success when profile/device printing fails.

### Explicit Decisions

- Driver settlement create remains intentionally web-only with rich Arabic blocked state because it reconciles multiple deliveries with a vault cash deposit.
- Roles remain rich read-only for role definition CRUD because the available mobile/admin API exposes role list and user role assignment, not role create/update/delete.
- Tenant settings now support safe primary theme color edit; broader tenant settings/logo remain web/admin scope.

### Validation So Far

- `npm run typecheck`: PASS after Pass 2 implementation fixes.

## 2026-05-23 Critical POS Rebuild

### Implemented: Tablet POS Workspace

- Actual rendered path confirmed: `POSTab` -> `POSStack` -> `POSScreen` -> `PosTabletScreen`.
- Root cause fixed: POS tablet components were using `rootRtl` as a direction helper even though it also adds `flex: 1`.
- `PosTabletSplit` now forces physical LTR pane order so the cart stays on the left and catalog on the right while pane content remains RTL.
- `PosFlexGrid` no longer gives every row `flex: 1`, removing the huge category/product whitespace.
- `PosTabletTopBar` no longer stretches vertically and now exposes visible `الطاولات`, held-cart, save-cart, and exit actions.

### Implemented: Cart/Catalog Flow

- `PosOrderPanel` rebuilt as a cashier order panel with branch/shift/order type/table/customer context, item count, variant/modifier lines, line totals, discount/note indicators, 44px quantity controls, totals, split paid/remaining, held cart actions, kitchen print, clear, and sticky checkout.
- `PosCatalogPanel` now has search, scan/search icon, category title/count/breadcrumb, `الخروج من التصنيف`, table entry, dense categories, and denser product cards.
- Search from category root now shows products immediately; empty search says `لا توجد منتجات مطابقة`.

### Implemented: Tables/Checkout/Offline/Print

- `PosTablesSheet` now shows halls, table status filters, selected table state, active order summary, choose-only action, online cart draft sync, and safe navigation to table order/settlement.
- `POSStack` now registers `WaiterPos` so table order actions do not navigate to a missing route.
- `POSScreen` now tracks selected table context, sends `dining_table_id` on checkout, and blocks table checkout offline with an explicit reason.
- `PosCheckoutSheet` shows dine-in table context, blocks unverified/insufficient wallet payment, keeps loyalty/gift-card/coupon safety, and split payment remains vault-validated.
- POS kitchen printing now uses the selected table name where available and missing profile says `لم يتم إعداد طابعة.`
- Offline saved order message standardized to `تم حفظ الطلب محلياً وسيتم مزامنته عند عودة الاتصال`.

### Validation So Far

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 errors; existing warnings remain.
- `npx expo export --platform web`: PASS.
- `npm run web -- --port 19006`: PASS smoke. Browser reached login after fixing web secure-storage fallback; authenticated POS screenshot still requires valid credentials/session data.

## 2026-05-24 Physical Tablet POS Follow-up

### Implemented: Cart And Catalog Polish From Real Screenshot

- `PosOrderPanel`: reworked cart line composition so product title/options are separated from line total and quantity controls. This prevents the product name from being squeezed or hidden on the left cart panel.
- `POSScreen`: computes a cart quantity map by `product_id` and passes it into tablet and phone catalog panels.
- `PosCatalogPanel`: shows an `×N` badge on the product image and `في السلة: N` in the stock row when the product is already in the current cart.

### Implemented: Tenant Theme Color Runtime

- `colors.ts`: `getColors()` now accepts tenant `primary_hex` and derives foreground, soft fills, borders, accent, tab active color, ring and card glow.
- `themeStore`: persists and hydrates tenant primary color.
- `authStore`: refreshes tenant theme after bootstrap/login and clears it on logout.
- `TenantSettingsScreen`: applies saved tenant primary color immediately after loading or saving.
- `App.tsx`, `useColors`, and `AppBadge`: now use tenant-aware colors across navigation, badges and POS controls.

### Implemented: Options/Split/Customer Sheet Stability

- `ModifierPickerSheet`: removed nested `FlatList` from inside `AppBottomSheet`, reset selections per product open, and rebuilt option choices as touch-friendly selectable cards.
- `SplitPaymentSheet`: removed nested `FlatList` from the bottom sheet and kept split lines as normal sheet content.
- `POSScreen` customer selector: removed nested `FlatList` from the customer bottom sheet.
- `AppBottomSheet`: constrains tablet sheet width on `>=900px` screens so option/payment flows do not stretch across the whole tablet.

### Validation

- `npm run typecheck`: PASS.
- `npm run lint`: PASS, 0 errors; 45 warnings remain.
- `npx expo export --platform web`: PASS.
- `npm run web -- --port 19006`: PASS smoke. Browser reached login at 1280x720 with 0 console errors; authenticated POS screenshot still requires real cashier credentials/session data.
