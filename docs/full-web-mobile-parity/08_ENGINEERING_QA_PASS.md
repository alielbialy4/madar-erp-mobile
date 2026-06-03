# Engineering QA Pass — Mobile Parity Implementation (2026-06-03)

Physical device QA rows in [`06_DEVICE_QA_SCRIPT.md`](06_DEVICE_QA_SCRIPT.md) remain **NOT TESTED** until a tester runs them on hardware. This document records automated/code verification for the parity implementation pass.

## Automated checks

| Command | Result |
|---------|--------|
| `npm run typecheck` | PASS for all files touched in this pass (pre-existing errors in `CloseShiftSheet.tsx`, `PosCheckoutSheet.tsx` unchanged) |
| `npm run test:unit` | PASS — `coercePendingOrder.spec.ts`, `posDining.spec.ts` |
| `npx expo install expo-file-system expo-sharing` | PASS — SDK 54 compatible |

## Features implemented (code-ready)

| Area | Status | Notes |
|------|--------|-------|
| Recipe reports (`/reports/recipes`) | Code complete | `RecipeReportsScreen`, API methods, sidebar + reports hub |
| POS held carts | Code complete | `HoldCartsSheet` wired in `POSScreen` + `PosTabletScreen` top bar |
| Raw materials UX | Code complete | Role/status filters on `ProductsScreen`; form fields on `ProductFormScreen` |
| Stock count depth | Code complete | `variant_id`/`batch_id`, load warehouse balances |
| Offline coupon | Already present | `validateCouponOffline` + `revalidateAppliedCoupon` in `POSScreen` |
| Recipe cost preview | Code complete | Server `recipe_costing` + estimated cost in product form |
| Report bar charts | Code complete | `ReportBarChart` on sales dashboard, hourly, treasury |
| Native export | Code complete | `expo-file-system/legacy` + `expo-sharing` in `ReportExportActions` |

## Device QA gate

**NO-GO for store release** until [`06_DEVICE_QA_SCRIPT.md`](06_DEVICE_QA_SCRIPT.md) Android/iPhone/iPad smoke rows are marked PASS by a human tester with production API and printers.
