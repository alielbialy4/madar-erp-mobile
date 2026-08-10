# Screen Rebuild Tracker

Overall status: **NO-GO**

Discovery includes route registrations and overlay uses. “Implementation touched” means product structure or behavior changed; it does not mean the whole domain is accepted. “Accepted” requires structural review, implementation, visual review, and runtime evidence for every required state.

| Domain | Routes | Overlays | Total surfaces | Current implementation evidence | Accepted | Result |
|---|---:|---:|---:|---|---:|---|
| Auth | 1 | 0 | 1 | Login hierarchy and failure state rebuilt | 0 | IN PROGRESS |
| Dashboard | 1 | 0 | 1 | Context, KPI hierarchy, report navigation and chart composition rebuilt; emulator opened | 0 | IN PROGRESS |
| POS | 8 | 33 | 41 | Catalog/cart/payment/delivery/split-payment hierarchy rebuilt | 0 | IN PROGRESS |
| Sales / refunds | 7 | 11 | 18 | Sale presentation and partial-refund financial/inventory flow rebuilt | 0 | IN PROGRESS |
| Finance / expenses / shifts | 9 | 17 | 26 | Account list/detail/actions and shift center rebuilt; expenses still being expanded | 0 | IN PROGRESS |
| Products | 16 | 9 | 25 | Shared list/detail/form system adopted on representative screens | 0 | IN PROGRESS |
| Inventory | 24 | 18 | 42 | Labels, filters, quantity semantics, stock count, requisition, transfer and adjustment rebuilt | 0 | IN PROGRESS |
| Purchases | 7 | 6 | 13 | Metadata edit and purchase-return workflow rebuilt | 0 | IN PROGRESS |
| Suppliers | 4 | 5 | 9 | Shared list/detail surfaces present; full financial depth not accepted | 0 | IN PROGRESS |
| Customers | 2 | 6 | 8 | Shared list/detail surfaces present; full debt/payment depth not accepted | 0 | IN PROGRESS |
| Dining | 4 | 10 | 14 | Existing operational routes inventoried; full state validation open | 0 | FAIL |
| Kitchen | 10 | 5 | 15 | Existing operational routes inventoried; full state validation open | 0 | FAIL |
| Delivery | 12 | 4 | 16 | Tracking center and detail assignment/status/COD flow rebuilt; emulator UI verified | 0 | IN PROGRESS |
| Reports | 5 | 5 | 10 | Report shell, canonical-field selection and representative charts rebuilt | 0 | IN PROGRESS |
| Settings / admin | 21 | 8 | 29 | Shared forms/lists adopted on representative modules; route-by-route acceptance open | 0 | IN PROGRESS |
| Notifications | 1 | 0 | 1 | Inventoried; runtime state matrix open | 0 | FAIL |
| Shared / composed | 2 | 8 | 10 | Shell and current archetypes implemented | 0 | IN PROGRESS |

## Current quality evidence

- Shared adoption: 30 list layouts, 27 form layouts, 23 detail layout/screen sources, 36 current list-archetype sources.
- Full TypeScript, ESLint, UI, color-token, and unit-test gates pass.
- Android Debug and Release APK builds pass.
- Compact 360×640 navigation and representative screens have emulator evidence.

## Remaining acceptance order

1. Finish expense detail/payment/reversal/cancellation and remaining finance depth.
2. Close supplier/customer payment history and settlement flows.
3. Deep-review dining, kitchen, notification, and remaining administration surfaces.
4. Run every surface through phone/tablet, RTL, light/dark, loading/empty/error/offline/permission/stale-state checks.
5. Run representative backend/web/mobile reconciliation, physical printer tests, and iOS validation.

The accepted column intentionally remains zero until complete per-surface evidence exists; this avoids turning broad code changes into unsupported acceptance claims.
