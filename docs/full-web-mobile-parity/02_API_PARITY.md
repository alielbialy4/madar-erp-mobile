# API Parity

## API Clients Reviewed

Reviewed `front/src/api` against `madar-erp-mobile/src/api`.

## Added This Pass

| Mobile API | Web API Source | Endpoints |
|------------|----------------|-----------|
| `src/api/layaway.ts` | `front/src/api/layaway.ts` | `GET /layaway`, `GET /layaway/:id`, `POST /layaway/:id/payments`, `GET /layaway/:id/installments`, `POST /layaway/:id/installments/:installmentId/pay` |
| `src/api/payments.ts` | `front/src/api/payments.ts` | `GET /mcp/invoices/payments/list`, `GET /mcp/invoices/safe-totals` |

## Tightened This Pass

| Mobile API | Change |
|------------|--------|
| `src/api/vaults.ts` | Added typed vault transaction list/detail envelopes. |
| `src/api/supplierPayments.ts` | Added typed supplier payment row list envelope. |
| `src/api/deliveryFinance.ts` | Added typed driver finance detail response. |
| `src/api/index.ts` | Exported new layaway/payments clients. |

## Remaining API Gaps / Intentional Non-Ports

| Web API | Mobile Status | Reason |
|---------|---------------|--------|
| `backup.ts` | Intentionally Web-only | Backup/restore/download is dangerous admin infrastructure; mobile shows disabled explanation. |
| `billSplit.ts` | Missing | Web dining bill split endpoint not yet wired to mobile dining/POS. |
| `tableReservations.ts` | Missing | No active mobile reservation route yet. |
| `commissions.ts` | Missing | No current mobile route. |
| `kitchenPrinters.ts`, `kitchenRouting.ts` | Partial | Mobile has printer profiles and offline routing service; full branch kitchen printer editor needs hardware QA. |
| `branchSections.ts` | Missing | No direct mobile route; branch settings cover operational settings. |
| `employees.ts` | Partial | Mobile uses `settingsAPI` users/roles endpoints; employee-specific multipart fields are not fully ported. |
| `sync.ts` | Partial | Mobile has `syncService`, `syncEngine`, and POS offline queue, but not a 1:1 exported web sync API module. |

