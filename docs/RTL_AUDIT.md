# RTL Audit — Madar ERP Mobile

## Global approach (root fix)

1. **Bootstrap** (`src/bootstrap/rtl.ts`) — imported first in `App.tsx`:
   - `I18nManager.allowRTL(true)` + `forceRTL(true)` + `swapLeftAndRightInRTL(true)`
   - Web: `document.documentElement.dir = 'rtl'`, `lang=ar`
2. **Providers**: `RtlProvider` + `NavigationContainer direction="rtl"`
3. **Layout tokens** (`constants/layout.ts`): `rootRtl`, `screenRtl`, `textStart`, `inputTextAlign`, logical `start`/`end`
4. **Typography**: `AppText` defaults to `textStart`; inputs use `inputTextAlign`
5. **Numbers / IDs**: `textLtr` / `metaLtr` for money and invoice lines
6. **Icons**: `chevronForwardIcon()` / `backArrowIcon()` in `utils/rtl.ts`
7. **Drawer**: `start: 0` (logical start = right in RTL) + slide animation
8. **Stacks**: `rtlStackScreenOptions` on all native stacks

## Fixed in navigation UX refactor

| Area | Fix |
|------|-----|
| Top bar | Minimal chips only; branch truncates; badges use logical layout |
| Bottom navigation | Five high-frequency tabs; centered Arabic labels; press pulse |
| Drawer | Anchored `right: 0` (physical right); closed `translateX = width` → open `0` (slides in from right); `translateX` ignores layout mirroring |
| More hub | Section cards `textStart`; 2/3-column grid; toolbar RTL |
| Command palette | Modal search, `textStart` labels, RTL chevrons on rows |
| Navbar notification badge | Absolute top-right (mirrors with RTL layout direction on parent) |
| Theme toggle | Moved to drawer footer (removed from crowded top bar) |

## Screens verified (static / web export)

- Login, Dashboard, POS (catalog/cart tabs), Products, Sales, More (grouped), Drawer, Settings, Profile
- List screens via `CrudListScreen` + `ResourceList` pull-to-refresh
- Parity read-only modules

## Remaining risks

| Issue | Severity | Note |
|-------|----------|------|
| `I18nManager.forceRTL` not enabled | Low | Manual `direction: 'rtl'` used; avoids restart requirement on iOS |
| Some third-party modals | Low | React Navigation modals inherit container direction |
| Complex POS tablet split | Medium | Two-column layout LTR-neutral; tested at width ≥ 900 |

## Screenshot checklist (manual on device)

- [ ] Login — labels right-aligned
- [ ] Dashboard — stat cards RTL, numbers readable
- [ ] POS phone — categories scroll, cart tab
- [ ] Products list — search + cards
- [ ] Drawer open — menu from right, search works
- [ ] Bottom tabs — five Arabic labels, active state clear
- [ ] More — eight module hub sections + بحث سريع / كل الشاشات
- [ ] Command palette — search and navigate
- [ ] Sale detail — invoice number LTR
- [ ] Settings / Profile — forms aligned
