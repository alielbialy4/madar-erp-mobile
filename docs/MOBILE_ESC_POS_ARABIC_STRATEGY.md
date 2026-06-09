# ESC/POS Arabic Strategy (Mobile)

## Modes

### 1. ESC/POS text (`escpos_text`)

- Code pages: CP864, CP720, Windows-1256 via `ESC t n` (table preset: Epson 37/32/50 or Clone 22/32/50).
- Bytes produced by pure-JS SBCS tables (Windows-1256 / CP864 / CP720) — not raw UTF-8.
- Arabic shaping via `arabic-persian-reshaper` before encoding.
- Works on printers with Arabic firmware/codepage support.
- **Limitation:** BiDi for mixed Arabic + Latin may still be imperfect; disconnected letters possible on some firmware.

### 2. ESC/POS raster (`escpos_image` / `utf8_image`)

- **Status: implemented**
- `ReceiptPrintCaptureHost` renders receipt RTL (Tajawal) off-screen.
- `react-native-view-shot` captures PNG base64.
- **TCP:** PNG → 1-bit → `GS v 0` via `escposRaster.ts`.
- **Bluetooth:** `BluetoothEscposPrinter.printPic(base64, { width, paperSize })`.
- **Recommended** for production Arabic on mixed printer brands.

## Default for new profiles

- `encoding: utf8_image`
- `mode: escpos_image`
- `code_page_preset: generic_clone`

## Test content (Arabic test)

- فاتورة بيع
- منتج تجريبي
- الإجمالي 123.45 ج.م
- رقم الفاتورة
- التاريخ

Use **اختبار الترميزات** in printer settings to print: Windows-1256, CP864, UTF-8 text, UTF-8 image.

## Offline receipts

Always show banner: `غير مزامنة` when `is_offline_unsynced` is true.
