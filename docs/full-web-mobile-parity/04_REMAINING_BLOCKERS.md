# Remaining Blockers

## Critical / High

| Blocker | Route(s) | Status | Exact Reason | Safe Mobile State |
|---------|----------|--------|--------------|-------------------|
| POS device/offline/printer validation | `/pos`, `/sync-status`, printer routes | Needs Device QA | Pass 2 implemented quick customer create, variant picker, cash movement, POS table bridge, and failed offline coupon/order conflict details. Remaining risk is physical device validation: offline queue/retry under real network toggles and actual receipt/kitchen printer behavior. | UI is native and honest; failed orders show coupon/server reason, retry, and guarded clear. |
| Driver settlement create | `/driver-settlements` | Intentionally Web-only | تسوية السائقين تتطلب ربط مالي متعدد الطلبات والخزنة، وتبقى حالياً من الويب فقط. The backend API exists, but safe mobile create needs multi-delivery selection, branch/vault validation, `delivery_settle` permission, and cash reconciliation review before deposit. | Rich read-only list with Arabic blocked state and finance dashboard link. |
| Shifts hardware print QA | `/shifts`, `/pos` | Needs Device QA | In-POS cash movement is implemented. Shift summary and receipt/kitchen printing still require physical printer validation on iOS/Android. | Shift open/close and summary are available; print is honest about hardware QA. |

## Medium

| Blocker | Route(s) | Status | Exact Reason | Safe Mobile State |
|---------|----------|--------|--------------|-------------------|
| Direct kitchen ticket print hardware | `/kitchen/ticket/:id` | Needs Device QA | Native ticket preview route now exists and sends jobs through local print profiles. Actual output depends on configured network/Bluetooth/AirPrint printer and device build. | Preview loads real ticket data; print result is not faked and errors surface via message/queue. |
| Barcode label print | `/barcode-print` | Implemented This Pass | Exact label layout needs mobile print template and physical printer QA. | Dedicated disabled state added. |
| Saved report create/edit | `/reports/saved` | Intentionally Web-only | Current web page exposes list/delete; create/update APIs exist but no current mobile-safe editor or web page flow was required for this route. Mobile implements list/run/delete. | Saved report rows can run mapped report with stored filters or delete with confirmation. |
| Native export/share parity | reports, statements | Blocked By Missing API/Dependency | Web uses browser blob/download. Mobile project does not include a file save/share dependency (`expo-file-system` / `expo-sharing`) for native PDF/XLSX handoff, and Arabic filename QA is still required. | Export buttons are disabled on native with Arabic reason; web export still downloads. |

## Accepted Mobile Scope Differences

| Area | Route(s) | Status | Exact Reason | Safe Mobile State |
|------|----------|--------|--------------|-------------------|
| Customer advanced subtabs | `/customers/:id` | Intentionally Web-only | Additional phone CRUD, advanced address/delivery-zone forms, sales/delivery sub-tabs and loyalty ledger are web-depth management views. Core mobile customer detail, edit, wallet balance, wallet ledger, deposit and withdraw are implemented. | Read-only advanced context plus guarded wallet actions. |
| Standalone refund lookup | `/sales/returns/create` | Intentionally Web-only | Mobile refunding starts from a verified sale detail to avoid selecting/refunding the wrong invoice on a small screen. | Sale detail → partial refund is guarded with item quantities, restock toggle, confirmation, and backend errors. |
| Vault transfer/reconcile | `/vaults` | Intentionally Web-only | Transfer/reconcile moves cash between ledgers and needs dual-vault review; deposit/withdraw and transaction detail are available on mobile. | Deposit/withdraw guarded with confirmation; transfer remains on web. |
