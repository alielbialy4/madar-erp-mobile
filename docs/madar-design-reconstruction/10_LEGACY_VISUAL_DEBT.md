# 10 — Legacy Visual Debt

Register debt as we find and kill it.

## Class A — Structural (blocks PASS)
| Debt | Location pattern | Status |
|------|------------------|--------|
| Card-everything lists | AppDomainCard / AppListCard on indexes | RETIRED (parity + definition only) |
| Soft tinted KPI cards | MetricCard / AppStatCard / DashboardKpiCard | PARTIAL — product screens largely on MetricBlock; component still exported |
| Payment method rainbow wells | colors payment* + POS payment UI | PARTIAL — outline method cards; soft banners cleared |
| Weak pastel / slate SaaS palette | colors.ts lightColors | CLOSED for foundation (Obsidian/Cobalt) |
| Missing financial typography system | textStyles.ts | CLOSED for foundation |
| Bubble radius defaults (16–28 on content) | spacing.ts radius | CLOSED for tokens; residual screens TBD |
| GradientMesh / decorative mesh on ops screens | GradientMesh usages | OPEN |
| Stretched phone interiors on tablet | many MoreStack screens | PARTIAL — major lists on MasterDetail |
| Equal-weight dashboard KPI strips | Branch/Global dashboard | CLOSED structurally |
| Residual product AppCard | screens/* | CLOSED except ParityModuleScreen |
| Device visual QA evidence | 12_DEVICE_VISUAL_QA_CHECKLIST | OPEN — blocks PASS |

## Class B — Consistency
| Debt | Status |
|------|--------|
| Divergent search fields | OPEN |
| Divergent headers/actions | OPEN |
| Hardcoded rgba softs outside tokens | OPEN |
| designColors direct imports (~18 files) | OPEN |
| Soft chip fills on POS/status | PARTIAL — header/cart/tablet cleared |
| Equal-weight module icon colors in More hub | OPEN |

## Class C — Polish
| Debt | Status |
|------|--------|
| Uneven row padding | OPEN |
| Truncation wrap | OPEN |
| Icon well misuse | PARTIAL — list/dashboard icons outline |
| Oversized empty states | OPEN |

## Explicitly discarded prior direction
`docs/mobile-premium-rebuild/` — **Operational Ledger** execution rejected (insufficient authority, incomplete elite adoption). Artifacts remain historical only.
