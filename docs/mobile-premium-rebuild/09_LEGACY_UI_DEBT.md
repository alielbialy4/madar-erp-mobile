# Legacy UI Debt

Status: baseline debt inventory.

| Debt | Evidence | Required action |
|---|---|---|
| Card-everything composition | `AppCard` imported by 56 files; list chrome adds elevation by default | Introduce flat grouped surfaces and dense rows; reserve elevation |
| Marketing hero on operational lists | `ListScreenLayout` can prepend `ModuleHero` before search/data | Replace with compact identity/context headers |
| Generic detail architecture | `DetailScreenLayout` adopted by only 2 files | Build entity/document/financial detail archetypes and migrate |
| Generic form architecture | 21 files use the layout, but task grouping is screen-local | Add form sections, progressive disclosure, dirty guard, validation summary |
| Oversized floating navigation | Bottom dock and POS orb consume persistent space | Rebuild as restrained role-sensitive navigation |
| Overloaded navbar | Six competing controls in one horizontal band | Separate persistent context from progressive global actions |
| Card rows for dense data | Shared list row has radius, border, elevation, and 56px+ height | Add standard/dense row families with aligned values |
| Inline screen composition | 98 screen files contain inline style objects | Migrate visual decisions into archetype primitives |
| Local screen styles | 28 screen files define `StyleSheet.create` | Retain only domain-specific layout after migration |
| Weak responsive adoption | 16 screen files inspect dimensions | Move behavior into responsive archetypes and panes |
| Filter inconsistency | Full selects, chips, and local bars coexist | Standardize trigger/sheet/active-summary patterns |
| Overlay proliferation | 145 overlay usages; POS alone has 33 cataloged overlay uses | Distinguish choice sheets from full workflows |
| Report genericity | 119 definitions flow through a small number of generic shells | Enforce report context/metric/trend/breakdown/detail hierarchy |
| Static design colors in active UI | Audit finds one TSX file with direct hex usage | Replace or explicitly isolate print/static brand usage |

Debt is not cleared when a replacement component exists. It is cleared only after active-screen adoption and visual verification.
