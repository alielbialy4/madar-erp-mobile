# Phase 4 — Dining / Kitchen / Delivery Parity

**Date:** 2026-05-23  
**Scope:** `madar-erp-mobile/` only  
**Status:** **PASS WITH RISKS**

## Summary

Restaurant and logistics modules gained dedicated screens, typed API clients, and sidebar routing away from weak `ParityModule` fallbacks. Waiter POS is a real MVP flow; dangerous finance actions remain guarded or disabled with Arabic explanations.

## Delivered

### Dining

| Feature | Route | Notes |
|---------|-------|-------|
| Halls/tables grid | `Dining` | Status colors, counts, hall grouping |
| Hall CRUD | `DiningHallForm` | Create/edit/delete with confirm (manage_dining) |
| Table order ops | `DiningTableOrder` | Merge, transfer, settle, release + confirm |
| Waiter POS | `WaiterPos` | Tables, create order, add items, kitchen reprint, settle |
| Pre-invoice print | `DiningTableOrder` | Via kitchen ticket + printer profile |
| Offline dining | — | **Disabled** — no safe offline contract |

### Kitchen

| Feature | Route | Notes |
|---------|-------|-------|
| KDS list | `Kitchen` | Status + station filters, stats badges |
| Order detail | `KitchenOrder` | Order/item status with confirm |
| Stations CRUD | `KitchenStationsList`, `KitchenStationForm` | |
| Print jobs | `KitchenPrintJobs` | List, retry failed, bulk retry |
| Web ticket URL | — | `/kitchen/ticket/:id` browser-only |

### Delivery

| Feature | Route | Notes |
|---------|-------|-------|
| Orders + filters | `Delivery` | Hub links, status filter, detail |
| Order detail | `DeliveryDetail` | Assign driver, status transitions + confirm |
| Drivers CRUD | `DriversList`, `DriverForm` | |
| Zones CRUD | `DeliveryZonesList`, `DeliveryZoneForm` | |
| Driver settlements | `DriverSettlements` | **Read-only** — create disabled |
| Finance | `DeliveryFinance*` | Dashboard, liabilities, settlements, alerts (read) |

## API modules added

`waiter`, `kitchenStations`, `kitchenPrintJobs`, `drivers`, `deliveryZones`, `driverSettlements`, `deliveryFinance`; extended `dining`, `kitchen`, `deliveries`.

## Known risks

1. Waiter flow does not replicate full web POS modifiers/options.
2. Driver settlement create blocked on mobile (vault + multi-delivery).
3. Delivery finance mutations not exposed on mobile.
4. Kitchen ticket web route not a native screen.
5. Pre-invoice print requires configured kitchen printer profile.

## Verification

```bash
cd madar-erp-mobile
npm run typecheck
npm run lint
npx expo export --platform web
```
