# Navigation Parity Matrix

Source of truth inspected: `front/src/Layouts/buildSidebarMenu.ts`, `front/src/Routes/index.tsx`, nested route files, target page folders, and matching `front/src/api/*` clients.

Mobile implementation (native UX, not web header clone):

- **Top bar** (`Navbar.tsx`): menu, branch chip, sync/offline chip, notifications, optional search → command palette, profile sheet. No web quick-nav shortcuts.
- **Bottom tabs** (`AppTabBar.tsx`): الرئيسية / نقطة البيع / المنتجات / المبيعات / المزيد — pulse + active dot.
- **Drawer** (`Sidebar.tsx`): full `buildSidebarMenu.ts` tree, filter search, recent routes (`recentRoutes.ts`), command palette entry, profile/settings/theme/logout footer.
- **More hub** (`moreModuleHub.ts` + `MoreScreen.tsx`): eight sections (عمليات، مطعم، مخزون، مشتريات، مالية، تسويق، تقارير، إدارة) as 2-col (3-col tablet) cards; toolbar links to drawer + command palette.
- **Command palette** (`CommandPalette.tsx` + `navCatalog.ts`): flatten sidebar leaves, Arabic search, permission-aware catalog from same menu builder.

Unimplemented web-only paths are not hidden: they open `ParityModuleScreen` with Arabic reason and read-only data when API exists.

