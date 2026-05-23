# Mobile Gap Audit (Web vs Mobile)

Static audit comparing **`front/`** (source of truth) to **`madar-erp-mobile/`**.

- **Date:** 2026-05-23
- **No code changes** outside this folder.

## Index

| File | Topic |
|------|--------|
| [00_EXECUTIVE_SUMMARY.md](./00_EXECUTIVE_SUMMARY.md) | Totals, top gaps, readiness |
| [01_NAVIGATION_AND_ROUTES_GAPS.md](./01_NAVIGATION_AND_ROUTES_GAPS.md) | Sidebar vs mobile routes |
| [02_POS_GAPS.md](./02_POS_GAPS.md) | Point of sale |
| [03_PRODUCTS_AND_CATEGORIES_GAPS.md](./03_PRODUCTS_AND_CATEGORIES_GAPS.md) | Catalog management |
| [04_CUSTOMERS_SALES_REFUNDS_GAPS.md](./04_CUSTOMERS_SALES_REFUNDS_GAPS.md) | CRM & sales |
| [05_DINING_AND_KITCHEN_GAPS.md](./05_DINING_AND_KITCHEN_GAPS.md) | Restaurant ops |
| [06_INVENTORY_GAPS.md](./06_INVENTORY_GAPS.md) | Stock |
| [07_PURCHASES_SUPPLIERS_GAPS.md](./07_PURCHASES_SUPPLIERS_GAPS.md) | Procurement |
| [08_VAULTS_SHIFTS_EXPENSES_GAPS.md](./08_VAULTS_SHIFTS_EXPENSES_GAPS.md) | Cash management |
| [09_DELIVERY_GAPS.md](./09_DELIVERY_GAPS.md) | Delivery |
| [10_MARKETING_COUPONS_GIFT_CARDS_GAPS.md](./10_MARKETING_COUPONS_GIFT_CARDS_GAPS.md) | Promotions |
| [11_REPORTS_GAPS.md](./11_REPORTS_GAPS.md) | Reports |
| [12_SETTINGS_USERS_ADMIN_GAPS.md](./12_SETTINGS_USERS_ADMIN_GAPS.md) | Admin |
| [13_OFFLINE_AND_PRINTING_GAPS.md](./13_OFFLINE_AND_PRINTING_GAPS.md) | Offline & printers |
| [14_API_CONTRACT_GAPS.md](./14_API_CONTRACT_GAPS.md) | API clients |
| [15_UI_UX_PARITY_GAPS.md](./15_UI_UX_PARITY_GAPS.md) | UX |
| [16_PRIORITY_ROADMAP.md](./16_PRIORITY_ROADMAP.md) | Phased plan |

## Status legend

| Status | Meaning |
|--------|---------|
| Complete | Purpose-built mobile flow with API, aligned with web intent |
| Partial | Some behavior exists; notable gaps remain |
| Missing | No meaningful implementation |
| Read-only | List/detail via API or `ParityModule` without writes |
| Placeholder | Generic fallback UI |
| Wrong API / Wrong UX | Incorrect endpoint or navigation |
| Needs Verification | Could not confirm in static read |

## Lockdown Pass Update

The active full route tracker now lives in `../full-web-mobile-parity/`. The original audit remains useful history, but the current source of truth for route-by-route status is:

- `../full-web-mobile-parity/00_MASTER_TRACKER.md`
- `../full-web-mobile-parity/04_REMAINING_BLOCKERS.md`
- `../full-web-mobile-parity/05_FINAL_PARITY_REPORT.md`

2026-05-23 update: several former core fallback routes now have dedicated mobile screens (`/sales/products`, `/sales/layaway`, `/supplier-payments`, `/payments`, `/vaults/transactions`, `/barcode-print`, and `/delivery-finance/drivers/:driverId`). Current final status remains **NO-GO for full parity acceptance** because core Partial / Needs Device QA rows remain.
