# POS Rebuild Report

Date: 2026-05-24
Scope: `madar-erp-mobile/` only

## Rejected Screenshot Problems

- Tablet POS rendered as a sparse, stretched mobile page.
- Cart/order panel was missing or not visually anchored.
- Products and categories floated inside large unused whitespace.
- The normal app shell could steal POS space instead of giving POS a full workspace.
- Tables, checkout, held carts, printing, and payment states were present in pieces but not integrated into one cashier flow.

## Real Tablet Screenshot Follow-up - 2026-05-24

The latest physical tablet screenshot showed that the split workspace was now present, but the cashier UX still had visible production defects:

- Cart lines could show quantity/price while the product name was squeezed or effectively hidden.
- Adding the same product only showed a single cart line without a clear in-catalog quantity indicator.
- Product cards did not show how many units were already in the cart.
- Tenant primary color was not applied consistently across POS badges/buttons/navigation.
- Product options modal looked primitive and triggered the React Native warning: `VirtualizedLists should never be nested inside plain ScrollViews`.
- Split/customer sheets used the same nested-list pattern and could repeat the warning.
- Tablet bottom sheets were full-width, making option/payment flows feel stretched rather than cashier-grade.

## Actual Rendered Route And Components

- Route: `src/navigation/MainTabs.tsx` -> `POSTab` -> `src/navigation/POSStack.tsx` -> `POSHome`.
- Screen: `src/screens/pos/POSScreen.tsx`.
- Tablet branch: `src/screens/pos/PosTabletScreen.tsx`.
- Tablet split: `src/components/pos/PosTabletSplit.tsx`.
- Cart: `src/components/pos/PosOrderPanel.tsx`.
- Catalog: `src/components/pos/PosCatalogPanel.tsx` + `src/components/pos/PosFlexGrid.tsx`.
- Checkout: `src/screens/pos/PosCheckoutSheet.tsx`, `SplitPaymentSheet.tsx`, `CheckoutReviewSheet.tsx`.
- Tables: `src/screens/pos/PosTablesSheet.tsx`.
- Cart state / checkout submit: `src/store/posStore.ts`.
- Offline/printing: `src/services/offline/offlineCheckout.ts`, `src/services/pos/posKitchenPrint.ts`, `src/services/printing/*`.

## Root Cause

The previous redesign was wired to the real POS path, but several tablet POS components reused `rootRtl` as if it were only a direction helper. `rootRtl` also includes `flex: 1`.

That produced the rejected visual state:

- `PosTabletTopBar` received `flex: 1`, so the top bar could consume vertical space.
- `PosTabletSplit` panes received `flex: 1`, so the fixed-width cart pane could lose its intended 360-440px behavior.
- `PosFlexGrid` rows received `flex: 1`, so category/product rows expanded and floated with huge blank space.
- RTL direction inherited by the split row could physically place the first pane on the wrong side on web/tablet. The cart must be physically left, regardless of RTL text direction.

The 2026-05-24 screenshot exposed additional root causes:

- `PosOrderPanel` cart line layout mixed product info, line total, and quantity controls in a row shape that could starve the product name on tablet widths.
- `PosCatalogPanel` had no cart quantity map, so the catalog could not mark products already in the order.
- Theme colors were still mostly hardcoded from `lightColors` / `darkColors`; mobile did not hydrate the tenant `primary_hex` like the web theme.
- `ModifierPickerSheet`, `SplitPaymentSheet`, and the POS customer selector rendered `FlatList` inside `AppBottomSheet`, whose body is already a `ScrollView`.
- `AppBottomSheet` used full viewport width on tablets, which made option and split-payment modals feel like stretched mobile forms.

## Files Changed

- `src/constants/layout.ts`
- `src/components/pos/PosTabletSplit.tsx`
- `src/components/pos/PosFlexGrid.tsx`
- `src/components/pos/PosTabletTopBar.tsx`
- `src/components/pos/PosCatalogPanel.tsx`
- `src/components/pos/PosOrderPanel.tsx`
- `src/components/layout/AppBottomSheet.tsx`
- `src/components/ui/AppBadge.tsx`
- `src/constants/colors.ts`
- `src/hooks/useColors.ts`
- `src/store/themeStore.ts`
- `src/store/authStore.ts`
- `src/services/storage/keys.ts`
- `src/screens/settings/TenantSettingsScreen.tsx`
- `src/screens/pos/ModifierPickerSheet.tsx`
- `src/screens/pos/SplitPaymentSheet.tsx`
- `App.tsx`
- `src/screens/pos/PosTabletScreen.tsx`
- `src/screens/pos/POSScreen.tsx`
- `src/screens/pos/PosCheckoutSheet.tsx`
- `src/screens/pos/CheckoutReviewSheet.tsx`
- `src/screens/pos/PosTablesSheet.tsx`
- `src/navigation/POSStack.tsx`
- `src/types/navigation.ts`
- `src/store/posStore.ts`
- `src/services/offline/offlineCheckout.ts`
- `src/services/storage/secure.ts`
- `src/services/pos/posKitchenPrint.ts`
- `docs/POS_REBUILD_REPORT.md`
- `docs/MOBILE_RUNTIME_QA_CHECKLIST.md`
- `docs/full-web-mobile-parity/00_MASTER_TRACKER.md`
- `docs/full-web-mobile-parity/03_PAGE_BY_PAGE_IMPLEMENTATION_LOG.md`
- `docs/full-web-mobile-parity/04_REMAINING_BLOCKERS.md`
- `docs/full-web-mobile-parity/05_FINAL_PARITY_REPORT.md`

