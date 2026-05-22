# Madar ERP Mobile — Implementation Report

**Version:** 1.0.0  
**Framework:** Expo SDK (React Native)  
**Date:** May 2026

---

## Reports rebuild (May 2026)

Mobile reports were rebuilt to match `front/src/pages/Reports` and `front/src/api/reports.ts`:

- Replaced placeholder dashboard with **مركز التقارير** and 21 wired report screens
- Each report uses the same API endpoint and core filters as web
- Row data rendered as RTL cards; tablet uses wider centered layout (max 1200px)
- Export/charts: message only (no fake export)

**Validation:** `npm run typecheck` · `npm run lint` · `npx expo export --platform web` — PASS

---

## Visual acceptance pass (May 2026)

Second-pass UI work focused on **rendered screens**, not tokens-only changes. See `docs/VISUAL_ACCEPTANCE_REPORT.md` for per-screen PASS/FAIL.

| Component / screen | Change summary |
|--------------------|----------------|
| `PremiumBottomNav` | Circular active glow, larger POS orb, theme inactive colors |
| `Navbar` | Grouped toolbar, RTL badges, premium profile sheet |
| `DashboardHero` / KPI | Gradient hero band, 4-column KPI on tablet |
| `MoreScreen` | Hub hero, section accents, 3–4 col grid, chevrons |
| `SalesScreen` | `SaleInvoiceCard` invoice layout |
| `PosCatalogPanel` | Product images, card elevation |
| `PosOrderPanel` | Totals panel emphasis |

**Validation:** `npm run typecheck` · `npm run lint` · `npx expo export --platform web` — all pass.

**Status:** READY WITH RISKS (device screenshots pending).

---

## 1. Codebase Statistics

| Metric | Count |
|--------|-------|
| Screen files | 57 |
| Component files | 71 |
| API modules | 30 |
| Zustand stores | 5 |
| Custom hooks | 8 |
| Utility modules | 9 |
| Constant modules | 9 |
| Navigation files | 14 |

---

## 2. Screens (57 files)

### Auth (1)
- `LoginScreen.tsx` — Authentication with email/password

### Dashboard (1)
- `DashboardScreen.tsx` — Role-based dashboard with KPIs, charts, and quick actions

### POS (4)
- `POSScreen.tsx` — Main POS with catalog and cart panels
- `CheckoutReviewSheet.tsx` — Checkout flow with payment methods
- `ModifierPickerSheet.tsx` — Product modifier selection
- `SplitPaymentSheet.tsx` — Split payment across methods

### Products (7)
- `ProductsScreen.tsx` — Product list with search and filters
- `ProductDetailScreen.tsx` — Product detail with info, insights
- `ProductFormScreen.tsx` — Create/edit product form
- `CategoriesScreen.tsx` — Category management
- `CategoryFormScreen.tsx` — Create/edit category
- `ProductsReorderScreen.tsx` — Drag-to-reorder products
- `CategoriesReorderScreen.tsx` — Drag-to-reorder categories
- `ProductInsightsScreen.tsx` — Product sales and stock insights

### Sales (2)
- `SalesScreen.tsx` — Sales list with search and date filters
- `SaleDetailScreen.tsx` — Sale detail with line items and payments

### Customers (2)
- `CustomersScreen.tsx` — Customer list with search
- `CustomerDetailScreen.tsx` — Customer detail view

### Inventory (6)
- `InventoryScreen.tsx` — Inventory hub screen
- `InventoryListScreen.tsx` — Balances, movements, reorder rules, requisitions, stock counts, expiry
- `WarehousesScreen.tsx` — Warehouse list
- `WarehouseDetailScreen.tsx` — Warehouse detail
- `WarehouseFormScreen.tsx` — Create/edit warehouse
- `StockAdjustmentScreen.tsx` — Stock adjustment form
- `StockTransferScreen.tsx` — Stock transfer form

