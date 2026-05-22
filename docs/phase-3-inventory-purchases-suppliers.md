# Phase 3 — Inventory / Purchases / Suppliers Parity

**Date:** 2026-05-23  
**Scope:** `madar-erp-mobile/` only  
**Status:** **PASS WITH RISKS**

## Summary

Operational stock and procurement flows were implemented as dedicated screens (no weak `ParityModule` for inventory reorder/requisitions/stock counts, purchase returns, or supplier statement/payment). Navigation, sidebar mapping, and the inventory hub were wired to the new routes.

## Delivered

### Inventory

| Feature | Mobile route | Notes |
|---------|--------------|-------|
| Stock balances filters + drill-down | `InventoryList` balances, `StockBalanceDetail` | Warehouse + product id filters |
| Movements detail | `InventoryMovementDetail` | Row passed from list (no GET-by-id API) |
| Adjustments list/detail/post | `StockAdjustmentsList`, `StockAdjustmentDetail`, `StockAdjustment` | Create + history |
| Transfers list/detail/complete | `StockTransfersList`, `StockTransferDetail`, `StockTransfer` | From/to warehouse validation on create |
| Stock counts | `StockCountsList`, `StockCountCreate`, `StockCountDetail` | Draft lines, save, post with confirm |
| Reorder rules | `ReorderRulesList`, `ReorderRuleForm` | Create/edit |
| Requisitions | `RequisitionsList`, `RequisitionCreate`, `RequisitionDetail` | Status workflow + confirm |

### Purchases

| Feature | Mobile route | Notes |
|---------|--------------|-------|
| Edit purchase | `EditPurchase` | Qty/cost/expiry/batch on lines |
| Returns list/detail | `PurchaseReturnsList`, `PurchaseReturnDetail` | Create from `PurchaseDetail` |
| Purchase payment | `PurchaseDetail` sheet | Vault + confirm when API allows |

### Suppliers

| Feature | Mobile route | Notes |
|---------|--------------|-------|
| Statement | `SupplierStatement` | GET `/suppliers/:id/statement` |
| Aging/balance/credit | `SupplierDetail` | Cards + available credit API |
| Payment create | `SupplierDetail` | Confirm + refresh balance |
| Mixed settlement | — | **Blocked** — accounting flow unclear |

## API modules added

`stockCounts`, `requisitions`, `reorderRules`, `stockAdjustments`, `stockTransfers`; extended `suppliers`, `supplierPayments`, `purchases`.

## Known risks / gaps

1. **Batch/expiry on adjustments/transfers** — Partial vs web batch picker; edit purchase has line expiry/batch.
2. **Movement detail** — No standalone fetch; depends on list row payload.
3. **Supplier mixed settlement** — Disabled with explicit Arabic reason on detail screen.
4. **Purchase payment** — Requires open vault/shift; disabled when prerequisites missing.
5. **Standalone purchase return** — Create primarily from purchase detail (matches common web path).

## Verification

```bash
cd madar-erp-mobile
npm run typecheck
npm run lint
npx expo export --platform web
```

## Audit updates

- `docs/mobile-gap-audit/06_INVENTORY_GAPS.md`
- `docs/mobile-gap-audit/07_PURCHASES_SUPPLIERS_GAPS.md`
- `docs/mobile-gap-audit/14_API_CONTRACT_GAPS.md`
- `docs/mobile-gap-audit/16_PRIORITY_ROADMAP.md`
