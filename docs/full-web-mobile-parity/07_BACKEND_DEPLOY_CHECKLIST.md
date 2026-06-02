# Backend deploy checklist (mobile parity)

Run on **production/staging** before signing off mobile POS parity with web.

## Routes (must exist)

- `PUT /api/pos/tables/{tableId}/order/draft` — accepts `expected_sale_updated_at`, full draft payload; returns **409** with `code: table_order_conflict` when stale.
- `POST /api/pos/tables/{tableId}/unmerge` — body: `{ source_table_id }`.
- `POST /api/sync/offline-orders` — idempotent by `client_uuid`.

## Migrations

```bash
php artisan migrate
```

Required for coupon usage dedupe (if not already applied):

- `2026_06_02_120000_add_unique_coupon_usage_per_sale.php`

## Post-deploy

```bash
php artisan route:clear
php artisan config:clear
```

## Smoke (API)

1. Draft sync with wrong `expected_sale_updated_at` → 409.
2. Merge two open table orders → unmerge restores source.
3. Push offline order twice with same `client_uuid` → second row `duplicate`.

## Mobile build

Ship a mobile build **after** backend is live; older app builds without unmerge/409 handling remain unsafe for multi-device dining.
