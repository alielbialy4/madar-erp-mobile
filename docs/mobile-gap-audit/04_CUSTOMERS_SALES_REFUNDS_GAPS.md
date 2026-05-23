# Customers, Sales, and Refunds Gaps

## Customers

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Customer list | `/customers` | `customersAPI` | Complete | `CustomersScreen` | — | P3 | |
| Search / filters | list | query | Partial | Search NEEDS VERIFICATION | Missing filter | P2 | |
| Customer detail profile | `/customers/:id` | `GET` | Partial | `CustomerDetailScreen` | Weak UI/UX | P2 | Read-only fields |
| Create customer | form | `POST` | Complete | Sheet on list | — | P3 | |
| Edit customer | profile edit | `PUT` | Missing | — | Missing action | P1 | |
| Phone normalization | web helpers | — | NEEDS VERIFICATION | — | Missing validation | P2 | |
| Addresses CRUD | profile | addresses API | Read-only | Detail lists addresses | Missing action | P1 | |
| Wallet top-up/adjust | profile | wallet | Missing | Display only | Missing action | P1 | |
| Loyalty adjust | profile | — | Missing | Display points | Missing action | P2 | |
| Recent sales on profile | profile | sales | Missing | — | Missing screen | P2 | |

## Sales

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Sales list | `/sales` | `salesAPI.list` | Complete | `SalesScreen` | Partial | P2 | Date/status filters |
| Sale detail | `/sales/:id` | `GET` | Complete | `SaleDetailScreen` | — | P3 | |
| Payments breakdown | details | — | Partial | Fields on detail | Weak UI/UX | P2 | |
| Receipt / reprint | details | `salesAPI.print` | Partial | Button calls print | Missing print support | P1 | Depends on print stack |
| Full refund from detail | actions | `salesAPI.refund` | Complete | Full refund button | — | P3 | |
| Partial refund | returns form | refunds API | Partial | `PartialRefundScreen` | Missing modal | P2 | Web dedicated form |
| Sales by product | `/sales/products` | report/sales | Read-only | `ParityModule` | Missing screen | P1 | |
| Layaway list | `/sales/layaway` | `layawayAPI` | Read-only | `ParityModule` | Missing action | P1 | No payment collection |
| Status filters | list | — | Partial | NEEDS VERIFICATION | Missing filter | P2 | |
| Export | list | — | Missing | — | Missing action | P3 | |

## Refunds

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Refunds list | `/sales/returns` | refunds | Partial | `RefundsScreen` CrudList | Weak UI/UX | P2 | |
| Create refund (standalone) | `/sales/returns/create` | `POST` | Partial | `PartialRefundScreen` only | Missing screen | P1 | |
| Refund to wallet | form option | payload | NEEDS VERIFICATION | — | Missing action | P1 | |
| Stock restock flag | form | — | NEEDS VERIFICATION | — | Missing validation | P2 | |
| Refund receipt print | form | print | Missing | — | Missing print support | P2 | |
| Link to refund reports | UI link | `/reports/sales/refunds` | Partial | Reports hub broken nav | Wrong UX | P1 | |

## Files

- Web: `front/src/pages/Customers/`, `Sales/`, `front/src/Routes/customers.tsx`, `sales.tsx`
- Mobile: `madar-erp-mobile/src/screens/customers/`, `sales/`, `refunds/`

---

## Lockdown Pass Update — 2026-05-23

- Added dedicated `SalesByProductScreen` for `/sales/products` with date filter, search, sale-detail jump, and confirmed full refund.
- Added dedicated `LayawayScreen` plus `layawayAPI` for `/sales/layaway` list, schedule, plan payment, and installment payment.
- Customer detail now supports basic edit and wallet ledger/deposit/withdraw with shift gate and confirmation.
- Remaining: standalone sales return create lookup flow, customer phone CRUD, advanced address CRUD, customer sales/delivery tabs, and loyalty ledger.
