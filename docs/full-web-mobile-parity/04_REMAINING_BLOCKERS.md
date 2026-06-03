# Remaining Blockers

## Critical / High

| Blocker | Route(s) | Status | Exact Reason | Safe Mobile State |
|---------|----------|--------|--------------|-------------------|
| POS device/offline/printer validation | `/pos`, `/sync-status`, printer routes | Needs Device QA | Critical POS rebuild fixed the rendered tablet workspace, cart-left/catalog-right layout, table bridge, checkout safety, held carts, and print honesty. The 2026-05-24 physical screenshot follow-up also fixed cart-line name visibility, in-catalog cart quantities, tenant primary color hydration, and nested-list bottom-sheet warnings. Remaining risk is physical device validation: offline queue/retry under real network toggles, live table draft/settle behavior, and actual receipt/kitchen printer behavior. | Tablet UI is rebuilt and honest; unsafe table/loyalty/gift-card states block offline, print profile absence says `لم يتم إعداد طابعة.`, failed orders show coupon/server reason, retry, and guarded clear. |
| Authenticated POS screenshot | `/pos` | Needs Session QA | Browser smoke reached the login screen at 1280x720 with 0 console errors, but no valid cashier credentials/session were available to capture the live POS tablet workspace after the screenshot follow-up. | Code path is fixed and automated gates pass; capture with a real branch/session before release sign-off. |
| Driver settlement create | `/driver-settlements` | Intentionally Web-only | تسوية السائقين تتطلب ربط مالي متعدد الطلبات والخزنة، وتبقى حالياً من الويب فقط. The backend API exists, but safe mobile create needs multi-delivery selection, branch/vault validation, `delivery_settle` permission, and cash reconciliation review before deposit. | Rich read-only list with Arabic blocked state and finance dashboard link. |
| Shifts hardware print QA | `/shifts`, `/pos` | Needs Device QA | In-POS cash movement is implemented. Shift summary and receipt/kitchen printing still require physical printer validation on iOS/Android. | Shift open/close and summary are available; print is honest about hardware QA. |

## Medium

| Blocker | Route(s) | Status | Exact Reason | Safe Mobile State |
|---------|----------|--------|--------------|-------------------|
| Direct kitchen ticket print hardware | `/kitchen/ticket/:id` | Needs Device QA | Native ticket preview route now exists and sends jobs through local print profiles. Actual output depends on configured network/Bluetooth/AirPrint printer and device build. | Preview loads real ticket data; print result is not faked and errors surface via message/queue. |
| Barcode label print | `/barcode-print` | Implemented This Pass | Exact label layout needs mobile print template and physical printer QA. | Dedicated disabled state added. |
| Saved report create/edit | `/reports/saved` | Intentionally Web-only | Current web page exposes list/delete; create/update APIs exist but no current mobile-safe editor or web page flow was required for this route. Mobile implements list/run/delete. | Saved report rows can run mapped report with stored filters or delete with confirmation. |
| Native export/share parity | reports (`exportSupported`) | Needs Device QA | **Implemented 2026-06-03:** `expo-file-system/legacy` + `expo-sharing` in `ReportExportActions.tsx`; `exportType` wired for `inventory`, `sales`, `coupons`. Physical share-sheet and Arabic filename QA still required on Android/iPhone. | Export enabled on supported hub reports; failures surface via alert. |

## Post-2026-06-03 review pass (code)

| Item | Status |
|------|--------|
| Held carts on phone (`PosOrderPanel.checkoutIcons`) | **Closed** — same callbacks as tablet top bar |
| `/reports/recipes` in `buildSidebarMenu` (mobile + web) | **Closed** |
| Stock count / adjustment / transfer lot picker (`BatchPickerSheet`) | **Closed** — balances API `product_id` + warehouse |
| Report charts: treasury (`vaults`), expenses (`by-category`) | **Closed** |
| Report export: sales dashboard, coupons + inventory | **Closed** (backend legacy types) |
| `npm run typecheck` | **PASS** |
| `localPromotionEngine.ts` | **Present** — gap audit line on “missing engine” is stale |
| Device QA (`06_DEVICE_QA_SCRIPT.md`) | **NOT TESTED** — requires physical Android/iPhone/iPad |

**Store release:** NO-GO until Android + iPhone smoke PASS per device script.

## Accepted Mobile Scope Differences

| Area | Route(s) | Status | Exact Reason | Safe Mobile State |
|------|----------|--------|--------------|-------------------|
| Customer advanced subtabs | `/customers/:id` | Intentionally Web-only | Additional phone CRUD, advanced address/delivery-zone forms, sales/delivery sub-tabs and loyalty ledger are web-depth management views. Core mobile customer detail, edit, wallet balance, wallet ledger, deposit and withdraw are implemented. | Read-only advanced context plus guarded wallet actions. |
| Standalone refund lookup | `/sales/returns/create` | Intentionally Web-only | Mobile refunding starts from a verified sale detail to avoid selecting/refunding the wrong invoice on a small screen. | Sale detail → partial refund is guarded with item quantities, restock toggle, confirmation, and backend errors. |
| Vault transfer/reconcile | `/vaults` | Intentionally Web-only | Transfer/reconcile moves cash between ledgers and needs dual-vault review; deposit/withdraw and transaction detail are available on mobile. | Deposit/withdraw guarded with confirmation; transfer remains on web. |
