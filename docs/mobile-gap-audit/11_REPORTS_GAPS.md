# Reports Gaps

Web reports: `front/src/Routes/reports.tsx`, `front/src/pages/Reports/`  
Mobile: `reportDefinitions.ts`, `BaseReportScreen.tsx`, `ReportsScreen.tsx`, `api/reports.ts`

**Phase 2 update (2026-05-23):** Navigation P0 fixed. Shared viewer + filters + normalizers shipped. See `docs/phase-2-reports-parity.md`.

## Navigation

| Item | Status | Notes |
|------|--------|-------|
| `ReportViewer` / `LegacyReports` in `MoreStack` | Complete | Registered with typed `MoreStackParamList` |
| Sidebar report links → `ReportViewer` | Complete | `sidebarNavMap.ts` `WEB_REPORT_TO_ID` |
| Partner `/reports/partner` | Complete | `partner-performance` + `view_partner_reports` |
| Dead `reportScreens.tsx` wrappers | Removed | Single `BaseReportScreen` via `reportId` |

---

## Per-report matrix

| Report | Web Route | Mobile Status | Missing vs web | Severity |
|--------|-----------|---------------|----------------|----------|
| Sales dashboard | `/reports/sales/dashboard` | Complete (data) | Charts, drill-down | P2 |
| Refunds report | `/reports/sales/refunds` | Complete (data) | Advanced reason filters | P2 |
| Sales returns by product | `/reports/sales-returns-by-product` | Complete (data) | Async product search UX | P2 |
| Purchase returns by product | `/reports/purchase-returns-by-product` | Complete (data) | Same | P2 |
| Tax report | `/reports/sales/tax` | Complete (data) | By-rate chart | P2 |
| Layaway report | `/reports/sales/layaway` | Complete (data) | Installment drill-down | P2 |
| Hourly sales | `/reports/sales/hourly` | Complete (data) | Bar chart | P2 |
| Treasury | `/reports/treasury` | Complete (data) | Daily cash flow chart | P2 |
| Expenses report | `/reports/expenses` | Complete (data) | Daily chart | P2 |
| Inventory valuation | `/reports/inventory/valuation` | Complete (data) | Export on native | P2 |
| Stock movements | `/reports/inventory/movements` | Complete (data) | Type filter (if API adds) | P2 |
| Expiry report | `/reports/inventory/expiry` | Complete (data) | Full product async picker | P2 |
| Customer aging | `/reports/customers/aging` | Complete (data) | Export | P2 |
| Supplier aging | `/reports/suppliers/aging` | Complete (data) | Export | P2 |
| Coupons report | `/reports/marketing/coupons` | Complete (data) | Export modal | P2 |
| Promotions report | `/reports/marketing/promotions` | Complete (data) | — | P3 |
| Gift cards report | `/reports/gift-cards` | Complete (data) | — | P3 |
| Dining report | `/reports/dining` | Complete (data) | — | P3 |
| Delivery report | `/reports/delivery` | Complete (data) | Driver filter (optional API) | P2 |
| Shift performance | `/reports/shifts` | Complete (data) | Charts | P2 |
| Saved reports | `/reports/saved` | Complete for current web page | Create/edit editor remains web/admin scope | P2 |
| Legacy reports hub | `/reports/legacy` | Complete for endpoints | Charts/export remain lighter than web | P2 |
| Partner reports | `/reports/partner` | Complete (data) | Charts | P2 |
| Reports hub index | `/reports` | Complete | — | — |

---

## Mobile report infrastructure

| Web Feature | Mobile Status | Notes |
|-------------|---------------|-------|
| Filter sheet | Complete | `ReportFilterSheet` + chips |
| Export CSV/PDF | Blocked on native | Web export works; native app lacks file/share dependency and Arabic filename QA |
| Pagination | Complete | `useReport` + load more |
| Branch filter | Complete | Global/branch mode |
| Charts | Missing | Metrics cards only |
| Normalizers | Complete | `reportNormalizers.ts` |

## `reportDefinitions.ts` coverage

22 hub definitions + `partner-performance`; saved reports use `SavedReportsScreen`, legacy hub uses `LegacyReportsScreen`.

## Lockdown Pass 2 Update — 2026-05-23

- Added saved reports list/run/delete screen with delete confirmation and stored-filter handoff to mapped report viewer.
- Added `reportsAPI.savedDelete`.
- Added legacy `comprehensive` tab so every web legacy tab opens and calls a real endpoint.
- Native export/share remains disabled with an Arabic reason until `expo-file-system` / `expo-sharing` or equivalent is added and tested.
