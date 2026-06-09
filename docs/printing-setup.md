# Printing Setup Guide

> Single-source practical guide for getting ESC/POS thermal printers working with the mobile app.
> See also: [MOBILE_PRINT_ENGINE.md](./MOBILE_PRINT_ENGINE.md) (architecture), [MOBILE_PRINTER_PROFILES.md](./MOBILE_PRINTER_PROFILES.md) (field reference).

---

## 1. Build the dev client (required)

Expo Go **cannot** load the native modules needed for raw TCP / Bluetooth printing. You must build a development client.

```bash
# One-time: install deps (includes react-native-tcp-socket, react-native-bluetooth-escpos-printer, react-native-view-shot, expo-print)
npm install

# Build a dev client APK for Android (once, and again after adding native modules)
npm run build:dev-client
```

Install the resulting APK on the device. For day-to-day work, run `npm run start:dev` on your Mac (same Wi-Fi as the phone) and open the **Madar ERP** dev client — JS changes reload without reinstalling the APK.

Launch the dev client instead of Expo Go for all printing-related development.

### Arabic receipt images (`utf8_image`)

If Metro logs `react-native-view-shot: RNViewShot is undefined`, the **current APK was built without** the view-shot native module (common with Expo Go or an old dev client). **Rebuild and reinstall** the dev client APK — `utf8_image` cannot work until then.

Until you rebuild, use **CP864 + Clone** text encoding as a temporary workaround, or run **طباعة جداول code page** to find the correct table number.

---

## 2. Network printer (TCP 9100) — recommended

### Sanity check from laptop

Before configuring in-app, verify the printer is reachable on the LAN:

```bash
nc -vz 192.168.1.150 9100
# Expected: Connection to 192.168.1.150 9100 port [tcp/*] succeeded!
```

If this fails, the mobile app will also fail. Check:
- Printer and phone on the same Wi-Fi network.
- Printer has a static IP (or DHCP reservation).
- No firewall blocking port 9100.

### In-app configuration

1. Go to **Settings → Branch Settings → Printing tab**.
2. Under **طابعة الكاشير** (Cashier printer), tap the profile picker.
3. If no profiles exist, tap **+ إضافة طابعة** to create one:
   - **Name**: e.g. "كاشير رئيسي"
   - **Role**: cashier (or kitchen for kitchen tickets)
   - **Connection**: TCP Network
   - **IP**: `192.168.1.150`
   - **Port**: `9100`
   - **Paper width**: 80mm (48 chars/line) or 58mm (32 chars/line)
   - **Encoding**: `utf8_image` (recommended for Arabic — renders receipt as image)
4. Tap **اختبار الاتصال** — should show "متصل" (connected).
5. Tap **اختبار الطباعة** — should print a test receipt with Arabic text.

### Troubleshooting TCP

| Symptom | Likely cause | Fix |
|---------|-------------|-----|
| Connection timeout | Wrong IP or printer off | Verify with `nc -vz <ip> 9100` |
| Connection refused | Printer not listening on 9100 | Check printer network config |
| Prints garbage / squares | Wrong encoding or no Arabic ROM | Use **UTF-8 صورة** or try **Windows-1256**; tap **اختبار الترميزات** |
| Arabic letters disconnected | Text mode without shaping | Use **UTF-8 صورة** (raster) for production |
| Prints blank | Paper loaded incorrectly | Hardware issue |
| Very slow / partial prints | Unstable Wi-Fi | Use wired LAN for printer, strong Wi-Fi for device |

---

## 3. Bluetooth printer (Android only)

### Pair first

1. **Settings → Bluetooth** (Android system) → pair the printer.
2. Note the MAC address (e.g. `00:11:22:33:44:55`).

### In-app configuration

1. **Settings → Branch Settings → Printing tab**.
2. Create a profile with:
   - **Connection**: Bluetooth (Android)
   - **MAC address**: the paired device's MAC
   - **Encoding**: `utf8_image` (uses `printPic` — proven Arabic fix)
3. Tap **اختبار الاتصال** — the app will request BT permissions on first use, then verify the device is reachable.

> **Note:** The `@vardrz/react-native-bluetooth-escpos-printer` library does **not** expose raw `printRaw`. Text modes use `printText` with Windows-1256/CP864; Arabic production uses raster (`printPic`).

