# Release Checklist — Internal Testing (iOS / Android)

## App identity

| Field | Value |
|-------|--------|
| App name | Madar ERP |
| iOS bundle | `com.madar.erp.mobile` |
| Android package | `com.madar.erp.mobile` |
| Version | `1.0.0` (app.json) |
| Scheme | `madarerp` |
| Splash / icon bg | `#0F172A` (navy, matches web) |

## Environment

1. Copy `mobile/.env.example` → `mobile/.env`.
2. Set `EXPO_PUBLIC_API_URL` to your staging API (never ship localhost as production default).
3. Optional: `EXPO_PUBLIC_DEFAULT_TENANT_SLUG` for multi-tenant login.
4. Confirm no secrets committed (tokens only in SecureStore at runtime).

## EAS builds (when credentials ready)

```bash
cd mobile
npx eas build --platform ios --profile preview
npx eas build --platform android --profile preview
```

See `mobile/eas.json` for profiles.

## Device testing matrix

| Test | iOS Simulator | Android Emulator | Physical device |
|------|---------------|------------------|-----------------|
| Login + branch switch | Required | Required | Required |
| POS sale E2E | Required | Required | Required |
| RTL drawer + tabs | Required | Required | Required |
| Offline banner + queue | Optional | Optional | Recommended |
| Push notifications | N/A | N/A | If enabled later |

## Known risky modules (read-only or partial on mobile)

- Driver settlements, delivery finance settlements — read-only parity
- Backup — disabled on mobile by design
- Branch edit, payment create — read-only parity
- Stock count posting, reorder rule edit — deferred
- Waiter flow — partial (dining halls reference)

## Permissions / privacy

- Network: API calls only
- Secure storage: auth token
- No camera/location required for current build
- Document data collection in App Store privacy form if publishing externally

## Screenshot checklist (App Store Connect / Play Console)

1. Dashboard (Arabic, stats visible)
2. POS catalog + cart
3. Products list
4. Sales list
5. More — module groups
6. Drawer open
7. Kitchen or Dining (if restaurant tenant)

## Blockers for public store (not internal test)

- Production API URL + SSL
- Apple/Google developer accounts
- Privacy policy URL
- Physical POS hardware testing (printers) — web-first

## Pre-flight commands

```bash
cd mobile
npm install
npm run typecheck
npm run lint
npx expo export --platform web
```
