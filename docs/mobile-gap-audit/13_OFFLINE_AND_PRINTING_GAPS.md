# Offline and Printing Gaps

## Offline

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Catalog cache | `offlineBootstrap` | catalog sync | Partial | `catalogCache.ts` | — | P2 | Mobile pull via `posAPI` |
| Pending orders queue | POS payment | `/sync/offline-orders` | Complete | `posOrders.ts`, `posStore` | Device QA | P1 | Status: pending/syncing/synced/failed |
| Failed sync visibility | POS UI | — | Complete | `SyncStatusScreen` | Device QA | P2 | Failed details include coupon/server reason |
| Retry failed orders | sync | retry | Partial | retry in posOrders | — | P2 | |
| Reconnect auto-sync | network listener | `syncAll` | Partial | `syncEngine`, 60s interval | — | P2 | |
| Active shift offline | POS rules | — | NEEDS VERIFICATION | — | — | P2 | |
| Local stock reservation | web POS | — | Missing | — | Missing offline support | P2 | |
| Duplicate prevention | `client_order_id` | payload | Partial | `OfflinePosOrderRecord` | — | P2 | |
| Conflict handling UI | sync results | push results | Complete | `SyncStatusScreen` | Device QA | P1 | Per-order retry/clear with confirmation |
| Held carts offline | HoldCartModal | local | Complete | `heldCartsLocal.ts` | — | P3 | Server hold requires online; local survives restart |
| Coupon offline validation | `coupons.ts` | local rules | Missing | — | Missing offline support | P1 | |
| Dining tables offline cache | `TablesView` | cache | Missing | — | Missing offline support | P2 | |
| Edit sale offline guard | POSScreen | — | Missing | — | Missing validation | P2 | Web blocks |

## Printing

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Receipt print after sale | print service | print sale | Partial | `printEngine`, `receiptTemplates` | Missing silent print | P1 | |
| Kitchen ticket print | `/kitchen/ticket/:id` | kitchen print | Complete | `KitchenTicketPreviewScreen`, queue + routing | Device QA | P1 | Preview + queued print; hardware NOT TESTED |
| Shift summary print | `ShiftSummaryModal` | shift print | Complete | `shiftSummaryPrint.ts`, `ShiftScreen` | — | P3 | Hardware NOT TESTED |
| Refund receipt | refund flow | — | Missing | — | Missing print support | P2 | |
| Silent / auto print | web desktop | — | Partial | NEEDS VERIFICATION | Missing print support | P2 | |
| Printer profiles | branch settings | — | Complete | `PrinterProfilesScreen` | — | P3 | Mobile-specific |
| Network/Ethernet printer | web | TCP | Partial | `networkTcpPrinter.ts` | NEEDS VERIFICATION | P2 | |
| Bluetooth printer | — | — | Partial | `androidBluetoothPrinter.ts` | — | P2 | Android |
| AirPrint / iOS | — | — | Partial | `iosAirPrintPrinter.ts` | NEEDS VERIFICATION | P2 | |
| Print queue + retry | web print jobs | — | Partial | `PrintQueueScreen` | — | P2 | |
| Arabic ESC/POS | templates | — | Partial | `escposBuilder.ts` | NEEDS VERIFICATION | P1 | RTL rendering |
| Kitchen printer routing rules | `kitchenRoutingAPI` | rules | Partial | `offline/kitchenRouting.ts` | — | P2 | |
| Web silent print workers | `kitchenPrintWorkersAPI` | — | Missing | — | Missing API client | P2 | |

## Mobile services (reference)

- `madar-erp-mobile/src/services/offline/`
- `madar-erp-mobile/src/services/printing/`
- `madar-erp-mobile/src/services/sync/`

## Lockdown Pass 2 Update — 2026-05-23

- Failed offline POS orders now show exact server reason, coupon snapshot, retry, and clear-with-confirmation.
- Kitchen ticket preview route now exists and uses local print queue without pretending hardware success.
- Native export/share remains blocked by missing file/share dependency and needs Arabic filename QA.
