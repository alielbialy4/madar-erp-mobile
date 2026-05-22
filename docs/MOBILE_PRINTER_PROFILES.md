# Mobile Printer Profiles

## Fields

| Field | Description |
|-------|-------------|
| id | UUID |
| name | Display name |
| role | cashier, kitchen, bar, shift, report |
| connection_type | network_tcp, bluetooth_android, airprint_ios, vendor_sdk, disabled |
| paper_width | 58mm, 80mm |
| ip / port | Network (default port 9100) |
| bluetoothAddress | Android MAC |
| airprintName | iOS hint |
| mode | escpos_text, escpos_image, airprint |
| encoding | cp864, cp720, windows1256, utf8_image |
| characters_per_line | 32 (58mm) or 48 (80mm) |
| cut_paper | GS V cut command |
| enabled | Master switch |

## UI

- **Settings → ملفات الطابعات** — list / add / edit
- **تشخيص الطباعة** — test connection, test page, Arabic test
- **قائمة انتظار الطباعة** — pending / failed / retry

## Target hardware

- Rongta / Rongta RP Ethernet (TCP 9100)
- Xprinter XP-80 Ethernet (TCP 9100)
- Generic ESC/POS 58/80mm
- Android Bluetooth Classic (Dev build)
- iOS: prefer network; AirPrint fallback