### BT permissions

The app requests these at runtime:
- `BLUETOOTH_SCAN` / `BLUETOOTH_CONNECT` (Android 12+)
- `ACCESS_FINE_LOCATION` (Android 11 and below, needed for BLE discovery)

If the user denies, printing silently fails. Retry from **Branch Settings → Printing**.

---

## 4. AirPrint (iOS fallback)

On iOS, AirPrint is the fallback when no TCP printer is configured. It renders the ESC/POS buffer as monospace HTML (lossy: no barcodes, no raw ESC commands) and presents the standard AirPrint picker.

This is **not** the primary path — use TCP for production. AirPrint is only useful for quick demos on AirPrint-capable printers.

---

## 5. Branch scoping

Each printer profile belongs to a branch. When you switch branches (via the branch picker), the app shows only that branch's profiles plus any shared (branch-less) profiles.

**First-run migration**: On app launch, any legacy profiles without `branch_id` are automatically stamped with the active branch's ID. This runs once (flag: `madar.print.profiles_migrated_v1` in AsyncStorage) and is idempotent.

To share a profile across all branches, explicitly leave `branch_id` unset (edit the profile → advanced → clear branch field).

---

## 6. Cashier + multiple kitchen printers (same logic as desktop)

On mobile you use **local printer profiles** (IP:9100 or Bluetooth), not Windows printer names. The business flow matches the Electron front:

1. **Cashier receipt** — one `PrinterProfile` with role `cashier` (TCP IP). Select it in **Branch Print Settings** and enable **auto print after sale**.
2. **Kitchen printers (server)** — add logical kitchen printers on the server (**Branch Kitchen Printers**), same records as the web app.
3. **Device binding** — on each phone/tablet, map each server kitchen printer → the local profile with the correct IP (**server_printer_map**).
4. **Routing** — assign categories/products to a kitchen printer (**Branch Kitchen Routing**).

After checkout: receipt goes to the cashier profile; kitchen lines are grouped per bound IP and printed as separate ESC/POS tickets.

**Important:** If `use_server_kitchen_print_queue` is enabled, mobile **skips** local kitchen printing (there is no desktop worker on the phone). Disable it when using IP printers on the device.

---

## 7. Encoding reference

| Encoding | Use case | Notes |
|----------|----------|-------|
| `utf8_image` | **Recommended** — Arabic on all brands | Receipt captured as RTL image (Tajawal); TCP sends `GS v 0`, BT sends `printPic` |
| `windows1256` | Fast text on TCP printers with Arabic ROM | Single-byte; may show disconnected letters without shaping |
| `cp864` | Legacy Arabic text | Set code page preset: Epson (37) vs Clone (22) |
| `cp720` | Old Epson TM-T88II/III | Rarely needed |
| `utf8` | Printers with dedicated Arabic UTF-8 ROM only | Most IP clones **do not** support this |

### Code page table (ESC t)

| Preset | CP864 | CP720 | Windows-1256 |
|--------|-------|-------|--------------|
| Epson / standard | 37 | 32 | 50 |
| Clone / Xprinter | 22 | 32 | 50 |

Use **اختبار الترميزات** in printer advanced settings to print four samples and pick the best mode.

The `codePage('utf8')` call in `escposBuilder` is a **no-op**: it does not emit `ESC t` because that would corrupt multi-byte UTF-8 sequences on the printer.

---

## 8. Testing without a printer

Unit tests verify the ESC/POS byte builder and profile branch-scoping logic:

```bash
npm run test:unit
```

This runs:
- `coercePendingOrder.spec.ts` — offline order shape
- `posDining.spec.ts` — table/dining logic
- `posTotals.spec.ts` — branch print settings merged into POS catalog
- `escposBuilder.spec.ts` — ESC/POS commands + SBCS single-byte Arabic
- `printerProfiles.spec.ts` — branch filtering + migration

These run in pure Node (no native modules needed).

---

## 9. POC reference

`mobile_print_test/` (repo root) is a standalone Expo SDK 51 POC that proved Arabic UTF-8 over TCP works. It is kept as a reference but is **not** part of the main app build. If the main app's printing breaks, run the POC against the same printer to isolate hardware vs. software issues.
