# Routes Parity

## Current Counts

- Web routes recorded in tracker: 105
- Sidebar leaf links reviewed from `front/src/Layouts/buildSidebarMenu.ts`: 70
- Mobile route registrations reviewed: `MainTabs`, `POSStack`, `ProductsStack`, `SalesStack`, `MoreStack`
- Core ParityModule fallbacks removed this pass: `/sales/products`, `/sales/layaway`, `/supplier-payments`, `/vaults/transactions`, `/payments`, `/barcode-print`

## Current Route Risks

| Area | Status | Notes |
|------|--------|-------|
| POS | Needs Device QA | Checkout exists with modifiers, split, coupon, loyalty, gift card, held carts, offline queue. Remaining parity gaps: quick customer create from POS, variant picker, cash movement, in-POS tables, offline coupon conflict/revalidation UI. |
| Customers | Partial | Web profile has phone/address CRUD, wallet deposit/withdraw/history, loyalty ledger, sales/delivery tabs. Mobile detail is still mostly read-only. |
| Refund create | Partial | Sale detail partial refund exists; standalone `/sales/returns/create` sale lookup workflow is not full. |
| Vaults | Partial | Transactions list/detail added; deposit/withdraw exist in vault screen but transfer/reconcile parity needs verification. |
| Shifts | Needs Device QA | Open/close and summary print exist; cash movement/in-POS shift modals not fully matched. |
| Driver settlements | Partial | Read-only/disabled create due vault + multiple delivery settlement risk. |
| Kitchen ticket print | Partial | Print queue/profiles exist; direct mobile ticket preview route is not implemented. |
| Backup | Intentionally Web-only | Dangerous admin operation disabled with mobile explanation. |

## Navigation Changes This Pass

- Added `SalesByProduct`, `Layaway`, `SupplierPayments`, `PaymentsLedger`, `VaultTransactions`, `VaultTransactionDetail`, `DeliveryFinanceDriverDetail`, and `BarcodePrintInfo` to `MoreStack`.
- Updated `WEB_LINK_TO_MOBILE_NAV` so core web routes no longer fall through to `ParityModule`.
- Added direct route mapping for `/notifications`.
- Cleared stale explicit `PARITY_FALLBACKS`; every current web sidebar leaf now has a direct mobile target. `ParityModule` remains only as a generic safety screen for unknown/future links.
