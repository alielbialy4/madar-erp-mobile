# MADAR Product System Specification

Status: architecture approved for implementation; primitives not yet fully migrated.

## Foundation

| Primitive | Purpose | Rules |
|---|---|---|
| `ProductScreen` | Canvas, safe area, keyboard, responsive content frame | No screen-local canvas colors; explicit density and archetype |
| `ProductTopBar` | Page identity, back, contextual actions | Maximum two visible actions on compact phone |
| `ContextRail` | Branch, period, shift, sync, stale state | Persistent on operational/report screens |
| `Section` | Titled semantic grouping | Divider or surface; card only when elevation is meaningful |
| `Surface` | Level 1/2/3 composition | Explicit level, radius, padding, border policy |
| `ResponsivePane` | Stack/split/master-detail behavior | Tiers: compact, phone, large phone, tablet, large tablet |

## Actions

- `PrimaryAction`: one per state; solid brand surface, no decorative gradient.
- `SecondaryAction`: lower emphasis; neutral surface or outline.
- `TertiaryAction`: text/icon action within context.
- `DangerAction`: separated spatially and requires consequence confirmation.
- `IconAction`: minimum 44px, always labeled for accessibility.
- `StickyActionBar`: safe-area aware; primary action remains reachable above keyboard and navigation.
- `ContextMenu`: rare/secondary row actions.

## Data and finance

- `DataRow`: standard entity row with stable identity, status, trailing value, and action slot.
- `DenseDataRow`: 48–56px transaction/inventory row with aligned numeric columns.
- `DocumentHeader`: document number, party, date, status, branch.
- `DocumentTotals`: subtotal, tax, discount, paid, remaining, total.
- `FinancialValue`: tabular numeric direction, currency, sign, semantic label.
- `MovementRow`: IN/OUT icon + label + signed value + source/account + timestamp.
- `KeyValueGroup`: grouped metadata without one card per field.
- `ActivityTimeline`: ordered business events and audit context.

## Forms

- `FormSection`: title, description, optional collapsible advanced content.
- `Field`: label, control, helper, error, required state.
- `MoneyField`: currency, decimal keyboard, formatted value, LTR numeric content.
- `QuantityField`: unit context and decimal precision.
- `EntitySelectField`: search + recent choices + permission/loading states.
- `DateField`: localized label with stable machine date.
- `ValidationSummary`: submit-time list with focus targets.
- `DirtyStateGuard`: protects long forms from accidental navigation loss.

## Filters

- `FilterCommandBar`: search, filter trigger, sort, result count.
- `FilterSheet`: grouped controls with Apply and Reset.
- `ActiveFilterSummary`: removable chips and clear-all.
- `ScopeFilter`: branch/tenant/global availability and permission messaging.
- `DateRangeFilter`: named presets plus explicit range.

## Feedback and state

- Layout-matching skeletons replace generic spinners for first load.
- Empty states explain scope and the next useful action.
- Errors distinguish retryable network, validation, permission, stale configuration, and server rejection.
- Offline/sync states state what remains available and whether data is stale.
- Permission states do not leak restricted values.

## Overlays

- `ChoiceSheet`: reversible selection.
- `ActionSheet`: short contextual actions.
- `FormSheet`: short focused form only.
- `FinancialConfirmSheet`: amount, direction, accounts, branch, consequence, confirmation.
- `FullScreenFlow`: payment, refund, purchase line editing, or other multi-step high-risk workflow.

## Reporting

- `ReportContextBar`, `MetricBlock`, `ChartSurface`, `BreakdownList`, `ReportTable`, `ComparisonIndicator`, and `DataUnavailableState` share one hierarchy.
- Charts remain neutral with one highlighted series. Interaction reveals exact values; legends never rely on color alone.

## Density

| Density | Vertical rhythm | Use |
|---|---|---|
| Comfortable | 16–24 spacing, 52–56 controls | Forms, settings, confirmation |
| Standard | 12–20 spacing, 48–52 rows | Details, customer/supplier entities |
| Dense | 8–12 spacing, 44–48 rows | Sales, stock, transactions, KDS, reports |

## Responsive tiers

| Tier | Width | Expected composition |
|---|---:|---|
| Compact phone | < 375 | Single column, condensed top bar, bottom actions |
| Standard phone | 375–419 | Single column with complete metadata |
| Large phone | 420–599 | Wider rows, paired secondary fields |
| Tablet | 600–1023 | Persistent navigation and selective split panes |
| Large tablet | 1024+ | Master/detail, multi-column reports, split POS |
