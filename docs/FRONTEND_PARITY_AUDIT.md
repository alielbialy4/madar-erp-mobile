# Frontend Parity Audit

Audit date: 2026-05-22.

The mobile app now treats `front/src/Layouts/buildSidebarMenu.ts` as the navigation source of truth. The mobile drawer is generated from the same labels, grouping, permissions, feature checks, branch/global guards, and route order. Bottom tabs are intentionally reduced to the owner-requested mobile primary tabs: الرئيسية، نقطة البيع، المنتجات، المبيعات، المزيد.

## Completed Native Modules

- Dashboard: KPI cards, active shift, recent sales, low-stock warnings, refresh/loading/error states.
- POS: categories, product search/grid, modifiers with required validation, cart quantity controls, customer selection, wallet/points display, branch discount/coupon toggles, coupon validation, manual discount, split payment with vault selection, checkout review, active shift validation, server error display, offline queue notice.
- Products/Categories: list/search/detail/card UX.
- Customers: list/search/detail.
- Sales/Refunds: sales list/detail, guarded full refund and partial refund route.
- Dining/Kitchen: halls/tables, table active order, merge/transfer/settle/release confirmations, KDS list/detail/status updates.
- Inventory: overview, balances, movements, transfers, adjustments, low/expiry stock; dangerous mutations guarded.
- Purchases/Suppliers: purchases list/detail/create, returns read-only or detail-triggered, suppliers list/detail/settlement guard.
- Vaults/Shifts/Expenses: vault listing and guarded cash movement, shift open/close, expense create with confirmation.
- Marketing/Gift Cards/Reports/Notifications/Settings/Profile/Sync: native mobile pages or read-only parity fallbacks.

## Read-Only Or Deferred Parity

Some web routes remain visible but intentionally read-only via `ParityModuleScreen`: driver settlements, delivery finance, print queues, kitchen stations, stock counts posting, reorder rules editing, branch editing, payments creation, activity logs, and detailed report paths. This avoids fake success flows and keeps the drawer complete.

## Safety Notes

- Permissions/features are checked in the menu builder and backend `403` is still normalized to `ليس لديك صلاحية لتنفيذ هذه العملية.`
- Financial/inventory mutations use confirmations, loading states, disabled submit while loading, backend validation errors, and refresh after success where implemented.
- Unsupported or risky actions show an Arabic disabled/read-only reason instead of pretending to complete.

## Remaining Risks

- Some report endpoints in the web app are inferred from route/API names and may need backend verification in staging.
- Full waiter POS parity is represented through dining/table context; the complex web waiter workflow remains partial.
- Backup and deep admin branch/settings editing are intentionally web-only for internal-testing safety.
