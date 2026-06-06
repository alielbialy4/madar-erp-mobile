# UI/UX QA Checklist — Madar ERP Mobile

Per-module gate before marking a module as polished.

## Visual consistency

- [ ] Light mode screenshots captured
- [ ] Dark mode screenshots captured
- [ ] Tenant primary color override verified
- [ ] No hardcoded hex outside `src/constants/colors.ts` (`npm run check:colors`)

## List screens

- [ ] Uses `ListScreenLayout` or upgraded `CrudListScreen`
- [ ] `ModuleHero` with stats or compact hero
- [ ] Search via `AppSearchField` or list header search
- [ ] Skeleton loading (`AppSkeletonList`) — not spinner-only text
- [ ] Empty state with CTA (`AppEmptyState` + `ctaLabel`)
- [ ] FAB for create when permission allows

## Detail screens

- [ ] Uses `DetailScreenLayout` — not flat key-value dump
- [ ] Hero with title, badge, amount/icon
- [ ] Grouped section cards

## Form screens

- [ ] Uses `FormScreenLayout` or `SheetFormLayout`
- [ ] `FormSection` for grouped fields
- [ ] Long selects via `AppPicker` (>5 options)
- [ ] Sticky save footer
- [ ] Toast on successful mutation (`useToast`)
- [ ] Haptic feedback on save/error where appropriate

## Shell

- [ ] `AppHeader` responsive (branch pill hidden <360px)
- [ ] Offline state via `AppBanner` / `OfflineBanner`
- [ ] Keyboard-safe scrolling on forms

## Tablet

- [ ] Layout checked at ≥768px and ≥900px
- [ ] Persistent sidebar parity where applicable

## Accessibility

- [ ] Touch targets ≥44pt on icon-only buttons
- [ ] `accessibilityLabel` on icon-only controls

## Modules (20)

| Module | Light | Dark | Tenant | List | Detail | Form |
|--------|-------|------|--------|------|--------|------|
| auth | | | | — | — | |
| dashboard | | | | — | — | — |
| products | | | | | | |
| inventory | | | | | | |
| pos | | | | — | — | |
| sales | | | | | | |
| purchases | | | | | | |
| settings | | | | | | |
| delivery | | | | | | |
| kitchen | | | | | | |
| dining/waiter | | | | — | — | |
| refunds | | | | | | |
| expenses | | | | | | |
| coupons | | | | | | |
| customers | | | | | | |
| suppliers | | | | | | |
| vaults | | | | | | |
| notifications | | | | | | |
| reports | | | | — | — | — |

## Primitive infra (must be zero)

- [ ] No `ParityModuleScreen` for user-facing routes
- [ ] No generic `DetailScreen` key-value-only usage
- [ ] `CrudListScreen` only as thin `ListScreenLayout` adapter during migration