### Purchases (4)
- `PurchasesScreen.tsx` — Purchase list
- `PurchaseDetailScreen.tsx` — Purchase detail with line items
- `CreatePurchaseScreen.tsx` — Create purchase form
- `CreatePurchaseReturnScreen.tsx` — Create purchase return

### Suppliers (2)
- `SuppliersScreen.tsx` — Supplier list
- `SupplierDetailScreen.tsx` — Supplier detail

### Kitchen (2)
- `KitchenScreen.tsx` — Kitchen order list with status filters
- `KitchenOrderScreen.tsx` — Kitchen order detail

### Dining (2)
- `DiningScreen.tsx` — Dining halls and tables
- `TableOrderScreen.tsx` — Active table order

### Delivery (1)
- `DeliveryScreen.tsx` — Delivery order list

### Refunds (2)
- `RefundsScreen.tsx` — Refund list
- `PartialRefundScreen.tsx` — Create partial refund

### Expenses (1)
- `ExpensesScreen.tsx` — Expense list with create

### Coupons (1)
- `CouponsScreen.tsx` — Coupon list

### Reports (hub + engine + legacy)
- `ReportsScreen.tsx` — Premium report center (search, groups, recent, permissions)
- `ReportViewerScreen.tsx` / `BaseReportScreen.tsx` — Real API reports via `reportDefinitions`
- `LegacyReportsScreen.tsx` — Classic tabs (comprehensive sales/purchases, products, customers, payments, inventory)
- Shared: `ReportFilterSheet`, `ReportSummaryCards`, `ReportListCards`, `reportScreens.tsx` (thin wrappers)
- Config: `src/reports/reportDefinitions.ts`, `src/utils/reportNormalizers.ts`, `src/hooks/useReport.ts`
- See `docs/MOBILE_REPORTS_PARITY_AUDIT.md`

### Vaults (2)
- `VaultsScreen.tsx` — Vault list
- `ShiftScreen.tsx` — Shift management

### Notifications (1)
- `NotificationsScreen.tsx` — Notification list with unread count

### Settings (6)
- `MoreScreen.tsx` — Module hub with grouped cards
- `SettingsScreen.tsx` — Settings overview
- `ProfileScreen.tsx` — User profile
- `BranchSwitcherScreen.tsx` — Branch selection
- `SyncStatusScreen.tsx` — Offline sync status
- `UsersScreen.tsx` — User management
- `PromotionsScreen.tsx` — Promotions list
- `GiftCardsScreen.tsx` — Gift cards list

### Shared (4)
- `ParityModuleScreen.tsx` — Web-only feature read-only fallback
- `CrudListScreen.tsx` — Generic CRUD list screen
- `DetailScreen.tsx` — Generic detail screen
- `ActionUnavailable.tsx` — Action unavailable placeholder

---

## 3. Components (71 files)

### UI Primitives (`src/components/ui/` — 20 files)
`AppCard`, `AppButton`, `AppInput`, `AppBadge`, `AppChip`, `AppDivider`, `AppText`, `AppSkeleton`, `AppIconButton`, `AppListCard`, `AppListItem`, `AppSectionHeader`, `AppSegmentedControl`, `AppSelect`, `AppStatCard`, `AppTabs`, `MetricCard`, `ModuleCard`, `ActionCard`, `index.ts`

### Navigation (`src/components/navigation/` — 2 files)
`PremiumBottomNav`, `CommandPalette`

### Layout (`src/components/layout/` — 8 files)
`AppScreen`, `AppHeader`, `AppBottomSheet`, `AppTabBar`, `Sidebar`, `Navbar`, `OfflineBanner`, `RtlProvider`

### Dashboard (`src/components/dashboard/` — 11 files)
`DashboardHero`, `DashboardKpiCard`, `DashboardListCard`, `DashboardQuickActions`, `DashboardScopePill`, `DashboardSection`, `RevenueTrendChart`, `BranchDashboardView`, `CashierDashboardView`, `GlobalDashboardView`, `dashboardStyles`

