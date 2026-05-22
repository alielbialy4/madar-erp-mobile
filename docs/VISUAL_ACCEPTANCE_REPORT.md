# Visual Acceptance Report — Final Lockdown

**App root:** `madar-erp-mobile/`  
**Date:** May 2026  
**Viewports tested (web export):** 390×844, 1024×1366  
**Captures:** `docs/visual-captures/phone-390-shell.png`, `docs/visual-captures/tablet-1024-shell.png`

## Executive summary

| Item | Result |
|------|--------|
| Code redesign (must-fix screens) | Complete |
| `npm run typecheck` | PASS |
| `npm run lint` | PASS |
| `npx expo export --platform web` | PASS |
| Authenticated UI visual proof | **NOT TESTED** (session gate only) |
| **Final release status** | **NO-GO** (owner / logged-in visual sign-off pending) |

Reason for NO-GO: Web captures stop at «جاري التحقق من الجلسة…» without API session. Priority screens (Dashboard, POS sheets, Products detail, More hub with data) were **not** rendered in the capture run. Internal QA must re-verify after login.

---

## Screen matrix (required format)

| Screen | Phone Status | Tablet Status | Problems Found | Fixes Applied | Final Status |
|--------|--------------|---------------|----------------|---------------|--------------|
| POS checkout sheet (`PosCheckoutSheet`) | NOT TESTED | NOT TESTED | Raw form layout, weak payment hierarchy | New sheet: total hero, payment method grid, section cards, sticky CTA | FAIL (unverified) |
| Checkout review (`CheckoutReviewSheet`) | NOT TESTED | NOT TESTED | Flat summary list | Total hero, line cards, payment block, sticky confirm | FAIL (unverified) |
| Modifier picker (`ModifierPickerSheet`) | NOT TESTED | NOT TESTED | Basic chips, weak header | Product header + image, required badges, check chips, error banner, sticky bar | FAIL (unverified) |
| Split payment (`SplitPaymentSheet`) | NOT TESTED | NOT TESTED | Cramped form lines | Due/paid/remaining meter, line cards, validation banners | FAIL (unverified) |
| Product detail (`ProductDetailScreen`) | NOT TESTED | NOT TESTED | Stacked phone-only rows | Hero large on tablet, 2-col cards (pricing/identity/stock), grid fields in `DetailInfoCard` | FAIL (unverified) |
| Products filters (tablet) | NOT TESTED | PASS (layout code) | Filters only inline on wide screens | 272px sidebar panel + `layout="sidebar"` on Products list | FAIL (unverified) |
| Tablet sidebar | NOT TESTED | PASS (layout code) | Modal-only drawer | `PersistentTabletSidebar` 280px persistent + `sidebarParts` | FAIL (unverified) |
| More hub | NOT TESTED | NOT TESTED | Card width drift | Fixed % widths, section spacing | FAIL (unverified) |
| Dashboard | NOT TESTED | NOT TESTED | Assumed from prior pass | No regression changes this lockdown | NOT TESTED |
| POS catalog/cart | NOT TESTED | NOT TESTED | Assumed from prior pass | No regression changes this lockdown | NOT TESTED |
| Sales list | NOT TESTED | NOT TESTED | Assumed from prior pass | No regression changes this lockdown | NOT TESTED |
| Bottom nav | NOT TESTED | N/A | — | Phone only (hidden ≥900px) | NOT TESTED |
| Top bar (Navbar) | NOT TESTED | NOT TESTED | — | Prior pass; tablet menu → command palette | NOT TESTED |
| Web session shell | PASS | PASS | Only loading state visible | Export boots, RTL loading copy centered | PASS |

---

## Fixes in this lockdown (by area)

### POS
- `src/components/pos/posSheetUi.tsx` — shared sheet primitives (hero total, payment grid, sections).
- `src/screens/pos/PosCheckoutSheet.tsx` — premium checkout flow (extracted from `POSScreen`).
- `src/screens/pos/CheckoutReviewSheet.tsx` — review layout redesign.
- `src/screens/pos/ModifierPickerSheet.tsx` — modifier UX redesign.
- `src/screens/pos/SplitPaymentSheet.tsx` — split payment meter + cards.

### Products
- `src/screens/products/ProductDetailScreen.tsx` — tablet 2-column layout.
- `src/components/products/DetailInfoCard.tsx` — field tiles, 2-col on tablet.
- `src/components/products/ProductDetailHero.tsx` — `large` hero on tablet.
- `src/components/products/ProductFiltersPanel.tsx` — sidebar layout mode.
- `src/screens/products/ProductsScreen.tsx` — filter rail ≥900px.

### Tablet navigation
- `src/components/layout/sidebarParts.tsx` — shared drawer items.
- `src/components/layout/PersistentTabletSidebar.tsx` — persistent nav ≥900px.
- `src/navigation/MainTabs.tsx` — row shell, sidebar first (RTL right).

### More hub
- `src/screens/settings/MoreScreen.tsx` — card grid width fix.

---

## Commands

```bash
npm run typecheck   # PASS (0 errors)
npm run lint        # PASS (0 errors)
npx expo export --platform web   # PASS → dist/
```

`npm run web` / Expo dev server: running in user terminal (`npx expo start --clear`); static verification used `dist/` on port 3456.

---

## QA handoff (required before READY FOR INTERNAL TESTING)

1. Log in on phone (390×844) and tablet (≥1024).
2. Open POS → checkout → modifier → split → confirm review.
3. Open Products list (tablet filter rail) → product detail.
4. Confirm persistent right sidebar on tablet.
5. Mark each row above PASS/FAIL in this file.
6. Owner sign-off on captures after login.

Until those steps pass, status remains **NO-GO**.
