# API Payload Runtime Audit

## Summary

All 12 high-risk mobile mutation endpoints were audited against backend validation rules defined in `back/routes/api.php`. Payloads were checked for correct field names, required fields, type correctness, and missing values.

## Findings & Fixes

### CRITICAL — Fixed

| Screen | Endpoint | Issue | Fix |
|---|---|---|---|
| ExpensesScreen | `POST /expenses` | Sent `category_id` but backend expects `expense_category_id` | Changed to `expense_category_id` in `src/screens/expenses/ExpensesScreen.tsx` |

### Verified Correct

| Screen | Endpoint | Payload Fields | Status |
|---|---|---|---|
| POSScreen | `POST /sales` | `items[].product_id, quantity, unit_price, discount, tax_rate`, `discount_type, discount_value`, `coupon_code`, `customer_id`, `notes` | OK |
| PartialRefundScreen | `POST /sales/{id}/partial-refund` | `items[].sale_item_id, quantity, restock`, `reason, notes, refund_method` | OK |
| StockAdjustmentScreen | `POST /stock-adjustments` | `items[].product_id, warehouse_id, quantity, type, reason, cost`, `notes, adjustment_date` | OK |
| StockTransferScreen | `POST /stock-transfers` | `from_warehouse_id, to_warehouse_id, items[].product_id, quantity`, `notes, transfer_date` | OK |
| CreatePurchaseScreen | `POST /purchases` | `supplier_id, warehouse_id, items[].product_id, quantity, cost_price`, `discount_type, discount_value, tax_rate`, `notes, purchase_date, reference_no` | OK |
| CreatePurchaseReturnScreen | `POST /purchase-returns` | `purchase_id, items[].purchase_item_id, quantity, unit_cost`, `reason, notes` | OK |
| SupplierDetailScreen | `POST /supplier-payments` | `supplier_id, vault_id, amount, payment_date` | OK |
| VaultsScreen | `POST /vaults/{id}/deposit` | `amount, notes` | OK |
| VaultsScreen | `POST /vaults/{id}/withdraw` | `amount, notes` | OK |
| ExpensesScreen | `POST /expenses` | `expense_category_id, vault_id, amount, expense_date, description, reference` | Fixed |
| TableOrderScreen | `POST /dining/tables/{id}/settle` | `payment_type, paid` | OK |

## Methodology

1. Read backend route definitions from `back/routes/api.php`
2. Cross-referenced frontend web API calls in `front/src/api/` files
3. Compared mobile payload construction in each screen's submit handler
4. Verified field names, required fields, and nested object structures