### POS (`src/components/pos/` — 4 files)
`PosCatalogPanel`, `PosOrderPanel`, `PosTopBar`, `index.ts`

### Products (`src/components/products/` — 12 files)
`ProductsHero`, `ProductListCard`, `ProductDetailHero`, `ProductFiltersPanel`, `ProductFormSection`, `ProductInsightBlock`, `BarcodesEditor`, `OpeningStockEditor`, `UnitsEditor`, `ProductOptionGroupsEditor`, `productUtils`

### Categories (`src/components/categories/` — 3 files)
`CategoriesHero`, `CategoryListCard`, `categoryStyles`

### Inventory (`src/components/inventory/` — 10 files)
`InventoryHero`, `InventoryLineItemCard`, `InventoryListCard`, `InventoryProductSearch`, `WarehouseListCard`, `WarehousesHero`, `inventoryListPresets`, `inventoryRowUtils`, `inventoryUiStyles`

### Feedback (`src/components/feedback/` — 5 files)
`AppEmptyState`, `AppErrorState`, `AppLoadingState`, `ConfirmDialog`, `index.ts`

### Forms (`src/components/forms/` — 3 files)
`FormError`, `ImagePickerField`, `index.ts`

### Lists (`src/components/lists/` — 4 files)
`ListFiltersBar`, `ReorderList`, `ResourceList`, `index.ts`

### Cards (`src/components/cards/` — 2 files)
`ModuleCard`, `index.ts`

---

## 4. API Modules (30 files)

`auth`, `branches`, `cashMovements`, `categories`, `client`, `coupons`, `customers`, `dashboard`, `deliveries`, `dining`, `expenses`, `formData`, `giftCards`, `index`, `inventory`, `kitchen`, `notifications`, `pos`, `products`, `promotions`, `purchases`, `refunds`, `reports`, `sales`, `settings`, `shifts`, `supplierPayments`, `suppliers`, `vaults`, `wallet`

All API modules go through a centralized HTTP client (`client.ts`) that handles:
- Base URL from `EXPO_PUBLIC_API_URL`
- Auth token injection
- Tenant slug header
- Request/response interceptors
- Error handling

---

## 5. Zustand Stores (5 files)

| Store | File | Purpose |
|-------|------|---------|
| `authStore` | `authStore.ts` | Authentication state, user data, token management |
| `posStore` | `posStore.ts` | POS cart state, line items, modifiers, checkout |
| `branchStore` | `branchStore.ts` | Current branch selection and branch list |
| `themeStore` | `themeStore.ts` | Light/dark theme preference |
| `networkStore` | `networkStore.ts` | Online/offline status monitoring |

---

## 6. Custom Hooks (8 files)

| Hook | File | Purpose |
|------|------|---------|
| `useColors` | `useColors.ts` | Theme-aware color access via `themeStore` |
| `useResponsive` | `useResponsiveColumns.ts` | Breakpoint, columns, isTablet detection |
| `useResponsiveColumns` | `useResponsiveColumns.ts` | Column count based on breakpoint |
| `useListResource` | `useListResource.ts` | Paginated list data fetching with search |
| `useAsyncResource` | `useAsyncResource.ts` | Single resource data fetching |
| `useDebouncedValue` | `useDebouncedValue.ts` | Debounced value for search inputs |
| `usePermissions` | `usePermissions.ts` | Permission checking for feature access |
| `useTabBarBottomInset` | `useTabBarBottomInset.ts` | Safe area inset for bottom tab bar |
| `useInventoryDirectoryAccess` | `useInventoryDirectoryAccess.ts` | Inventory directory feature gate |

---

## 7. Utilities (9 files)

