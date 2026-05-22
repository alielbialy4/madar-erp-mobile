# Madar ERP Mobile — Navigation Parity Matrix

Maps web sidebar routes (`front/Layouts/buildSidebarMenu.ts`) to mobile navigation targets.

---

## 1. Primary Tab Routes

These routes map directly to bottom tab navigation:

| Web Route | Web Label | Mobile Tab | Mobile Screen |
|-----------|-----------|-----------|---------------|
| `/` | الرئيسية | `DashboardTab` | `DashboardScreen` |
| `/pos` | نقطة البيع | `POSTab` | `POSScreen` |
| `/products` | المنتجات | `ProductsTab` → `ProductsStack` | `ProductsHome` → `ProductsScreen` |
| `/sales` | المبيعات | `SalesTab` → `SalesStack` | `SalesHome` → `SalesScreen` |

### POS Tab Detail

The POS tab opens `POSScreen.tsx` directly. Sub-flows:
- `ModifierPickerSheet` — modifier selection
- `CheckoutReviewSheet` — checkout and payment
- `SplitPaymentSheet` — split payment flow

### Products Stack

| Mobile Screen | File |
|---------------|------|
| `ProductsHome` | `ProductsScreen.tsx` |
| `ProductDetail` | `ProductDetailScreen.tsx` |
| `ProductForm` | `ProductFormScreen.tsx` |
| `Categories` | `CategoriesScreen.tsx` |
| `CategoryForm` | `CategoryFormScreen.tsx` |
| `ProductsReorder` | `ProductsReorderScreen.tsx` |
| `CategoriesReorder` | `CategoriesReorderScreen.tsx` |
| `ProductInsights` | `ProductInsightsScreen.tsx` |

### Sales Stack

| Mobile Screen | File |
|---------------|------|
| `SalesHome` | `SalesScreen.tsx` |
| `SaleDetail` | `SaleDetailScreen.tsx` |

---

## 2. More Stack Routes

All other modules are accessed via the More tab (`MoreTab` → `MoreStack`):

### Complete Modules

| Web Route | Web Label | Mobile Screen | Status |
|-----------|-----------|---------------|--------|
| `/customers` | العملاء | `Customers` → `CustomersScreen` | Complete |
| `/customers/:id` | تفاصيل العميل | `CustomerDetail` → `CustomerDetailScreen` | Complete |
| `/expenses` | المصروفات | `Expenses` → `ExpensesScreen` | Complete |
| `/kitchen` | شاشة المطبخ | `Kitchen` → `KitchenScreen` | Complete |
| `/kitchen/:id` | تفاصيل طلب المطبخ | `KitchenOrder` → `KitchenOrderScreen` | Complete |
| `/inventory` | المخزون | `Inventory` → `InventoryScreen` | Complete |
| `/inventory/balances` | أرصدة المخزون | `InventoryList` (preset: balances) | Complete |
| `/inventory/warehouses` | المخازن | `Warehouses` → `WarehousesScreen` | Complete |
| `/inventory/movements` | حركات المخزون | `InventoryList` (preset: movements) | Complete |
| `/inventory/adjustments` | التسويات | `StockAdjustment` → `StockAdjustmentScreen` | Complete |
| `/inventory/transfers` | التحويلات | `StockTransfer` → `StockTransferScreen` | Complete |
| `/purchases` | المشتريات | `Purchases` → `PurchasesScreen` | Complete |
| `/purchases/:id` | تفاصيل الشراء | `PurchaseDetail` → `PurchaseDetailScreen` | Complete |
| `/suppliers` | الموردين | `Suppliers` → `SuppliersScreen` | Complete |
| `/suppliers/:id` | تفاصيل المورد | `SupplierDetail` → `SupplierDetailScreen` | Complete |
| `/marketing/coupons` | الكوبونات | `Coupons` → `CouponsScreen` | Complete |
| `/marketing/promotions` | العروض | `Promotions` → `PromotionsScreen` | Complete |
| `/gift-cards` | بطاقات الهدايا | `GiftCards` → `GiftCardsScreen` | Complete |
| `/reports` | التقارير | `Reports` → `ReportsScreen` | Complete |
| `/notifications` | الإشعارات | `Notifications` → `NotificationsScreen` | Complete |
| `/employees` | المستخدمين | `Users` → `UsersScreen` | Complete |

### Partial Modules

| Web Route | Web Label | Mobile Screen | Status | Note |
|-----------|-----------|---------------|--------|------|
| `/dining-halls` | القاعات والطاولات | `Dining` → `DiningScreen` | Partial | Halls and tables; no waiter POS |
| `/dining-halls/:id` | طلب طاولة | `TableOrder` → `TableOrderScreen` | Partial | Active table order view |
| `/sales/returns` | المرتجعات | `Refunds` → `RefundsScreen` | Partial | List and detail; create from sale detail |
| `/refunds/:id` | مرتجع جزئي | `PartialRefund` → `PartialRefundScreen` | Partial | Create partial refund |
| `/delivery` | التوصيل | `Delivery` → `DeliveryScreen` | Partial | Delivery list; financial details documented |
| `/vaults` | الخزنة | `Vaults` → `VaultsScreen` | Partial | Current shift and vault list |
| `/shifts` | الورديات | `ShiftManagement` → `ShiftScreen` | Partial | View shifts; no financial operations |
| `/settings` | الإعدادات | `Settings` → `SettingsScreen` | Partial | Profile, branch switch, password change |

