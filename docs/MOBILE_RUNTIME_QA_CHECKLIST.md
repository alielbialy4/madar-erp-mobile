# Madar ERP Mobile — Runtime QA Checklist (Final Lock)

**Version:** 1.5.0 — full web/mobile parity lockdown pass 2  
**Date:** 2026-05-24
**Tester:** Engineering validation (static + build)  
**Device:** NOT TESTED — assign physical device tester  
**Report:** `docs/full-web-mobile-parity/05_FINAL_PARITY_REPORT.md`

Legend: **PASS** · **FAIL** · **NOT TESTED** (reason required)

---

## A) Build checks

| Check | Status | Notes |
|-------|--------|-------|
| `npm run typecheck` | PASS | Exit 0 |
| `npm run lint` | PASS | Exit 0; 45 warnings, 0 errors |
| `npx expo export --platform web` | PASS | `dist/` generated |
| `npm run web -- --port 19006` | PASS | Metro web booted and bundled; browser reached login at 1280x720 with 0 console errors; dev server stopped after smoke |

---

## B) EAS readiness

| Check | Status | Notes |
|-------|--------|-------|
| `app.json` / bundle id | PASS | `com.madar.erp.mobile` |
| Android package | PASS | Same id |
| iOS tablet support | PASS | `supportsTablet: true` |
| `eas.json` profiles | PASS | development / preview / production |
| `.env.example` | PASS | API + tenant + timezone documented |
| No secrets committed | PASS | `.env` gitignored |
| Production API placeholder | PASS | Must replace before real preview build |
| `eas build --profile preview` executed | NOT TESTED | Command documented in FINAL report |

---

## C) Navigation smoke (P0)

| Route | Status | Notes |
|-------|--------|-------|
| Dashboard | PASS | `DashboardTab` registered |
| POS | PASS | `POSTab` → `POSScreen` |
| Products | PASS | `ProductsTab` |
| Sales | PASS | `SalesTab` |
| More | PASS | `MoreTab` |
| Reports | PASS | `MoreStack` |
| ReportViewer | PASS | All 22 report IDs |
| LegacyReports | PASS | Registered |
| Inventory | PASS | |
| Purchases | PASS | |
| Suppliers | PASS | |
| Dining | PASS | |
| Waiter | PASS | `WaiterPos` |
| Kitchen | PASS | |
| Delivery | PASS | |
| Vaults | PASS | |
| Shifts | PASS | `ShiftManagement` |
| Expenses | PASS | |
| Coupons | PASS | |
| Promotions | PASS | |
| Gift Cards | PASS | |
| Settings | PASS | |
| Users | PASS | |
| Branches | PASS | |
| Notifications | PASS | |
| Sales by product | PASS | Added to `MoreStack` this pass |
| Layaway | PASS | Added to `MoreStack` this pass |
| Supplier payments | PASS | Added to `MoreStack` this pass |
| Payments ledger | PASS | Added to `MoreStack` this pass |
| Vault transactions | PASS | Added to `MoreStack` this pass |
| Delivery finance driver detail | PASS | Added to `MoreStack` this pass |
| Barcode print state | PASS | Dedicated disabled/read-only screen |
| Kitchen ticket preview | PASS | Added `KitchenTicketPreviewScreen`; printer hardware NOT TESTED |
| Saved reports management | PASS | List/run/delete; live API NOT TESTED |
| Sync Status | PASS | |
| Printer Profiles | PASS | |
| Print Queue | PASS | |
| Runtime crash on open | NOT TESTED | Needs device + login |

---

## D) POS critical (P0)

| Check | Status | Notes |
|-------|--------|-------|
| Catalog loads | PASS | Code verified |
| Category filter | PASS | |
| Search | PASS | |
| Modifiers | PASS | |
| Cart operations | PASS | |
| Held carts save/restore/delete | PASS | `HoldCartsSheet` + API/local hybrid; device restart NOT TESTED |
| Customer selection | PASS | |
| Wallet payment | PASS | Insufficient balance blocked |
| Loyalty redemption | PASS | Checkout + `submitSale` payload; offline blocked |
| Gift card payment at POS | PASS | Check + post-sale redeem; offline blocked |
| Coupon online | PASS | |
| Coupon offline policy | PASS | Code shows failed coupon/order conflict details; live offline device test NOT TESTED |
| Split payment | PASS | |
| Checkout review | PASS | |
| Offline queue honest | PASS | No fake invoice id |
| Failed sync UI | PASS | Failed order details include coupon/server reason |
| Retry / clear failed | PASS | Confirm on clear |
| Shift summary print | PASS | `ShiftScreen` → `printShiftSummaryForShift`; hardware NOT TESTED |
| Tablet POS split | PASS WITH RISKS | Fullscreen POSTab (≥900px); `PosTabletSplit` cart left / catalog right; catalog/cart polish follow-up applied; physical tablet authenticated QA still NOT TESTED |
| POS pass-2 parity gaps | PASS | Quick customer, variants, cash movement, POS tables bridge, and failed offline conflict UI implemented; device QA NOT TESTED |

---

## E) Reports (P0 hub)

