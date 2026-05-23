# Device QA Script

All rows start as **NOT TESTED** until a tester runs them on a real device. Use **PASS** or **FAIL** only after recording the observed result.

## Android Phone

| Area | Steps | Status | Notes |
|------|-------|--------|-------|
| Install/login | Install preview build, set production API, login with tenant user, select branch. | NOT TESTED | Device required. |
| POS checkout | Open POS, add product, add modifier/variant if available, quick-create customer, checkout cash, verify sale appears in sales. | NOT TESTED | Device + backend required. |
| POS table bridge | Add cart items, open POS tables, link to available table, verify table order opens with items. | NOT TESTED | Device + dining data required. |
| Offline order | Disable network, checkout cached catalog order, re-enable network, sync, verify server sale or exact failure reason. | NOT TESTED | Must confirm no duplicate order. |
| Offline coupon conflict | Apply coupon online, go offline, queue order, force invalid/expired coupon server-side, sync and confirm failed-order reason/retry/clear UI. | NOT TESTED | Backend fixture required. |
| Printing | Configure Android network/Bluetooth printer, print receipt, kitchen ticket, refund receipt, and shift summary. | NOT TESTED | Physical printer required. |
| Dining/waiter | Open waiter mode, create order, add item, send kitchen, settle table. | NOT TESTED | Backend dining data required. |
| Delivery | Open delivery orders, driver detail, finance dashboard, settlements read-only state. | NOT TESTED | Delivery data required. |
| Admin/settings | Open users, roles, tenant settings; change theme hex and verify refresh. | NOT TESTED | Admin permission required. |

## iPhone

| Area | Steps | Status | Notes |
|------|-------|--------|-------|
| Install/login | Install preview build/TestFlight, login, select branch. | NOT TESTED | Device required. |
| POS checkout | Complete cash/card checkout with customer and split payment review. | NOT TESTED | Backend required. |
| Offline order | Queue offline order and reconnect sync. | NOT TESTED | Must inspect failed/synced states. |
| Reports | Open reports hub, saved reports, legacy reports, run filters and pagination. | NOT TESTED | Live API required. |
| Printing | Configure AirPrint/network profile; verify iOS prompt/blocked silent-print messaging. | NOT TESTED | Printer required. |
| Dining/waiter | Open table order, merge/transfer/settle where available. | NOT TESTED | Data required. |
| Delivery | Verify delivery list/detail, driver detail, alerts and finance screens. | NOT TESTED | Data required. |
| Admin/settings | Verify roles read-only reason and tenant theme save. | NOT TESTED | Admin permission required. |

## iPad / Tablet

| Area | Steps | Status | Notes |
|------|-------|--------|-------|
| Layout | Open landscape and portrait; verify sidebar, no overlap, RTL alignment. | NOT TESTED | Tablet required. |
| POS split | Verify catalog/cart split, variant sheet, quick customer sheet, cash movement, tables sheet. | NOT TESTED | Tablet required. |
| Reports | Open report cards, filters, summary cards, row cards/tablet width. | NOT TESTED | Live API required. |
| Kitchen | Open kitchen board/order/ticket preview/print jobs. | NOT TESTED | Data required. |
| Settings | Open tenant, roles, users, printer profiles, print queue. | NOT TESTED | Admin required. |

## Final Device Decision

| Gate | Status | Notes |
|------|--------|-------|
| Android phone smoke | NOT TESTED | |
| iPhone smoke | NOT TESTED | |
| iPad/tablet smoke | NOT TESTED | |
| POS checkout | NOT TESTED | |
| Offline duplicate prevention | NOT TESTED | |
| Receipt/kitchen/shift printing | NOT TESTED | |
| Reports live data | NOT TESTED | |
| Dining/waiter | NOT TESTED | |
| Delivery | NOT TESTED | |
| Admin/settings | NOT TESTED | |
