# Navigation and Routes Gaps

Compares `front/src/Layouts/buildSidebarMenu.ts` + `front/src/Routes` vs `madar-erp-mobile/src/navigation` + screens.

---

## Sidebar route matrix

| Web Route | Web Label | Permission/Feature | Mobile Route | Status | Gap | Severity |
|-----------|-----------|-------------------|--------------|--------|-----|----------|
| `/` | الرئيسية | — | `DashboardTab` | Complete | KPI dashboard present | P3 |
| `/pos` | شاشة البيع | `process_sales`, `pos` | `POSTab` → `POSHome` | Partial | Missing held cart, loyalty redeem, gift card pay, in-POS tables | P0 |
| `/waiter` | النادل | `process_sales` + `manage_dining` | `ParityModule` → `/dining-halls` | Partial | No dedicated waiter POS | P0 |
| `/sales` | المبيعات | `process_sales` | `SalesTab` → `SalesHome` | Partial | Filters/export weaker than web list | P2 |
| `/sales/products` | مبيعات المنتجات | `process_sales` | `ParityModule` | Read-only | Report summary only, not sales-by-product UI | P1 |
| `/sales/layaway` | البيع الآجل | `process_sales` | `ParityModule` | Read-only | No installment payment actions | P1 |
| `/sales/returns` | مرتجعات المبيعات | `void_receipt` | `MoreStack` → `Refunds` | Partial | List only; web has create form route | P1 |
| `/expenses` | المصروفات | `manage_expenses` | `Expenses` | Partial | Create exists; edit/attachments/categories parity NEEDS VERIFICATION | P2 |
| `/dining-halls` | القاعات والطاولات | `manage_dining` | `Dining` | Partial | No hall CRUD; table ops on `TableOrder` only | P1 |
| `/customers` | العملاء | `manage_customers` | `Customers` | Partial | Inline create; no full profile edit like web | P2 |
| `/products` | المنتجات | `manage_products` | `ProductsTab` → `ProductsHome` | Partial | Form strong; import/export/barcode print missing | P2 |
| `/categories` | التصنيفات | `manage_categories` | `Categories` | Complete | Reorder + form present | P3 |
| `/inventory` | نظرة عامة | `manage_inventory` | `Inventory` | Partial | Hub vs web dashboard widgets | P2 |
| `/inventory/balances` | أرصدة المخازن | `manage_inventory` | `InventoryList` preset `balances` | Partial | List cards; web table filters | P2 |
| `/inventory/warehouses` | المخازن | `manage_inventory` | `Warehouses` | Complete | CRUD screens exist | P3 |
| `/inventory/movements` | حركات المخزون | `manage_inventory` | `InventoryList` `movements` | Read-only | No movement detail drill-down | P2 |
| `/inventory/reorder-rules` | قواعد إعادة الطلب | `manage_inventory` | `ParityModule` | Read-only | No edit | P1 |
| `/inventory/requisitions` | طلبات الشراء الداخلية | `manage_inventory` | `ParityModule` | Read-only | No create/approve | P1 |
| `/inventory/stock-counts` | الجرد | `manage_inventory` | `ParityModule` | Read-only | No count session workflow | P1 |
| `/inventory/transfers` | تحويل مخزني | `manage_inventory` | `StockTransfer` | Partial | Create screen; web list + detail parity | P2 |
| `/inventory/adjustments` | تسوية مخزنية | `manage_inventory` | `StockAdjustment` | Partial | Create screen; web list parity | P2 |
| `/purchases` | فواتير الشراء | `manage_purchases` | `Purchases` | Partial | Create + detail; no edit route | P1 |
| `/purchases/returns` | مرتجعات الشراء | `manage_purchases` | `ParityModule` | Read-only | Create from purchase detail only | P1 |
| `/purchases/suppliers` | موردي المشتريات | `manage_purchases` | `ParityModule` / `Suppliers` | Partial | Redirected to suppliers list | P2 |
| `/suppliers` | الموردون | `manage_suppliers` | `Suppliers` | Partial | Statement/settlements missing | P1 |
| `/supplier-payments` | دفعات الموردين | `manage_supplier_payments` | `ParityModule` | Read-only | No create from list | P1 |
| `/delivery` | طلبات التوصيل | `manage_deliveries` | `Delivery` | Partial | List/status NEEDS VERIFICATION vs web transitions | P1 |
| `/drivers` | السائقون | `manage_drivers` | `ParityModule` | Read-only | No CRUD | P1 |
| `/delivery-zones` | مناطق التوصيل | `manage_deliveries` | `ParityModule` | Read-only | No zone editor | P1 |
| `/driver-settlements` | تسويات السائقين | delivery finance perms | `ParityModule` | Read-only | No settle action | P1 |
| `/delivery-finance` | مالية التوصيل | delivery finance perms | `ParityModule` | Read-only | No dashboard UX | P1 |
| `/delivery-finance/liabilities` | التزامات التوصيل | delivery finance perms | `ParityModule` | Read-only | — | P1 |
| `/delivery-finance/settlements` | تسويات المالية | delivery finance perms | `ParityModule` | Read-only | — | P1 |
| `/delivery-finance/alerts` | تنبيهات المالية | delivery finance perms | `ParityModule` | Read-only | — | P1 |
| `/kitchen` | شاشة المطبخ | `view_kitchen` | `Kitchen` | Partial | KDS list + order detail; station filter weak | P2 |
| `/kitchen/print-jobs` | طوابير الطباعة | `view_kitchen` | `ParityModule` | Read-only | — | P1 |
| `/kitchen/stations` | محطات KDS | `manage_kitchen` | `ParityModule` | Read-only | — | P1 |
| `/shifts` | الورديات | shift perms | `ShiftManagement` | Partial | Open/close; summary print weak | P1 |
| `/vaults` | الخزن | treasury perms | `Vaults` | Partial | Deposit/withdraw NEEDS VERIFICATION | P2 |
| `/vaults/transactions` | حركات الخزن | `manage_treasuries` | `ParityModule` | Read-only | Web detail route `/vaults/transactions/:id` missing | P2 |
| `/marketing/promotions` | العروض | `manage_promotions` | `Promotions` | Partial | List only | P1 |
| `/marketing/coupons` | الكوبونات | `manage_coupons` | `Coupons` | Partial | List only | P1 |
| `/reports` | مركز التقارير | `view_reports` | `Reports` | Wrong UX | Hub OK; child nav broken (see below) | P0 |
| `/reports/sales/dashboard` | لوحة المبيعات | `view_reports` | `ParityModule` / broken `ReportViewer` | Partial | `BaseReportScreen` exists but not in stack | P0 |
| `/reports/*` (all report children) | various | `view_reports` | Intended `ReportViewer` | Missing | Screen not registered | P0 |
| `/reports/legacy` | التقارير الكلاسيكية | `view_reports` | `LegacyReports` navigate | Missing | Route not in `MoreStackParamList` | P0 |
| `/settings` | الإعدادات | admin perms | `Settings` | Partial | No web settings tabs | P1 |
| `/branches` | الفروع | `manage_branches`, global | `ParityModule` | Read-only | No `BranchDetail` | P1 |
| `/employees` | الموظفون | `manage_users` | `Users` | Partial | List; roles CRUD weak | P1 |
| `/payments` | المدفوعات | `manage_treasuries` | `ParityModule` | Read-only | — | P2 |
| `/gift-cards` | بطاقات الهدايا | `manage_gift_cards` | `GiftCards` | Partial | List; no create/cancel UI | P1 |
| `/activity-logs` | سجل النشاط | `view_activity_logs` | `ParityModule` | Read-only | Acceptable for mobile | P3 |
| `/backup` | النسخ الاحتياطي | `manage_settings`, global | `ParityModule` disabled | Missing | Intentionally web-only | P1 |

