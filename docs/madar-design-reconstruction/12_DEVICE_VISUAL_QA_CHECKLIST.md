# 12 — Device Visual QA Session Checklist

**Purpose:** Convert structural NO-GO into evidence-based PASS/FAIL.  
**Rule:** No PASS without phone + tablet (or large phone) captures, light + dark where supported, and RTL sanity.

## Prep
- [ ] Android build running (`expo run:android --device`) with latest bundle reload
- [ ] Active branch + cashier/admin credentials for ops flows
- [ ] Sample data: open table, kitchen ticket, unpaid supplier, pending offline sale if possible
- [ ] Capture folder: `docs/madar-design-reconstruction/captures/` (create if missing)

## Critical path (must score ≥ 9.2 avg)
| # | Surface | Phone LTR | Phone RTL | Dark | Tablet/wide | Notes / fail reason |
|---|---------|-----------|-----------|------|-------------|---------------------|
| 1 | Branch dashboard | | | | | Hero vs AttentionBand weight |
| 2 | Global dashboard | | | | | No equal KPI wallpaper |
| 3 | Cashier dashboard | | | | | Shift CTA clarity |
| 4 | POS catalog | | | | | Outline selection, tile density |
| 5 | POS cart | | | | | FinancialValue total dominance |
| 6 | POS tablet split | | | | | Top bar + pane balance |
| 7 | Payment sheet | | | | | Amount due + method outline |
| 8 | Sales index (+ MD if tablet) | | | | | Row density / detail pane |
| 9 | Sale detail | | | | | DocumentHeader hierarchy |
| 10 | Partial refund | | | | | Stepping + effect metric |
| 11 | Close shift triad | | | | | Variance emphasis |
| 12 | Financial accounts (+ MD) | | | | | Balance as hero number |
| 13 | Account detail | | | | | QuickActions vs txn list |

## High-value residual (must ≥ 8.5)
| # | Surface | Phone | RTL | Dark | Wide | Notes |
|---|---------|-------|-----|------|------|-------|
| 14 | Expenses index/detail | | | | | |
| 15 | Customers index/detail | | | | | |
| 16 | Purchases MD | | | | | |
| 17 | Suppliers report/statement | | | | | |
| 18 | Delivery finance dashboard | | | | | |
| 19 | Table order | | | | | QuickActionBar touch |
| 20 | Kitchen order | | | | | Status actions |
| 21 | Sync status | | | | | MetricBlocks + failed list |
| 22 | Reports hub + viewer KPIs | | | | | |
| 23 | Settings / More hub | | | | | Outline chips |
| 24 | Profile | | | | | No filled avatar card |

## Pixel discipline (every critical capture)
- [ ] Baseline alignment of numbers/labels
- [ ] Currency does not wrap
- [ ] Row heights consistent
- [ ] No soft tint wells masquerading as cards
- [ ] Dividers hairline / tokenized only
- [ ] Safe area / nav occlusion
- [ ] Truncation of Arabic labels acceptable

## Gate formula reminder
- Critical avg (1–13) ≥ **9.2** and no critical perspective fail
- Structural scorecard alone is insufficient

## Current mission status
**NO-GO** until this checklist has photographic evidence and re-scored random-25 visual averages.
