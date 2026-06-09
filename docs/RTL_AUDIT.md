# Madar ERP Mobile — RTL Audit

**Date:** June 2026  
**Language:** Arabic (primary and only language)  
**Direction:** RTL (Right-to-Left)

---

## 1. Bootstrap Configuration

### Single RTL flag

Runtime text uses **`APP_IS_RTL = true`** in `src/bootstrap/rtl.ts`.

**Do not use `I18nManager.isRTL` for text alignment** — it is frozen at module load and does not update after `forceRTL()`.

### I18nManager (native)

- `I18nManager.allowRTL(true)` + `I18nManager.forceRTL(true)` — mirrors flex rows and logical start/end
- **`swapLeftAndRightInRTL` is disabled**
- **Shell views (`rootRtl`, `screenRtl`) are `flex: 1` only** — no `direction` style (avoids double-mirror with forceRTL)
- **`contentAreaRtl`** — `direction: 'rtl'` only inside tablet LTR shell row

### RN left/right swap (critical)

In RTL layout mode, React Native maps physical `left`/`right` in styles:

| Code | Screen (RTL layout) |
|------|---------------------|
| `textAlign: 'right'` | **visual left** (wrong for Arabic labels) |
| `textAlign: 'left'` | **visual right** |
| `textAlign: 'start'` | **visual right** (correct — use this) |
| `textAlign: 'end'` | **visual left** (correct for numbers) |

**Rule:** Arabic text uses **`textAlign: 'start'`** on native, **`'right'`** on web. Never `'right'` for Arabic on native RTL layout.

### Web document

- `dir="rtl"` and `lang="ar"` on `<html>`, `<body>`, `#root`
- Injected CSS in `src/bootstrap/typography.ts`

### Early text defaults

- `applyEarlyRtlDefaults()` in `App.tsx` before fonts — `writingDirection: 'rtl'` + `textAlignStart`

### NavigationContainer

`direction="rtl"` on root navigator.

---

## 2. Text layer

### AppText / AppTextInput

- `resolveTajawalFontOnly()` — fonts only; no textAlign/writingDirection passthrough
- Trailing style: `textAlignStart` (native `start`, web `right`) for all Arabic text
- `numeric` → `textLtr` (native `end`, web `left`)
- `align="center"` → skip forced start

### Layout constants

| Constant | Purpose |
|----------|---------|
| `textAlignStart` / `textStart` | Arabic — native `start`, web `right` |
| `textLtr` | Numbers — native `end`, web `left` |
| `textAlignEnd` / `textEnd` | Trailing edge |
| `inputTextAlign` | TextInput prop — native `left` (swap → visual right), web `right` |

---

## 3. Tablet shell

- `tabletShellRow` — `direction: 'ltr'` → `[content | sidebar]`, sidebar on physical right
- `contentAreaRtl` — applied **only when tablet sidebar visible**

## 3b. Portrait drawer (`Sidebar.tsx`)

- `drawerShellLtr` on `RtlModalRoot` — physical LTR modal root (same principle as tablet shell)
- Drawer panel positioned with `left: screenWidth - SIDEBAR_WIDTH` inside the LTR shell (physical right)
- `sidebarAreaRtl` on drawer content — Arabic labels and menu rows stay RTL
- `drawerClosedTranslateX(+width)` — slides panel off the right edge when closed

---

## 4. Verification

1. Close app fully on device (not hot reload)
2. `expo start --dev-client -c`
3. Dashboard: Arabic labels **right**, numbers **left**
4. Tablet ≥900px: sidebar **right**
5. No EAS rebuild needed for JS-only RTL changes