| Check | Status | Notes |
|-------|--------|-------|
| Hub opens | PASS | `ReportsScreen` |
| Each report card → ReportViewer | PASS | 22 definitions |
| Saved reports list/run/delete | PASS | `SavedReportsScreen`; live API NOT TESTED |
| Legacy comprehensive tab | PASS | Added to `LegacyReportsScreen` |
| Filters UI | PASS | `BaseReportScreen` |
| Loading / empty / error | PASS | `useReport` + feedback components |
| Pagination where defined | PASS | Code |
| Live API data | NOT TESTED | Needs backend + device |
| Tablet layout | NOT TESTED | Code PASS; device N/T |

---

## F) Offline (P0)

| Check | Status | Notes |
|-------|--------|-------|
| Queue on offline sale | PASS | |
| No fake server invoice | PASS | |
| Pending count | PASS | |
| Sync on reconnect | PASS | `syncEngine` |
| Failed + retry | PASS | |
| Clear failed confirmation | PASS | |
| Live airplane mode test | NOT TESTED | Device required |

---

## G) Printing (P0)

| Check | Status | Notes |
|-------|--------|-------|
| Profiles screen | PASS | |
| Queue screen | PASS | |
| Receipt job path | PASS | Queue + status |
| Kitchen jobs | PASS | |
| Shift summary from UI | PASS | Button on current shift + history |
| Arabic unsupported reason | PASS | `printerCapabilities` |
| No fake printed success | PASS | Failed status on error |
| Hardware print | NOT TESTED | Device + printer required |

---

## H) Tablet / RTL (P1)

| Check | Status | Notes |
|-------|--------|-------|
| Bottom nav hidden ≥900 | PASS | |
| POS catalog + cart split | PASS | |
| Reports / More columns | PASS | |
| Persistent sidebar | PASS | Code |
| Arabic alignment | PASS | |
| Currency readable | PASS | |
| Bottom sheets | PASS | |
| iPad landscape | NOT TESTED | |
| Dark mode | NOT TESTED | |

---

## Sign-off

| Role | Status | Date |
|------|--------|------|
| Engineering build | PASS | 2026-05-24 |
| Engineering navigation (code) | PASS | |
| Engineering POS critical | PASS | Pass 2 core gaps implemented in code; device QA still NOT TESTED |
| Device QA | NOT TESTED | Held carts / loyalty / gift card / print on hardware |
| **Release recommendation** | **NOT TESTED** | Automated gates must be rerun after Pass 2; physical device QA still required |

---

## I) Critical POS Rebuild Pass - 2026-05-24

| Check | Status | Notes |
|-------|--------|-------|
| Real rendered POS route traced | PASS | `POSTab` -> `POSStack` -> `POSScreen` -> `PosTabletScreen` |
| Root cause documented | PASS | `rootRtl` injected `flex: 1` into POS top bar, split panes, and grid rows |
| Tablet fullscreen shell | PASS | Sidebar/navbar hidden by `isPosTabletFullscreen`; tablet POS uses safe full-height route |
| Cart physically left | PASS | `PosTabletSplit` row is physical LTR; panes keep RTL content |
| Catalog physically right | PASS | Catalog pane flexes to remaining width |
| Category/product whitespace | PASS | `PosFlexGrid` row no longer receives `flex: 1`; denser 3-5 column rules |
| Exit POS action | PASS | Always visible on tablet; confirms when cart has lines |
| Exit category action | PASS | Product/category context only; resets category without leaving POS |
| Cart cashier panel | PASS | Header context, table/customer, line totals, modifiers, 44px controls, sticky footer |
| Held carts | PASS | Save/list/restore/delete exposed from tablet cart/top bar |
| Tables in POS | PASS WITH RISKS | Halls/status filters, select table context, online draft sync; live API not tested |
| Checkout/payment | PASS WITH RISKS | Table `dining_table_id`, wallet/loyalty/gift/coupon safety, split paid/remaining; live payment not tested |
| Offline honesty | PASS | Table/loyalty/gift card unsafe states blocked offline; offline save message is explicit |
| Printing honesty | PASS WITH RISKS | Kitchen print uses real profile/queue and missing profile says `لم يتم إعداد طابعة.`; hardware not tested |
| Phone behavior | PASS | Phone remains catalog/cart tabbed; no forced split |
| Automated validation | PASS WITH RISKS | Typecheck/lint/export pass; browser reached login at 1280x720 with 0 console errors; authenticated POS screenshot still needs credentials/session |

## J) Physical Tablet Screenshot Follow-up - 2026-05-24

| Check | Status | Notes |
|-------|--------|-------|
| Cart product names visible | PASS BY CODE | Cart line title/options split from totals and quantity controls in `PosOrderPanel`; physical tablet retest required |
| Product quantity on catalog cards | PASS BY CODE | POS computes cart quantity map and `PosCatalogPanel` shows `×N` badge plus `في السلة: N` |
| Tenant primary color in POS UI | PASS BY CODE | Tenant `primary_hex` hydrates into `useColors`, nav theme, badges and POS buttons |
| Product options modal nested-list warning | PASS BY CODE | `ModifierPickerSheet` no longer renders `FlatList` inside `AppBottomSheet` |
| Split/customer nested-list warning | PASS BY CODE | `SplitPaymentSheet` and POS customer selector no longer render nested `FlatList` inside the bottom sheet |
| Tablet sheet presentation | PASS BY CODE | `AppBottomSheet` constrains width on >=900px screens |
| Physical screenshot comparison | NOT TESTED | Needs authenticated cashier session on the physical tablet |
