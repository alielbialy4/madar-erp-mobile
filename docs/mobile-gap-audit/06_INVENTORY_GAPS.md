# Inventory Gaps

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Inventory overview | `/inventory` | dashboard metrics | Complete | `InventoryScreen` | — | P3 | Hub links to dedicated flows |
| Stock balances | `/inventory/balances` | balances API | Complete | `InventoryList` balances, `StockBalanceDetail` | — | P3 | Warehouse/product filters |
| Warehouses CRUD | `/inventory/warehouses` | `warehousesAPI` | Complete | `Warehouses`, `WarehouseForm` | — | P3 | |
| Warehouse detail | web list | `GET` | Complete | `WarehouseDetailScreen` | — | P3 | |
| Movements list | `/inventory/movements` | movements API | Complete | `InventoryList` movements, `InventoryMovementDetail` | — | P3 | Detail from list row |
| Stock adjustments | `/inventory/adjustments` | `stockAdjustmentsAPI` | Complete | `StockAdjustmentsList`, `StockAdjustment`, `StockAdjustmentDetail` | — | P3 | Post with confirm |
| Stock transfers | `/inventory/transfers` | `stockTransfersAPI` | Complete | `StockTransfersList`, `StockTransfer`, `StockTransferDetail` | — | P3 | Complete with confirm |
| Reorder rules | `/inventory/reorder-rules` | `reorderRulesAPI` | Complete | `ReorderRulesList`, `ReorderRuleForm` | — | P3 | Phase 3 |
| Requisitions | `/inventory/requisitions` | `requisitionsAPI` | Complete | `RequisitionsList`, `RequisitionCreate`, `RequisitionDetail` | — | P3 | Status + confirm |
| Stock counts | `/inventory/stock-counts` | `stockCountsAPI` | Complete | `StockCountsList`, `StockCountCreate`, `StockCountDetail` | — | P3 | Create/lines/post |
| Expiry / low stock | reports + inventory | expiry endpoints | Partial | preset `expiry` list | Missing filter | P2 | |
| Batch/expiry in ops | transfers/adjustments | batch_id | Partial | Forms | Missing validation | P1 | Web batch picker not fully ported |
| Permissions | guards | — | Partial | `hasPermission` on forms | Missing permission guard | P2 | |
| Offline behavior | web limited | — | Missing | Online only | Missing offline support | P3 | |

## Mobile API modules (Phase 3)

`reorderRules`, `requisitions`, `stockCounts`, `stockAdjustments`, `stockTransfers` — typed clients in `src/api/`.

## Files

- Web: `front/src/pages/Inventory/`, `front/src/Routes/inventory.tsx`, `front/src/api/inventory.ts` + related
- Mobile: `madar-erp-mobile/src/screens/inventory/`, `src/api/*.ts`
