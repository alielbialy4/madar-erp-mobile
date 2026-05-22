# Missing Or Deferred API Endpoints

No backend files were modified. When a web feature needed unclear or high-risk API behavior, the mobile app keeps the route visible and read-only/disabled.

| Feature | Mobile State | Reason |
|---------|--------------|--------|
| Backup (`/backup`) | Disabled | Global destructive/admin operation; must remain web-only until a dedicated mobile confirmation and audit flow exists. |
| Full waiter POS (`/waiter`) | Partial | Web waiter flow has specialized table context and operational shortcuts. Mobile currently uses dining/table context and POS. |
| Layaway installment payment | Read-only | Financial payment workflow needs vault/shift checks and receipt handling before mobile mutation. |
| Stock count create/post | Read-only | Posting stock counts changes inventory balances and needs full line-level count UX. |
| Reorder rule create/update | Read-only | Changes automatic inventory policy; deferred for safer review. |
| Inventory requisition approve/fulfill | Read-only | Approval workflow requires role-specific state transitions not yet implemented natively. |
| Driver settlements | Read-only | Financial settlement; no mobile mutation until vault, shift, and audit UX is complete. |
| Delivery finance actions | Read-only | Finance dashboard/liabilities/settlements/alerts are visible, mutations disabled. |
| Kitchen printer queues/stations management | Read-only | Printer/device administration is web/desktop oriented. |
| Branch edit/settings deep tabs | Read-only or settings shell | Branch and hardware settings stay web-first for internal testing. |
| Payments creation | Read-only | Treasury mutations require tighter cash movement audit. |
| Saved/legacy/detail report variants | Read-only fallback | Some endpoints are inferred from web routes and should be verified against staging. |

All deferred items are documented in `NAVIGATION_PARITY_MATRIX.md` and are reachable through `ParityModuleScreen` with an Arabic explanation.
