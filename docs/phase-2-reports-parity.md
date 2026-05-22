# Phase 2 — Reports Parity (Mobile)

**Status:** `REPORTS READY WITH RISKS`  
**Date:** 2026-05-23  
**Scope:** `madar-erp-mobile/` only (web/back read as reference).

## Summary

Mobile reports now use a single navigation path (`Reports` → `ReportViewer` → `BaseReportScreen`) for all sidebar report routes in `front/src/Routes/reports.tsx`, plus partner reports (`/reports/partner`) and an expanded legacy hub.

| Area | Result |
|------|--------|
| Navigation | `ReportViewer`, `LegacyReports` registered in `MoreStack`; hub + sidebar map aligned |
| API data | `useReport` + `reportsAPI` / `inventoryAPI.expiryStock` / `partnerReportsAPI` |
| Filters | Extended `ReportFilters` + `ReportFilterSheet` (date, branch, warehouse, category, product, customer, supplier, cashier, status, payment, coupon, expiry, per_page) |
| UI | Header subtitle (date range), summary cards, filter chips, card rows, tablet 2-column grid, pull-to-refresh, load more, empty/error/loading |
| Normalizers | `reportNormalizers.ts` — empty arrays, metric defaults, name fallbacks (`غير محدد`) |
| Export | Web-only download via `POST /reports/export`; native shows Arabic blocker |
| Charts | Not ported (web Apex); metrics cards only — documented risk |

## Report route matrix

| Web route | Mobile `ReportId` | Screen |
|-----------|-------------------|--------|
| `/reports/sales/dashboard` | `sales-dashboard` | `ReportViewer` |
| `/reports/sales/refunds` | `sales-refunds` | `ReportViewer` |
| `/reports/sales-returns-by-product` | `sales-returns-by-product` | `ReportViewer` |
| `/reports/purchase-returns-by-product` | `purchase-returns-by-product` | `ReportViewer` |
| `/reports/sales/tax` | `sales-tax` | `ReportViewer` |
| `/reports/sales/layaway` | `sales-layaway` | `ReportViewer` |
| `/reports/sales/hourly` | `sales-hourly` | `ReportViewer` |
| `/reports/treasury` | `treasury` | `ReportViewer` |
| `/reports/expenses` | `expenses` | `ReportViewer` |
| `/reports/inventory/valuation` | `inventory-valuation` | `ReportViewer` |
| `/reports/inventory/movements` | `inventory-movements` | `ReportViewer` |
| `/reports/inventory/expiry` | `inventory-expiry` | `ReportViewer` |
| `/reports/customers/aging` | `customers-aging` | `ReportViewer` |
| `/reports/suppliers/aging` | `suppliers-aging` | `ReportViewer` |
| `/reports/marketing/coupons` | `marketing-coupons` | `ReportViewer` |
| `/reports/marketing/promotions` | `marketing-promotions` | `ReportViewer` |
| `/reports/gift-cards` | `gift-cards` | `ReportViewer` |
| `/reports/dining` | `dining` | `ReportViewer` |
| `/reports/delivery` | `delivery` | `ReportViewer` |
| `/reports/shifts` | `shifts` | `ReportViewer` |
| `/reports/saved` | `saved-reports` | `ReportViewer` |
| `/reports/legacy` | — | `LegacyReports` (9 tabs) |
| `/reports/partner` | `partner-performance` | `ReportViewer` (`view_partner_reports`) |

## Known gaps / risks

1. **Charts** — Web uses Apex charts; mobile uses summary metrics + tables as cards only.
2. **Export on iOS/Android** — Blocked without `expo-file-system` + sharing; Excel/PDF on web export only.
3. **Saved reports** — Read-only list; no create/run/delete (web CRUD).
4. **Legacy hub** — 9 tabs vs web `ReportsList` full tab set (comprehensive report tab still web-only).
5. **Product picker** — Expiry/returns use ID chips or short product list, not full async search UI like web.
6. **Inventory valuation export** — Uses generic export on web; mobile `exportType: inventory` on web only.

## Verification

```bash
cd madar-erp-mobile
npm run typecheck   # pass
npm run lint        # pass (warnings acceptable)
npx expo export --platform web
```

## Key files

- `src/reports/reportDefinitions.ts` — 22 hub reports + partner
- `src/hooks/useReport.ts` — fetch, pagination, metrics
- `src/screens/reports/BaseReportScreen.tsx` — shared UI shell
- `src/screens/reports/LegacyReportsScreen.tsx` — classic tabs
- `src/utils/reportNormalizers.ts` — response shaping
- `src/api/partnerReports.ts` — partner performance API
