# Mobile Offline Sync — Backend Requirements

## Existing endpoint (in use)

`POST /api/sync/offline-orders`

- Header: `X-Branch-Id`
- Body: `{ orders: [...] }`
- Each order **must** include:
  - `client_uuid` — UUID (idempotent; duplicate returns `duplicate` without second sale)
  - `sale_date` — date (mobile now sets from `created_at`)
  - `branch_id`, `warehouse_id` (backend can inject warehouse from branch)
  - `items[]`, totals, `payment_type`, `paid`, etc.

## Mobile payload mapping

| Mobile field | API field |
|--------------|-----------|
| `client_order_id` | `client_uuid` |
| `payload` | spread into order object |
| `sale_date` | `payload.sale_date` |

## Optional enhancements (not required for MVP)

- Return `invoice_number` on sync (already returned) — mobile stores on success.
- Kitchen routing API to sync `madar.print.kitchen_routing` rules.
- Printer profile sync for multi-device setups.
- Explicit `shift_id` on offline orders if shift enforcement is required server-side.

## Guards (mobile)

- Auth token
- Active branch
- Active shift (POS UI)
- `canSync()` + `isSyncInProgress()` prevent parallel sync storms

No fake sync success: errors remain on `failed` orders until retry or confirmed delete.
