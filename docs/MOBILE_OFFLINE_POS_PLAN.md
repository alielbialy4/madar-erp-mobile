# Mobile Offline POS Plan

## Scope (madar-erp-mobile only)

Offline POS is intentionally narrow: catalog-backed checkout queue + local print jobs. No fake server invoice numbers.

## Local stores

| Store | Key | Contents |
|-------|-----|----------|
| Catalog cache | `madar.pos.catalog` | products, categories, customers, coupons, `updated_at`, `branch_id` |
| Offline orders | `madar.pos.pending_orders` | full `OfflinePosOrderRecord` with `client_order_id` / `client_uuid` |
| Print jobs | `madar.print.jobs` | receipt/kitchen/shift jobs |
| Printer profiles | `madar.print.profiles` | connection, paper, encoding |
| Kitchen routing | `madar.print.kitchen_routing` | local rules until backend API consumed |

## Offline checkout flow

1. NetInfo reports offline.
2. Guard: cached catalog for active branch (`hasCachedCatalog`).
3. Guard: active shift (POS screen).
4. `saveOfflinePosOrder` → AsyncStorage queue with UUID `client_uuid`.
5. Receipt print job(s) for enabled cashier profiles.
6. Kitchen jobs from local routing rules (no duplicate unless reprint).
7. User message: `تم حفظ الطلب محليًا وسيتم مزامنته عند عودة الاتصال.`
8. Receipt template shows `غير مزامنة` — no `server_invoice_number` assigned locally.

## Sync

- Endpoint: `POST /api/sync/offline-orders` (exists).
- Idempotency: `client_uuid` (UUID v4).
- Payload includes `sale_date` (required by backend).
- Statuses: `pending` → `syncing` → removed on `created`/`duplicate`; `failed` retains `error_message`.
- Triggers: app start interval (60s), reconnect, manual sync, after online sale.

## Not offline

Refunds, purchases, vault, shift open/close, stock ops, dining settlement — see `OFFLINE_STRATEGY.md`.
