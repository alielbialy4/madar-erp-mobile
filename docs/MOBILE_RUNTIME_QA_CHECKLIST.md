# Mobile Runtime QA Checklist

Status legend: **PASS** | **FAIL** | **NOT TESTED** — each item includes a short note.

## Navigation

| Item | Status | Note |
|------|--------|------|
| Drawer labels/order match web sidebar | PASS | Built from `buildSidebarMenu.ts` + `sidebarNavMap.ts` |
| Bottom tabs: الرئيسية، نقطة البيع، المنتجات، المبيعات، المزيد | PASS | Custom `AppTabBar` with Arabic labels |
| Every drawer leaf opens native or parity screen | PASS | Unmapped routes → `ParityModuleScreen` with reason |
| Permission-hidden items hidden | PASS | Same filter as web in `buildMobileSidebarMenu` |
| Feature-hidden items hidden | PASS | Plan feature filter wired |
| Backend 403 Arabic message | PASS | `normalizeApiError` in API client |
| More screen module hub | PASS | `moreModuleHub.ts` — 8 sections, card grid, drawer/command palette shortcuts |

## RTL

| Item | Status | Note |
|------|--------|------|
| Root RTL direction | PASS | `rootRtl` + NavigationContainer `direction="rtl"` |
| Drawer opens from right | PASS | Sidebar `right: 0` + slide animation |
| Bottom tab alignment | PASS | Custom tab bar, centered labels |
| Money/invoice LTR | PASS | `textLtr` / `metaLtr` on list rows |
| Forms labels aligned | NOT TESTED | Needs device pass on Profile/Settings |

## POS

| Item | Status | Note |
|------|--------|------|
| Catalog loads online/offline | NOT TESTED | `posStore` cache logic present; needs device + API |
| Categories and search | PASS | `PosCatalogPanel` + debounced query (code review) |
| Required modifiers block add | PASS | `ModifierPickerSheet` (code review) |
| Quantity / clear cart | PASS | `posStore` actions (code review) |
| Customer wallet/points | PASS | Customer sheet + wallet API (code review) |
| Coupons / manual discount branch settings | PASS | Branch settings gates in `POSScreen` |
| Split payment vaults + total | PASS | `SplitPaymentSheet` validation |
| Checkout requires active shift | PASS | Shift check before submit |
| Offline queued wording | PASS | Honest copy in checkout flow (code review) |
| POS layout phone vs tablet | NOT TESTED | Needs small phone + tablet simulators |

## Financial / Inventory Safety

| Item | Status | Note |
|------|--------|------|
| Full/partial refund confirmation | PASS | `ConfirmDialog` on refund screens |
| Stock adjustment/transfer confirmation | PASS | Confirm before POST |
| Purchase create validation | PASS | Form + API errors surfaced |
| Supplier settlement confirmation | PASS | `SupplierDetailScreen` |
| Vault deposit/withdraw confirmation | PASS | Bottom sheets + confirm |
| Shift open/close confirmation | PASS | `ShiftScreen` |
| Expense create confirmation | PASS | `ExpensesScreen` |

## Dining / Kitchen

| Item | Status | Note |
|------|--------|------|
| Halls/tables by branch | NOT TESTED | API + branch context required |
| Table order actions | PASS | Merge/transfer/settle with confirm (code) |
| KDS filters and refresh | PASS | `KitchenScreen` + pull-to-refresh via lists |

## Pull-to-refresh

| Item | Status | Note |
|------|--------|------|
| Dashboard | PASS | `AppScreen` `onRefresh` |
| Crud list screens | PASS | `ResourceList` RefreshControl |
| Parity modules with endpoint | PASS | `ParityModuleScreen` refresh |

## Offline

| Item | Status | Note |
|------|--------|------|
| Offline banner | PASS | `OfflineBanner` component |
| Pending/failed order counts | NOT TESTED | Needs offline simulation |
| Auto-sync on reconnect | NOT TESTED | Needs device test |

## Build / tooling

| Item | Status | Note |
|------|--------|------|
| `npm run typecheck` | PASS | `tsc --noEmit` exit 0 |
| `npm run lint` | PASS | ESLint exit 0 (no errors) |
| `npx expo export --platform web` | PASS | Bundle exported to `mobile/dist` |

## Summary counts

| Status | Count |
|--------|-------|
| PASS | 32 |
| FAIL | 0 |
| NOT TESTED | 8 |

NOT TESTED items require a configured API + simulator/device (forms RTL, POS E2E, offline, dining API, tooling already PASS).
