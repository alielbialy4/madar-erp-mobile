# Mobile Runbook

## Setup

```bash
cd mobile
npm install
cp .env.example .env
```

Set:

```bash
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_DEFAULT_TENANT_SLUG=
```

## Development Commands

```bash
npm start
npm run ios
npm run android
npm run web
npm run typecheck
npm run lint
npx expo export --platform web
```

## Physical Phone

- Do not use `localhost` for a physical phone.
- Use your Mac LAN IP, for example `http://192.168.1.100:8000/api`.
- Android emulator can use `http://10.0.2.2:8000/api`.
- iOS simulator can use `http://localhost:8000/api`.

## Clear Expo Cache

```bash
npm start -- --clear
```

## Reset Local Storage

- Logout from the profile menu.
- Clear Expo app data on the device if auth/session/cache persists.
- For offline POS queue testing, use `المزيد` → `حالة المزامنة` → clear failed orders after confirmation.

## Production/Internal Testing

- Set production `EXPO_PUBLIC_API_URL` in `.env`, EAS profile env, or CI.
- Verify tenant slug if the API requires `X-Tenant-Slug`.
- Do not commit real secrets or tokens.
- `app.config.js` enables cleartext/local networking only when `EXPO_PUBLIC_API_URL` starts with `http://`.

## EAS

`mobile/eas.json` is present for internal handoff. Typical commands:

```bash
npx eas login
npx eas build:configure
npx eas build --profile preview --platform ios
npx eas build --profile preview --platform android
```

Do not run remote builds until Apple/Google credentials and production API env are confirmed.
