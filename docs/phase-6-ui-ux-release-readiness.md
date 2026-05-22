# Phase 6 — UI/UX Tablet Polish & Internal Testing Readiness

**Date:** 2026-05-23  
**Scope:** `madar-erp-mobile/` only  
**Recommendation:** **READY FOR INTERNAL TESTING** (with external risks on store submission)

## Summary

Phase 6 hardens tablet layouts (≥900px), RTL/touch targets, pull-to-refresh coverage, subtle animations, skeleton loading, ParityModule polish, and release documentation for EAS internal builds.

## Engineering changes

| Area | Change |
|------|--------|
| Touch targets | Buttons default 44px; inputs 44px; `responsive.minTouchTarget` |
| Skeletons | `AppSkeletonList`; lists use skeleton on first load |
| POS tablet | Two-pane layout; catalog `flex:1` tiles on tablet; cart column fixed width |
| POS refresh | Pull-to-refresh on catalog via `loadCatalog` |
| POS feedback | Cart tab pulse on add; `PressableScale` on product tiles |
| Bottom sheet | Fade + slide animation (`AppBottomSheet`) |
| Reports hub | Pull-to-refresh; multi-column cards; press scale |
| ParityModule | Skeleton loading instead of spinner-only |
| Release | `app.json` / `eas.json` / `.env.example` verified (no secrets in repo) |

## Production API (internal testing)

1. Copy `.env.example` → `.env`
2. Set `EXPO_PUBLIC_API_URL` to your tenant API (must end with `/api`), e.g. `https://back-madar.amen-card.com/api`
3. Set `EXPO_PUBLIC_DEFAULT_TENANT_SLUG` if multi-tenant login requires it
4. Build: `eas build --profile preview --platform all`

Do **not** commit `.env`. Production EAS profiles use placeholder domain until replaced in EAS secrets.

## Verification (agent)

```bash
cd madar-erp-mobile
npm run typecheck
npm run lint
npx expo export --platform web
```

## Device QA still required

- iPad landscape POS (cart visible beside catalog)
- RTL screenshots (Arabic labels, chevrons, drawer from right)
- Dark mode pass
- Physical device login + offline POS smoke test

## Risks (external / post-internal)

- App Store / Play metadata and screenshots not prepared
- Crash reporting (Sentry) not wired
- Some routes still use `ParityModule` for niche web-only flows
- Report charts remain summary cards (no native chart library)
