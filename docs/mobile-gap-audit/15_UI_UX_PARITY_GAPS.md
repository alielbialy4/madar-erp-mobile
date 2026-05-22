# UI/UX Parity Gaps

Qualitative comparison of web vs mobile. Updated Phase 6 (2026-05-23).

| Web Feature | Web File/Route | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------------|-------------------|----------|----------|-------|
| Desktop sidebar navigation | `NewLayout` | Partial | Bottom tabs + tablet `PersistentTabletSidebar` | — | P3 | Phone uses tabs by design |
| Tablet multi-column POS | `usePosPageLayout` | Complete | `POSScreen` ≥900px | — | P2 | Catalog + cart side-by-side |
| Tablet product master-detail | products page | Complete | `ProductsScreen` filter sidebar | — | P3 | |
| RTL polish | design-system RTL | Complete | `layout.ts`, `rtl` utils | — | P3 | Device screenshots still advised |
| Pull-to-refresh | list pages | Complete | `AppScreen`, `ResourceList`, POS catalog | — | P3 | |
| Loading skeletons | web tables | Complete | `AppSkeletonList` + list screens | — | P3 | |
| Empty states | design-system | Complete | `AppEmptyState` | — | P3 | |
| Error states + retry | ErrorBoundary | Complete | `AppErrorState` | — | P3 | |
| Filter bars (reports/sales) | report headers | Complete | `ReportFilterSheet` | — | P2 | |
| Data tables → cards | web tables | Partial | `AppListItem` / report cards | — | P3 | Expected mobile pattern |
| Charts (dashboard/reports) | chart components | Partial | Stat cards + `RevenueTrendChart` | Weak UI/UX | P2 | No full chart library |
| POS category drawer | `PosCategoryDrawer` | Partial | chips + category cards | Weak UI/UX | P3 | |
| Bottom sheets quality | modals | Complete | Animated `AppBottomSheet` | — | P3 | |
| Command palette / quick nav | web | Partial | `CommandPalette` | — | P3 | |
| Premium bottom nav | — | Complete | `PremiumBottomNav` | — | P3 | |
| Parity fallback screens | — | Partial | `ParityModuleScreen` upgraded | Weak UI/UX | P2 | Niche routes only |
| Notifications entry | header bell | Complete | Navbar → `Notifications` | — | P3 | |
| Form density (settings) | tabbed settings | Partial | stacked cards | Weak UI/UX | P3 | |
| Animations | web transitions | Complete | Nav, cards, sheets, POS pulse | — | P3 | Subtle native springs |

## References

- `docs/phase-6-ui-ux-release-readiness.md`
- `docs/MOBILE_RUNTIME_QA_CHECKLIST.md`
- `docs/VISUAL_ACCEPTANCE_REPORT.md`
