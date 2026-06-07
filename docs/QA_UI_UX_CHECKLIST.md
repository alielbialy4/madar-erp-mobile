# UI/UX QA Checklist — Madar ERP Mobile

Per-module gate before marking a module as polished.

## Visual consistency

- [x] Light mode screenshots captured
- [ ] Dark mode screenshots captured
- [x] Tenant primary color override verified
- [x] No hardcoded hex outside `src/constants/colors.ts` (`npm run check:colors`)

## List screens

- [x] Uses `ListScreenLayout` or `ListScreenTemplate` (not legacy `CrudListScreen`)
- [x] `ModuleHero` with stats or compact hero
- [x] Search via `AppSearchField` or list header search
- [x] Skeleton loading (`AppSkeletonList`) — not spinner-only text
- [x] Empty state with CTA (`AppEmptyState` + `ctaLabel`)
- [x] FAB for create when permission allows

## Detail screens

- [x] Uses `DetailScreenLayout` (directly or via `DetailScreen` wrapper)
- [x] Hero with title, badge, amount/icon
- [x] Grouped section cards

## Form screens

- [x] Uses `FormScreenLayout` or `SheetFormLayout`
- [x] `FormSection` for grouped fields
- [x] Long selects via `AppPicker` (>5 options)
- [x] Sticky save footer
- [x] Toast on successful mutation (`useToast`)
- [x] Haptic feedback on save/error where appropriate

## Shell

- [x] `AppHeader` responsive (branch pill hidden <360px)
- [x] Offline state via `AppBanner` / `OfflineBanner`
- [x] Keyboard-safe scrolling on forms

## Tablet

- [ ] Layout checked at ≥768px and ≥900px
- [ ] Persistent sidebar parity where applicable

## Accessibility

- [x] Touch targets ≥44pt on icon-only buttons
- [ ] `accessibilityLabel` on icon-only controls

## CI gates

- [x] `npm run check:ui` — list/form adoption thresholds
- [x] `npm run check:colors` — token-only colors

## Modules (20)

| Module | Light | Dark | Tenant | List | Detail | Form |
|--------|-------|------|--------|------|--------|------|
| auth | x | | x | — | — | x |
| dashboard | | | | — | — | — |
| products | x | | x | x | x | x |
| inventory | x | | x | x | x | x |
| pos | x | | x | — | — | — |
| sales | x | | x | x | x | — |
| purchases | x | | x | x | x | x |
| settings | x | | x | x | x | x |
| delivery | x | | x | x | x | x |
| kitchen | x | | x | x | x | x |
| dining/waiter | x | | x | x | — | x |
| refunds | x | | x | x | — | — |
| expenses | x | | x | x | — | x |
| coupons | x | | x | x | — | x |
| customers | x | | x | x | x | x |
| suppliers | x | | x | x | x | — |
| vaults | x | | x | x | x | — |
| notifications | x | | x | x | — | — |
| reports | x | | x | — | — | — |

## Primitive infra (must be zero)

- [ ] No `ParityModuleScreen` for user-facing routes (fallback route kept for nav parity)
- [x] No generic flat key-value-only detail dumps in migrated modules
- [x] `CrudListScreen` removed — use `ListScreenTemplate` directly
