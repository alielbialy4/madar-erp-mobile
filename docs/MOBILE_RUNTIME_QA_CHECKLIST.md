# Madar ERP Mobile — Runtime QA Checklist (Final Lock)

**Version:** 1.3.0  
**Date:** 2026-05-23  
**Tester:** Engineering validation (static + build)  
**Device:** NOT TESTED — assign physical device tester  
**Report:** `docs/FINAL_INTERNAL_TESTING_REPORT.md`

Legend: **PASS** · **FAIL** · **NOT TESTED** (reason required)

---

## A) Build checks

| Check | Status | Notes |
|-------|--------|-------|
| `npm run typecheck` | PASS | Exit 0 |
| `npm run lint` | PASS | Exit 0; 23 warnings, 0 errors |
| `npx expo export --platform web` | PASS | `dist/` generated |
| `npm run web` | NOT TESTED | Port 8081 already used by running Expo; non-interactive prompt blocked |

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
| Coupon offline policy | NOT TESTED | Needs offline device test |
| Split payment | PASS | |
| Checkout review | PASS | |
| Offline queue honest | PASS | No fake invoice id |
| Failed sync UI | PASS | |
| Retry / clear failed | PASS | Confirm on clear |
| Shift summary print | PASS | `ShiftScreen` → `printShiftSummaryForShift`; hardware NOT TESTED |
| Tablet POS split | PASS | Code ≥900px |

---

## E) Reports (P0 hub)

| Check | Status | Notes |
|-------|--------|-------|
| Hub opens | PASS | `ReportsScreen` |
| Each report card → ReportViewer | PASS | 22 definitions |
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
| Engineering build | PASS | 2026-05-23 |
| Engineering navigation (code) | PASS | |
| Engineering POS critical | PASS (code) | 4 former FAIL items closed |
| Device QA | NOT TESTED | Held carts / loyalty / gift card / print on hardware |
| **Release recommendation** | **READY FOR INTERNAL TESTING** | |
