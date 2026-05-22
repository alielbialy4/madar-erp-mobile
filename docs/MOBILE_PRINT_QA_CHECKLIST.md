# Mobile Print & Offline QA Checklist

Use **PASS** / **FAIL** / **NOT TESTED** for each item on a physical device (not Expo Go for TCP/BT).

| # | Scenario | Result | Notes |
|---|----------|--------|-------|
| 1 | Network Rongta / Rongta RP Ethernet test | NOT TESTED | TCP 9100 + Dev Client |
| 2 | Xprinter XP-80 Ethernet test | NOT TESTED | |
| 3 | Android Bluetooth paired printer | NOT TESTED | Dev build only |
| 4 | iOS network printer (local network permission) | NOT TESTED | |
| 5 | iOS AirPrint fallback (dialog) | NOT TESTED | |
| 6 | Arabic receipt test (text codepage) | NOT TESTED | |
| 7 | Cut paper after receipt | NOT TESTED | |
| 8 | Kitchen ticket print | NOT TESTED | Local routing |
| 9 | Offline order save + receipt job | NOT TESTED | Shows غير مزامنة |
| 10 | Failed print retry | NOT TESTED | Print queue screen |
| 11 | Offline sync retry after reconnect | NOT TESTED | Sync status |
| 12 | No duplicate sync (same client_uuid) | NOT TESTED | Backend duplicate status |
| 13 | Paper width 58mm layout | NOT TESTED | |
| 14 | Paper width 80mm layout | NOT TESTED | |
| 15 | typecheck + lint + web export | NOT TESTED | CI/local |

## Validation scenarios (expected)

**A) Offline order save** — local queue + pending count + receipt job; no server invoice.

**B) Network printer test** — connect IP:9100; test + Arabic + cut.

**C) Android Bluetooth** — permissions + test or clear blocked message.

**D) iOS** — network preferred; BT limitation visible.

**E) Failed print** — failed status + retry.

**F) Sync reconnect** — pending syncs; duplicate safe via UUID.
