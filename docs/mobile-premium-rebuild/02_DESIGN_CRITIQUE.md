# Product Design Critique

Status: structural baseline critique complete; route-level critique remains in progress.

## 1. Information architecture

- The phone dock exposes Dashboard, POS, Products, Sales, and More. Finance, inventory operations, delivery, dining, reports, and settings are all flattened behind “More,” so destination weight reflects implementation history rather than operational priority.
- The drawer compensates by exposing a very large hierarchy. Users must understand the entire ERP taxonomy before reaching routine work; role-sensitive relevance exists in code but is not expressed as a clear “today / operations / records / administration” model.
- The navbar presents menu, branch, sync, search, notifications, and brand/profile affordances simultaneously. Branch and sync context are important, but global search and notifications compete with them on every screen.
- Tablet behavior begins at 900px. Smaller tablets and landscape phones retain the phone shell and therefore gain width without gaining information architecture.

## 2. Hierarchy and density

- `ListScreenLayout` can place a marketing-like `ModuleHero`, search, filters, and then data above the fold. On operational lists this delays the first actionable row and makes page identity compete with summary pills.
- `ModuleHero` turns statistics into rounded badges and reserves a separate refresh rail. Counts, refresh, and actions receive similar emphasis even when one action is dominant.
- Generic `AppCard` defaults to border + radius + elevation. Because 56 files import it, the product tends toward card-everything composition instead of using sections, dividers, grouped rows, and document structure.
- `createListRowChrome` makes every row a raised rounded card. Dense transaction, inventory, and report lists therefore consume too much vertical space and lose column alignment.

## 3. Action hierarchy

- The shared layouts do not distinguish screen-level primary actions, contextual row actions, selection actions, and destructive actions as separate interaction layers.
- FAB use is optional but not archetype-aware. On data-heavy lists, it can overlap content or become the only visible creation affordance without explaining scope.
- `FormScreenLayout` puts delete, cancel, and save in one horizontal footer. Destructive deletion remains adjacent to the primary submission path; narrow phones can compress three high-consequence controls into one row.
- Detail screens often render actions before the user sees structured identity, status, financial state, or next-step guidance.

## 4. Lists and scanning

- `AppListItem` provides only title, subtitle, meta, badge, and leading content. It lacks first-class numeric columns, financial direction, status placement, density levels, selection, and contextual action slots.
- Sales need invoice, customer, time, status, total, and payment summary. The generic row architecture cannot create a stable scan line for those fields.
- Inventory needs stock, available, reserved, low/zero/negative state, warehouse, and cost permission. Card rows obscure comparison because each value floats within its own container.
- List filters are frequently rendered as full select fields in a horizontal scroller. The active filter state is not summarized, reset is inconsistent, and large touch controls consume the same area as actual records.

## 5. Detail pages

- `DetailScreenLayout` has only two adopters, proving that detail pages have not converged on one architecture.
- Its generic implementation creates a hero and one card per section, then pairs labels and values. It cannot express entity identity, document totals, financial direction, activity timeline, or operational next action with sufficient hierarchy.
- Sale, purchase, supplier, customer, financial account, and delivery details require different emphasis but should share a common identity / status / action / section grammar.

## 6. Forms

- `FormScreenLayout` provides a scroll container and sticky footer but no task sections, progress, dirty-state warning, field reveal rules, or keyboard-aware next-field flow.
- Inputs are visually consistent but semantically generic. Money, quantity, account, date, warehouse, branch, and search fields do not have distinct formatting, helper behavior, or risk treatment.
- Long product, purchase, branch, and POS configuration forms expose too many fields in a single reading order. Advanced configuration is not progressively disclosed.
- Validation is field-local; there is no form-level error summary that helps the user locate multiple failures after submit.

## 7. Financial and operational risk

- Generic cards and badges are reused for balances, payments, refunds, expenses, and shift cash. They do not consistently communicate IN / OUT / BALANCE / PENDING / REVERSED using sign, label, icon, and context together.
- Shift state, expected cash, counted cash, and variance are not guaranteed a persistent hierarchy across all shift subflows.
- Payment and refund overlays compete with generic sheet chrome. Amount due, allocation state, remaining amount, account, and confirmation need a dedicated financial workflow frame.
- Confirmation dialogs are widely used, but consequence previews are inconsistent. Financial confirmation should repeat amount, destination/source, branch, and irreversible effect.

## 8. POS

- POS contains at least eleven focused overlays from the main screen alone. Each subflow has been added independently, so the interaction model risks becoming “open another sheet” rather than a coherent checkout progression.
- Phone and tablet have separate render paths, but they still share a large stateful source. This makes visual refinements fragile and hides the operational stages of browse → configure → cart → allocate → confirm → receipt.
- Product, cart, table, customer, delivery, shift, discount, and payment context can all compete in one screen. The product needs one persistent transaction state and one dominant next action at a time.

## 9. Reports

- `ReportScreenLayout` repeats the same hero pattern used by lists and then inserts filters and arbitrary children. It does not create a report context bar, primary metric hierarchy, chart/breakdown relationship, or drill-down contract.
- There are 119 report definitions but only a small number of route shells. A generic viewer can maintain behavioral coverage while still producing visually generic reports unless report composition primitives are enforced.
- Charts currently solve rendering but not interaction hierarchy: selected period, unavailable data, refund treatment, and drill-down affordance are not consistently visible next to the metric.

## 10. Shell and navigation ergonomics

- The floating bottom dock is visually dominant and permanently consumes useful vertical space. The enlarged POS orb draws attention even on non-selling tasks and resembles consumer navigation more than an enterprise operations tool.
- Icon-only navbar actions depend on learned meaning. Sync status is shown as an action instead of a persistent state with progressive disclosure.
- The sidebar footer uses four unlabeled icons for profile, settings, theme, and logout. Logout is high consequence but visually adjacent to benign preferences.

## 11. Responsive behavior

- Global width thresholds do not define compact, standard, large-phone, tablet, and large-tablet behavior per archetype.
- Many screens never inspect width and therefore stretch rather than recompose.
- Form and detail layouts rarely use two-column grouping on tablet.
- List/detail master-detail behavior is absent, so tablet capacity is mostly spent on wider cards.

## 12. RTL, theme, and accessibility

- RTL helpers are present, but code awareness is not visual proof. Mixed dates, currency, IDs, invoice numbers, chart axes, and chevrons need route-level inspection.
- Theme tokens are broadly used, but direct use of static design colors remains in active shell/printing-related UI. Surface elevation must be reviewed independently in dark mode.
- Touch targets are generally close to 44–48px, yet unlabeled icon actions and dense footer clusters reduce confidence.
- Dynamic text and screen-reader descriptions are inconsistent, especially for compound financial rows and chart content.

## Product-level diagnosis

The current application has a component library but not yet a product grammar. Shared components normalize decoration while each screen still decides its own hierarchy. The rebuild must first replace the shell and archetypes, then migrate modules; additional card polish would reinforce the existing problem.