---

## Web routes not in sidebar (mobile impact)

| Web Route | Web File/Route | Mobile Status | Gap Type | Severity |
|-----------|----------------|---------------|----------|----------|
| `/notifications` | `pages/Notifications` | `NotificationsScreen` in More stack but **not in sidebar hub** | Missing drawer entry | P2 |
| `/barcode-print` | `Routes/barcodePrint.tsx` | Missing | Missing screen | P2 |
| `/reports/partner` | `PartnerReportsPage` | Missing | Missing module | P2 |
| `/profile` | `user-profile` | `ProfileScreen` | Partial | P3 |
| `/branches/:id` | `BranchDetail` | Missing | Missing detail | P1 |
| `/vaults/transactions/:id` | `VaultTransactionDetails` | Missing | Missing detail | P2 |
| `/kitchen/ticket/:id` | `KitchenTicketPrint` | Missing | Missing print route | P1 |
| `/delivery-finance/drivers/:driverId` | `DriverDetail` | Missing | Missing detail | P2 |
| `/purchases/edit/:id` | `PurchaseForm` edit | Missing | Missing action | P1 |
| `/marketing/coupons/create` | `CouponForm` | Missing | Missing screen | P1 |
| `/sales/returns/create` | `SalesReturnForm` | Partial via `PartialRefund` only | Missing modal flow | P1 |

---

## Mobile-only routes (no direct web equivalent)

| Mobile Route | Notes |
|--------------|-------|
| `SyncStatus` | Offline sync dashboard — web uses POS/sync indicators |
| `PrinterProfiles`, `PrinterProfileForm`, `PrinterDiagnostics`, `PrintQueue` | Mobile-native printing stack |
| `ProductInsights` | Maps to web `/products/:id/insights` (nested, not sidebar) |

---

## Permission / grouping issues

| Issue | Severity |
|-------|----------|
| `buildMobileSidebarMenu` drops items with no `webLinkToNav` unless parity fallback provides nav — backup correctly disabled | P3 |
| Bottom tabs: Dashboard, POS, Products, Sales, More — web has no tab bar; **Categories** only under Products tab, not bottom tab (aligned) | — |
| `More` hub badges `قراءة` for `ParityModule` — correct signaling | P3 |
| Reports `openReport` → undefined navigator route | P0 |

---

## Navigation implementation references

- Web menu: `front/src/Layouts/buildSidebarMenu.ts`
- Web routes: `front/src/Routes/index.tsx`
- Mobile map: `madar-erp-mobile/src/navigation/sidebarNavMap.ts`
- Mobile stacks: `madar-erp-mobile/src/navigation/MoreStack.tsx`, `MainTabs.tsx`

---

## Lockdown Pass Update — 2026-05-23

The current authoritative route matrix is `docs/full-web-mobile-parity/00_MASTER_TRACKER.md`.

Changes since this audit:

- `/sales/products` now maps to `SalesByProduct`.
- `/sales/layaway` now maps to `Layaway`.
- `/supplier-payments` now maps to `SupplierPayments`.
- `/payments` now maps to `PaymentsLedger`.
- `/vaults/transactions` now maps to `VaultTransactions`.
- `/barcode-print` now maps to `BarcodePrintInfo`.
- `/delivery-finance/drivers/:driverId` has `DeliveryFinanceDriverDetail`.
- Current sidebar leaves have direct mobile targets; explicit stale `PARITY_FALLBACKS` were cleared.
