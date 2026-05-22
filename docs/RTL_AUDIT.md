# Madar ERP Mobile — RTL Audit

**Date:** May 2026  
**Language:** Arabic (primary and only language)  
**Direction:** RTL (Right-to-Left)

---

## 1. Bootstrap Configuration

### I18nManager

`I18nManager.forceRTL(true)` is called on app bootstrap to ensure the React Native layout engine mirrors all flexbox directions, text alignment, and scroll behavior.

### NavigationContainer

The root `NavigationContainer` is configured with `direction="rtl"` to ensure navigation transitions and screen rendering follow RTL flow.

### RtlProvider

`src/components/layout/RtlProvider.tsx` wraps the app to provide RTL context to all child components.

---

## 2. Layout Constants

All RTL-aware layout constants are defined in `src/constants/layout.ts` and re-exported from `src/utils/rtl.ts`:

### Text Alignment

| Constant | Value (RTL) | Usage |
|----------|-------------|-------|
| `textStart` | `textAlign: 'right'`, `writingDirection: 'rtl'` | Arabic text paragraphs, labels, titles |
| `textEnd` | `textAlign: 'left'`, `writingDirection: 'rtl'` | Trailing text (prices on left in RTL) |
| `textCenter` | `textAlign: 'center'`, `writingDirection: 'rtl'` | Centered headings, metric values |
| `textLtr` | `textAlign: 'left'`, `writingDirection: 'ltr'` | Numbers, currency amounts, dates |

### View Direction

| Constant | Value | Usage |
|----------|-------|-------|
| `rootRtl` | `direction: 'rtl'` | Root view wrapper |
| `screenRtl` | `direction: 'rtl'` | Screen containers |
| `flexRow` | `flexDirection: 'row'` | Horizontal layouts (auto-mirrored by RTL) |
| `flexCol` | `flexDirection: 'column'` | Vertical layouts |

### Input Alignment

| Constant | Value | Usage |
|----------|-------|-------|
| `inputTextAlign` | `'right'` | All form inputs align text to the right |

### Alignment Helpers

| Constant | Value | Usage |
|----------|-------|-------|
| `alignStart` | `alignItems: 'flex-start'` | Start-aligned children |
| `alignEnd` | `alignItems: 'flex-end'` | End-aligned children |
| `alignCenter` | `alignItems: 'center'` | Center-aligned children |
| `justifyCenter` | `justifyContent: 'center'` | Center-justified content |

### Margin Helpers

`rtlMargin(side, value)` returns the correct `marginLeft` or `marginRight` based on RTL context:
- `rtlMargin('start', 16)` → `{ marginLeft: 16 }` in RTL
- `rtlMargin('end', 16)` → `{ marginRight: 16 }` in RTL

---

## 3. Icon Direction

### Chevron Forward

`chevronForwardIcon()` from `src/utils/rtl.ts`:
- RTL → returns `'chevron-left'` (points toward the "forward" direction in Arabic reading)
- LTR → returns `'chevron-right'`

Used in: `AppListItem`, `ModuleCard`, `ActionCard`, list item chevrons across all screens.

### Back Arrow

`backArrowIcon()` from `src/utils/rtl.ts`:
- RTL → returns `'arrow-forward'` (physically pointing left = "back" in RTL)
- LTR → returns `'arrow-back'`

Used in: `AppHeader` back button, navigation back arrows.

---

## 4. Drawer Direction

The sidebar drawer (`Sidebar.tsx`) slides from the **physical right edge** of the screen:

- `drawerClosedTranslateX(width)` returns `width` (off-screen to the right)
- `drawerOpenTranslateX()` returns `0` (visible)

This is correct for Arabic RTL where the menu is expected on the right side.

---

## 5. Numbers and Currency

All numeric values and currency amounts use `textLtr` to ensure:

- Digits render left-to-right (correct for Arabic-Indic or Western numerals)
- Currency symbols appear in the correct position
- Decimal points and separators are properly ordered

This applies to:
- POS totals and line item prices
- Dashboard KPI metric values
- Sale detail amounts
- Invoice totals
- Expense amounts

---

## 6. Form Inputs

All form inputs use `inputTextAlign` which resolves to `'right'` in RTL:

- Text inputs: cursor starts on the right
- Numeric inputs: text aligned right for visual consistency
- Search inputs: placeholder text appears right-aligned
- Select dropdowns: selected value right-aligned

---

## 7. Arabic Text Alignment Verification

### Dashboard
- Hero greeting: `textStart` ✓
- KPI labels: `textStart` ✓
- KPI values: `textLtr` for numbers, `textCenter` for metric cards ✓
- Section headers: `textStart` ✓

### POS
- Product names: `textStart` ✓
- Category tabs: `textCenter` ✓
- Cart line items: name `textStart`, price `textLtr` ✓
- Total amount: `textLtr` ✓

### Products
- Product list card name: `textStart` ✓
- Product detail labels: `textStart` ✓
- Product detail values: `textStart` for text, `textLtr` for numbers ✓
- Form field labels: `textStart` ✓

### Sales
- Sale list card: customer name `textStart`, amount `textLtr` ✓
- Sale detail: labels `textStart`, values `textLtr` for amounts ✓

### More Screen
- Module card labels: `textStart` ✓
- Section group headers: `textStart` ✓

### All Other Screens
- List card titles: `textStart` ✓
- Detail screen labels: `textStart` ✓
- Detail screen numeric values: `textLtr` ✓
- Empty state messages: `textCenter` ✓
- Error messages: `textStart` ✓

---

## 8. Theme-Aware Colors

All components access colors via the `useColors()` hook (`src/hooks/useColors.ts`), which reads the current theme from `themeStore` and returns the full `AppColors` object. This ensures:

- Text colors (`text`, `textMuted`, `textCaption`) adapt to light/dark
- Background colors (`surface`, `surfaceMuted`) adapt correctly
- Border colors (`border`, `borderSubtle`) adapt correctly
- No hardcoded colors in component code

---

## 9. RTL Compliance Checklist

| Item | Status |
|------|--------|
| `I18nManager.forceRTL(true)` on bootstrap | ✅ PASS |
| `NavigationContainer direction="rtl"` | ✅ PASS |
| `textStart` used for all Arabic text | ✅ PASS |
| `textLtr` used for numbers/currency | ✅ PASS |
| `inputTextAlign` used on all form inputs | ✅ PASS |
| `chevronForwardIcon()` for navigation chevrons | ✅ PASS |
| `backArrowIcon()` for back navigation | ✅ PASS |
| Drawer slides from right edge | ✅ PASS |
| `rootRtl` / `screenRtl` on screen wrappers | ✅ PASS |
| `useColors()` for theme-aware text colors | ✅ PASS |
| Flexbox row direction auto-mirrored | ✅ PASS |
| No hardcoded `left`/`right` positioning | ✅ PASS |
| Arabic labels in module definitions | ✅ PASS |
| Arabic section headers in sidebar menu | ✅ PASS |

---

## 10. Known Considerations

1. **Web platform**: `I18nManager.isRTL` may report `false` on web, so `isRtl` in `rtl.ts` includes `Platform.OS === 'web'` as a fallback since the app is Arabic-only.

2. **Start/End properties**: The codebase uses `start`/`end` (logical properties) instead of `left`/`right` where React Native supports them, ensuring automatic RTL mirroring.

3. **Image direction**: Product images and icons do not need RTL mirroring as they are non-directional content.

4. **External content**: Any user-generated content (product names, customer names) is assumed to be Arabic and rendered with `textStart`.
