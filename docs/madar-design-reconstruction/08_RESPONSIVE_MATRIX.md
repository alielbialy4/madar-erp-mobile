# 08 — Responsive Matrix

## Phone classes
| Class | Width |
|-------|------:|
| Compact | ~360 |
| Standard | ~390 |
| Large | ~430 |
| Landscape phone | vary |

Do not optimize only for one device.

## Tablet
Breakpoint policy: treat **≥900** as tablet shell today; redesign interiors for true adaptivity — never a centered phone column.

| Surface | Phone | Tablet intent |
|---------|-------|---------------|
| POS | Catalog + compact cart sheet | True split catalog \| cart |
| Resource indexes | Dense list | Optional master/detail |
| Entity detail | Stacked sections | Two-column when safe |
| Reports | Metric → chart → table | Context + viz + breakdown columns |
| Finance accounts | Dense rows | Master/detail activity |
| Inventory | Dense rows/table | Wide table / split filters |
| Settings | Grouped list | Same, wider readable measure |
| KDS | Dense cards | Multi-column ticket board |
| Dining | Tile grid | Larger spatial hall |

## Validation checklist per flagship screen
- [ ] Compact  
- [ ] Standard  
- [ ] Large  
- [ ] Landscape phone (where relevant)  
- [ ] Tablet  

Log failures in tracker with screenshot references.
