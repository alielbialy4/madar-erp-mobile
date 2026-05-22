# Mobile Print Platform Limitations

## React Native reality

- No `window.print()`.
- Expo Go cannot load custom native TCP/Bluetooth modules.
- Use **Expo Dev Client** + `npx expo prebuild` for production printing.

## Per platform

### Android

| Mode | Silent | Notes |
|------|--------|-------|
| network_tcp | Yes* | *Requires `react-native-tcp-socket` |
| bluetooth_android | Yes* | *Requires BT ESC/POS library + permissions in `app.json` |

Permissions declared: `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `ACCESS_FINE_LOCATION` (legacy pairing).

### iOS

| Mode | Silent | Notes |
|------|--------|-------|
| network_tcp | Yes* | *Requires TCP module + `NSLocalNetworkUsageDescription` |
| airprint_ios | No | System print dialog |
| bluetooth | No | Classic BT ESC/POS not available without MFi/vendor SDK |

Messages shown in app:

- الطباعة الصامتة عبر البلوتوث غير مدعومة على iOS إلا بطابعات مدعومة أو SDK خاص.
- استخدم طابعة شبكة Ethernet للحصول على أفضل تجربة طباعة على iOS.

### Web (expo export)

TCP and Bluetooth blocked; printing UI remains for configuration/testing only.

## Recommended production setup

1. Ethernet ESC/POS (Rongta / Xprinter) on `IP:9100`.
2. Dev Client build with `react-native-tcp-socket`.
3. Arabic: plan for raster mode on problematic printers.
