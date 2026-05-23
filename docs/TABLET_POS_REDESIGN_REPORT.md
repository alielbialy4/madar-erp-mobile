# Tablet POS Redesign — Web Recovery Pass Report

**Date:** 2026-05-23  
**Scope:** `madar-erp-mobile/` only  
**Status:** TABLET POS REDESIGN PASS (build/static validation; manual 1024px viewport QA pending)

---

## Problem (Expo Web ≥900px)

After the corrective shell pass, the tablet POS screen still broke on Expo Web due to cumulative layout issues:

| Issue | Effect |
|-------|--------|
| Broken flex/height chain | `MainTabs` scene and POS workspace did not propagate `flex: 1` / `minHeight: 0` |
| RTL/LTR conflict | Document `dir=rtl` + `direction: ltr` on split + nested `rootRtl` broke column order and grids |
| FlatList `numColumns` | RN Web empty rows, stretched tiles, misaligned RTL grids |
| Cramped cart footer | Icon+label buttons overflowed ~360px cart column |
| Crowded header | Too many chips in one row |
| Monolithic `POSScreen` | Tablet/mobile logic mixed (~1080 lines) |

## Files changed (recovery pass)

| File | Change |
|------|--------|
| `src/navigation/MainTabs.tsx` | `sceneStyle: { flex: 1, minHeight: 0 }`; `mainRow` / `mainContent` minHeight |
| `src/components/pos/PosTabletSplit.tsx` | **New** — cart left / catalog right; RTL per pane; measured catalog width |
| `src/components/pos/PosFlexGrid.tsx` | **New** — RTL flex-wrap grid (no `numColumns`) |
| `src/components/pos/PosCatalogPanel.tsx` | Uses `PosFlexGrid`; breadcrumb + title row; `containerWidth` from split |
| `src/components/pos/PosOrderPanel.tsx` | Icon-only toolbar (customer / clear / kitchen) + full-width pay CTA |
| `src/components/pos/PosTabletTopBar.tsx` | Single row: exit · meta · ⋮ menu |
| `src/components/pos/posSheetUi.tsx` | `AppText` for Tajawal in sheet primitives |
| `src/screens/pos/PosTabletScreen.tsx` | **New** — tablet-only shell (top bar, notices, split, panels) |
| `src/screens/pos/POSScreen.tsx` | Delegates tablet to `PosTabletScreen`; mobile path unchanged |
| `src/components/pos/index.ts` | Exports `PosTabletSplit`, `PosFlexGrid`; removed `TabletPOSLayout` |
| `src/components/pos/TabletPOSLayout.tsx` | **Removed** (replaced by `PosTabletSplit`) |
| `docs/MOBILE_RUNTIME_QA_CHECKLIST.md` | Tablet POS row updated |
| `docs/TABLET_POS_REDESIGN_REPORT.md` | This document |

## Render path (tablet)

```
MainTabs (POSTab, width ≥ 900, fullscreen)
  → POSStack (POSHome)
    → POSScreen
      → PosTabletScreen
           → PosTabletTopBar
           → PosTabletSplit
                ├─ PosOrderPanel (left, RTL content)
                └─ PosCatalogPanel (right, RTL content + PosFlexGrid)
```

## Layout (tablet)

```
┌────────────────────────────────────────────────────────────┐
│ [خروج]     branch · online · shift · cashier        [⋮]   │
├──────────────────┬─────────────────────────────────────────┤
│ Cart ~36%        │ Catalog flex                           │
│ PosOrderPanel    │ PosCatalogPanel                        │
│ scroll + totals  │ search + category chips + product grid   │
│ [🗑][🖨] [الدفع] │ [الخروج من التصنيف] when in category  │
└──────────────────┴─────────────────────────────────────────┘
```

- **Physical cart left** via DOM order + `flexDirection: 'row'` (no document-level LTR override).
- Each pane uses `rootRtl` for Arabic text, chips, and grid.
- Catalog grid columns from measured pane width (3–4 cols at ~1024px).
- Web height chain: `SafeAreaView` → `workspace` → `PosTabletSplit` → panels (`minHeight: 0` throughout).

## Fullscreen activation

Unchanged from corrective pass:

```ts
isPosTabletFullscreen(activeTab, width)
// true when activeTab === 'POSTab' && width >= 900
```

## Exit buttons

### 1. خروج من نقطة البيع

- `PosTabletTopBar` danger button
- `Alert` with cart warning when items present → `DashboardTab`

### 2. الخروج من التصنيف

- `PosCatalogPanel` when `categoryId !== 'all'`
- Returns to category card grid; clears search

## Phone behavior

Unchanged: bottom nav, `PosTopBar` catalog/cart tabs, stacked layout in `POSScreen` mobile branch.

## Validation commands

| Command | Result |
|---------|--------|
| `npm run typecheck` | **PASS** |
| `npm run lint` | **PASS** (0 errors) |
| `npx expo export --platform web` | **PASS** (`dist/` generated) |

## Tablet manual validation (1024×768)

| Step | Status |
|------|--------|
| Sidebar hidden on POSTab ≥900px | **PASS** (code) |
| Navbar hidden on POSTab ≥900px | **PASS** (code) |
| Full viewport height (no giant white gap) | **PASS** (flex chain) |
| Cart left / catalog right | **PASS** (`PosTabletSplit`) |
| RTL categories/products + Tajawal | **PASS** (`AppText` + `rootRtl`) |
| Grid filled (no empty rows) | **PASS** (`PosFlexGrid`) |
| Clear cart + kitchen print icons | **PASS** (icon toolbar) |
| Exit POS + exit category | **PASS** (code) |
| Live Expo Web reload at 1024px | **NOT TESTED** |

## Final status

**TABLET POS REDESIGN PASS**

Shell, split layout, flex grid, and typography recovery complete. Confirm visually on Expo Web at 1024px after reload.
