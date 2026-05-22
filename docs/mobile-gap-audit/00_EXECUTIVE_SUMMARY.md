# Mobile Gap Audit — Executive Summary

**Audit date:** 2026-05-23  
**Source of truth:** `front/` (web ERP)  
**Target:** `madar-erp-mobile/`  
**Method:** Static code inspection only (no implementation changes).

---

## Route inventory

| Metric | Count | Notes |
|--------|------:|-------|
| Web sidebar leaf links | **70** | From `front/src/Layouts/buildSidebarMenu.ts` |
| Web top-level route mounts | **38** | From `front/src/Routes/index.tsx` (+ nested route files) |
| Web nested leaf routes (est.) | **~45** | Products insights, purchases create/edit, sales returns/create, marketing CRUD, reports children, etc. |
| **Total web navigable routes (est.)** | **~95–110** | Sidebar + detail/CRUD routes not duplicated in sidebar |
| Mobile dedicated screen files | **69** | `madar-erp-mobile/src/screens/**/*.tsx` |
| Mobile `WEB_LINK_TO_MOBILE_NAV` direct maps | **32** | `madar-erp-mobile/src/navigation/sidebarNavMap.ts` |
| Mobile `ParityModule` fallback routes | **35** | Same file, `PARITY_FALLBACKS` |
| Mobile stack screens registered (`MoreStack`) | **38** | `MoreStack.tsx` — **missing `ReportViewer`, `LegacyReports`** |

---

## Mobile status distribution (70 sidebar items)

Classification is per sidebar leaf vs best available mobile implementation (screen, stack, or `ParityModule`).

| Mobile Status | Count | % |
|---------------|------:|--:|
| Complete | 14 | 20% |
| Partial | 38 | 54% |
| Missing | 6 | 9% |
| Read-only | 9 | 13% |
| Placeholder | 2 | 3% |
| Wrong UX / broken nav | 1 | 1% |
| Needs Verification | 0 | — |

**Notes on counts:** Several items are “Partial” but implemented as **read-only** `ParityModule` lists (drivers, delivery finance, stock counts, etc.). “Complete” requires a purpose-built screen with real API workflows matching web, not only a generic list.

---

## Top 20 critical gaps (P0 / P1)

| # | Gap | Severity | Module doc |
|---|-----|----------|------------|
| 1 | Reports hub navigates to `ReportViewer` / `LegacyReports` **not registered** in `MoreStack` | P0 | `11_REPORTS_GAPS.md` |
| 2 | Dedicated **Waiter POS** (`/waiter`) — mobile only opens dining halls reference | P0 | `05_DINING_AND_KITCHEN_GAPS.md` |
| 3 | POS **held carts** (save/restore) — web `HoldCartModal`; mobile absent | P0 | `02_POS_GAPS.md` |
| 4 | POS **loyalty points redemption** at checkout — web `useCartPayment`; mobile shows balance only | P0 | `02_POS_GAPS.md` |
| 5 | POS **gift card payment** — web payment modal; mobile no gift card tender | P0 | `02_POS_GAPS.md` |
| 6 | POS **offline coupon** validate/revalidate — web `validateCouponOffline`; mobile online-only | P1 | `02_POS_GAPS.md`, `13_OFFLINE_AND_PRINTING_GAPS.md` |
| 7 | POS integrated **table view / merge / transfer** in POS shell — web `TablesView`; mobile dining is separate app area | P1 | `02_POS_GAPS.md`, `05_DINING_AND_KITCHEN_GAPS.md` |
| 8 | **Shift summary print** + rich close-shift UX — web `ShiftSummaryModal`; mobile shift close without print parity | P1 | `08_VAULTS_SHIFTS_EXPENSES_GAPS.md`, `13_OFFLINE_AND_PRINTING_GAPS.md` |
| 9 | **Sales layaway** management screen (`/sales/layaway`) — Parity read-only only | P1 | `04_CUSTOMERS_SALES_REFUNDS_GAPS.md` |
| 10 | **Sales returns** create flow from list — web `/sales/returns/create`; mobile list-only + partial refund from sale detail | P1 | `04_CUSTOMERS_SALES_REFUNDS_GAPS.md` |
| 11 | **Supplier statement / aging / settlements** — web supplier module depth; mobile supplier detail basic | P1 | `07_PURCHASES_SUPPLIERS_GAPS.md` |
| 12 | **Purchase edit** (`/purchases/edit/:id`) — web supported; mobile create + detail only | P1 | `07_PURCHASES_SUPPLIERS_GAPS.md` |
| 13 | **Delivery finance** full module (dashboard, liabilities, settlements, alerts, driver detail) — Parity read-only | P1 | `09_DELIVERY_GAPS.md` |
| 14 | **Kitchen print jobs / stations / ticket print route** — Parity or missing | P1 | `05_DINING_AND_KITCHEN_GAPS.md` |
| 15 | **Stock counts / requisitions / reorder rules** create & post workflows — read-only lists | P1 | `06_INVENTORY_GAPS.md` |
| 16 | **Marketing coupon/promotion create-edit** — web full CRUD; mobile list screens | P1 | `10_MARKETING_COUPONS_GIFT_CARDS_GAPS.md` |
| 17 | **Gift cards** create/cancel/POS redeem — list only + no POS | P1 | `10_MARKETING_COUPONS_GIFT_CARDS_GAPS.md` |
| 18 | **Settings** tenant/branches/roles/printers — web tabbed settings; mobile profile-focused | P1 | `12_SETTINGS_USERS_ADMIN_GAPS.md` |
| 19 | **Backup** (`/backup`) — intentionally disabled on mobile | P1 | `12_SETTINGS_USERS_ADMIN_GAPS.md` |
| 20 | **Barcode label print** (`/barcode-print`) — web only | P2 | `03_PRODUCTS_AND_CATEGORIES_GAPS.md` |

