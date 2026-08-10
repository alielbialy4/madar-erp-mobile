# 00 — Product UI Map

**Product:** MADAR ERP Mobile  
**Mission:** Elite Product Design Reconstruction  
**Art direction:** Executive Operational Fintech  
**Baseline date:** 2026-08-10  
**Supersedes:** `docs/mobile-premium-rebuild/` (rejected)

---

## Navigation shell

```
Auth → Login
MainTabs
  ├─ DashboardTab        → DashboardScreen
  ├─ POSTab              → POSStack (POSHome, DiningTableOrder, WaiterPos)
  ├─ ProductsTab         → ProductsStack (~11 screens)
  ├─ SalesTab            → SalesStack (SalesHome, SaleDetail, PartialRefund)
  └─ MoreTab             → MoreStack (~115 screens)
Phone: PremiumBottomNav (Dashboard · POS · Sales · Products · More)
Tablet (≥900): PersistentTabletSidebar + no bottom tabs
Overlays: Sidebar modal, CommandPalette, Navbar, ImmersiveExitChip
```

**Shell context chrome:** Branch · Scope · Shift · Sync · Offline · Notifications · Profile  
These must recede visually — never compete equally with working content.

---

## Active surface inventory

| Module | Screen files (approx) | Primary archetype | Flagship? |
|--------|----------------------:|-------------------|-----------|
| Auth | 1 | Editor (login) | — |
| Dashboard | 1 | Command Center | Critical |
| POS + overlays | 12 | Operational / Editor | Critical |
| Sales + refund | 6 | Resource Index / Transaction Document | Critical |
| Shifts / Vaults | 4 + sheets | Command Center | Critical |
| Finance / Accounts | 5 | Resource Index / Entity Detail | Critical |
| Expenses | 6 | Resource Index / Transaction Document | High |
| Inventory | 22 | Resource Index / Dense data | High |
| Products / Categories | 12 | Resource Index / Entity / Editor | High |
| Purchases | 7 | Transaction Document | High |
| Suppliers | 5 | Entity Detail | High |
| Customers | 2 | Entity Detail | High |
| Dining | 4 | Operational spatial | High |
| KDS / Kitchen | 10 | Mission control | High |
| Delivery | 12 | Operational workflow | High |
| Reports | 8+ | Data Analysis | High |
| Settings / Admin / Marketing / Print | ~30 | Grouped lists / Editors | Required |
| Notifications / Shared | 3 | Utility | Required |

**Totals**
- `*Screen*.tsx`: **138**
- TSX under `src/screens`: **163** (includes sheets/helpers)
- Stack registrations: **~133**
- Sheet/Modal TSX: **~32**

---

## Screen → archetype assignment (canonical)

| Archetype | Surfaces |
|-----------|----------|
| **A. Command Center** | Dashboard, Shift, KDS, Delivery ops, Delivery finance alerts |
| **B. Resource Index** | Sales, Products, Customers, Suppliers, Expenses, Purchases, Accounts, Inventory lists, Coupons, Promotions, Gift cards, Users, Branches |
| **C. Entity Detail** | Customer, Supplier, Product, Account, Warehouse, Driver, Branch |
| **D. Transaction Document** | Sale detail, Purchase detail, Refund workflow, Expense detail, Stock transfer/adjustment docs, Purchase return |
| **E. Editor** | Product form, Category form, Purchase create/edit, Expense create, User/Role forms, Branch settings, Coupon/Promotion forms |
| **F. Data Analysis** | Reports hub, Report viewer, Product insights, Supplier report/statement, Sales by product |

---

## Critical paths (must reach visual excellence first)

1. Open app → Dashboard context  
2. Open shift → Sell on POS → Payment → Print  
3. Sales list → Sale detail → Partial refund  
4. Close shift (expected / counted / variance)  
5. Account index → Account detail → Movement  
6. Product search → Edit price/stock  
7. Inventory exception → Adjustment  
8. Purchase receive → Pay supplier  
9. Dining table → Order → Kitchen ticket  
10. Delivery assign → Settle  

---

## Token / system locations (implementation)

| Concern | Path |
|---------|------|
| Colors | `src/constants/colors.ts` |
| Spacing / radius / shadows | `src/constants/spacing.ts` |
| Typography sizes | `src/constants/typography.ts` |
| Text presets | `src/constants/textStyles.ts` |
| Fonts | `src/constants/fonts.ts` |
| Elevation | `src/constants/elevation.ts` |
| Motion | `src/constants/motion.ts` |
| Responsive | `src/constants/responsive.ts` |
| UI barrel | `src/components/ui/index.ts` |
| Layout shells | `src/components/layout/*` |

---

## Reconstruction waves (binding)

| Wave | Scope | Status |
|------|-------|--------|
| 1 | Benchmark, art direction, foundations, tokens | IN PROGRESS |
| 2 | Shell, nav, headers, lists, forms, filters, sheets, states | PENDING |
| 3 | POS, Payment, Sales, Refund, Shift | PENDING |
| 4 | Finance, Expenses, Collections | PENDING |
| 5 | Products, Inventory, Purchases, Suppliers | PENDING |
| 6 | Customers, Dining, KDS, Delivery | PENDING |
| 7 | Dashboard, Reports | PENDING |
| 8 | Settings + secondary | PENDING |
| 9 | Tablet-specific | PENDING |
| 10 | Global consistency / refinement / gates | PENDING |

Dashboard is intentionally deferred to Wave 7.
