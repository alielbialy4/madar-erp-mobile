# Delivery Gaps

| Web Feature | Web File/Route | Web API | Mobile Status | Mobile File/Route | Gap Type | Severity | Notes |
|-------------|----------------|---------|---------------|-------------------|----------|----------|-------|
| Delivery orders list | `/delivery` | `deliveriesAPI` | Complete | `Delivery` | — | P3 | Filters + detail |
| Order detail / assign | web list | `PATCH` / assign | Complete | `DeliveryDetail` | — | P3 | Status map + confirm |
| Drivers CRUD | `/drivers` | `driversAPI` | Complete | `DriversList`, `DriverForm` | — | P3 | |
| Delivery zones CRUD | `/delivery-zones` | `deliveryZonesAPI` | Complete | `DeliveryZonesList`, `DeliveryZoneForm` | — | P3 | |
| Driver settlements | `/driver-settlements` | `driverSettlementsAPI` | Disabled | `DriverSettlements` | Disabled with reason | P1 | Read-only; no mobile create |
| Delivery finance dashboard | `/delivery-finance` | `deliveryFinanceAPI` | Complete | `DeliveryFinanceDashboard` | — | P3 | Read KPIs |
| Liabilities | liabilities | API | Complete | `DeliveryFinanceLiabilities` | — | P3 | Read |
| Finance settlements | settlements | API | Complete | `DeliveryFinanceSettlements` | — | P3 | Read |
| Finance alerts | alerts | API | Complete | `DeliveryFinanceAlerts` | — | P3 | Read |
| Delivery report | `/reports/delivery` | reports | Complete | `ReportViewer` | — | P3 | Phase 2 |

## Mobile API (Phase 4)

`drivers`, `deliveryZones`, `driverSettlements`, `deliveryFinance` in `src/api/`.

## Files

- Web: `front/src/pages/Delivery/`, `Drivers/`, `DeliveryZones/`, `DeliveryFinance/`
- Mobile: `madar-erp-mobile/src/screens/delivery/`
