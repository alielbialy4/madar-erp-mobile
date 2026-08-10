# 09 — Theme & RTL Matrix

## Light mode — Executive Clean
- Canvas `#F3F5F9`, surfaces white / `#F8F9FC`
- Crisp ink `#111827`
- Cobalt for selection/accent only
- Avoid washed single flat white

## Dark mode — Independent art direction
- Layered: Canvas `#080D18` → Surface `#101725` → Elevated `#172033` → Interactive `#202A40`
- Nav recedes slightly; working surface dominates
- Brand accent `#7792FF` — not neon borders everywhere
- Charts/axes/labels tuned separately
- **Not** light mode inverted

## Validation targets
| Check | Count target |
|-------|-------------:|
| Light screens checked | all active |
| Dark screens checked | all active |
| RTL visual check | all major + sample nested |

## RTL specific inspections
- [ ] Back / chevrons  
- [ ] Amounts (LTR isolate)  
- [ ] Mixed AR/EN identifiers  
- [ ] Tabs / segmented  
- [ ] Search fields  
- [ ] Sheets  
- [ ] Charts  
- [ ] Date formatting  
- [ ] Currency placement  

Arabic must look intentionally designed, not mirrored English.