| Utility | File | Purpose |
|---------|------|---------|
| RTL helpers | `rtl.ts` | `chevronForwardIcon`, `backArrowIcon`, `drawerTranslateX`, layout constants |
| Animations | `animations.ts` | Spring-based press, fade, slide, pulse, scale animations |
| Formatting | `format.ts` | Number, date, currency formatting |
| Money parsing | `parseMoney.ts` | Money string parsing and conversion |
| Errors | `errors.ts` | Error message extraction and formatting |
| Media | `media.ts` | Image/media URL helpers |
| Permissions | `permissions.ts` | Permission checking utilities |
| Data | `data.ts` | Data transformation utilities |
| Dashboard greeting | `dashboardGreeting.ts` | Time-based greeting message |

---

## 8. Constants (9 files)

| Constant | File | Purpose |
|----------|------|---------|
| Colors | `colors.ts` | 62 color tokens, light/dark themes |
| Fonts | `fonts.ts` | Font family definitions |
| Layout | `layout.ts` | RTL layout constants, text alignment, flex helpers |
| Modules | `modules.ts` | Module definitions with status, permissions, routes |
| Responsive | `responsive.ts` | Breakpoints, columns, device info |
| Sidebar icons | `sidebarIcons.ts` | Web-to-mobile icon mapping |
| Spacing | `spacing.ts` | Spacing scale, radius scale, shadow system |
| Tab bar | `tabBar.ts` | Bottom nav dimensions and positioning |
| Typography | `typography.ts` | Font size scale |

---

## 9. Services

| Service | Directory | Purpose |
|---------|-----------|---------|
| Auth | `services/auth/` | Authentication flow |
| Navigation | `services/navigation/` | Navigation helpers |
| Offline | `services/offline/` | Offline queue and storage |
| Storage | `services/storage/` | Local storage abstraction |
| Sync | `services/sync/` | Offline-to-online sync engine |

---

## 10. Navigation (14 files)

| File | Purpose |
|------|---------|
| `RootNavigator.tsx` | Root navigator switching between auth and main |
| `AuthNavigator.tsx` | Login flow navigator |
| `MainTabs.tsx` | Bottom tab navigator (5 tabs) |
| `ProductsStack.tsx` | Products screen stack |
| `POSStack.tsx` | POS screen stack |
| `SalesStack.tsx` | Sales screen stack |
| `MoreStack.tsx` | All other module screens |
| `buildSidebarMenu.ts` | Builds sidebar menu from web config |
| `sidebarNavigation.ts` | Sidebar navigation actions |
| `sidebarNavMap.ts` | Web route to mobile screen mapping |
| `navCatalog.ts` | Flattened navigation catalog for search |
| `moreModuleHub.ts` | Module hub configuration for More screen |
| `NavShellContext.tsx` | Navigation shell context provider |
| `rtlScreenOptions.ts` | RTL-aware screen options |

---

## 11. Key Design Decisions

### RTL-First Design
- All text uses `textStart`/`textLtr` from layout constants
- `I18nManager.forceRTL(true)` on bootstrap
- Icons use direction-aware functions (`chevronForwardIcon`, `backArrowIcon`)
- Drawer slides from physical right edge
- Numbers and currency remain LTR-readable via `textLtr`

### Offline Support
- Sync service (`services/sync/`) manages offline queue
- Local storage (`services/storage/`) persists data
- Network store (`networkStore`) monitors connectivity
- Offline banner (`OfflineBanner`) shows status
- Sync status screen for detailed sync information

### Theme Support
- Light and dark themes via `themeStore`
- 62 color tokens covering all UI needs
- `useColors()` hook for theme-aware components
- No hardcoded colors in component code

### Type Safety
- Full TypeScript coverage
- Navigation types defined in `src/types/navigation.ts`
- API response types in API modules
- Component prop types for all components

### Performance
- All animations use `useNativeDriver: true`
- Memoized computations via `useMemo` in hooks
- Debounced search inputs via `useDebouncedValue`
- FlatList with proper `keyExtractor` for list virtualization
- Skeleton loading during data fetches
