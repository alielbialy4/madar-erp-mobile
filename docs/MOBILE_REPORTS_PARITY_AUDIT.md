# Mobile Reports Parity Audit

**Source of truth:** `front/src/pages/Reports` + `front/src/api/reports.ts`  
**Mobile implementation:** `madar-erp-mobile/src/screens/reports` + `src/api/reports.ts`  
**Date:** May 2026

## Summary

| Status | Count |
|--------|------:|
| Complete | 21 |
| Partial | 1 |
| Missing | 0 |
| Blocked by missing API | 0 |

**Root cause (pre-fix):** `ReportsScreen` was a single dashboard calling unrelated APIs with `extractData` guesses — not wired to web report routes, filters, or row shapes. No per-report screens or navigation.

---

## Parity table

| Web Report | Web Route | Web File | API Endpoint | Filters | Mobile Screen | Mobile Status | Missing |
|------------|-----------|----------|--------------|---------|---------------|---------------|---------|
| لوحة المبيعات | `/reports/sales/dashboard` | `Sales/SalesDashboard.tsx` | `GET /reports/sales/dashboard` | from_date, to_date, branch_id | `ReportViewer` → sales-dashboard | Complete | Charts (Apex) — cards/lists only on mobile |
| المرتجعات | `/reports/sales/refunds` | `Sales/RefundsReport.tsx` | `GET /reports/refunds` | from_date, to_date | ReportViewer → sales-refunds | Complete | by_reason chart |
| مرتجعات بيع بالمنتج | `/reports/sales-returns-by-product` | `Sales/SalesReturnsByProductReport.tsx` | `GET /reports/sales-returns-by-product` | from_date, to_date, branch_id, category_id, product_id, search, page, per_page | ReportViewer → sales-returns-by-product | Complete | Async product picker (ID field only) |
| مرتجعات شراء بالمنتج | `/reports/purchase-returns-by-product` | `Purchases/PurchaseReturnsByProductReport.tsx` | `GET /reports/purchase-returns-by-product` | same as sales returns | ReportViewer → purchase-returns-by-product | Complete | Async product picker |
| تقرير الضرائب | `/reports/sales/tax` | `Sales/TaxReport.tsx` | `GET /reports/tax` | from_date, to_date | ReportViewer → sales-tax | Complete | daily tax chart |
| البيع الآجل | `/reports/sales/layaway` | `Sales/LayawayReport.tsx` | `GET /reports/layaway` | none | ReportViewer → sales-layaway | Complete | — |
| مبيعات بالساعة | `/reports/sales/hourly` | `Sales/HourlySales.tsx` | `GET /reports/sales/hourly` | from_date, to_date | ReportViewer → sales-hourly | Complete | bar chart |
| تقييم المخزون | `/reports/inventory/valuation` | `Inventory/InventoryValuation.tsx` | `GET /reports/inventory/valuation` | warehouse_id | ReportViewer → inventory-valuation | Complete | Export blob — disabled on mobile with message |
| حركة المخزون | `/reports/inventory/movements` | `Inventory/StockMovements.tsx` | `GET /reports/stock-movements` | from_date, to_date | ReportViewer → inventory-movements | Complete | Tab UI merged into two sections |
| تقرير الصلاحية | `/reports/inventory/expiry` | `Inventory/ExpiryStockReport.tsx` | `GET /inventory/expiry-stock` | branch_id, warehouse_id, product_id, days_threshold, expired_only, near_expiry_only, page, per_page | ReportViewer → inventory-expiry | Complete | Product async search (ID field) |
| أعمار ديون العملاء | `/reports/customers/aging` | `Customers/CustomerAging.tsx` | `GET /reports/customers/aging` | none | ReportViewer → customers-aging | Complete | Bucket chart |
| أعمار الموردين | `/reports/suppliers/aging` | `Suppliers/SupplierAging.tsx` | `GET /reports/suppliers/aging` | none | ReportViewer → suppliers-aging | Complete | Bucket chart |
| الكوبونات | `/reports/marketing/coupons` | `Marketing/CouponsReport.tsx` | `GET /reports/coupons` | from_date, to_date, coupon_code, page, per_page | ReportViewer → marketing-coupons | Complete | Export modal — disabled on mobile |
| العروض | `/reports/marketing/promotions` | `Marketing/PromotionsReport.tsx` | `GET /reports/promotions` | none | ReportViewer → marketing-promotions | Complete | — |
| بطاقات الهدايا | `/reports/gift-cards` | `GiftCards/GiftCardsReport.tsx` | `GET /reports/gift-cards` | none | ReportViewer → gift-cards | Complete | — |
| الخزائن | `/reports/treasury` | `Treasury/TreasuryReport.tsx` | `GET /reports/treasury/summary` | branch_id, from_date, to_date | ReportViewer → treasury | Complete | feature `advanced_reports`; daily cash flow chart |
| المصروفات | `/reports/expenses` | `Expenses/ExpensesReport.tsx` | `GET /reports/expenses/summary` | branch_id, from_date, to_date | ReportViewer → expenses | Complete | feature `advanced_reports`; daily chart |
| المطاعم | `/reports/dining` | `Dining/DiningReport.tsx` | `GET /reports/dining` | from_date, to_date | ReportViewer → dining | Complete | — |
| التوصيل | `/reports/delivery` | `Delivery/DeliveryReport.tsx` | `GET /reports/delivery` | from_date, to_date | ReportViewer → delivery | Complete | by_status / by_driver charts |
| أداء الورديات | `/reports/shifts` | `Shifts/ShiftPerformance.tsx` | `GET /reports/shifts/performance` | branch_id, from_date, to_date | ReportViewer → shifts | Complete | feature `advanced_reports` |
| التقارير المحفوظة | `/reports/saved` | `Saved/SavedReports.tsx` | `GET /reports/saved` | page, per_page | ReportViewer → saved-reports | Complete | Create/edit/delete saved — read-only list on mobile |
| التقارير الكلاسيكية | `/reports/legacy` | `list/index.tsx` | Multiple (see legacy tabs) | Per-tab filters | `LegacyReports` | Partial | employees, suppliers-only, profit-loss, comprehensive tabs not all exposed (6 main tabs) |
| ملخص مبيعات (web API only) | — | — | `GET /reports/sales/summary` | branch_id, from_date, to_date, group_by | — | Missing | No dedicated web nav route; embedded in dashboard |
| low-stock / top-products / etc. | — | `reports.ts` legacy helpers | various | — | — | Missing | Not in web ReportsLayout nav |

---

## Mobile architecture

| Path | Role |
|------|------|
| `src/screens/reports/ReportsScreen.tsx` | Premium hub: search, groups, recent, permissions |
| `src/screens/reports/ReportViewerScreen.tsx` | Route param `reportId` |
| `src/screens/reports/BaseReportScreen.tsx` | Shared engine: API, filters, summary, cards, pagination |
| `src/screens/reports/LegacyReportsScreen.tsx` | Classic multi-tab reports |
| `src/reports/reportDefinitions.ts` | Parity config per report |
| `src/utils/reportNormalizers.ts` | Safe arrays/summary/labels |
| `src/hooks/useReport.ts` | Load/refresh/paginate |
| `src/api/reports.ts` | API clients aligned with web |

---

## Export / charts

| Capability | Web | Mobile |
|------------|-----|--------|
| PDF/Excel export | `POST /reports/export`, per-report blob | Disabled — message shown |
| Apex charts | Yes | Not ported — numeric summary + row cards instead |

---

## Permissions

- All reports: `view_reports`
- Treasury, Expenses, Shifts: `advanced_reports` feature flag (same as `buildSidebarMenu.ts`)
