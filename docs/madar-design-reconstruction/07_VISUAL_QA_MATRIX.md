# 07 — Visual QA Matrix

## Scorecard dimensions (1–10)
Art Direction · Hierarchy · Density · Typography · Spacing · Color Discipline · Data Legibility · Action Hierarchy · Touch Ergonomics · State Design · RTL · Dark Mode · Responsive Layout · Consistency · Polish

**Pass floors:** normal ≥ 8.5 avg · critical (Dashboard, POS, Payment, Refund, Shift, Finance) ≥ 9.2  
Do not inflate. Attach criticism with every score.

## Review panel (mandatory per important screen)
1. Design Director — premium?  
2. UX Lead — workflow optimal?  
3. Enterprise Designer — density correct?  
4. Operations User — usable under pressure?

Fail any critical perspective → screen fails.

## Comparison evidence required
Before/after captures for all major modules listed in mission brief.  
**Status:** Device visual capture matrix still OPEN (cannot PASS without screenshots).

## Pixel discipline checklist
- [ ] Baseline alignment  
- [ ] Icon optical alignment  
- [ ] Control / header / row heights  
- [ ] Vertical rhythm  
- [ ] Truncation  
- [ ] Currency non-wrap  
- [ ] Status alignment  
- [ ] Divider positions  
- [ ] Safe areas  

## Structural integrity notes (code review — not visual PASS)
| Module | Structural | Blocking for visual PASS |
|--------|------------|--------------------------|
| Dashboard | Hero + AttentionBand landed | Need device shots / RTL / dark |
| Reports | Dense hub + MetricBlock KPIs + Madar table/breakdown rows | Chart viz palette audit on device |
| POS | Outline tiles, calmed chrome, tablet bar | Full phone cart↔catalog flow shots |
| Payment | Amount-due hero + outline methods | Touch audit on small phones |
| Refund | Stepwise + effect MetricBlock | Confirm dialog density on device |
| Shift | Expected/counted/variance triad | Visual variance emphasis check |
| Dining / Kitchen / Sync | TableOrder + KitchenOrder + Sync Madar | QuickActionBar touch & fail lists |
| Supplier / Delivery finance | MetricBlock + Madar surfaces | Numeric hierarchy on device |
| Print / Backup / Profile | Residual info surfaces Madar | Secondary only |

See also: `12_DEVICE_VISUAL_QA_CHECKLIST.md` for capture session.

## Module gate log
| Module | Gate | Avg | Notes |
|--------|------|----:|-------|
| Shell | PENDING | — | No screenshot scorecard |
| Navigation | PENDING | — | |
| Dashboard | STRUCTURAL | — | Wave 7 code done; QA open |
| POS | STRUCTURAL | — | Deepen in progress |
| Sales | PENDING | — | |
| Refunds | STRUCTURAL | — | Stepwise remodel |
| Shifts | PENDING | — | |
| Finance | PENDING | — | |
| Expenses | PENDING | — | |
| Inventory | PENDING | — | |
| Products | PENDING | — | |
| Purchases | PENDING | — | |
| Suppliers | PENDING | — | |
| Customers | PENDING | — | |
| Dining | PENDING | — | |
| KDS | PENDING | — | |
| Delivery | PENDING | — | |
| Reports | STRUCTURAL | — | |
| Settings | PENDING | — | |
