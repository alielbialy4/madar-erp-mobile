# API Contract Gaps

Compares `front/src/api/*.ts` (58 modules) vs `madar-erp-mobile/src/api/*.ts` (30 modules).

## Missing mobile API client modules

| Web API module | Typical endpoints | Mobile Status | Gap Type | Severity |
|----------------|-------------------|---------------|----------|----------|
| `sync.ts` | offline push, catalog | Partial | `syncService` not full `syncAPI` export | P1 |
| `drivers.ts` | `/drivers` | Complete | `src/api/drivers.ts` | — |
| `deliveryZones.ts` | zones CRUD | Complete | `src/api/deliveryZones.ts` | — |
| `driverSettlements.ts` | settlements | Partial | `src/api/driverSettlements.ts` | P1 | Create disabled on mobile |
| `deliveryFinance.ts` | finance suite | Complete | `src/api/deliveryFinance.ts` | — | Read screens |
| `waiter.ts` | waiter POS | Complete | `src/api/waiter.ts` | — |
| `kitchenStations.ts` | stations | Complete | `src/api/kitchenStations.ts` | — |
| `kitchenPrintJobs.ts` | print queue | Complete | `src/api/kitchenPrintJobs.ts` | — |
| `reorderRules.ts` | reorder | Complete | `src/api/reorderRules.ts` | — |
| `requisitions.ts` | requisitions | Complete | `src/api/requisitions.ts` | — |
| `stockCounts.ts` | counts | Complete | `src/api/stockCounts.ts` | — |
| `inventoryMovements.ts` | movements | Partial | `inventoryAPI` + list row detail | P2 | No GET-by-id |
| `stockTransfers.ts` | transfers | Complete | `src/api/stockTransfers.ts` | — |
| `stockAdjustments.ts` | adjustments | Complete | `src/api/stockAdjustments.ts` | — |
| `purchaseReturns.ts` | returns | Partial | `purchaseReturnsAPI` | P2 |
| `payments.ts` | payments ledger | Missing | Missing API client | P2 |
| `employees.ts` | users CRUD | Partial | `settingsAPI` `/mcp/users` | P2 | Not multipart employees |
| `branchesManage.ts` | branch admin | Complete | `branchesManage.ts` | — |
| `backup.ts` | backup | Disabled | `BackupInfo` screen | P1 | Web-only |
| `activityLogs.ts` | logs | Complete | `activityLogs.ts` | — |
| `tenant.ts` | tenant meta | Complete | `tenant.ts` | — |
| `partnerReports.ts` | partner | Complete | `src/api/partnerReports.ts` + `usePartnerApi` in `useReport` | — |
| `layaway.ts` | layaway plans | Missing | reports only | P1 |
| `billSplit.ts` | split bill | Missing | Missing API client | P2 |
| `waiter.ts` | waiter POS | Missing | Missing API client | P0 |
| `diningTables.ts` | table ops | Partial | `dining.ts` | P2 |
| `diningHalls.ts` | halls | Partial | `dining.ts` | P2 |
| `kitchenPrintJobs.ts` | print queue | Missing | Missing API client | P1 |
| `kitchenStations.ts` | stations | Missing | Missing API client | P1 |
| `kitchenPrinters.ts` | printers | Missing | Missing API client | P2 |
| `kitchenRouting.ts` | routing | Partial | offline service only | P2 |
| `tableReservations.ts` | reservations | Missing | Missing API client | P3 |
| `commissions.ts` | commissions | Missing | Missing API client | P3 |
| `tenant.ts` | tenant meta | Missing | NEEDS VERIFICATION | P2 |

## Client behavior comparison

| Concern | Web (`axiosConfig.ts`) | Mobile (`client.ts`) | Status | Severity |
|---------|------------------------|----------------------|--------|----------|
| `X-Tenant-Slug` | Yes | Yes | Complete | — |
| `Authorization` Bearer | Yes | Yes | Complete | — |
| `X-Branch-Id` | Yes, respects global mode | Yes, from storage | Complete | — |
| `branch_id` query param | Often | Sometimes | Partial | P2 |
| Permissions version refresh | Yes | NEEDS VERIFICATION | Needs Verification | P2 |
| 401 handler | redirect login | `setUnauthorizedHandler` | Complete | — |
| Multipart uploads | Yes | `postMultipart` | Complete | — |
| Error envelope parsing | helpers | `normalizeApiError` | Complete | — |

## Wrong / incomplete endpoint usage

| Area | Issue | Severity |
|------|-------|----------|
| Reports | `reportsAPI` + `exportReport` (blob); viewer routed via `ReportViewer` | — |
| Parity modules | Generic `get(endpoint)` without typed clients | P2 |
| Coupons | No offline validate helpers | P1 |
| Sales print | `salesAPI.print` — print pipeline NEEDS VERIFICATION | P2 |

## Files

- Web: `front/src/api/`
- Mobile: `madar-erp-mobile/src/api/`, `madar-erp-mobile/src/api/index.ts`