| Web Sidebar Item | Web Route | Permission/Feature | Mobile Route | Status | Notes |
|------------------|----------|--------------------|-------------|--------|------|
| الرئيسية | `/` | none | `DashboardTab` | Complete | Dashboard cards, active shift, low stock, recent sales. |
| نقطة البيع | group | feature `pos` | Drawer group | Complete | Same module order as web. |
| شاشة البيع | `/pos` | `process_sales`, branch only, feature `pos` | `POSTab/POSHome` | Complete | Catalog, categories, modifiers, cart, wallet, coupons, manual discount, split payment, active shift, checkout review. |
| النادل | `/waiter` | `process_sales` or `manage_dining`, branch only | `ParityModule:/waiter` | Partial | Read-only/table context fallback; full waiter workflow remains web-first. |
| المبيعات | `/sales` | `process_sales` | `SalesTab/SalesHome` | Complete | Sales list/detail/full refund/partial refund entry. |
| مبيعات المنتجات | `/sales/products` | `process_sales` | `ParityModule:/sales/products` | Partial | Read-only report fallback. |
| البيع الآجل | `/sales/layaway` | `process_sales` | `ParityModule:/sales/layaway` | Partial | List/read-only; installment payment is deferred as financial. |
| مرتجعات المبيعات | `/sales/returns` | `void_receipt` | `MoreTab/Refunds` | Complete | Returns list plus guarded refund from sale detail. |
| المصروفات | `/expenses` | `process_sales` or `manage_expenses` | `MoreTab/Expenses` | Complete | List/create guarded by confirmation and backend errors. |
| المطعم والصالات | group | none | Drawer group | Complete | Same grouping as web. |
| القاعات والطاولات | `/dining-halls` | `manage_dining`, branch only | `MoreTab/Dining` | Complete | Halls/tables, active order, merge/transfer/settle/release with confirmations. |
| العملاء | group | none | Drawer group | Complete | Same grouping as web. |
| العملاء | `/customers` | `manage_customers` or `process_sales` | `MoreTab/Customers` | Complete | List/detail/customer data and search. |
| المخزون | group | feature `inventory` | Drawer group | Complete | Same grouping/order as web. |
| المنتجات | `/products` | `manage_products`, feature `inventory` | `ProductsTab/ProductsHome` | Complete | List/detail/search/cards. |
| التصنيفات | `/categories` | `manage_categories`, feature `inventory` | `ProductsTab/Categories` | Complete | List/search/cards. |
| نظرة عامة على المخزون | `/inventory` | `manage_inventory`, feature `inventory` | `MoreTab/Inventory` | Complete | Balances, low stock, expiry and warehouse overview. |
| أرصدة المخازن | `/inventory/balances` | `manage_inventory`, feature `inventory` | `ParityModule:/inventory/balances` | Complete | Read-only card list from API. |
| المخازن | `/inventory/warehouses` | `manage_inventory`, feature `inventory` | `ParityModule:/inventory/warehouses` | Partial | Read-only; create/edit deferred. |
| حركات المخزون | `/inventory/movements` | `manage_inventory`, feature `inventory` | `ParityModule:/inventory/movements` | Complete | Read-only movement list. |
| قواعد إعادة الطلب | `/inventory/reorder-rules` | `manage_inventory`, feature `inventory` | `ParityModule:/inventory/reorder-rules` | Partial | Read-only; edits deferred. |
| طلبات الشراء الداخلية | `/inventory/requisitions` | `manage_inventory`, feature `inventory` | `ParityModule:/inventory/requisitions` | Partial | Read-only; approval/create deferred. |
| الجرد | `/inventory/stock-counts` | `manage_inventory`, feature `inventory` | `ParityModule:/inventory/stock-counts` | Partial | Read-only; posting disabled until full count workflow exists. |
| تحويل مخزني | `/inventory/transfers` | `manage_inventory`, feature `inventory` | `MoreTab/StockTransfer` | Complete | Create guarded by confirmation and backend errors. |
| تسوية مخزنية | `/inventory/adjustments` | `manage_inventory`, feature `inventory` | `MoreTab/StockAdjustment` | Complete | Create/post guarded by confirmation and backend errors. |
| المشتريات والموردين | group | feature `purchases` | Drawer group | Complete | Same grouping/order as web. |
| فواتير الشراء | `/purchases` | `manage_purchases`, feature `purchases` | `MoreTab/Purchases` | Complete | List/detail/create guarded. |
| مرتجعات الشراء | `/purchases/returns` | `manage_purchases`, feature `purchases` | `ParityModule:/purchases/returns` | Partial | Read-only list; create from purchase detail when items are clear. |
| موردي المشتريات | `/purchases/suppliers` | `manage_purchases`, feature `purchases` | `ParityModule:/purchases/suppliers` | Partial | Read-only fallback; supplier master screen is complete separately. |
| الموردون | `/suppliers` | `manage_suppliers` | `MoreTab/Suppliers` | Complete | List/detail/statement and guarded settlement. |
| دفعات الموردين | `/supplier-payments` | `manage_supplier_payments` | `ParityModule:/supplier-payments` | Partial | Read-only list; create remains guarded through supplier context. |
| التوصيل | group | none | Drawer group | Complete | Same grouping/order as web. |
| طلبات التوصيل | `/delivery` | `process_sales` or `manage_deliveries` | `MoreTab/Delivery` | Complete | Delivery list/status cards. |
| السائقون | `/drivers` | `manage_drivers` | `ParityModule:/drivers` | Partial | Read-only list; create/edit deferred. |
| مناطق التوصيل | `/delivery-zones` | `manage_deliveries` | `ParityModule:/delivery-zones` | Partial | Read-only list. |
| تسويات السائقين | `/driver-settlements` | delivery finance permissions | `ParityModule:/driver-settlements` | Partial | Read-only; settlement execution disabled. |
| مالية التوصيل | `/delivery-finance` | delivery finance permissions | `ParityModule:/delivery-finance` | Partial | Read-only dashboard. |
| التزامات التوصيل | `/delivery-finance/liabilities` | delivery finance permissions | `ParityModule:/delivery-finance/liabilities` | Partial | Read-only. |
| تسويات المالية | `/delivery-finance/settlements` | delivery finance permissions | `ParityModule:/delivery-finance/settlements` | Partial | Read-only. |
| تنبيهات المالية | `/delivery-finance/alerts` | delivery finance permissions | `ParityModule:/delivery-finance/alerts` | Partial | Read-only. |
| المطبخ | group | none | Drawer group | Complete | Same grouping/order as web. |
| شاشة المطبخ | `/kitchen` | `view_kitchen` or `manage_kitchen`, branch only | `MoreTab/Kitchen` | Complete | Orders, filters, detail, status updates. |
| طوابير الطباعة | `/kitchen/print-jobs` | `view_kitchen` or `manage_kitchen`, branch only | `ParityModule:/kitchen/print-jobs` | Partial | Read-only; printer management remains web. |
| محطات شاشة المطبخ | `/kitchen/stations` | `manage_kitchen`, branch only | `ParityModule:/kitchen/stations` | Partial | Read-only. |
| الورديات والخزن | group | none | Drawer group | Complete | Same grouping/order as web. |
| الورديات | `/shifts` | shift/process/admin permissions | `MoreTab/ShiftManagement` | Complete | Current/list/open/close guarded. |
| الخزن | `/vaults` | admin/open/process permissions | `MoreTab/Vaults` | Complete | Vaults plus guarded deposit/withdraw. |
| حركات الخزن | `/vaults/transactions` | `manage_treasuries` | `ParityModule:/vaults/transactions` | Partial | Read-only financial transaction list. |
| التسويق | group | `manage_promotions` or `manage_coupons` | Drawer group | Complete | Same grouping/order as web. |
| العروض | `/marketing/promotions` | `manage_promotions` | `MoreTab/Promotions` | Complete | List/detail cards. |
| الكوبونات | `/marketing/coupons` | `manage_coupons`, feature `coupons` | `MoreTab/Coupons` | Complete | List/detail and POS validation. |
| التقارير | group | `view_reports`, feature `reports` | Drawer group | Complete | Same grouping/order as web. |
| مركز التقارير | `/reports` | `view_reports`, feature `reports` | `MoreTab/Reports` | Complete | Report hub summary. |
| لوحة المبيعات | `/reports/sales/dashboard` | `view_reports`, feature `reports` | `ParityModule:/reports/sales/dashboard` | Complete | Read-only summary. |
| تقرير المرتجعات | `/reports/sales/refunds` | `view_reports`, feature `reports` | `ParityModule:/reports/sales/refunds` | Complete | Read-only. |
| مرتجعات بيع بالمنتج | `/reports/sales-returns-by-product` | `view_reports`, feature `reports` | `ParityModule:/reports/sales-returns-by-product` | Partial | Endpoint-dependent read-only. |
| مرتجعات شراء بالمنتج | `/reports/purchase-returns-by-product` | `view_reports`, feature `reports` | `ParityModule:/reports/purchase-returns-by-product` | Partial | Endpoint-dependent read-only. |
| تقرير الضرائب | `/reports/sales/tax` | `view_reports`, feature `reports` | `ParityModule:/reports/sales/tax` | Complete | Read-only. |
| تقرير البيع الآجل | `/reports/sales/layaway` | `view_reports`, feature `reports` | `ParityModule:/reports/sales/layaway` | Partial | Endpoint-dependent read-only. |
| مبيعات بالساعة | `/reports/sales/hourly` | `view_reports`, feature `reports` | `ParityModule:/reports/sales/hourly` | Partial | Endpoint-dependent read-only. |
| الخزائن | `/reports/treasury` | `view_reports`, features `reports`,`advanced_reports` | `ParityModule:/reports/treasury` | Complete | Read-only. |
| تقرير المصروفات | `/reports/expenses` | `view_reports`, features `reports`,`advanced_reports` | `ParityModule:/reports/expenses` | Complete | Read-only. |
| تقييم المخزون | `/reports/inventory/valuation` | `view_reports`, feature `reports` | `ParityModule:/reports/inventory/valuation` | Complete | Read-only. |
| حركات المخزون | `/reports/inventory/movements` | `view_reports`, feature `reports` | `ParityModule:/reports/inventory/movements` | Complete | Read-only. |
| تقرير الصلاحية | `/reports/inventory/expiry` | `view_reports`, feature `reports` | `ParityModule:/reports/inventory/expiry` | Complete | Read-only. |
| أعمار ديون العملاء | `/reports/customers/aging` | `view_reports`, feature `reports` | `ParityModule:/reports/customers/aging` | Complete | Read-only. |
| أعمار الموردين | `/reports/suppliers/aging` | `view_reports`, feature `reports` | `ParityModule:/reports/suppliers/aging` | Complete | Read-only. |
| تقرير الكوبونات | `/reports/marketing/coupons` | `view_reports`, feature `reports` | `ParityModule:/reports/marketing/coupons` | Complete | Read-only. |
| تقرير العروض | `/reports/marketing/promotions` | `view_reports`, feature `reports` | `ParityModule:/reports/marketing/promotions` | Partial | Endpoint-dependent read-only. |
| تقرير بطاقات الهدايا | `/reports/gift-cards` | `view_reports`, feature `reports` | `ParityModule:/reports/gift-cards` | Partial | Endpoint-dependent read-only. |
| تقرير المطاعم | `/reports/dining` | `view_reports`, feature `reports` | `ParityModule:/reports/dining` | Complete | Read-only. |
| تقرير التوصيل | `/reports/delivery` | `view_reports`, feature `reports` | `ParityModule:/reports/delivery` | Complete | Read-only. |
| أداء الورديات | `/reports/shifts` | `view_reports`, features `reports`,`advanced_reports` | `ParityModule:/reports/shifts` | Complete | Read-only. |
| التقارير المحفوظة | `/reports/saved` | `view_reports`, feature `reports` | `ParityModule:/reports/saved` | Partial | Endpoint-dependent read-only. |
| التقارير الكلاسيكية | `/reports/legacy` | `view_reports`, feature `reports` | `ParityModule:/reports/legacy` | Partial | Read-only fallback. |
| الإعدادات والإدارة | group | none | Drawer group | Complete | Same grouping/order as web. |
| الإعدادات | `/settings` | admin/settings permissions | `MoreTab/Settings` | Partial | Profile, branch switch, sync, user/settings links; deep settings tabs remain web. |
| الفروع | `/branches` | `manage_branches`, global only, feature `branches` | `ParityModule:/branches` | Partial | Read-only; branch edit remains web. |
| الموظفون | `/employees` | `manage_users` | `MoreTab/Users` | Complete | Users list/read-only role display. |
| المدفوعات | `/payments` | `manage_treasuries` | `ParityModule:/payments` | Partial | Read-only; payment creation disabled. |
| بطاقات الهدايا | `/gift-cards` | `manage_gift_cards` | `MoreTab/GiftCards` | Complete | List/cards. |
| سجل النشاط | `/activity-logs` | `view_activity_logs` | `ParityModule:/activity-logs` | Complete | Read-only. |
| النسخ الاحتياطي | `/backup` | `manage_settings`, global only | `ParityModule:/backup` | Disabled with reason | Backup is admin/global and intentionally web-only. |
