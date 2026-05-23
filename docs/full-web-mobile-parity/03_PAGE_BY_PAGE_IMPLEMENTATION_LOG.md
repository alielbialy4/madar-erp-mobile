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
