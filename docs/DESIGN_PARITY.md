# Mobile ↔ Web Design Parity

Mobile UI tokens are aligned with `front/src/design-system/globals.css` (light theme).

## Color mapping

| Web token | Mobile constant | Hex |
|-----------|-----------------|-----|
| `--primary` | `colors.primary` | `#0F172A` |
| `--brand-accent` / `--ring` | `colors.accent` | `#2563EB` |
| `--background` | `colors.background` | `#F8FAFC` |
| `--card` | `colors.surface` | `#FFFFFF` |
| `--secondary` | `colors.surfaceMuted` | `#F1F5F9` |
| `--border` | `colors.border` | `#E2E8F0` |
| `--muted-foreground` | `colors.textMuted` | `#64748B` |
| Semantic success/warning/danger/info | `colors.success` etc. | See `colors.ts` |

**Removed:** legacy purple brand (`#8B5CF6`) — it was not used on web.

## Typography

| Web | Mobile |
|-----|--------|
| Google Fonts `Tajawal` (300–900) | `@expo-google-fonts/tajawal` via `FontProvider` |
| `font-family: Tajawal, sans-serif` | `AppText` maps `fontWeight` → Tajawal variant |
| Inputs inherit Tajawal | `AppInput` uses `fonts.medium` on `TextInput` |
| Navigation labels | React Navigation `theme.fonts` + tab `fontFamily` |

Weights loaded: 400, 500, 700, 800, 900 (same as web index.html).

## Components

| Web | Mobile |
|-----|--------|
| `Button` default (navy) | `AppButton` primary |
| `Card` rounded-xl + border | `AppCard` |
| `Badge` semantic soft | `AppBadge` |
| `StatsCard` | `AppStatCard` |
| Login split panel (navy + white) | `LoginScreen` |
| Bottom nav icons | `MainTabs` + MaterialIcons |
| POS category chip (soft) | `POSScreen` category chips |
| Payment method (solid navy) | `AppSelect` variant `solid` |

## Header & sidebar (web parity)

| Web (`header.tsx`) | Mobile (`Navbar.tsx`) |
|--------------------|------------------------|
| Menu → sidebar drawer | Menu → `Sidebar` modal |
| Quick nav: Home, Products, Sales, POS | Same tabs + cashier hides non-POS |
| `BranchSwitcher` | Branch sheet (tap chip) |
| Online / offline chip | Same |
| Sync now | `syncAll()` button |
| `NotificationDropdown` | Bell + unread badge → Notifications |
| User menu (profile, settings, logout) | Bottom sheet menu |
| Theme / fullscreen | Omitted on mobile v1 |

| Web (`buildSidebarMenu.ts` + `sidebar.tsx`) | Mobile |
|---------------------------------------------|--------|
| Permission / plan / branch filters | `buildMobileSidebarMenu()` (same source file, mapped routes) |
| Nested groups + chevron | Collapsible groups in `Sidebar.tsx` |
| Logo + app name | Logo mark + "Madar Pos" |
| Footer `v3.5.0` | Same |

Menu source: `mobile/src/navigation/buildSidebarMenu.ts` (copy of `front/src/Layouts/buildSidebarMenu.ts`). Web-only routes are hidden when no mobile screen exists (`sidebarNavMap.ts`).

## Not replicated on mobile (by design)

- Dark mode toggle (light theme only for v1)
- Tenant theme color override from settings (uses default navy/blue tokens)
- Fullscreen toggle
- Offline bootstrap dropdown (failed orders detail) — use Sync status screen
- Web-only report / inventory sub-routes until mobile screens exist

## Refresh assets after token change

```bash
node scripts/generate-placeholder-assets.mjs
```

Replace `assets/*.png` with production brand files when ready.