## Tablet Layout

- Tablet breakpoint remains `width >= 900`.
- `MainTabs` already hides the normal tablet sidebar and navbar for `POSTab` through `isPosTabletFullscreen`.
- `PosTabletSplit` now forces the split row to physical LTR while each pane keeps RTL text/content direction.
- Cart renders first and is physically left.
- Catalog renders second and fills the right side.
- Cart width remains ratio-based with bounds from `posTabletLayout`: 360-440px / 36%.
- Bottom nav is hidden on tablet because `MainTabs` returns no tablet tab bar.

## Cart Behavior

- Cart header now shows order type, branch, shift state, item count, customer, and selected table when present.
- Cart lines show name, variant/modifiers, unit price including option price, quantity controls, line total, line discount, note indicator, and remove action.
- Cart line layout now separates title/options from totals and quantity controls so product names are not squeezed off the row.
- Tablet quantity/remove controls are at least 44px.
- Empty state is compact and points the cashier to catalog/tables.
- Cart footer is sticky and includes customer, tables, hold cart, held carts, clear cart, kitchen print, totals, and checkout.
- Totals show subtotal, promotions, manual discount, coupon, tax, service charge, delivery fee, loyalty, gift-card amount, split paid/remaining, and final total when those states exist.

## Catalog Behavior

- Catalog header includes search, scan/search icon, table entry, title, count, category breadcrumb, and category exit button when inside a category.
- Category root shows dense cards including `كل المنتجات`.
- Product browsing uses a denser 3-5 column grid based on available catalog pane width.
- Product cards now receive cart quantities and display an `×N` badge plus `في السلة: N` when the item is already in the current order.
- Search from category root switches into product results instead of leaving category cards onscreen.
- Empty search state uses: `لا توجد منتجات مطابقة`.
- `الخروج من التصنيف` resets category state only; it does not exit POS.

## Theme, Font, And Sheets

- Tenant `primary_hex` is now loaded during auth/bootstrap and saved through tenant settings.
- `useColors()` and React Navigation theme now derive primary/accent/badges from the tenant primary color.
- POS badges and buttons use the tenant-aware palette instead of hardcoded blue where possible.
- The options modal no longer nests a `FlatList` inside the bottom-sheet `ScrollView`; option groups render as normal sheet content.
- Split payment and POS customer selector also avoid nested virtualized lists inside bottom sheets.
- Tablet bottom sheets are constrained to a focused max width instead of stretching across the entire screen.

## Exit Actions

- `خروج من نقطة البيع` remains always visible in the tablet top bar.
- If the cart has products, it confirms with: `توجد منتجات في السلة. هل تريد الخروج من نقطة البيع؟`.
- `الخروج من التصنيف` is visible only in category context and returns to category root.

## Tables Behavior

- Tablet POS now exposes `الطاولات` directly in the top bar and catalog header, plus cart footer.
- `PosTablesSheet` shows hall filters, table status filters, table status badges, hall/capacity, active order, and selected-table state.
- Cashier can choose a table context for the cart header.
- If online and cart has items, POS syncs the cart to `/pos/tables/{tableId}/order/draft`, clears the cart, and opens the table order.
- If offline, table linking is blocked with the exact reason that server state is required to prevent duplicate table orders.
- `POSStack` now includes `WaiterPos` so the table order action no longer navigates to a missing route.

## Checkout And Payment

- Checkout shows selected table as dine-in context and sends `dining_table_id` in `submitSale`.
- Offline dine-in checkout is blocked honestly because table state must be server-owned.
- Wallet payment blocks when balance cannot be verified or is insufficient.
- Loyalty remains blocked offline.
- Gift card remains blocked offline and requires validation before review.
- Coupon validation remains online-first with cached offline policy.
- Split payment keeps paid/remaining/total meters and vault validation.
- Final submit has a loading lock and does not fake success.
- Offline save message is standardized to: `تم حفظ الطلب محلياً وسيتم مزامنته عند عودة الاتصال`.

## Held Carts

- Held carts remain local/server-backed through `HoldCartsSheet` and `holdCartService`.
- Tablet cart and top bar now expose save/list actions directly.
- Restore replaces the current cart only after confirmation when needed.

## Printing And Offline Safety

- Kitchen print from POS uses real local print profiles and queue; no fake printed success.
- Missing kitchen printer profile now reports: `لم يتم إعداد طابعة.`
- Print queue/offline indicators remain visible in POS.
- Offline POS sale saves only when local catalog exists and unsafe table/loyalty/gift-card states are blocked.

## Phone Behavior

- Phone remains tabbed between catalog/cart instead of forcing the split layout.
- Cart utilities remain available from the phone cart panel.
- Checkout sheets and table sheet remain reachable.

## Validation Results

- `npm run typecheck`: PASS, exit 0.
- `npm run lint`: PASS, exit 0; 45 warnings, 0 errors.
- `npx expo export --platform web`: PASS, exit 0; exported `dist/`.
- `npm run web -- --port 19006`: PASS smoke; Metro served `http://localhost:19006`.
- Browser smoke: PASS to login at 1280x720 with no captured console errors. Authenticated POS viewport could not be completed without valid cashier credentials/session data, so live POS visual QA remains a device/session blocker.

## Remaining Blockers

- Physical iPad/Android tablet QA is still required.
- Real receipt/kitchen/shift-summary printer hardware QA is still required.
- Backend live table settlement and draft flows require a real branch/session to fully validate.
- Authenticated tablet browser POS screenshot still needs valid credentials/session data.
- Existing app-wide lint warnings outside this POS rebuild remain.
