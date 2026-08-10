# 01 — Visual Forensics

**Verdict on current product:** REJECTED as premium commercial ERP.

This is not a theme failure. It is a **product design** failure: hierarchy, density, authority, and cohesion.

---

## Forensic diagnosis (global)

### 1. Card inflation
- ~203 JSX Card usages; ~81 `AppCard`, ~46 `AppDomainCard`, ~24 `AppStatCard`
- Cards used as default grouping → visual noise, equal weight, low information density
- Rows that should be typographic lists are wrapped as mini-panels

### 2. Weak color authority
- Light mode reads as washed slate SaaS (`#F8FAFC` / `#2563EB` / soft pastel wells)
- Soft semantic backgrounds (`softSuccess`, `softWarning`, etc.) tint entire KPI cards
- Payment methods use distinct purple/indigo/green wells → decorative rainbow
- Dark mode is closer to “navy blue admin” than layered Obsidian materials
- `premiumGold`, mesh gradients, cardGlow reinforce decorative AI-template aesthetics

### 3. Typography without numeric system
- Presets exist but screens rarely compose distinct text vs numeric hierarchies
- Financial values lack consistent tabular treatment and currency separation
- Equal medium weights across titles, labels, and amounts flatten screens

### 4. Shell without intentional hierarchy
- Five bottom tabs include Products as primary — operations sprawl leaks into core chrome
- Navbar tools (sync, branch, language, user) compete visually
- Tablet rail exists but many module interiors remain stretched phone layouts

### 5. POS not yet flagship
- Phone POS still compresses catalog + cart concerns poorly for narrow widths
- Payment UI retains method-color decoration over financial workflow clarity
- Split payment allocation not unmistakably clear at a glance

### 6. Finance screens look generic ERP
- Accounts/expenses share module-card patterns with inventory settings
- Balance does not dominate as in Stripe-class finance surfaces
- Transaction rows lack banking-grade density and direction encoding

### 7. Inventory lacks Carbon density
- Resource lists vary between card-like rows and tables without one grammar
- Exception states (low/zero/negative) not systematically dominant over decoration

### 8. Dashboard = KPI card simulator risk
- Structured components favor equal Metric/KPI cards
- Attention/exceptions not structurally superior to vanity metrics
- Charts risk rainbow series without a deliberate viz palette

### 9. Previous redesign package (`mobile-premium-rebuild`)
- Direction (“Operational Ledger”) was conceptually closer to enterprise but:
  - Insufficient visual authority (still pale / soft)
  - Incomplete adoption (system created, screens not migrated at elite level)
  - Still readable as RN admin template with better tokens
- **Explicitly rejected.** Do not continue that visual language.

---

## Per-module forensic notes

| Area | What's wrong | Danger |
|------|--------------|--------|
| Dashboard | Equal KPI weight, card strip | Looks like demos |
| POS | Density + payment decoration | Operations under pressure fail |
| Sales | Invoice as decorated cards | Slow scan |
| Refund | Form-like, not risk workflow | Financial error risk |
| Shift | Metric cards equalize variance | Cash control ambiguity |
| Accounts | Generic settings aesthetic | Trust failure |
| Expenses | Incurred vs paid confusion | Accounting misread |
| Products | Card-heavy index | Commerce inefficiency |
| Inventory | Soft cards vs dense ops need | Warehouse speed |
| Purchases | Document structure weak | Payable confusion |
| Customers/Suppliers | Card sprawl on entity pages | No financial focus |
| Dining | Rainbow table risk | Hall cognitive load |
| KDS | Decoration vs urgency | Kitchen lag |
| Delivery | State not workflow-led | Missed actions |
| Reports | Chart gallery tendency | Unserious analytics |
| Settings | Often over-carded | Breaks Apple-like calm |

---

## Baseline metrics (BEFORE reconstruction)

| Metric | Count |
|--------|------:|
| Active `*Screen*.tsx` | 138 |
| Screen TSX (incl helpers) | 163 |
| Card component files | 25 |
| JSX `<*Card` usages | ~203 |
| `AppCard` | ~81 |
| `AppDomainCard` | ~46 |
| Hardcoded `#hex` in `src` | ~208 (mostly `colors.ts`) |
| Hardcoded `rgba()` | ~44 |
| Files using `useColors` | ~243 |

These counts will be re-measured AFTER Wave 10.

---

## Forensic principles → reconstruction mandates

1. **Fewer cards** than today on almost every module.
2. **Stronger neutrals** — 80%± screen reads as controlled structure.
3. **Cobalt as signature**, not pastel blue wells.
4. **Numeric hierarchy** is a first-class design system.
5. **Archetype-driven composition** replaces “stack of cards”.
6. **POS / Finance / Shift / Payment / Refund** = 9.2+ quality or NO-GO.
7. Random obscure screens must share the same DNA or NO-GO.
