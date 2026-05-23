# Vaults, Shifts, and Expenses Gaps

## Vaults

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Vault list | `/vaults` | `vaultsAPI` | Partial | `VaultsScreen` | — | P3 | |
| Vault balance display | list/cards | `GET` | Partial | Stat cards | — | P3 | |
| Deposit | web modals | `POST` deposit | NEEDS VERIFICATION | Vaults UI | Missing action | P1 | |
| Withdraw | web modals | withdraw | NEEDS VERIFICATION | — | Missing action | P1 | |
| Transfer between vaults | web | transfer | Missing | — | Missing action | P2 | If web supports |
| Vault transactions list | `/vaults/transactions` | list | Read-only | `ParityModule` | Missing screen | P2 | |
| Transaction detail | `/vaults/transactions/:id` | `GET` | Missing | — | Missing detail | P2 | |
| Permissions | guards | — | Partial | — | Missing permission guard | P2 | |

## Shifts

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Current shift | `/shifts` | `shiftsAPI.current` | Complete | `ShiftScreen` | — | P3 | |
| Open shift | modal/page | open | Complete | Open sheet | — | P3 | |
| Close shift | modal | close + actual cash | Partial | Close sheet | Missing validation | P2 | Expected cash UX |
| Shift summary | `ShiftSummaryModal` | summary | Partial | Summary section | Weak UI/UX | P1 | |
| Print shift summary | modal print | print | Missing | — | Missing print support | P1 | |
| Expected vs actual | close shift | — | Partial | `actualCash` input | — | P2 | |
| Shift history list | management page | list | Partial | List on `ShiftScreen` | — | P3 | |
| Cash drawer / vault relation | open shift | vault picker | Partial | Vault select on open | — | P3 | |
| Global vs branch view | `ViewModeGuard` | — | NEEDS VERIFICATION | Branch store | — | P2 | |

## Expenses

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Expense list | `/expenses` | `expensesAPI` | Partial | `ExpensesScreen` | — | P3 | |
| Create expense | form | `POST` | Partial | Create in screen | — | P2 | |
| Edit expense | web edit | `PUT` | Missing | — | Missing action | P2 | |
| Categories | settings/categories | — | NEEDS VERIFICATION | — | Missing filter | P2 | |
| Vault selection | form | vault_id | NEEDS VERIFICATION | — | Missing validation | P2 | |
| Attachments | form upload | multipart | Missing | — | Missing action | P2 | |
| Expense reports link | `/reports/expenses` | reports | Partial | Report viewer broken | — | P2 | |

## Files

- Web: `front/src/pages/Vaults/`, `Shifts/`, `Expenses/`
- Mobile: `madar-erp-mobile/src/screens/vaults/`, `expenses/`

---

## Lockdown Pass Update — 2026-05-23

- Added dedicated `VaultTransactionsScreen` for `/vaults/transactions`.
- Added dedicated `VaultTransactionDetailScreen` for `/vaults/transactions/:id`.
- Added typed vault transaction list/detail API.
- Remaining: verify vault transfer/reconcile parity and shift cash movement/in-POS modal parity; physical print QA still required.
