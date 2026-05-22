# API Contracts Used

All requests use `EXPO_PUBLIC_API_URL` through `mobile/src/api/client.ts`, with `Authorization`, `X-Tenant-Slug`, `X-Branch-Id`, and Arabic language headers.

## Core

- Auth: `POST /login`, profile/session endpoints from `authAPI`.
- Branches: `/branches`, branch switch and active branch context.
- Dashboard: `/dashboard/*`, `/reports/low-stock`, `/reports/daily-sales`, `/kitchen/orders/stats`, `/shifts/current`.

## POS

- Catalog pull: `GET /pos/catalog` via `posAPI.pullCatalog`.
- Checkout: `POST /pos/sales`.
- Offline sync: `POST /pos/offline-orders` via `posAPI.pushOfflineOrders`.
- Coupon validation: `POST /coupons/validate`.
- Wallet balance: wallet balance endpoint from `walletAPI`.
- Active shift: `GET /shifts/current`.
- Vaults for split payment: `GET /vaults`.

Payload rules:
- `discount` includes line discounts plus manual discount when branch allows it.
- `coupon_id` and `coupon_discount` are sent only after server validation.
- `payment_lines` are sent for split payments and require selected vault ids.
- Offline queued sales are labeled pending; they are not marked as server success.

## Sales And Refunds

- Sales list/detail: `GET /pos/sales`, `GET /pos/sales/:id`.
- Full refund: `POST /pos/sales/:id/refund`.
- Partial refund: `POST /pos/sales/:id/partial-refund`.
- Returns list: returns/refunds endpoints in `refundsAPI`.

## Dining And Kitchen

- Dining halls/tables: `/dining-halls`, `/dining-tables`.
- Active table order: table active-order endpoint in `diningAPI`.
- Table merge/transfer/settle/release: `diningAPI.mergeOrder`, `transferOrder`, `settleOrder`, `releaseForPos`.
- Kitchen: `GET /kitchen/orders`, `GET /kitchen/orders/:id`, `PATCH /kitchen/orders/:id/status`.

## Inventory

- Overview/balances/products/expiry/movements: `/inventory`, `/inventory/balances`, `/inventory/products`, `/inventory/expiry-stock`, `/inventory/movements`.
- Warehouses: `/warehouses`, `/inventory/warehouses`.
- Stock adjustments: `/stock-adjustments`, `/stock-adjustments/:id/post`.
- Stock transfers: `/stock-transfers`, `/stock-transfers/:id/complete`.
- Read-only parity: `/inventory/reorder-rules`, `/inventory/requisitions`, `/inventory/stock-counts`.

## Purchases And Suppliers

- Purchases: `/purchases`, `/purchases/:id`, `POST /purchases`.
- Purchase returns: `/purchase-returns`, `/purchases/:id/returns`.
- Suppliers: `/suppliers`, supplier statement endpoints.
- Supplier payments/settlements: `/supplier-payments`, `/suppliers/:id/settleable-balance`, guarded create from supplier context.

## Finance, Delivery, Marketing, Reports

- Vaults: `/vaults`, `/vaults/:id/deposit`, `/vaults/:id/withdraw`, read-only `/vaults/transactions`.
- Shifts: `/shifts`, `/shifts/current`, open/close/summary endpoints.
- Expenses: `/expenses`, expense categories, vaults.
- Delivery: `/deliveries`, read-only `/drivers`, `/delivery-zones`, `/driver-settlements`, `/delivery-finance/*`.
- Coupons/promotions/gift cards: `/coupons`, `/marketing/promotions`, `/gift-cards`.
- Reports: `/reports/*` as listed in `NAVIGATION_PARITY_MATRIX.md`; detail routes use read-only parity fallback.
- Notifications: `/notifications`, unread count, mark read.
- Settings/users: `/settings`, `/users` or settings user endpoints.

## Error Contract

- `401`: session ends and auth state is cleared.
- `403`: displayed as `ليس لديك صلاحية لتنفيذ هذه العملية.`
- `422`: first validation error is shown; form data is not cleared.
- Network errors include the configured API host and localhost/LAN guidance.
