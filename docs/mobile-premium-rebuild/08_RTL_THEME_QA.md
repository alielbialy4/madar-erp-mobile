# RTL and Theme QA

Status: code-awareness inventory complete; visual route verification pending.

## RTL checks

- Header/back/chevron direction.
- Arabic title and mixed Latin IDs.
- Invoice numbers, dates, phone numbers, currencies, signed amounts.
- Chart order, axis placement, legends, and touch labels.
- Filter chips, select affordances, action menus, and sheet transitions.

## Theme checks

- Canvas and four surface levels.
- Selected, pressed, focused, disabled, and destructive states.
- Financial positive/negative/pending/reversed semantics.
- Inputs, dividers, tables, charts, sheets, and modal elevation.
- System bars and navigation integration.

| Area | Light | Dark | RTL code-aware | RTL visually verified | Result |
|---|---|---|---|---|---|
| Shell | Baseline | Baseline | Yes | Baseline only | FAIL |
| Shared archetypes | Pending | Pending | Partial | No | FAIL |
| Financial values | Pending | Pending | Partial | No | FAIL |
| Charts | Baseline | Baseline | Partial | Partial | FAIL |
| Forms | Pending | Pending | Partial | No | FAIL |
| Lists/details | Pending | Pending | Partial | No | FAIL |
