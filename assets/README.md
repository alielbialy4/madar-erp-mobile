# Mobile app assets

Brand artwork is generated from the Madar logo (`front/public/logo.png`) via:

```bash
python3 scripts/generate-brand-assets.py
```

That script writes:

- `logo.png` — transparent-background Madar mark for in-app `BrandLogo`
- `icon.png` — 1024×1024 launcher icon (white mark on `#0F172A`)
- `adaptive-icon.png` — Android adaptive foreground (safe-zone mark)
- `splash.png` — splash screen with centered Madar mark
- `favicon.png` — web favicon
- Android `mipmap-*` / splash drawables and iOS `AppIcon`

After regenerating icons, rebuild the native app so the home-screen icon updates:

```bash
npx expo run:android --device
# or
npx expo run:ios
```
