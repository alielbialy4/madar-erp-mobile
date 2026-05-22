# Purchases and Suppliers Gaps

## Purchases

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Purchase list | `/purchases` | `purchasesAPI` | Complete | `PurchasesScreen` | Partial | P2 | List filters still light |
| Purchase detail | `/purchases/:id` | `GET` | Complete | `PurchaseDetailScreen` | — | P3 | Edit, payment, return links |
| Create purchase | `/purchases/create` | `POST` | Complete | `CreatePurchaseScreen` | Partial | P2 | Batch/expiry lines partial |
| Edit purchase | `/purchases/edit/:id` | `PUT` | Complete | `EditPurchaseScreen` | — | P3 | Phase 3 |
| Record payment | detail | payment endpoint | Complete | `PurchaseDetailScreen` | Partial | P2 | Vault/shift required |
| Purchase returns list | `/purchases/returns` | `purchaseReturnsAPI` | Complete | `PurchaseReturnsList` | — | P3 | |
| Create purchase return | returns/create | `POST` | Complete | `CreatePurchaseReturnScreen` | — | P3 | From purchase detail |
| Return detail | `/purchases/returns/:id` | `GET` | Complete | `PurchaseReturnDetail` | — | P3 | |
| Purchases suppliers nested route | `/purchases/suppliers` | — | Partial | `Suppliers` | Wrong UX | P2 | Same as suppliers list |

## Suppliers

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Supplier list | `/suppliers` | `suppliersAPI` | Complete | `SuppliersScreen` | — | P3 | |
| Supplier detail | `/suppliers` | `GET` | Complete | `SupplierDetailScreen` | — | P3 | Aging, credit, payment |
| Statement | statement API | `GET` | Complete | `SupplierStatement` | — | P3 | |
| Balance / aging | detail | aging | Complete | `SupplierDetailScreen` | — | P3 | |
| Supplier payments | `/supplier-payments` | `supplierPaymentsAPI` | Partial | `SupplierDetail` | — | P2 | No global list screen |
| Settlements (mixed) | web flows | — | Disabled | `SupplierDetail` | Disabled with reason | P1 | Accounting flow unclear |
| Available credit | detail | credit API | Complete | `SupplierDetail` | — | P3 | |
| Print/export statement | web | — | Missing | — | Missing action | P3 | |

## Files

- Web: `front/src/pages/Purchases/`, `Suppliers/`, `front/src/Routes/purchases.tsx`, `suppliers.tsx`
- Mobile: `madar-erp-mobile/src/screens/purchases/`, `suppliers/`