### Parity Fallback Routes (Web-Only Features)

These routes open `ParityModuleScreen` with a read-only view or disabled message:

| Web Route | Mobile Nav | Status | Note |
|-----------|-----------|--------|------|
| `/waiter` | `ParityModule` | Partial | Waiter experience is web-only; shows halls data as read reference |
| `/sales/products` | `ParityModule` | Partial | Product sales report summary from reports endpoint |
| `/sales/layaway` | `ParityModule` | Partial | Layaway list readable; installment payments deferred |
| `/inventory/reorder-rules` | `ParityModule` | Partial | Reorder rules read-only |
| `/inventory/requisitions` | `ParityModule` | Partial | Requisitions read-only |
| `/inventory/stock-counts` | `ParityModule` | Partial | Stock counts read-only |
| `/purchases/returns` | `ParityModule` | Partial | Purchase returns list readable |
| `/purchases/suppliers` | `ParityModule` | Partial | Purchase suppliers redirected to main Suppliers screen |
| `/supplier-payments` | `ParityModule` | Partial | Supplier payments read-only |
| `/drivers` | `ParityModule` | Partial | Drivers read-only |
| `/delivery-zones` | `ParityModule` | Partial | Delivery zones read-only |
| `/driver-settlements` | `ParityModule` | Partial | Driver settlements read-only |
| `/delivery-finance` | `ParityModule` | Partial | Delivery finance dashboard read-only |
| `/delivery-finance/liabilities` | `ParityModule` | Partial | Delivery liabilities read-only |
| `/delivery-finance/settlements` | `ParityModule` | Partial | Delivery settlements read-only |
| `/delivery-finance/alerts` | `ParityModule` | Partial | Delivery alerts read-only |
| `/kitchen/print-jobs` | `ParityModule` | Partial | Print jobs read-only |
| `/kitchen/stations` | `ParityModule` | Partial | Kitchen stations read-only |
| `/vaults/transactions` | `ParityModule` | Partial | Vault transactions read-only |
| `/branches` | `ParityModule` | Partial | Branches read-only |
| `/payments` | `ParityModule` | Partial | Payments read-only |
| `/backup` | `ParityModule` | Disabled | Backup is admin-only, web-only |
| Various `/reports/*` | `ParityModule` | Complete/Partial | Report sub-routes with read access |

---

## 3. Settings Sub-Routes

| Mobile Screen | File |
|---------------|------|
| `Profile` | `ProfileScreen.tsx` |
| `BranchSwitcher` | `BranchSwitcherScreen.tsx` |
| `SyncStatus` | `SyncStatusScreen.tsx` |
| `Users` | `UsersScreen.tsx` |
| `Promotions` | `PromotionsScreen.tsx` |
| `GiftCards` | `GiftCardsScreen.tsx` |

---

## 4. Navigation Architecture

```
RootNavigator
├── AuthNavigator
│   └── LoginScreen
└── MainTabs (Tab Navigator)
    ├── DashboardTab → DashboardScreen
    ├── ProductsTab → ProductsStack
    │   ├── ProductsHome (ProductsScreen)
    │   ├── ProductDetail
    │   ├── ProductForm
    │   ├── Categories
    │   ├── CategoryForm
    │   ├── ProductsReorder
    │   ├── CategoriesReorder
    │   └── ProductInsights
    ├── POSTab → POSStack
    │   └── POSHome (POSScreen)
    ├── SalesTab → SalesStack
    │   ├── SalesHome (SalesScreen)
    │   └── SaleDetail
    └── MoreTab → MoreStack
        ├── MoreHome (MoreScreen)
        ├── Customers
        ├── CustomerDetail
        ├── Refunds
        ├── PartialRefund
        ├── Dining
        ├── TableOrder
        ├── Kitchen
        ├── KitchenOrder
        ├── Inventory
        ├── InventoryList
        ├── Warehouses
        ├── WarehouseDetail
        ├── WarehouseForm
        ├── StockAdjustment
        ├── StockTransfer
        ├── Purchases
        ├── PurchaseDetail
        ├── CreatePurchase
        ├── CreatePurchaseReturn
        ├── Suppliers
        ├── SupplierDetail
        ├── Expenses
        ├── Coupons
        ├── Promotions
        ├── GiftCards
        ├── Reports
        ├── Notifications
        ├── Delivery
        ├── Vaults
        ├── ShiftManagement
        ├── Settings
        ├── Profile
        ├── BranchSwitcher
        ├── SyncStatus
        ├── Users
        └── ParityModule
```

---

## 5. Sidebar Menu Construction

`buildSidebarMenu.ts` reads the web sidebar configuration and maps each item to a mobile navigation action using `sidebarNavMap.ts`. The mapping logic:

1. Check `WEB_LINK_TO_MOBILE_NAV` for direct mapping
2. If no direct mapping, check `PARITY_FALLBACKS` for read-only/disabled fallback
3. If no fallback, create a generic `ParityModule` entry with disabled status

The sidebar menu is rendered by `Sidebar.tsx` with search capability provided by `navCatalog.ts`.

---

## 6. Sidebar Icons

`sidebarIcons.ts` maps web sidebar icon strings (e.g., `'las la-tachometer-alt'`) to Material Icons (e.g., `'dashboard'`). This ensures visual parity between web and mobile sidebar menus.

The `resolveSidebarIcon(icon?)` function returns the Material Icons glyph name, defaulting to `'folder'` for unknown icons.
