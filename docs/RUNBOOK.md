# Mobile Runbook

## Setup

```bash
cd madar-erp-mobile
npm install
cp .env.example .env
```

Set:

```bash
EXPO_PUBLIC_API_URL=https://your-api-domain.com/api
EXPO_PUBLIC_DEFAULT_TENANT_SLUG=
```

## Development Commands

### UI only (Expo Go — no TCP / Bluetooth printing)

```bash
npm start
npm run android
npm run ios
npm run web
```

### Printing + native modules (Dev Client — recommended on device)

Build the dev client **once**, install the APK, then use Metro for live reload:

```bash
# One-time
npm run build:dev-client

# Daily development (phone + Mac on same Wi-Fi)
npm run start:dev
# or open directly on Android:
npm run android:dev
```

Expo Go cannot load `react-native-tcp-socket` or Bluetooth ESC/POS. Use the dev client APK for printer testing.

### Other

```bash
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

`madar-erp-mobile/eas.json` is present for internal handoff. Typical commands:

```bash
npx eas login
npx eas init   # first time only — links projectId in app.json (requires eas-cli in devDependencies)
npm run build:dev-client   # dev APK + Metro (printing works, live reload)
npm run build:apk          # standalone preview APK (no Metro needed)
npx eas build --profile preview --platform ios
```

Do not run remote builds until Apple/Google credentials and production API env are confirmed.
