# MADAR Product Design Direction

Working direction: **Operational Ledger**

MADAR should feel like a calm, precise operating system for a business: structured like a ledger, fast like a POS, and explicit about risk. The identity comes from hierarchy, numeric precision, and contextual action—not decoration.

## Product principles

1. **Context before content.** Branch, period, shift, connectivity, and permission context must be visible before values that depend on them.
2. **One dominant action.** Every state has one most-likely next action. Secondary and destructive actions are progressively disclosed.
3. **Numbers form a grid.** Monetary and quantity values align, use stable direction, and remain visually comparable.
4. **Exceptions outrank summaries.** Low stock, failed sync, cash variance, pending settlement, and permission limits must interrupt calm surfaces intentionally.
5. **Documents look like documents.** Sales, purchases, returns, statements, and settlements use headers, line items, totals, status, and activity—not unrelated cards.
6. **Operational state persists.** POS cart state, shift state, delivery assignment, and kitchen timing remain visible while the user acts.
7. **Progressive disclosure reduces error.** Advanced fields and rare actions remain available without crowding the primary task.
8. **Density is chosen, not accidental.** Lists and operations are dense; forms and confirmations are comfortable.

## Visual language

- Neutral canvas and surfaces dominate.
- One brand accent drives selection and primary action.
- Green, red, amber, and blue are semantic only.
- Gradients are removed from routine buttons, KPI cards, list rows, and charts.
- Borders are used for structure only; dividers and surface contrast replace border-everything treatment.
- Elevation is limited to navigation, overlays, and truly floating controls.
- Radius communicates component type: 6 small control, 10 field, 12 grouped surface, 18 sheet. Pill is reserved for status/filter chips.

## Phone information architecture

The implementation will preserve route contracts while changing presentation:

- **Home:** current context, exceptions, key signals, recent activity.
- **POS:** flagship selling workflow.
- **Sales:** invoices, refunds, collections.
- **Operations:** inventory, purchasing, dining, kitchen, delivery, shifts.
- **More:** customers, suppliers, finance, reports, administration, profile.

Role and permission rules determine shortcuts and visible groups. No user should see twenty equal destinations.

## Tablet information architecture

- Persistent navigation begins at the tablet tier, not at a single 900px device guess.
- Lists may use master/detail.
- Forms group related sections into two columns when reading order remains safe.
- POS uses a true catalog/cart split with persistent totals.
- Reports use context + visualization + breakdown columns.

## Screen archetypes

- List: compact identity header → search/filter command row → active filter summary → dense rows → contextual create action.
- Detail: entity/document identity → status + primary value → quick actions → structured sections → activity.
- Form: task context → grouped sections → inline validation → sticky safe submission.
- Operational: persistent state rail → working area → critical warnings → dominant next action.
- Report: scope/period bar → primary metric → trend → breakdown → drill-down table.
- Control center: scope and state → exceptions → primary signals → trend/breakdown → recent activity.

## Interaction language

- Press feedback is immediate and subtle.
- Bottom sheets are used for reversible focused choices, not full workflows by default.
- Financial confirmations use dedicated confirmation sheets with consequence summaries.
- Row actions use long-press/context menus or a trailing action affordance; destructive actions never sit beside the primary tap target.
- Filters use trigger → sheet → apply/reset, with compact segmented controls only for high-frequency status switching.