---

## Largest missing functionality by module

1. **Reports** — Definitions exist (`reportDefinitions.ts`) but navigation wiring broken; filter/export parity vs web tables incomplete.  
2. **Delivery ecosystem** — Drivers, zones, settlements, finance sub-routes are Parity read-only.  
3. **POS restaurant + payments** — Waiter mode, held carts, gift card, loyalty, in-POS tables.  
4. **Inventory operations** — Stock counts, requisitions, reorder rules lack write flows.  
5. **Admin / settings** — Branches detail, roles, backup, hardware/printer config tied to branch settings on web.

---

## App Store / internal testing readiness

| Verdict | **NOT READY** |
|---------|----------------|

**Why:** Core POS checkout works with catalog, modifiers, split pay, coupons (online), wallet, and offline order queue, but **reports navigation is broken**, **waiter/restaurant POS parity is incomplete**, and many finance/inventory/admin paths are read-only placeholders. Suitable for **limited pilot** (cashier POS + catalog) only after fixing P0 report navigation.

---

## Recommended next phases

1. **Phase 1** — Register `ReportViewer` + `LegacyReports` in `MoreStack`; fix POS held cart, loyalty, gift card payment; shift summary print.  
2. **Phase 2** — Report filters, export, charts parity (`BaseReportScreen` vs web report pages).  
3. **Phase 3** — Inventory write flows (stock count, requisition, reorder).  
4. **Phase 4** — Dining waiter POS, kitchen print jobs, delivery finance.  
5. **Phase 5** — Admin settings, branches, roles, backup policy.  
6. **Phase 6** — Tablet/RTL polish and App Store hardening.

See `16_PRIORITY_ROADMAP.md` for acceptance criteria.

---

## Severity totals (audit line items, all module docs)

| Severity | Count (approx.) |
|----------|----------------:|
| P0 Critical | 28 |
| P1 High | 62 |
| P2 Medium | 74 |
| P3 Low | 41 |
| **Total gaps logged** | **~205** |

---

## Files inspected (primary)

- `front/src/Layouts/buildSidebarMenu.ts`
- `front/src/Routes/*` (index, sales, inventory, purchases, products, customers, suppliers, marketing, pos, reports, settings, backup, barcodePrint)
- `front/src/pages/**` (POS, Products, Sales, Inventory, Purchases, Reports, Settings, Delivery, Kitchen, Dining, etc.)
- `front/src/api/*.ts` (58 modules)
- `madar-erp-mobile/src/navigation/*`
- `madar-erp-mobile/src/screens/**`
- `madar-erp-mobile/src/api/*.ts` (30 modules)
- `madar-erp-mobile/src/services/offline/*`, `printing/*`, `sync/*`
- `madar-erp-mobile/src/reports/reportDefinitions.ts`
- `back/routes/api.php` (spot checks for endpoint names)

---

## Confirmation

- No changes to `back/`, `front/`, or `super_dash/`
- No mobile implementation edits (screens, API, stores)
- Documentation written only under `madar-erp-mobile/docs/mobile-gap-audit/`
