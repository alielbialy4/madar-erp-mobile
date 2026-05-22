# ESC/POS Arabic Strategy (Mobile)

## Modes

### 1. ESC/POS text (`escpos_text`)

- Code pages: CP864 (default), CP720, Windows-1256 via `ESC t n`.
- Works on printers with Arabic firmware/codepage support.
- Arabic test receipt lines included in `buildArabicTestEscPos`.
- **Limitation:** RTL shaping not applied in text mode; complex Arabic may render incorrectly.

### 2. ESC/POS raster (`escpos_image` / `utf8_image`)

- Render receipt as bitmap (RTL), send `GS v 0` raster.
- **Status:** adapter interface reserved; full raster pipeline not implemented in this phase.
- **Recommended** for production Arabic on mixed printer brands.

## Test content (Arabic test)

- فاتورة بيع
- منتج تجريبي
- الإجمالي 123.45 ج.م
- رقم الفاتورة
- التاريخ

## Offline receipts

Always show banner: `غير مزامنة` when `is_offline_unsynced` is true.
