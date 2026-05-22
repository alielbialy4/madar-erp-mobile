# Dining and Kitchen Gaps

## Dining

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Halls & tables overview | `/dining-halls` | `diningAPI` | Complete | `Dining` | — | P3 | Grid by hall, status colors |
| Hall management | halls CRUD | `diningHallsAPI` | Complete | `DiningHallForm` | — | P3 | Phase 4 |
| Active table order | table click | `getActiveOrder` | Complete | `DiningTableOrder` | — | P3 | Merge/transfer/settle/release |
| Waiter POS | `/waiter` | `waiterAPI` | Complete | `WaiterPos` | — | P3 | MVP: create, add, kitchen, settle |
| Pre-invoice print | dining | print/ticket | Partial | `DiningTableOrder` | — | P2 | Needs kitchen printer profile |
| Offline dining cache | web offline | — | Disabled | Banner on `Dining` | Disabled with reason | P2 | No safe contract |
| Table reservations | API | — | Missing | — | Missing API client | P3 | |

## Kitchen

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| KDS order board | `/kitchen` | `kitchenAPI` | Complete | `Kitchen` | — | P3 | Filters + stats |
| Status updates | KDS | `PATCH` | Complete | `KitchenOrder` | — | P3 | Confirm dialogs |
| Station filters | KDS | stations | Complete | `Kitchen` station select | — | P3 | |
| Kitchen stations CRUD | `/kitchen/stations` | `kitchenStationsAPI` | Complete | `KitchenStationsList`, `KitchenStationForm` | — | P3 | |
| Print jobs queue | `/kitchen/print-jobs` | `kitchenPrintJobsAPI` | Complete | `KitchenPrintJobs` | — | P3 | Retry failed |
| Kitchen ticket print page | `/kitchen/ticket/:id` | — | Partial | — | Disabled with reason | P2 | Web preview only |
| Item-level print status | KDS items | — | Partial | Item status buttons | — | P2 | |

## Files

- Web: `front/src/pages/DiningHalls/`, `Kitchen/`, `Waiter/`
- Mobile: `madar-erp-mobile/src/screens/dining/`, `kitchen/`, `src/api/*.ts`
